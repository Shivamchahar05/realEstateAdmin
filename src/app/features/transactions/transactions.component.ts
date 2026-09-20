import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AdminDataService } from '../../core/services/admin-data.service';
import { PaginationComponent } from '../../shared/pagination.component';

interface TxRow {
  id: string;
  transactionCode: string;
  stage: string;
  sellerPrice?: string | number | null;
  negotiatedPrice?: string | number | null;
  updatedAt: string;
  property?: { title: string; propertyCode: string };
  buyer?: { fullName: string; email: string };
}

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, CurrencyPipe, PaginationComponent],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss',
})
export class TransactionsComponent implements OnInit {
  private readonly data = inject(AdminDataService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly items = signal<TxRow[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = 20;

  readonly filters = this.fb.nonNullable.group({
    search: [''],
    stage: [''],
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
      .listTransactions({
        ...this.filters.getRawValue(),
        page: this.page(),
        limit: this.limit,
      })
      .subscribe({
        next: (res) => {
          this.items.set(res.data as TxRow[]);
          this.total.set(res.meta?.total ?? res.data.length);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.error?.message ?? 'Failed to load transactions');
          this.loading.set(false);
        },
      });
  }
}
