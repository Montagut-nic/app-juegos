import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { Supabase } from '../core/supabase';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = async (_route, state) => {
  const supa = inject(Supabase);
  const router = inject(Router);

  // si ya tenés isLoggedIn(): Promise<boolean>
  const logged = await supa.isLoggedIn();
  if (logged) return true;

  // redirige a /login con returnUrl
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url }});
};

export const authChildGuard: CanActivateChildFn = (childRoute, state) => authGuard(childRoute, state);
