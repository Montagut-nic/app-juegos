import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { Alert } from '../../../core/alert';
import { Supabase } from '../../../core/supabase';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-ahorcado',
  standalone: false,
  templateUrl: './ahorcado.component.html',
  styleUrl: './ahorcado.component.scss'
})
export class AhorcadoComponent implements OnInit, OnDestroy {

  private supa = inject(Supabase);
  private alert = inject(Alert);
  private http = inject(HttpClient);

  //Variables del juego
  letrasDisponibles = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');
  palabra = signal<string>('');
  letrasAdivinadas = signal<Set<string>>(new Set());
  letrasErradas = signal<Set<string>>(new Set());
  maxErrores = 6;
  errores = computed(() => this.letrasErradas().size);
  remaining = computed(() => this.maxErrores - this.errores()); // vidas restantes
  estado = signal<'jugando' | 'ganaste' | 'perdiste' | 'esperando'>('esperando');
  palabraOculta = computed(() => {
    const p = this.palabra();
    const guessed = this.letrasAdivinadas();
    return p.split('').map(ch => (ch === ' ' ? ' ' : (guessed.has(ch) ? ch : '_'))).join(' ');
  });

  //Usuario
  authId: string | null = null;
  puntos = signal<number>(0);
  racha = signal<number>(0);

  // ---- Imagen/animación (doble capa) ----
  imgPrev = signal<string>('');    // capa base (último estado ya “pintado”)
  imgCurr = signal<string>('');    // capa superior (nuevo estado)
  animando = signal<boolean>(false);

  private srcForRemaining(rem: number) {
    // 0..6 -> el-ahorcado0.webp .. el-ahorcado6.webp
    return `assets/el-ahorcado${rem}.webp`;
  }

  // Dispara la animación pasando la cantidad de vidas resultante
  private actualizarStageConAnim(rem: number) {
    const next = this.srcForRemaining(rem);
    if (next === this.imgCurr()) return; // nada que animar
    this.imgPrev.set(this.imgCurr()); // queda de base
    this.imgCurr.set(next);           // nueva arriba
    this.animando.set(true);          // activa la animación
  }

  onRevealDone() {
    // La nueva ya reemplazó la anterior → consolidamos y apagamos animación
    this.animando.set(false);
    this.imgPrev.set(this.imgCurr());
  }

  private palabrasBase = [
    'inteligencia artificial', 'red neuronal', 'teoria conspirativa', 'funcion', 'algoritmo', 'variable', 'servicio', 'componente',
    'codigo', 'base de datos', 'orientacion', 'objeto', 'arreglo', 'promesa', 'observable', 'modulo',
    'estudio', 'cansancio', 'universidad', 'seguridad', 'cableado', 'servidor', 'cliente', 'ruta',
    'celular', 'repositorio', 'informatica', 'capacitado', 'codigo', 'crueldad', 'ahorcado', 'dado', 'puesto',
    'pizzeria', 'hamburguesa', 'habilitacion', 'turismo', 'compuesto', 'consulta', 'xilofono', 'sesion',
    'encriptacion', 'deconstruir', 'credenciales', 'contraseña', 'usuario', 'puntaje', 'juegos'
  ];

  async ngOnInit() {
    this.estado.set('esperando');
    this.racha.set(0);
    const u = this.supa.user;
    if (!u) return;
    this.authId = u.id;
    try {
      this.puntos.set(await this.supa.getPuntos(u.id));
    } catch (e: any) {
      this.alert.error(e.message);
    }
  }

  async ngOnDestroy() {
    await this.subirResultado();
  }

  async subirResultado() {
    if (!this.authId) return;

    let user_id = this.authId;
    let racha = this.racha();

    try {
      await this.supa.guardarResultado('ahorcado', user_id, 0, racha);
    } catch (e: any) {
      this.alert.error('Error al guardar el resultado');
      console.error(e);
    }
  }

  async nuevaPartida() {
    this.letrasAdivinadas.set(new Set());
    this.letrasErradas.set(new Set());
    this.estado.set('jugando');

    const apiWord = await this.fetchPalabraAPI();
    this.palabra.set(apiWord ?? this.randomLocal());

    // Reset imágenes al estado “full vidas”
    const src = this.srcForRemaining(this.maxErrores);
    this.imgPrev.set(src);
    this.imgCurr.set(src);
    this.animando.set(false);
  }

  //en caso que falle conseguir una palabra
  private randomLocal(): string {
    const i = Math.floor(Math.random() * this.palabrasBase.length);
    return this.normalizarPalabra(this.palabrasBase[i]);
  }

  private async fetchPalabraAPI(reintentos = 2): Promise<string | null> {
    const url = 'https://random-word-api.herokuapp.com/word?lang=es';
    try {
      const arr = await firstValueFrom(this.http.get<string[]>(url, { responseType: 'json' as const }));
      const raw = Array.isArray(arr) ? (arr[0] ?? '') : '';
      const norm = this.normalizarPalabra(raw);
      if (norm && /^[A-ZÑ]+$/.test(norm) && norm.length >= 1) {
        return norm;
      }
      return null;
    } catch (e) {
      console.log(e);
      if (reintentos > 0) return this.fetchPalabraAPI(reintentos - 1);
      return null;
    }
  }

  normalizarPalabra(p: string): string {
    if (!p) return '';
    // Pasa a forma NFD para separar diacríticos, preserva Ñ, elimina resto de tildes
    let s = p.normalize('NFD')
      .replace(/n[\u0303]/gi, (m) => m[0] === 'n' ? 'ñ' : 'Ñ') // n + tilde -> ñ/Ñ
      .replace(/[\u0300-\u036f]/g, '');                        // quita tildes (áéíóú, etc.)
    s = s
      .replace(/[^A-Za-zñÑ\s]/g, '')  // solo letras y espacios
      .replace(/\s+/g, ' ')          // colapsa espacios múltiples
      .toUpperCase()
      .trim();
    return s;
  }

  async jugarLetra(letra: string) {
    if (this.estado() !== 'jugando') return;

    letra = this.normalizarPalabra(letra).replace(/[^A-ZÑ]/g, '');
    if (!letra) return;

    const ad = new Set(this.letrasAdivinadas());
    const er = new Set(this.letrasErradas());

    if (ad.has(letra) || er.has(letra)) return;

    const p = this.palabra();
    const acierto = p.includes(letra);

    if (acierto) {
      ad.add(letra);
      this.letrasAdivinadas.set(ad);
      const restantes = p.split('').filter(ch => ch !== ' ' && !ad.has(ch));
      if (restantes.length === 0) {
        this.estado.set('ganaste');
        await this.onWin();
        await this.subirResultado();
      }
    } else {
      er.add(letra);
      this.letrasErradas.set(er);
      const rem = this.maxErrores - er.size;   // vidas tras el error
      this.actualizarStageConAnim(rem);
      if (er.size >= this.maxErrores) {
        this.estado.set('perdiste');
        await this.subirResultado();
        this.racha.set(0);
        this.alert.error('Perdiste. La palabra era: ' + this.palabra());
      }
    }
  }

  private async onWin() {
    this.alert.success('¡Correcto! +1 punto');
    if (!this.authId) return;
    try {
      this.racha.update(v => v + 1);
      this.puntos.update(v => v + 1);
      await this.supa.setPuntos(this.authId, this.puntos());
    } catch (e) {
      this.alert.error('Ganaste, pero ocurrió un error');
      console.error(e);
    }
  }

}
