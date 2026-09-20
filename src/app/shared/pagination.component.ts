import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  template: `
    <div class="pagination" [hidden]="totalPages() <= 1 && total() === 0">
      <p class="meta">
        @if (total() === 0) {
          No records
        } @else {
          Showing {{ from() }}–{{ to() }} of {{ total() }}
        }
      </p>
      <div class="controls">
        <button
          type="button"
          class="btn"
          [disabled]="page() <= 1"
          (click)="pageChange.emit(page() - 1)"
        >
          Previous
        </button>
        <span class="page-indicator">Page {{ page() }} / {{ totalPages() || 1 }}</span>
        <button
          type="button"
          class="btn"
          [disabled]="page() >= totalPages()"
          (click)="pageChange.emit(page() + 1)"
        >
          Next
        </button>
      </div>
    </div>
  `,
  styles: `
    .pagination {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: center;
      justify-content: space-between;
      margin-top: 1rem;
      padding-top: 0.85rem;
      border-top: 1px solid rgba(23, 53, 40, 0.1);
    }
    .meta,
    .page-indicator {
      color: #5b675f;
      font-size: 0.88rem;
      margin: 0;
    }
    .controls {
      display: flex;
      gap: 0.55rem;
      align-items: center;
    }
  `,
})
export class PaginationComponent {
  readonly page = input.required<number>();
  readonly limit = input.required<number>();
  readonly total = input.required<number>();
  readonly pageChange = output<number>();

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.limit())));
  readonly from = computed(() => (this.total() === 0 ? 0 : (this.page() - 1) * this.limit() + 1));
  readonly to = computed(() => Math.min(this.page() * this.limit(), this.total()));
}
