import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { initializeApp } from "firebase/app";
import { routes } from './app.routes';
import { environment, firebaseConfig } from '../environments/env';
import { createClient } from '@supabase/supabase-js';
import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { provideHttpClient } from '@angular/common/http';


export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideAnimations(), importProvidersFrom(BrowserAnimationsModule), importProvidersFrom(MatSnackBarModule), provideHttpClient()]
};

const supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
const app = initializeApp(firebaseConfig);