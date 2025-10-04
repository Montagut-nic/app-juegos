import { CanActivateFn, CanMatchFn, Router, UrlSegment } from '@angular/router';
import { Supabase } from '../core/supabase';
import { inject } from '@angular/core';

export const guestGuard: CanActivateFn = async (_route, _state) => {
  const supa = inject(Supabase);
  const router = inject(Router);
  const logged = await supa.isLoggedIn();
  return logged ? router.createUrlTree(['/home']) : true;
};

export const guestMatchGuard: CanMatchFn = async (_route, segments: UrlSegment[]) => {
  const supa = inject(Supabase);
  const router = inject(Router);
  const logged = await supa.isLoggedIn();
  return logged ? router.createUrlTree(['/home']) : true;
};