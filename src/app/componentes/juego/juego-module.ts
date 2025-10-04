import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JuegoRoutingModule } from './juego-routing-module';
import { VeintiunoComponent } from './veintiuno/veintiuno.component';
import { MayorMenorComponent } from './mayor-menor/mayor-menor.component';
import { TriviaComponent } from './trivia/trivia.component';
import { AhorcadoComponent } from './ahorcado/ahorcado.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { JuegoComponent } from './juego.component';


@NgModule({
  declarations: [
    JuegoComponent,
    MayorMenorComponent,
    AhorcadoComponent,
    TriviaComponent,
    VeintiunoComponent
  ],
  imports: [
    CommonModule,
    JuegoRoutingModule,
    FormsModule,
    HttpClientModule
  ],
  exports: [
    JuegoComponent
  ]
})
export class JuegoModule { }
