import { Component } from '@angular/core';
import { BotonComponent } from "../boton/boton.component";

@Component({
  standalone: true,
  selector: 'app-navbar',
  imports: [BotonComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {

logueado: boolean = false;
nombre_usuario: string = "Usuario";

}
