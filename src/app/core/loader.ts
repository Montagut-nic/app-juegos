import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Loader {

  private active = 0;
  private showTimer: any = null;
  private minVisibleUntil = 0;

  // Estado público
  visible = signal<boolean>(false);

  // Opcional: delays para UX
  private readonly SHOW_DELAY_MS = 120;  // espera breve para evitar flicker
  private readonly MIN_VISIBLE_MS = 300; // mantener visible un mínimo

  show() {
    this.active++;
    if (this.active === 1) {
      // primera entrada: programar aparición
      if (this.showTimer) clearTimeout(this.showTimer);
      this.showTimer = setTimeout(() => {
        this.visible.set(true);
        this.minVisibleUntil = Date.now() + this.MIN_VISIBLE_MS;
      }, this.SHOW_DELAY_MS);
    }
  }

  hide() {
    if (this.active > 0) this.active--;
    if (this.active === 0) {
      const wait = Math.max(0, this.minVisibleUntil - Date.now());
      setTimeout(() => {
        if (this.active === 0) {
          this.visible.set(false);
          if (this.showTimer) { clearTimeout(this.showTimer); this.showTimer = null; }
        }
      }, wait);
    }
  }

  // Helper para envolver promesas/tareas
  async run<T>(task: () => Promise<T>): Promise<T> {
    this.show();
    try { return await task(); }
    finally { this.hide(); }
  }
}
