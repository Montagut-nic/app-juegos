import { Component, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Alert } from '../../../core/alert';
import { Supabase } from '../../../core/supabase';
import { Usuario } from '../../../clases/usuario';


type ApiCard = { code: string; value: string; suit: string; image: string; };
type DrawResp = { success: boolean; deck_id: string; remaining: number; shuffled: boolean; cards: ApiCard[]; };

@Component({
  selector: 'app-mayor-menor',
  standalone: false,
  templateUrl: './mayor-menor.component.html',
  styleUrl: './mayor-menor.component.scss'
})
export class MayorMenorComponent {

  onKey($event: KeyboardEvent) {
    const n = ($event.target as HTMLInputElement).valueAsNumber;
    if (n < 0 || !Number.isFinite(n)) {
      this.apuestaValida.set(false);
    }else {
      this.apuestaValida.set(true);
    }
  }
  private alert = inject(Alert);
  private http = inject(HttpClient);
  private API = 'https://deckofcardsapi.com/api/deck';

  apuesta = signal<number>(0);
  incremento = signal<number>(1);
  pozo = signal<number>(0);
  deckId = signal<string>('');
  remaining = signal<number>(0);
  usuario = signal<Usuario | null>(null);
  deckDepleted = signal(false);


  // Cartas
  cartaActual = signal<ApiCard | null>(null);
  cartaSiguiente = signal<ApiCard | null>(null);

  // UI / flujo
  estado = signal<'apuesta' | 'jugando' | 'fin'>('apuesta');
  bloqueado = signal<boolean>(false);     // evita doble clic
  flipping = signal<boolean>(false);     // activa animación flip
  ultimaDecision: 'mayor' | 'menor' | null = null;
  apuestaValida = signal<boolean>(true);

  // imágenes para el flip (front=actual, back=siguiente)
  frontImage = computed(() => this.cartaActual()?.image || '');
  backImage = computed(() => this.cartaSiguiente()?.image || '');

  constructor(private supabase: Supabase) {
    // Cargar perfil al estar logueado (o limpiar si logout)
    effect(() => {
      const u = this.supabase.user; // getter síncrono del servicio
      if (!u) { this.usuario.set(null); return; }
      this.loadOrCreateUsuario(u.id);
    });

    // crear mazo y mostrar 1a carta
    this.nuevoMazo();
  }

  /** Trae perfil de registros_usuarios; si no existe, lo crea con puntos=0 */
  private async loadOrCreateUsuario(authId: string) {
    try {
      const data = await this.supabase.getUserData(authId);
      if (data) {
        // construí tu instancia de Usuario con lo que tengas en la tabla
        const user = new Usuario(
          data.authId,
          data.email,
          data.name,
          data.avatarUrl ?? '',
          data.puntos ?? 0,
          data.active ?? true,
          data.created_at ?? ''
        );
        this.usuario.set(user);
      }
    } catch (e) {
      console.error('Error al traer datos de usuario', e);
      this.alert.error('Error al traer datos de usuario');
    }
  }

  private async nuevoMazo() {
    const u = `${this.API}/new/shuffle/?deck_count=1`;
    const r = await firstValueFrom(this.http.get<DrawResp>(u));
    if (r.success) {
      this.deckId.set(r.deck_id);
      this.remaining.set(r.remaining);
    } else {
      this.alert.error('No se pudo crear un nuevo mazo');
    }
  }

  private async draw(count = 1) {
    const id = this.deckId();
    if (!id) await this.nuevoMazo();
    if (count < 1 || count > 52 || count > this.remaining()) {
      console.error('draw: count inválido, ', count);
      this.alert.error('Ocurrió un error con la API de cartas.');
      return [];
    }
    const r = await firstValueFrom(this.http
      .get<DrawResp>(`${this.API}/${this.deckId()}/draw/?count=${count}`));
    this.remaining.set(r!.remaining);
    return r!.cards;
  }

  private async drawPrimera() {
    if (this.mazoVacio()) {
      this.alert.error('Error: mazo vacío');
      return;
    }
    const [c] = await this.draw(1);
    this.cartaActual.set(c);
  }

  private mazoVacio(): boolean {
    return this.remaining() <= 0;
  }

  private valorNum(v: string): number {
    switch (v) {
      case 'KING':
        return 13;
      case 'QUEEN':
        return 12;
      case 'JACK':
        return 11;
      case 'ACE':
        return 1;
      default:
        return parseInt(v, 10);
    }
  }

