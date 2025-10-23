import { Routes } from '@angular/router';
import { LoginComponent } from './componentes/login/login.component';
import { BienvenidoComponent } from './componentes/bienvenido/bienvenido.component';
import { RegistroComponent } from './componentes/registro/registro.component';
import { Error404 } from './componentes/error-404/error-404';
import { QuienSoy } from './componentes/quien-soy/quien-soy';
import { authMatchGuard } from './guards/auth-match-guard';
import { guestGuard, guestMatchGuard } from './guards/guest-guard';
import { Ranking } from  './componentes/ranking/ranking';
import { Encuesta } from  './componentes/encuesta/encuesta';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
    {
        path: '',
        pathMatch: "full",
        redirectTo: "home"
    },
    {
        path: "home",
        component: BienvenidoComponent
    },
    {
        path: "quien-soy",
        component: QuienSoy
    },
    {
        path: "login",
        canMatch: [guestMatchGuard],
        canActivate: [guestGuard],
        component: LoginComponent
    },
    {
        path: "register",
        canMatch: [guestMatchGuard],
        canActivate: [guestGuard],
        component: RegistroComponent
    },
    {
        path: "juegos",
        canMatch: [authMatchGuard],
        loadChildren: () => import('./componentes/juego/juego-module').then(m => m.JuegoModule)
    },
    {
        path: "ranking",
        component: Ranking
    },
    {
        path: "encuesta",
        canActivate: [authGuard],
        component: Encuesta
    },
    {
        path: "error404",
        component: Error404

    },
    {
        path: "**",
        redirectTo: "error404"
    }
];
