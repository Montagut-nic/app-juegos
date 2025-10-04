import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Alert } from '../../core/alert';
import { Supabase } from '../../core/supabase';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-juego',
  standalone: false,
  templateUrl: './juego.component.html',
  styleUrls: ['./juego.component.scss']
})
export class JuegoComponent implements OnInit, OnDestroy {

  private supa = inject(Supabase);
  private router = inject(Router);
  private alert = inject(Alert);

  userName = '';
  authId: string | null = null;
  puntos = 0;

  private subs = new Subscription();
  private realtimeUnsub?: () => void;

  async ngOnInit(): Promise<void> {
    // 1) Tomar usuario de Auth y armar encabezado
    const u = this.supa.user; // getter síncrono del servicio
    if (u) {
      this.authId = u.id;
      await this.refreshUsuario();       // puntos iniciales
      this.subscribeRealtime();    // escuchar cambios en BD (opcional, si tu servicio expone el client)
    }

    // 2) Si navegamos entre juegos, opcionalmente refrescar puntos
    this.subs.add(
      this.router.events.pipe(filter(e => e instanceof NavigationEnd))
        .subscribe(() => this.refreshUsuario())
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.realtimeUnsub?.();
  }

  async refreshUsuario() {
    if (!this.authId) return;
    try {
      const data = await this.supa.getUserData(this.authId);
      this.puntos = data?.puntos;
      this.userName = data?.name;
    } catch (e) {
      console.warn('No se pudo refrescar usuario:', e);
    }
  }

  private subscribeRealtime() {
    if (!this.authId) return;

    // intentamos obtener el cliente para Realtime
    const client = (this.supa as any)._client ?? (this.supa as any).client;
    if (!client || !client.channel) return;

    const ch = client.channel('reg_usuarios_points');
    ch.on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'registros_usuarios', filter: `authId=eq.${this.authId}` },
      (payload: any) => {
        const nuevos = payload?.new?.puntos;
        if (typeof nuevos === 'number') this.puntos = nuevos;
      }
    ).subscribe();

    this.realtimeUnsub = () => client.removeChannel(ch);
  }

  isActive(url: string): boolean {
    return this.router.isActive(url, { paths: 'exact', queryParams: 'ignored', fragment: 'ignored', matrixParams: 'ignored' });
  }

}
