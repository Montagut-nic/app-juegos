import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from "./componentes/navbar/navbar.component";
import { FooterComponent } from "./componentes/footer/footer.component";
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'app-juegos';

  
}
