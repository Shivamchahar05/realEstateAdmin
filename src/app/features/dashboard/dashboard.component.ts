import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminDataService } from '../../core/services/admin-data.service';
import { PermissionService } from '../../core/services/permission.service';
import { DashboardMetrics } from '../../core/models/api.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly data = inject(AdminDataService);
  readonly permissions = inject(PermissionService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly metrics = signal<DashboardMetrics | null>(null);

  ngOnInit(): void {
    this.data.getMetrics().subscribe({
      next: (metrics) => {
        this.metrics.set(metrics);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.error?.message ?? 'Failed to load dashboard');
        this.loading.set(false);
      },
    });
  }
}
