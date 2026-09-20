import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { hasPermission, type Permission } from '../permissions';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};

/** Route data: { permission: 'users.view' } */
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const permission = route.data['permission'] as Permission | undefined;
  const role = auth.user()?.role;

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  if (!permission || hasPermission(role, permission)) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
