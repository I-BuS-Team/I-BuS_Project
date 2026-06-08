import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getCurrentUser().pipe(
    take(1),
    map(user => {
      if (user) {
        return true;
      }

      console.warn('Acceso denegado: Se requiere iniciar sesión.');
      router.navigate(['/auth/login']);
      return false;
    })
  );
};
