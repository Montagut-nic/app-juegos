import { Component, computed, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn, FormGroup } from '@angular/forms';
import { Alert } from '../../core/alert';
import { Supabase } from '../../core/supabase';
import { Usuario } from '../../clases/usuario';

type JuegoId = 'ahorcado' | 'trivia' | 'mayorMenor' | 'veintiuno' | string;

@Component({
  selector: 'app-encuesta',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './encuesta.html',
  styleUrl: './encuesta.scss'
})
export class Encuesta {
  private alert = inject(Alert);
  private supa = inject(Supabase);
  form: FormGroup;
  usuario = signal<Usuario | null>(null);


  // Usuario
  authId: string | null = null;

  loading = signal(false);
  errorMsg = signal<string | null>(null)

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50), this.emptyStringValidator]],
      apellido: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50), this.emptyStringValidator]],
      edad: ['', [Validators.required, Validators.min(18), Validators.max(99), Validators.pattern(/^\d{2}$/)]],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      rating: ['', [Validators.required, Validators.min(1), Validators.max(5)]],
      juegoNuevo: ['', [Validators.required]],
      recomienda: [''],
      comentarios: ['', [Validators.required, Validators.maxLength(250), this.emptyStringValidator]],
    });

    // Cargar perfil al estar logueado (o limpiar si logout)
    effect(() => {
      const u = this.supa.user; // getter síncrono del servicio
      if (!u) { this.usuario.set(null); return; }
      this.loadOrCreateUsuario(u.id);
    });
  }

  emptyStringValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const v = String(control.value ?? '');
    return v.trim().length === 0 ? { empty: true } : null;
  }

  stars = [1, 2, 3, 4, 5]

  get nombreCtrl() { return this.form.controls['nombre']; }
  get apellidoCtrl() { return this.form.controls['apellido']; }
  get edadCtrl() { return this.form.controls['edad']; }
  get teleCtrl() { return this.form.controls['telefono']; }
  get ratingCtrl() { return this.form.controls['rating']; }
  get juegoNuevoCtrl() { return this.form.controls['juegoNuevo']; }
  get recomiendaCtrl() { return this.form.controls['recomienda']; }
  get comentariosCtrl() { return this.form.controls['comentarios']; }

  async submit() {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.errorMsg.set(null);
    console.log('Formulario enviado:', this.form.value, this.ranks);
    try {
      const user = this.usuario();
      if (!user) throw new Error('Usuario no autenticado. Debes iniciar sesión para enviar la encuesta.');
      await this.supa.sendEncuesta(
        user.authId,
        this.form.value.nombre,
        this.form.value.apellido,
        this.form.value.edad,
        this.form.value.telefono,
        this.form.value.rating,
        this.ranks['ahorcado'],
        this.ranks['trivia'],
        this.ranks['mayorMenor'],
        this.ranks['veintiuno'],
        this.form.value.juegoNuevo,
        this.form.value.recomienda ? true : false,
        this.form.value.comentarios
      );
      this.alert.success('¡Gracias por completar la encuesta!');
    } catch (error: any) {
      if (error.message.includes('duplicate key value')) {
        error.message = 'Ya has enviado una encuesta previamente. ¡Gracias por tu participación!';
      }
      this.errorMsg.set(error.message);
    } finally {
      this.loading.set(false);
    }

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

  // Config / catálogo de juegos (ajustá los que tengas en el sitio)
  juegos: { id: JuegoId; nombre: string }[] = [
    { id: 'ahorcado', nombre: 'Ahorcado' },
    { id: 'mayorMenor', nombre: 'Mayor o Menor' },
    { id: 'trivia', nombre: 'Trivia Pokémon' },
    { id: 'veintiuno', nombre: 'Veintiuno con dados' }
  ];

  get totalJuegos(): number { return this.juegos.length; }

  ranks: Record<JuegoId, number> = { ahorcado: 0, trivia: 0, mayorMenor: 0, veintiuno: 0 };

  setRank(juego: JuegoId, puesto: number) {
    //cada puesto se usa una sola vez
    for (const k of Object.keys(this.ranks) as JuegoId[]) {
      if (k !== juego && this.ranks[k] === puesto) this.ranks[k] = 0;
    }
    this.ranks[juego] = puesto;
  }

  get rankingCompleto() {
    const vals = Object.values(this.ranks);
    if (vals.some(v => v < 1 || v > this.totalJuegos)) return false;
    return new Set(vals).size === this.totalJuegos; // sin repetidos
  }

  juegosNuevos: { id: JuegoId; nombre: string }[] = [
    { id: 'tateti', nombre: 'Tateti' },
    { id: 'ppt', nombre: 'Piedra, Papel o Tijera' },
    { id: 'simpsons', nombre: 'Trivia Simpsons' },
    { id: 'banderas', nombre: 'Banderas del Mundo' },
    { id: 'sudoku', nombre: 'Sudoku' },
    { id: 'simon', nombre: 'Simón Dice' },
    { id: 'memotest', nombre: 'Memotest' },
    { id: 'generala', nombre: 'Generala' },
    { id: 'snake', nombre: 'La Viborita' }
  ];

  // Comentario
  text = signal('');

  // Recomendar
  recomendar = signal<boolean>(false);

}