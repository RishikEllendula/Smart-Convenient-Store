import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const ownerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const user = auth.user();
  if (!user) {
    router.navigateByUrl('/login');
    return false;
  }
  if (user.role !== 'Owner') {
    router.navigateByUrl('/');
    return false;
  }
  return true;
};


