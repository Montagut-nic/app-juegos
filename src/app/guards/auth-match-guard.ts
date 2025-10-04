import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlSegment } from '@angular/router';
import { Supabase } from '../core/supabase';

export const authMatchGuard: CanMatchFn = async (_r, segments: UrlSegment[]) => {
  const supa = inject(Supabase);
  const router = inject(Router);

  const logged = await supa.isLoggedIn();
  if (logged) return true;

  const returnUrl = '/' + segments.map(s => s.path).join('/');
  return router.createUrlTree(['/login'], { queryParams: { returnUrl }});
};
