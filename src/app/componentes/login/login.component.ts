import { Component } from '@angular/core';
import { Usuario } from '../../clases/usuario';
import { FormsModule } from '@angular/forms';
import { BotonComponent } from "../boton/boton.component";

@Component({
  selector: 'app-login',
  imports: [FormsModule, BotonComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})

export class LoginComponent {

user_username: string = "";
user_password: string = "";

logOn() {
  this.user = new Usuario(this.user_username,"",this.user_password);
throw new Error('Method not implemented.');
}

user!: Usuario;

ngOninit() {
  
}

}
