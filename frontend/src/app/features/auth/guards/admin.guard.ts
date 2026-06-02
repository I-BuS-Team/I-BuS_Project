import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { map, take } from 'rxjs/operators';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getCurrentUser().pipe(
    take(1),
    map(user => {
      const email = user?.email;
      const idTipo = user?.user_metadata?.['idTipoUsuario'];
      const isAdmin = email === 'admin@ibus.com' || idTipo === 1 || idTipo === '1';

      if (isAdmin) {
        return true;
      }

      console.warn('Acceso denegado: El usuario no es administrador.');
      router.navigate(['/auth/login']);
      return false;
    })
  );
};
