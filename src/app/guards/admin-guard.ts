import { CanActivateFn, Router } from '@angular/router';
import { Supabase } from '../core/supabase';
import { inject } from '@angular/core';

export const adminGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const supa = inject(Supabase);
  const user = supa.user;
  if (!user) return router.createUrlTree(['/']); // no logueado

  try {
    const { data, error } = await supa.client
      .from('registros_usuarios')
      .select('esAdmin')
      .eq('authId', user.id)
      .maybeSingle();

    if (error) throw error;
    const esAdmin = !!data?.esAdmin;
    return esAdmin ? true : router.createUrlTree(['/']);
  } catch {
    return router.createUrlTree(['/']);
  }
};