import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-boton',
  imports: [],
  templateUrl: './boton.component.html',
  styleUrl: './boton.component.scss'
})
export class BotonComponent {

@Input() nombreBoton!: string;

}
