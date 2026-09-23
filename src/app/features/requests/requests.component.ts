import { DatePipe } from '@angular/common';
import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  PROPERTY_REQUEST_FLOW,
  PROPERTY_REQUEST_STATUS_LABELS,
  PROPERTY_REQUEST_STEP_SHORT,
  advanceActionFor,
  flowStepIndex,
  nextPropertyRequestStatus,
  propertyRequestStatusLabel,
  type PropertyRequestStatus,
} from '../../core/property-request-status';
import { AdminDataService } from '../../core/services/admin-data.service';
import { PermissionService } from '../../core/services/permission.service';
import { PaginationComponent } from '../../shared/pagination.component';

interface RequestRow {
  id: string;
  status: string;
  message?: string | null;
  createdAt: string;
  property?: { title: string; propertyCode: string; city?: string };
  buyer?: { fullName: string; email: string; phone?: string | null };
}

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, PaginationComponent],
  templateUrl: './requests.component.html',
  styleUrl: './requests.component.scss',
})
export class RequestsComponent implements OnInit {
  private readonly data = inject(AdminDataService);
  private readonly permissions = inject(PermissionService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly items = signal<RequestRow[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = 20;
  readonly updatingId = signal<string | null>(null);
  readonly selected = signal<RequestRow | null>(null);

  readonly canManage = this.permissions.can('requests.manage');
  readonly flow = PROPERTY_REQUEST_FLOW;
  readonly stepShort = PROPERTY_REQUEST_STEP_SHORT;
  readonly allStatuses: PropertyRequestStatus[] = [...PROPERTY_REQUEST_FLOW, 'CANCELLED'];
  readonly statusLabels = PROPERTY_REQUEST_STATUS_LABELS;

  readonly filters = this.fb.nonNullable.group({
    search: [''],
    status: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.selected()) this.closeDetail();
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
      .listPropertyRequests({
        ...this.filters.getRawValue(),
        page: this.page(),
        limit: this.limit,
      })
      .subscribe({
        next: (res) => {
          const rows = res.data as RequestRow[];
          this.items.set(rows);
          this.total.set(res.meta?.total ?? rows.length);
          this.loading.set(false);

          const open = this.selected();
          if (open) {
            const refreshed = rows.find((r) => r.id === open.id) ?? null;
            this.selected.set(refreshed);
          }
        },
        error: (err) => {
          this.error.set(err?.error?.error?.message ?? 'Failed to load requests');
          this.loading.set(false);
        },
      });
  }

  openDetail(row: RequestRow): void {
    this.selected.set(row);
  }

  closeDetail(): void {
    this.selected.set(null);
  }

  label(status: string): string {
    return propertyRequestStatusLabel(status);
  }

  currentStatus(status: string): string {
    return status === 'CLOSED' ? 'CANCELLED' : status;
  }

  stepIndex(status: string): number {
    return flowStepIndex(status);
  }

  stepClass(status: string, step: PropertyRequestStatus): string {
    const current = this.stepIndex(status);
    const idx = PROPERTY_REQUEST_FLOW.indexOf(step);
    if (this.isTerminal(status) && status !== 'DEAL_CLOSED') return 'is-idle';
    if (current < 0) return 'is-idle';
    if (idx < current) return 'is-done';
    if (idx === current) return 'is-current';
    return 'is-todo';
  }

  shortLabel(step: PropertyRequestStatus): string {
    if (step === 'CANCELLED') return 'Cancelled';
    return this.stepShort[step];
  }

  nextOf(status: string): PropertyRequestStatus | null {
    return nextPropertyRequestStatus(status);
  }

  advanceMeta(status: string): { button: string; hint: string } | null {
    return advanceActionFor(status);
  }

  isTerminal(status: string): boolean {
    return status === 'DEAL_CLOSED' || status === 'CANCELLED' || status === 'CLOSED';
  }

  setStatus(id: string, status: string): void {
    if (!this.canManage) return;
    this.updatingId.set(id);
    this.data.updatePropertyRequest(id, { status }).subscribe({
      next: () => {
        this.updatingId.set(null);
        this.load();
      },
      error: (err) => {
        this.error.set(err?.error?.error?.message ?? 'Could not update status');
        this.updatingId.set(null);
      },
    });
  }

  advance(row: RequestRow): void {
    const next = this.nextOf(row.status);
    if (next) this.setStatus(row.id, next);
  }
}
