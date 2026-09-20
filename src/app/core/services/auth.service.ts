import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { AuthTokens, AuthUser } from '../models/api.models';

const ACCESS_KEY = 'vp_access_token';
const REFRESH_KEY = 'vp_refresh_token';
const USER_KEY = 'vp_auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly userSignal = signal<AuthUser | null>(this.readUser());
  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.userSignal() && !!this.getAccessToken());

  login(email: string, password: string): Observable<AuthUser> {
    return this.api.post<AuthTokens>('/auth/login', { email, password }).pipe(
      tap((res) => this.persistSession(res.data)),
      map((res) => res.data.user),
    );
  }

  logout(): void {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      this.api.post('/auth/logout', { refreshToken }).subscribe({ error: () => undefined });
    }
    this.clearSession();
    void this.router.navigate(['/login']);
  }

  me(): Observable<AuthUser | null> {
    if (!this.getAccessToken()) {
      return of(null);
    }
    return this.api.get<AuthUser>('/auth/me').pipe(
      tap((res) => {
        this.userSignal.set(res.data);
        localStorage.setItem(USER_KEY, JSON.stringify(res.data));
      }),
      map((res) => res.data),
      catchError(() => {
        this.clearSession();
        return of(null);
      }),
    );
  }

  refresh(): Observable<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token'));
    }

    return this.api.post<AuthTokens>('/auth/refresh', { refreshToken }).pipe(
      tap((res) => this.persistSession(res.data)),
      map((res) => res.data.accessToken),
    );
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  private persistSession(data: AuthTokens): void {
    localStorage.setItem(ACCESS_KEY, data.accessToken);
    localStorage.setItem(REFRESH_KEY, data.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    this.userSignal.set(data.user);
  }

  private clearSession(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this.userSignal.set(null);
  }

  private readUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  }
}
