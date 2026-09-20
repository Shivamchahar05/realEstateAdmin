import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminDataService } from '../../core/services/admin-data.service';
import { PermissionService } from '../../core/services/permission.service';
import { Property } from '../../core/models/api.models';
import { PaginationComponent } from '../../shared/pagination.component';

@Component({
  selector: 'app-property-list',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CurrencyPipe, DatePipe, PaginationComponent],
  templateUrl: './property-list.component.html',
  styleUrl: './property-list.component.scss',
})
export class PropertyListComponent implements OnInit {
  private readonly data = inject(AdminDataService);
  private readonly fb = inject(FormBuilder);
  readonly permissions = inject(PermissionService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly items = signal<Property[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = 20;

  readonly filters = this.fb.nonNullable.group({
    search: [''],
    city: [''],
    verificationStatus: [''],
    listingStatus: [''],
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
    this.error.set(null);
    const query = {
      ...this.filters.getRawValue(),
      page: this.page(),
      limit: this.limit,
    };
    this.data.listProperties(query).subscribe({
      next: (res) => {
        this.items.set(res.data);
        this.total.set(res.meta?.total ?? res.data.length);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.error?.message ?? 'Failed to load properties');
        this.loading.set(false);
      },
    });
  }
}
