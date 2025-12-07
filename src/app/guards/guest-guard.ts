import { CanActivateFn, CanMatchFn, Router, UrlSegment } from '@angular/router';
import { Supabase } from '../core/supabase';
import { inject } from '@angular/core';

export const guestGuard: CanActivateFn = async (_route, state) => {
  const supa = inject(Supabase);
  const router = inject(Router);

  const logged = await supa.isLoggedIn();
  if (logged) return router.createUrlTree(['/home']);

  return true;
};