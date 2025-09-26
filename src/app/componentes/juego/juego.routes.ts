// juego.routes.ts
import { Routes } from '@angular/router';

export const JUEGO_ROUTES: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'bienvenido' },
    {
        path: 'ahorcado',
        loadComponent: () =>
            import('./ahorcado/ahorcado.component').then(m => m.AhorcadoComponent),
    },
    {
        path: 'mayor-menor',
        loadComponent: () =>
            import('./mayor-menor/mayor-menor.component').then(m => m.MayorMenorComponent),
    },
    {
        path: 'trivia',
        loadComponent: () =>
            import('./trivia/trivia.component').then(m => m.TriviaComponent),
    },
    {
        path: 'veintiuno',
        loadComponent: () =>
            import('./veintiuno/veintiuno.component').then(m => m.VeintiunoComponent),
    },
    { path: '**', redirectTo: 'error404' },
];