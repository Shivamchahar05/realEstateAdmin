import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AdminDataService, ContactMessage } from '../../core/services/admin-data.service';
import { PaginationComponent } from '../../shared/pagination.component';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [DatePipe, PaginationComponent],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss',
})
export class MessagesComponent implements OnInit {
  private readonly data = inject(AdminDataService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly items = signal<ContactMessage[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = 10;

  ngOnInit(): void {
    this.load();
  }

  onPageChange(next: number): void {
    this.page.set(next);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.data.listContactMessages({ page: this.page(), limit: this.limit }).subscribe({
      next: (res) => {
        this.items.set(res.data);
        this.total.set(res.meta?.total ?? res.data.length);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.error?.message ?? 'Failed to load messages');
        this.loading.set(false);
      },
    });
  }

  remove(item: ContactMessage): void {
    if (!confirm(`Delete the message from ${item.name}?`)) return;
    this.data.deleteContactMessage(item.id).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(err?.error?.error?.message ?? 'Could not delete the message'),
    });
  }
}
