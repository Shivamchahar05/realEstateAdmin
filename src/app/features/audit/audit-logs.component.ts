import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AdminDataService } from '../../core/services/admin-data.service';
import { PaginationComponent } from '../../shared/pagination.component';

interface AuditRow {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  createdAt: string;
  actor?: { fullName: string; role: string } | null;
}

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [DatePipe, PaginationComponent],
  templateUrl: './audit-logs.component.html',
  styleUrl: './audit-logs.component.scss',
})
export class AuditLogsComponent implements OnInit {
  private readonly data = inject(AdminDataService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly items = signal<AuditRow[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = 20;

  ngOnInit(): void {
    this.load();
  }

  onPageChange(next: number): void {
    this.page.set(next);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.data.listAuditLogs({ page: this.page(), limit: this.limit }).subscribe({
      next: (res) => {
        this.items.set(res.data as AuditRow[]);
        this.total.set(res.meta?.total ?? res.data.length);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.error?.message ?? 'Failed to load audit logs');
        this.loading.set(false);
      },
    });
  }
}
