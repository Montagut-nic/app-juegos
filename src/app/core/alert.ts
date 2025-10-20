import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { SnackEncuesta } from './snack-encuesta/snack-encuesta';

@Injectable({
  providedIn: 'root'
})
export class Alert {
  private snackBar = inject(MatSnackBar);

  success(message: string, config: MatSnackBarConfig = {}) {
    this.snackBar.open(message, undefined, {
      duration: 5000,
      panelClass: ['snack-success'],
      ...config
    });
  }

  error(message: string, config: MatSnackBarConfig = {}) {
    this.snackBar.open(message, undefined, {
      duration: 5000,
      panelClass: ['snack-error'],
      ...config
    });
  }

  info(message: string, config: MatSnackBarConfig = {}) {
    this.snackBar.open(message, undefined, {
      duration: 5000,
      ...config
    });
  }

  encuesta(mensaje = '¡No olvides completar nuestra encuesta!', ruta = '/encuesta') {
    this.snackBar.openFromComponent(SnackEncuesta, {
      data: { mensaje, ruta },
      duration: 20000,                         // 0 = persistente hasta cerrar
      horizontalPosition: 'left',
      verticalPosition: 'top',
      panelClass: ['snack-encuesta']
    });
  }
}
  
