import { Component, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

type SnackData = { mensaje: string; ruta: string };

@Component({
  selector: 'app-snack-encuesta',
  imports: [],
  templateUrl: './snack-encuesta.html',
  styleUrl: './snack-encuesta.scss'
})
export class SnackEncuesta {
  data = inject<SnackData>(MAT_SNACK_BAR_DATA);
  ref  = inject(MatSnackBarRef<SnackEncuesta>);
  router = inject(Router);

  ir() {
    this.ref.dismiss();
    this.router.navigateByUrl(this.data?.ruta ?? '/encuesta', { replaceUrl: true });
  }
  cerrar() {
    this.ref.dismiss();
  }

}
