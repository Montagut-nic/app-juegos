import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BienvenidoComponent } from '../bienvenido/bienvenido.component';
import { AhorcadoComponent } from './ahorcado/ahorcado.component';
import { MayorMenorComponent } from './mayor-menor/mayor-menor.component';
import { TriviaComponent } from './trivia/trivia.component';
import { VeintiunoComponent } from './veintiuno/veintiuno.component';
import { JuegoComponent } from './juego.component';
import { authChildGuard } from '../../guards/auth-guard';

const routes: Routes = [
  {
    path: '', component: JuegoComponent,
    canActivateChild: [authChildGuard],
    children: [
      {
        path: 'ahorcado', component: AhorcadoComponent
      },
      {
        path: 'mayor-menor', component: MayorMenorComponent
      },
      {
        path: 'trivia-pokemon', component: TriviaComponent
      },
      {
        path: 'veintiuno', component: VeintiunoComponent
      },
    ]
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class JuegoRoutingModule { }
