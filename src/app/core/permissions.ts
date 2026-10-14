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
  | 'requests.view'
  | 'requests.manage'
  | 'audit.view'
  | 'blog.view'
  | 'blog.manage'
  | 'messages.view';

const ALL_STAFF: Role[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'LAWYER',
  'INSPECTOR',
  'PROPERTY_MANAGER',
];

const ADMINS: Role[] = ['SUPER_ADMIN', 'ADMIN'];
const OPS: Role[] = ['SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER'];

/** Mirrors backend authorize() rules */
export const ROLE_PERMISSIONS: Record<Permission, Role[]> = {
  'dashboard.view': ALL_STAFF,
  'properties.view': ALL_STAFF,
  'properties.create': OPS,
  'properties.update': OPS,
  'properties.assign': OPS,
  'properties.transition': ['SUPER_ADMIN', 'ADMIN', 'LAWYER', 'PROPERTY_MANAGER', 'INSPECTOR'],
  'properties.approve': ADMINS,
  'properties.reject': ['SUPER_ADMIN', 'ADMIN', 'LAWYER', 'INSPECTOR'],
  'documents.review': ['SUPER_ADMIN', 'ADMIN', 'LAWYER', 'PROPERTY_MANAGER'],
  'documents.request': ['SUPER_ADMIN', 'ADMIN', 'LAWYER', 'PROPERTY_MANAGER'],
  'inspections.view': ALL_STAFF,
  'inspections.schedule': OPS,
  'inspections.update': ['SUPER_ADMIN', 'ADMIN', 'INSPECTOR'],
  'users.view': ADMINS,
  'users.manage': ADMINS,
  // Deals & buyer leads are ops/admin — not lawyer/inspector work
  'transactions.view': OPS,
  'transactions.manage': OPS,
  'requests.view': OPS,
  'requests.manage': OPS,
  'audit.view': ADMINS,
  'blog.view': ADMINS,
  'blog.manage': ADMINS,
  'messages.view': ADMINS,
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
  /** Role-specific sidebar label */
  labelByRole?: Partial<Record<Role, string>>;
}

export const NAV_LINKS: NavLink[] = [
  { path: '/dashboard', label: 'Dashboard', permission: 'dashboard.view' },
  {
    path: '/properties',
    label: 'Properties',
    permission: 'properties.view',
    labelByRole: {
      LAWYER: 'Legal queue',
      INSPECTOR: 'Inspection queue',
    },
  },
  { path: '/users', label: 'Users', permission: 'users.view' },
  { path: '/transactions', label: 'Transactions', permission: 'transactions.view' },
  { path: '/requests', label: 'Buyer requests', permission: 'requests.view' },
  { path: '/blog', label: 'Blog', permission: 'blog.view' },
  { path: '/messages', label: 'Messages', permission: 'messages.view' },
  { path: '/audit-logs', label: 'Audit Logs', permission: 'audit.view' },
];

export function navLabel(link: NavLink, role: Role | null | undefined): string {
  if (role && link.labelByRole?.[role]) return link.labelByRole[role]!;
  return link.label;
}
