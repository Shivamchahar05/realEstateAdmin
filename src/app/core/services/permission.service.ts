import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { hasPermission, type Permission } from '../permissions';
import type { Role } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly auth = inject(AuthService);

  readonly role = computed(() => this.auth.user()?.role ?? null);

  can(permission: Permission): boolean {
    return hasPermission(this.role(), permission);
  }

  canAny(...permissions: Permission[]): boolean {
    return permissions.some((p) => this.can(p));
  }

  is(...roles: Role[]): boolean {
    const role = this.role();
    return !!role && roles.includes(role);
  }
}
