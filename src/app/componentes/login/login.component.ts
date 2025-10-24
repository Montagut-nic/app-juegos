import { Component, signal } from '@angular/core';
import { Usuario } from '../../clases/usuario';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Supabase } from '../../core/supabase';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})

export class LoginComponent {
  autocompletar() {
    this.form.setValue({
      email: 'nicolas@gmail.com',
      password: 'Trend123!'
    });
  }
  autocompletar2() {
    this.form.setValue({
      email: 'user@email.com.ar',
      password: 'Test123!'
    });
  }
  autocompletar3() {
    this.form.setValue({
      email: 'test@email.com.ar',
      password: 'Trend123!'
    });
  }
  autocompletar4() {
    this.form.setValue({
      email: 'martin@gmail.com',
      password: 'Trend123!'
    });
  }

  autocompletarAdmin() {
    this.form.setValue({
      email: 'montagut@gmail.com',
      password: 'Trend123!'
    });
  }

  form: FormGroup;
  user?: Usuario;
  loading = signal(false);
  errorMsg = signal<string | null>(null);
  capsOn = signal(false);

  constructor(private supabase: Supabase, private router: Router, private fb: FormBuilder, private route: ActivatedRoute) {

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


  async logOn() {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.errorMsg.set(null);
    try {
      const usuario = await this.supabase.logInWithPassword(this.form.value.email, this.form.value.password);
      console.log(usuario);
      const user_data = await this.supabase.getUserData(usuario.id);
      if (user_data.active) {
        console.log('Login exitoso:', user_data);
        this.user = new Usuario(user_data.authId, user_data.email, user_data.name, user_data.avatarUrl, user_data.puntos, user_data.active, usuario.created_at);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/home';
        this.router.navigateByUrl(returnUrl, { replaceUrl: true });
      } else {
        this.errorMsg.set('Tu cuenta no está activa. Contacta con un administrador.');
      }
    } catch (error: any) {
      const msg = (error?.message || '').toLowerCase();
      if (msg.includes('invalid login') || msg.includes('invalid email or password') || error?.status === 400) {
        this.errorMsg.set('Email o contraseña incorrectos.');
      } else {
        this.errorMsg.set('No pudimos iniciar sesión. Intentalo de nuevo.');
        console.log(msg);
      }
    } finally {
      this.loading.set(false);
    }
  }




}
