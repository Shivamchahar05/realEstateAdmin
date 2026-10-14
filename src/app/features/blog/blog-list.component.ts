import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BLOG_CATEGORIES, BlogPost } from '../../core/services/admin-data.service';
import { AdminDataService } from '../../core/services/admin-data.service';
import { PaginationComponent } from '../../shared/pagination.component';

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe, PaginationComponent],
  templateUrl: './blog-list.component.html',
  styleUrl: './blog-list.component.scss',
})
export class BlogListComponent implements OnInit {
  private readonly data = inject(AdminDataService);
  private readonly fb = inject(FormBuilder);

  readonly categories = BLOG_CATEGORIES;
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly items = signal<BlogPost[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = 10;

  readonly filters = this.fb.nonNullable.group({
    search: [''],
    status: [''],
    category: [''],
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
    const raw = this.filters.getRawValue();
    this.data
      .listBlogPosts({
        search: raw.search,
        status: raw.status,
        category: raw.category,
        page: this.page(),
        limit: this.limit,
      })
      .subscribe({
        next: (res) => {
          this.items.set(res.data);
          this.total.set(res.meta?.total ?? res.data.length);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.error?.message ?? 'Failed to load posts');
          this.loading.set(false);
        },
      });
  }

  remove(post: BlogPost): void {
    if (!confirm(`Delete “${post.title}”?`)) return;
    this.data.deleteBlogPost(post.id).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(err?.error?.error?.message ?? 'Could not delete the post'),
    });
  }
}
