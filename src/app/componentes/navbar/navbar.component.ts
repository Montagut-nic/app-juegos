import { Component, inject, Signal } from '@angular/core';
import { BotonComponent } from "../boton/boton.component";
import { Supabase } from '../../core/supabase';
import { Router } from '@angular/router';
import { User } from '@supabase/supabase-js';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  standalone: true,
  selector: 'app-navbar',
  imports: [BotonComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  private readonly supabase = inject(Supabase);
  user: Signal<User | null> = toSignal<User | null>(this.supabase.user$, { initialValue: null });
  get isLoggedIn() { return !!this.user(); }

  constructor(private router: Router) {
  }

  async logout() {
    try {
      await this.supabase.client.auth.signOut();
      await this.router.navigateByUrl('/login', { replaceUrl: true });
    } catch (e) {
      console.error('Error al cerrar sesión', e);
    }
  }
}


