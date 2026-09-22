import type { Role } from './models/api.models';

export type Permission =
  | 'dashboard.view'
  | 'properties.view'
  | 'properties.create'
  | 'properties.update'
  | 'properties.assign'
  | 'properties.transition'
  | 'properties.approve'
  | 'properties.reject'
  | 'documents.review'
  | 'documents.request'
  | 'inspections.view'
  | 'inspections.schedule'
  | 'inspections.update'
  | 'users.view'
  | 'users.manage'
  | 'transactions.view'
  | 'transactions.manage'
  | 'audit.view';

const ALL_STAFF: Role[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'LAWYER',
  'INSPECTOR',
  'PROPERTY_MANAGER',
];

const ADMINS: Role[] = ['SUPER_ADMIN', 'ADMIN'];

/** Mirrors backend authorize() rules */
export const ROLE_PERMISSIONS: Record<Permission, Role[]> = {
  'dashboard.view': ALL_STAFF,
  'properties.view': ALL_STAFF,
  'properties.create': ['SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER'],
  'properties.update': ['SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER'],
  'properties.assign': ['SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER'],
  'properties.transition': ['SUPER_ADMIN', 'ADMIN', 'LAWYER', 'PROPERTY_MANAGER', 'INSPECTOR'],
  'properties.approve': ADMINS,
  'properties.reject': ['SUPER_ADMIN', 'ADMIN', 'LAWYER', 'INSPECTOR'],
  'documents.review': ['SUPER_ADMIN', 'ADMIN', 'LAWYER', 'PROPERTY_MANAGER'],
  'documents.request': ['SUPER_ADMIN', 'ADMIN', 'LAWYER', 'PROPERTY_MANAGER'],
  'inspections.view': ALL_STAFF,
  'inspections.schedule': ['SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER'],
  'inspections.update': ['SUPER_ADMIN', 'ADMIN', 'INSPECTOR'],
  'users.view': ADMINS,
  'users.manage': ADMINS,
  'transactions.view': ALL_STAFF,
  'transactions.manage': ['SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER'],
  'audit.view': ADMINS,
};

export function hasPermission(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[permission].includes(role);
}

export function hasAnyPermission(
  role: Role | null | undefined,
  permissions: Permission[],
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export interface NavLink {
  path: string;
  label: string;
  permission: Permission;
}

export const NAV_LINKS: NavLink[] = [
  { path: '/dashboard', label: 'Dashboard', permission: 'dashboard.view' },
  { path: '/properties', label: 'Properties', permission: 'properties.view' },
  { path: '/users', label: 'Users', permission: 'users.view' },
  { path: '/transactions', label: 'Transactions', permission: 'transactions.view' },
  { path: '/audit-logs', label: 'Audit Logs', permission: 'audit.view' },
];
