import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from "./componentes/navbar/navbar.component";
import { FooterComponent } from "./componentes/footer/footer.component";
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ChatWidget } from './componentes/chat-widget/chat-widget';


@Component({
  standalone: true,
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent, FormsModule, RouterModule, ChatWidget],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'app-juegos';

  
}
