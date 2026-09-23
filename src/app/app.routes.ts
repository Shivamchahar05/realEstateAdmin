import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guard';
import { ShellLayoutComponent } from './layout/shell-layout.component';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    component: ShellLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        canActivate: [roleGuard],
        data: { permission: 'dashboard.view' },
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'properties',
        canActivate: [roleGuard],
        data: { permission: 'properties.view' },
        loadComponent: () =>
          import('./features/properties/property-list.component').then(
            (m) => m.PropertyListComponent,
          ),
      },
      {
        path: 'properties/new',
        canActivate: [roleGuard],
        data: { permission: 'properties.create' },
        loadComponent: () =>
          import('./features/properties/property-form.component').then(
            (m) => m.PropertyFormComponent,
          ),
      },
      {
        path: 'properties/:id/edit',
        canActivate: [roleGuard],
        data: { permission: 'properties.update' },
        loadComponent: () =>
          import('./features/properties/property-form.component').then(
            (m) => m.PropertyFormComponent,
          ),
      },
      {
        path: 'properties/:id',
        canActivate: [roleGuard],
        data: { permission: 'properties.view' },
        loadComponent: () =>
          import('./features/properties/property-detail.component').then(
            (m) => m.PropertyDetailComponent,
          ),
      },
      {
        path: 'users',
        canActivate: [roleGuard],
        data: { permission: 'users.view' },
        loadComponent: () =>
          import('./features/users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'transactions',
        canActivate: [roleGuard],
        data: { permission: 'transactions.view' },
        loadComponent: () =>
          import('./features/transactions/transactions.component').then(
            (m) => m.TransactionsComponent,
          ),
      },
      {
        path: 'requests',
        canActivate: [roleGuard],
        data: { permission: 'requests.view' },
        loadComponent: () =>
          import('./features/requests/requests.component').then((m) => m.RequestsComponent),
      },
      {
        path: 'audit-logs',
        canActivate: [roleGuard],
        data: { permission: 'audit.view' },
        loadComponent: () =>
          import('./features/audit/audit-logs.component').then((m) => m.AuditLogsComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
