import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { Supabase } from '../../../core/supabase';
import { Alert } from '../../../core/alert';
import { Usuario } from '../../../clases/usuario';

@Component({
  selector: 'app-veintiuno',
  standalone: false,
  templateUrl: './veintiuno.component.html',
  styleUrl: './veintiuno.component.scss'
})
export class VeintiunoComponent implements OnInit {
  private supa = inject(Supabase);
  private alert = inject(Alert);

  // Usuario
  authId: string | null = null;
  puntos = signal<number>(0);
  racha = signal<number>(0);
  usuario = signal<Usuario | null>(null);

  constructor() {
    // Cargar perfil al estar logueado (o limpiar si logout)
    effect(() => {
      const u = this.supa.user; // getter síncrono del servicio
      if (!u) { this.usuario.set(null); return; }
      this.loadOrCreateUsuario(u.id);
    });
  }

  /** Trae perfil de registros_usuarios; si no existe, lo crea con puntos=0 */
  private async loadOrCreateUsuario(authId: string) {
    try {
      const data = await this.supa.getUserData(authId);
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

  //Juego
  estado = signal<'jugando' | 'apuesta' | 'sistema' | 'fin'>('apuesta');
  resultado = signal<'gana' | 'pierde' | null>(null);

  // Apuesta / pozo
  apuesta = signal<number>(0);          // apuesta fijada
  pozo = signal<number>(0); // lo que se puede cobrar (apuesta x2, si apuesta=0 => 1)
  apuestaValida = signal<boolean>(true);
  onKey($event: KeyboardEvent) {
    const n = ($event.target as HTMLInputElement).valueAsNumber;
    if (n < 0 || !Number.isFinite(n)) {
      this.apuestaValida.set(false);
    } else {
      this.apuestaValida.set(true);
    }
  }
  onApuestaInput(e: Event) {
    const n = (e.target as HTMLInputElement).valueAsNumber;
    // valueAsNumber es NaN cuando el input está vacío
    const v = Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0;
    this.apuesta.set(v);
  }

  // Marcadores
  jugador = signal<number>(0);
  sistema = signal<number>(0);

  // UI / animación
  readonly ANIM_MS = 900;   // duración de animación de cada dado
  readonly GAP_MS = 80;    // pausa entre dados
  locked = signal<boolean>(false); // bloquear botones durante animaciones

  // Helpers UI
  puedeIniciar() {
    const apu = Math.max(0, Math.trunc(this.apuesta() || 0));
    return this.estado() === 'apuesta' && apu <= this.usuario()?.puntos! && apu >= 0;
  }

  // Dados: mostramos dos imágenes centradas con anim secuencial
  showDie1 = signal<boolean>(false);
  showDie2 = signal<boolean>(false);
  die1Rolling = signal<boolean>(false);
  die2Rolling = signal<boolean>(false);
  die1Src = signal<string | null>(null);
  die2Src = signal<string | null>(null);

  puedeQuedarse = computed(() => this.jugador() > 0 && this.estado() === 'jugando' && !this.locked());

  ngOnInit(): void {
    const u = this.supa.user;
    if (!u) return;
    this.authId = u.id;
    this.racha.set(0);
    try {
      this.supa.getPuntos(u.id).then(p => this.puntos.set(p));
    } catch (e: any) {
      this.alert.error(e.message);
    }
  }

  // ----------- Lógica de apuesta / pozo -----------
  confirmarApuesta() {
    if (this.usuario() == null || this.apuesta() < 0 || this.apuesta() > this.usuario()!.puntos) return;
    const disponible = this.puntos();
    const ap = Math.max(0, Math.floor(this.apuesta()));

    if (ap > disponible) {
      this.alert.error('No tenés suficientes puntos para esa apuesta.');
      return;
    }

    this.apuesta.set(ap);
    const pozoInicial = ap > 0 ? ap * 2 : 1;

    // Descontamos la apuesta y seteamos pozo inicial
    if (this.authId) {
      this.puntos.set(disponible - ap);
      try {
        this.supa.setPuntos(this.authId, this.puntos())
      } catch (e: any) {
        console.error(e.message);
        this.alert.error('No se registró tu apuesta. Ocurrió un error.');
      }
    }

    this.pozo.set(pozoInicial);
    this.resetRonda();
    this.estado.set('jugando');
  }

  // Reinicia los contadores de una ronda (jugador o sistema)
  private resetRonda() {
    this.jugador.set(0);
    this.sistema.set(0);
    this.resultado.set(null);
    this.clearDiceInstant();
  }

  // ----------- Tiradas y reglas -----------
  private d6(): number { return Math.floor(Math.random() * 6) + 1; }
  private face(n: number) { return `assets/dado${n}.webp`; }

  async tirarJugador() {
    if (this.estado() !== 'jugando' || this.locked()) return;
    const sum = await this.animarTirada('jugador');
    const total = this.jugador() + sum;
    this.jugador.set(total);

    if (total === 21) {
      // victoria instantánea
      this.estado.set('fin');
      this.resultado.set('gana');
      this.racha.update(v => v + 1);
      this.alert.success('¡21! Ganaste la ronda.');
    } else if (total > 21) {
      this.estado.set('fin');
      this.resultado.set('pierde');
      this.alert.error('Te pasaste de 21. Perdiste el pozo.', { verticalPosition: 'top' });
      try {
        await this.supa.guardarResultado('veintiuno', this.authId!, 0, this.racha());
      } catch (error) {
        this.alert.error('Error al guardar el resultado');
        console.error(error);
      } finally {
        this.pozo.set(0);
        this.apuesta.set(0);
        this.racha.set(0);
      }
    }
  }

  async plantarse() {
    if (!this.puedeQuedarse()) return;
    this.estado.set('sistema');

    // La banca tira hasta que su suma sea >= que la del jugador (en empate, gana la banca)
    while (this.sistema() < this.jugador()) {
      const sum = await this.animarTirada('sistema');
      this.sistema.set(this.sistema() + sum);

      if (this.sistema() > 21) {
        // banca se pasa -> gana jugador
        break;
      }
    }

    // Resolver
    const j = this.jugador();
    const b = this.sistema();
    if (b > 21) {
      this.resultado.set('gana');
      this.racha.update(v => v + 1);
      this.alert.success('La banca se pasó. ¡Ganaste!');
    } else if (b >= j) {
      // empate también lo gana la banca
      this.resultado.set('pierde');
      this.alert.error('La banca te igualó o superó. Perdiste.', { verticalPosition: 'top' });
      try {
        await this.supa.guardarResultado('veintiuno', this.authId!, 0, this.racha());
      } catch (error) {
        this.alert.error('Error al guardar el resultado');
        console.error(error);
      } finally {
        this.pozo.set(0);
        this.apuesta.set(0);
        this.racha.set(0);
      }
    } else {
      // (no debería darse por la condición del while, pero por seguridad)
      this.resultado.set(null);
      this.alert.error('Ocurrió un error');
    }
    this.estado.set('fin');
  }

  // Cuando gana, puede cobrar o doblar
  async cobrarPozo() {
    if (this.estado() !== 'fin' || this.resultado() !== 'gana') return;
    if (!this.authId) return;

    const nuevo = this.puntos() + this.pozo();
    try {
      await this.supa.setPuntos(this.authId, nuevo);
      this.puntos.set(nuevo);
      this.alert.success(`Sumaste ${this.pozo()} punto(s).`);
      await this.supa.guardarResultado('veintiuno', this.authId!, this.pozo(), this.racha());
    } catch (error) {
      this.alert.error('Error al guardar el resultado');
      console.error(error);
    } finally {
      // Volver al estado de setear apuesta
      this.estado.set('apuesta');
      this.apuesta.set(0);
      this.pozo.set(0);
      this.racha.set(0);
      this.clearDiceInstant();
    }
  }

  duplicarYSeguir() {
    if (this.estado() !== 'fin' || this.resultado() !== 'gana') return;
    this.pozo.set(this.pozo() * 2);  // duplica pozo acumulado
    this.resetRonda();
    this.estado.set('jugando');
  }

  nuevaApuesta() {
    // Si pierde descontamos la apuesta al inicio
    this.estado.set('apuesta');
    this.apuesta.set(0);
    this.pozo.set(0);
    this.clearDiceInstant();
  }

  // ----------- Animación de dados -----------
  // Tira 2 dados con animación secuencial centrada y devuelve la suma
  private animarTirada(quien: 'jugador' | 'sistema'): Promise<number> {
    this.locked.set(true);

    const d1 = this.d6();
    const d2 = this.d6();
    const suma = d1 + d2;

    // Primero dado 1
    this.showDie1.set(true);
    this.die1Src.set(this.face(d1));
    this.die1Rolling.set(true);

    return new Promise(resolve => {
      // cuando termina el 1ro, empieza el 2do (sin solaparse)
      setTimeout(() => {
        this.die1Rolling.set(false);
        this.showDie2.set(true);
        this.die2Src.set(this.face(d2));
        this.die2Rolling.set(true);

        // fin del 2do → liberar y resolver
        setTimeout(() => {
          this.die2Rolling.set(false);
          this.locked.set(false);
          resolve(suma);
        }, this.ANIM_MS);
      }, this.ANIM_MS + this.GAP_MS);
    });
  }

  private clearDiceInstant() {
    this.showDie1.set(false);
    this.showDie2.set(false);
    this.die1Rolling.set(false);
    this.die2Rolling.set(false);
  }
}
