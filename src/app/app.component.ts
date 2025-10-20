import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from "./componentes/navbar/navbar.component";
import { FooterComponent } from "./componentes/footer/footer.component";
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ChatWidget } from './componentes/chat-widget/chat-widget';
import { GlobalLoader } from "./core/global-loader/global-loader";
import { Subscription } from 'rxjs';
import { Loader } from './core/loader';


@Component({
  standalone: true,
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent, FormsModule, RouterModule, ChatWidget, GlobalLoader],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'app-juegos';
  private router = inject(Router);
  private loader = inject(Loader);
  private sub!: Subscription;

  ngOnInit() {
    this.sub = this.router.events.subscribe(ev => {
      if (ev instanceof NavigationStart)  this.loader.show();
      if (ev instanceof NavigationEnd || ev instanceof NavigationCancel || ev instanceof NavigationError) {
        this.loader.hide();
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
