import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

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
}
  
