import { Component, signal } from '@angular/core';
import { Usuario } from '../../clases/usuario';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Supabase } from '../../core/supabase';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})

export class LoginComponent {

  form: FormGroup;
  user?: Usuario;
  loading = signal(false);
  errorMsg = signal<string | null>(null);

  constructor(private supabase: Supabase, private router: Router, private fb: FormBuilder) {
    
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  get emailCtrl() { return this.form.controls['email']; }
  get passwordCtrl() { return this.form.controls['password']; }
  onPwKey(event: KeyboardEvent) {
    this.capsOn.set(event.getModifierState?.('CapsLock') ?? false);
  }
  capsOn = signal(false);

  async logOn() {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.errorMsg.set(null);
    try {
      const usuario = await this.supabase.logInWithPassword(this.form.value.email, this.form.value.password);
      const user_data = await this.supabase.getUserData(usuario.id);
      if (user_data.active) {
        this.user = new Usuario(user_data.authId, user_data.email, user_data.name, user_data.avatarUrl, user_data.puntos, user_data.active);
        this.router.navigate(['/home']);
      } else {
        this.errorMsg.set('Tu cuenta no está activa. Contacta con un administrador.');
      }
    } catch (error: any) {
      const msg = (error?.message || '').toLowerCase();
      if (msg.includes('invalid login') || msg.includes('invalid email or password') || error?.status === 400) {
        this.errorMsg.set('Email o contraseña incorrectos.');
      } else {
        this.errorMsg.set('No pudimos iniciar sesión. Intentalo de nuevo.');
      }
    } finally {
      this.loading.set(false);
    }
  }




}
