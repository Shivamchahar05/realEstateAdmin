import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminDataService } from '../../core/services/admin-data.service';
import { PermissionService } from '../../core/services/permission.service';
import { AuthUser } from '../../core/models/api.models';
import { PaginationComponent } from '../../shared/pagination.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, PaginationComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit {
  private readonly data = inject(AdminDataService);
  private readonly fb = inject(FormBuilder);
  readonly permissions = inject(PermissionService);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly users = signal<AuthUser[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = 20;

  readonly filters = this.fb.nonNullable.group({
    search: [''],
    role: [''],
  });

  readonly createForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.pattern(/^[6-9]\d{9}$/)]],
    role: ['ADMIN', Validators.required],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/),
      ],
    ],
  });

  ngOnInit(): void {
    this.load();
  }

  applyFilters(): void {
    this.page.set(1);
    this.load();
  }

  onPageChange(next: number): void {
    this.page.set(next);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.data
      .listUsers({
        ...this.filters.getRawValue(),
        page: this.page(),
        limit: this.limit,
      })
      .subscribe({
        next: (res) => {
          this.users.set(res.data);
          this.total.set(res.meta?.total ?? res.data.length);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.error?.message ?? 'Failed to load users');
          this.loading.set(false);
        },
      });
  }

  create(): void {
    if (!this.permissions.can('users.manage')) return;

    this.error.set(null);
    this.message.set(null);
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const raw = this.createForm.getRawValue();
    this.saving.set(true);
    this.data
      .createUser({
        ...raw,
        phone: raw.phone || undefined,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.message.set('User created');
          this.createForm.reset({
            fullName: '',
            email: '',
            phone: '',
            role: 'ADMIN',
            password: '',
          });
          this.page.set(1);
          this.load();
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(err?.error?.error?.message ?? 'Failed to create user');
        },
      });
  }
}
