import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { BLOG_CATEGORIES, AdminDataService } from '../../core/services/admin-data.service';

@Component({
  selector: 'app-blog-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './blog-form.component.html',
  styleUrl: './blog-form.component.scss',
})
export class BlogFormComponent implements OnInit {
  private readonly data = inject(AdminDataService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly categories = BLOG_CATEGORIES;
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly postId = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    slug: [''],
    excerpt: ['', [Validators.required, Validators.minLength(10)]],
    body: ['', [Validators.required, Validators.minLength(20)]],
    coverImageUrl: [''],
    category: ['Buying guide', Validators.required],
    tags: [''],
    city: [''],
    locality: [''],
    status: ['DRAFT' as 'DRAFT' | 'PUBLISHED'],
    featured: [false],
    seoTitle: [''],
    seoDescription: [''],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.postId.set(id);
    this.loading.set(true);
    this.data.getBlogPost(id).subscribe({
      next: (post) => {
        this.form.patchValue({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          body: post.body,
          coverImageUrl: post.coverImageUrl ?? '',
          category: post.category,
          tags: (post.tags ?? []).join(', '),
          city: post.city ?? '',
          locality: post.locality ?? '',
          status: post.status,
          featured: post.featured,
          seoTitle: post.seoTitle ?? '',
          seoDescription: post.seoDescription ?? '',
        });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load this post');
        this.loading.set(false);
      },
    });
  }

  coverSrc(): string {
    const url = this.form.controls.coverImageUrl.value;
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${environment.apiUrl.replace(/\/api$/, '')}${url}`;
  }

  onCoverSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.saving.set(true);
    this.data.uploadBlogCover(file).subscribe({
      next: (res) => {
        this.form.controls.coverImageUrl.setValue(res.url);
        this.saving.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.error?.message ?? 'Cover upload failed');
        this.saving.set(false);
      },
    });
  }

  clearCover(): void {
    this.form.controls.coverImageUrl.setValue('');
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const tags = raw.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 8);
    const body = {
      title: raw.title.trim(),
      slug: raw.slug.trim() || undefined,
      excerpt: raw.excerpt.trim(),
      body: raw.body.trim(),
      coverImageUrl: raw.coverImageUrl.trim() || null,
      category: raw.category,
      tags,
      city: raw.city.trim() || null,
      locality: raw.locality.trim() || null,
      status: raw.status,
      featured: raw.featured,
      seoTitle: raw.seoTitle.trim() || null,
      seoDescription: raw.seoDescription.trim() || null,
    };

    this.saving.set(true);
    this.error.set(null);
    const id = this.postId();
    const request = id ? this.data.updateBlogPost(id, body) : this.data.createBlogPost(body);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        void this.router.navigate(['/blog']);
      },
      error: (err) => {
        this.error.set(err?.error?.error?.message ?? 'Could not save the post');
        this.saving.set(false);
      },
    });
  }
}
