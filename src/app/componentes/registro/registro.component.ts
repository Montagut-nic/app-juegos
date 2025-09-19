import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Supabase } from '../../core/supabase';

/** Complejidad: 8–32, 1 minúscula, 1 MAYÚSCULA, 1 dígito, 1 especial, sin espacios */
const passwordRequirementsValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const v = String(control.value ?? '');
  const errors: ValidationErrors = {};
  if (v.length < 8 || v.length > 32) errors['length'] = true;
  if (!/[a-z]/.test(v)) errors['lowercase'] = true;
  if (!/[A-Z]/.test(v)) errors['uppercase'] = true;
  if (!/\d/.test(v)) errors['digit'] = true;
  if (!/[^A-Za-z0-9]/.test(v)) errors['special'] = true;
  if (/\s/.test(v)) errors['whitespace'] = true;
  return Object.keys(errors).length ? errors : null;
};

const matchPasswordValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const pw = group.get('password')?.value ?? '';
  const pw2 = group.get('confirmPassword')?.value ?? '';
  return pw !== pw2 ? { mismatch: true } : null;
};

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const imageFileValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const file = control.value as File | null | undefined;
  if (!file) return { required: true };
  if (!(file instanceof File)) return { type: true };
  if (file.size === 0) return { empty: true };

  const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
  // MIME primero; si el browser no setea MIME, caemos a extensión
  if (!allowed.includes(file.type.toLowerCase())) {
    const name = (file.name || '').toLowerCase();
    const extOk = name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png');
    if (!extOk) return { type: true };
  }

  if (file.size > MAX_AVATAR_BYTES) return { maxSize: true };

  return null;
};


@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.scss'
})
export class RegistroComponent {

  form: FormGroup;
  loading = signal(false);
  errorMsg = signal<string | null>(null)
  capsOn = signal(false);

  constructor(private supabase: Supabase, private router: Router, private fb: FormBuilder) {

    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      password: ['', [Validators.required, passwordRequirementsValidator]],
      confirmPassword: ['', [Validators.required]],
      avatar: [null, [imageFileValidator]]
    }, { validators: matchPasswordValidator });

  }

  get nameCtrl() { return this.form.controls['name']; }
  get emailCtrl() { return this.form.controls['email']; }
  get pwCtrl() { return this.form.controls['password']; }
  get pw2Ctrl() { return this.form.controls['confirmPassword']; }
  get avatarCtrl() { return this.form.controls['avatar']; }
  get pwMismatch() { return this.form.errors?.['mismatch'] ?? false; }

  get showPwHints(): boolean {
    return (this.pwCtrl.dirty || this.pwCtrl.touched) && this.pwCtrl.invalid;
  }

  onPwKey(e: KeyboardEvent) {
    this.capsOn.set(e.getModifierState?.('CapsLock') ?? false);
  }

  onFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.avatarCtrl.markAsTouched();
    this.avatarCtrl.markAsDirty();

    if (!file) {
      this.avatarCtrl.setValue(null);
      this.avatarCtrl.updateValueAndValidity();
      return;
    }
    this.avatarCtrl.setValue(file);
    this.avatarCtrl.updateValueAndValidity();
  }

  clearAvatar(input: HTMLInputElement) {
    input.value = '';
    this.avatarCtrl.reset(null);
  }


  async submit() {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.errorMsg.set(null);

    const { name, email, password } = this.form.getRawValue();

    try {
      const user = await this.supabase.signUpWithPassword(email!, password!);
      console.log('Usuario registrado:', user);
      // Guarda/actualiza la ficha de usuario en la tabla
      await this.supabase.saveUserData(user.id, {
        userName: name,
        userEmail: email,
        userActive: true
      });
      console.log('Datos de usuario guardados/actualizados');

      // Guarda el avatar en Storage y actualiza con la URL
      const file: File | null = this.form.get('avatar')?.value;
      if (!!file) {
        await this.supabase.saveFile(file, user.id);
      }

      // Redirigir a home
      if (await this.supabase.isLoggedIn()) {
        console.log('Usuario registrado y autenticado:', user);
        await this.router.navigateByUrl('/home');
      }
    } catch (err: any) {
      const msg = (err?.message || '').toLowerCase();
      if (msg.includes('user already registered') || msg.includes('already registered')) {
        this.errorMsg.set('El email ya está registrado.');
      } else {
        this.errorMsg.set('No pudimos crear tu cuenta. Intentá de nuevo.');
        console.log(msg);
      }
    } finally {
      this.loading.set(false);
    }
  }
}
