import { Routes } from '@angular/router';
import { LoginComponent } from './componentes/login/login.component';
import { BienvenidoComponent } from './componentes/bienvenido/bienvenido.component';
import { RegistroComponent } from './componentes/registro/registro.component';
import { Error404 } from './componentes/error-404/error-404';
import { QuienSoy } from './componentes/quien-soy/quien-soy';

export const routes: Routes = [
    {
        path:'',
        pathMatch:"full",
        redirectTo:"/home"
    },
    {
        path:"home",
        component: BienvenidoComponent
    },
    {
        path:"quien-soy",
        component: QuienSoy
    },
    {
        path:"login",
        component: LoginComponent
    },
    {
        path:"register",
        component:RegistroComponent
    },
    {
        path:"juegos",
        children:[
            {
                path:"juego1", pathMatch: 'full', redirectTo: '/home'
            },
            {
                path:"juego2", pathMatch: 'full', redirectTo: '/home'
            },
            {
                path:"juego3", pathMatch: 'full', redirectTo: '/home'
            }
        ]
    },
    {
        path:"quien-soy",
        component: QuienSoy

    },
    {
        path:"error404",
        component: Error404

    },
    {
        path:"**",
        redirectTo:"error404"
    }
];
