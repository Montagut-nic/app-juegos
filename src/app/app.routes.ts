import { Routes } from '@angular/router';
import { LoginComponent } from './componentes/login/login.component';
import { BienvenidoComponent } from './componentes/bienvenido/bienvenido.component';
import { RegistroComponent } from './componentes/registro/registro.component';

export const routes: Routes = [
    {
        path:'',
        pathMatch:"full",
        redirectTo:"home"
    },
    {
        path:"home",
        component: BienvenidoComponent
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
                path:"juego1",
            },
            {
                path:"juego2",
            },
            {
                path:"juego3",
            }
        ]
    },
    {
        path:"er404"
    },
    {
        path:"**",
        redirectTo:"er404"
    }
];
