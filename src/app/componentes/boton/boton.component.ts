import { I } from '@angular/cdk/keycodes';
import { Component, Input } from '@angular/core';
import { RouterModule,} from '@angular/router';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-boton',
  imports: [RouterLink, RouterLinkActive, RouterModule],
  templateUrl: './boton.component.html',
  styleUrl: './boton.component.scss'
})
export class BotonComponent {

@Input() nombreBoton!: string;
@Input() Router_Link!: string;

}


