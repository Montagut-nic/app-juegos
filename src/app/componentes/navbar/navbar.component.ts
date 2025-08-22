import { Component } from '@angular/core';
import { BotonComponent } from "../boton/boton.component";
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [BotonComponent, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {

logueado: boolean = false;
nombre_usuario: string = "Usuario";

}
