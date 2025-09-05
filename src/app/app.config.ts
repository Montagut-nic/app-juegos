import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { initializeApp } from "firebase/app";
import { routes } from './app.routes';
import { environment, firebaseConfig } from '../environments/env';
import { createClient } from '@supabase/supabase-js';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes)]
};

const supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
const app = initializeApp(firebaseConfig);