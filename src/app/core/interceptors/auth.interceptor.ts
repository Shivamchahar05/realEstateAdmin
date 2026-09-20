import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

let refreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getAccessToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || req.url.includes('/auth/login') || req.url.includes('/auth/refresh')) {
        return throwError(() => error);
      }

      if (refreshing) {
        auth.logout();
        return throwError(() => error);
      }

      refreshing = true;
      return auth.refresh().pipe(
        switchMap((accessToken) => {
          refreshing = false;
          return next(
            req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } }),
          );
        }),
        catchError((refreshError) => {
          refreshing = false;
          auth.logout();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
