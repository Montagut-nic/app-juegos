import { Component, inject } from '@angular/core';
import { Loader } from '../loader';

@Component({
  selector: 'app-global-loader',
  standalone: true,
  templateUrl: './global-loader.html',
  styleUrl: './global-loader.scss'
})
export class GlobalLoader {
  loader = inject(Loader);
}