  // Comenzar ronda
  async iniciar() {
    if (this.usuario() == null || this.apuesta() < 0 || this.apuesta() > this.usuario()!.puntos) return;

    let apu = Math.max(0, Math.trunc(this.apuesta() || 0));
    this.apuesta.set(apu);

    if (this.deckDepleted() || this.remaining() <= 0) {
      await this.nuevoMazo();      // new/shuffle
      this.deckDepleted.set(false);
    }

    // descuento de la apuesta al iniciar
    if (apu > 0) {
      let puntosRestantes = this.usuario()!.puntos - apu;
      await this.supabase.setPuntos(this.usuario()!.authId, puntosRestantes);
      this.usuario()!.puntos = puntosRestantes; // actualizar local
    }

    // incremento por acierto: incrementa 1 si apuesta==0 o puntos==0, o la cantidad apostada
    const inc = this.apuesta() > 0 ? apu : 1;
    this.incremento.set(inc);

    // reset de pozo/ronda
    this.pozo.set(0);
    this.estado.set('jugando');
    await this.drawPrimera();

    // Flip
    this.flipping.set(true);

    //Cuando termina la transformación, consolidamos estado
    setTimeout(() => this.onFlipEnd(), 500); // dura 500ms en el CSS
    this.bloqueado.set(false);
  }

  // Decisión: mayor/menor
  async decidir(tipo: 'mayor' | 'menor') {
    if (this.bloqueado() || this.estado() !== 'jugando') return;

    if (this.remaining() <= 0) {
      this.endRound('deck');
      return;
    }

    this.bloqueado.set(true);
    this.ultimaDecision = tipo;

    if (this.mazoVacio()) {
      this.alert.error('Error: mazo vacío');
      this.supabase.setPuntos(this.usuario()!.authId, this.usuario()!.puntos);
      this.bloqueado.set(false);
      return;
    }

    // 1) Pedimos la siguiente carta y la ponemos en el "back"
    const [next] = await this.draw(1);
    this.cartaSiguiente.set(next);

    // 2) Flip
    this.flipping.set(true);

    // 3) Cuando termina la transformación, consolidamos estado
    setTimeout(() => this.onFlipEnd(), 500); // dura 500ms en el CSS
  }

  // Fin del flip → consolidar carta y evaluar
  private async onFlipEnd() {
    this.flipping.set(false);

    const prev = this.cartaActual();
    const next = this.cartaSiguiente();

    if (!prev || !next || !this.ultimaDecision) { this.bloqueado.set(false); return; }

    this.cartaActual.set(next);
    this.cartaSiguiente.set(null);

    const a = this.valorNum(prev.value);
    const b = this.valorNum(next.value);

    const gana = (b === a) || (this.ultimaDecision === 'mayor' && b > a) || (this.ultimaDecision === 'menor' && b < a);

    if (gana) {
      this.pozo.update(p => p + this.incremento());
      // sigue jugando; puede retirarse o seguir eligiendo
    } else {
      // pierde el pozo
      this.pozo.set(0);
      await this.endRound('lose');
    }

    this.ultimaDecision = null;
    this.bloqueado.set(false);

    if (this.estado() === 'jugando' && this.remaining() === 0) {
      await this.endRound('deck');
    }
  }

  onApuestaInput(e: Event) {
    const n = (e.target as HTMLInputElement).valueAsNumber;
    // valueAsNumber es NaN cuando el input está vacío
    const v = Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0;
    this.apuesta.set(v);
  }


  // Retirarse: cobra el pozo acumulado
  async retirarse() {
    if (this.estado() !== 'jugando') return;
    await this.endRound('retire');
    this.estado.set('fin');
  }

  // Nueva ronda (manteniendo mazo y puntos)
  async nuevaRonda() {
    this.apuesta.set(0);
    this.incremento.set(1);
    this.pozo.set(0);
    this.estado.set('apuesta');
    if (!this.cartaActual()) await this.drawPrimera();
  }

  // Helpers UI
  puedeIniciar() {
    const apu = Math.max(0, Math.trunc(this.apuesta() || 0));
    return this.estado() === 'apuesta' && apu <= this.usuario()?.puntos! && apu >= 0;
  }

  private async endRound(reason: 'deck' | 'lose' | 'retire') {
    const premio = this.pozo();
    const usr = this.usuario();

    if (reason === 'lose') {
      // perdió la predicción → no hay cobro
      this.pozo.set(0);
      this.estado.set('fin');
      this.bloqueado.set(true);
      this.alert.error('Fallaste: perdiste el pozo');
      return;
    }

    // 'deck' (se agotó el mazo) o 'retire' (retiro manual)
    if (premio > 0 && usr) {
      usr.puntos = usr.puntos + premio;
      this.bloqueado.set(true);
      await this.supabase.setPuntos(usr.authId, usr.puntos); // upsert en tu tabla
      this.alert.success(
        reason === 'deck' ? `Mazo agotado, ganaste ${premio} puntos` : `Cobraste ${premio} puntos`
      );
    } else {
      this.alert.info(
        reason === 'deck' ? 'Mazo agotado' : 'Sin pozo para cobrar'
      );
    }

    this.estado.set('fin');
    this.bloqueado.set(true);
    if (reason === 'deck') this.deckDepleted.set(true);
  }

}
