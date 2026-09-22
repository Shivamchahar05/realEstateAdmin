import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { switchMap, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AMENITIES,
  FURNISHING_ITEMS,
  NEARBY_CATEGORIES,
  type AmenityKey,
  type FurnishingItemKey,
  type NearbyCategory,
} from '../../core/property-features';
import { AdminDataService } from '../../core/services/admin-data.service';
import { PropertyMedia, StaffOption } from '../../core/models/api.models';

interface PendingMedia {
  file: File;
  previewUrl: string;
  kind: 'image' | 'video';
}

interface NearbyRow {
  name: string;
  distance: string;
  category: NearbyCategory;
}

@Component({
  selector: 'app-property-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './property-form.component.html',
  styleUrl: './property-form.component.scss',
})
export class PropertyFormComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly data = inject(AdminDataService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly saving = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly mediaError = signal<string | null>(null);
  readonly staff = signal<StaffOption[]>([]);
  readonly propertyId = signal<string | null>(null);
  readonly existingMedia = signal<PropertyMedia[]>([]);
  readonly pendingMedia = signal<PendingMedia[]>([]);
  readonly removingMediaId = signal<string | null>(null);

  readonly furnishingItems = FURNISHING_ITEMS;
  readonly amenitiesCatalog = AMENITIES;
  readonly nearbyCategories = NEARBY_CATEGORIES;

  readonly furnishingQty = signal<Record<string, number>>({});
  readonly selectedAmenities = signal<Set<string>>(new Set());
  readonly nearbyRows = signal<NearbyRow[]>([]);

  readonly isEdit = () => !!this.propertyId();

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
    description: [''],
    propertyType: ['APARTMENT', Validators.required],
    city: ['Gurgaon', [Validators.required, Validators.minLength(2)]],
    locality: ['', [Validators.required, Validators.minLength(2)]],
    address: ['', [Validators.required, Validators.minLength(5)]],
    state: ['Haryana', Validators.required],
    pincode: ['', [Validators.pattern(/^\d{6}$/)]],
    bhk: [3, [Validators.min(0), Validators.max(20)]],
    carpetAreaSqft: [1200, [Validators.min(1)]],
    builtUpAreaSqft: [1400, [Validators.min(1)]],
    floor: [5, [Validators.min(0)]],
    totalFloors: [15, [Validators.min(0)]],
    ageYears: [3, [Validators.min(0)]],
    parkingSpaces: [1, [Validators.min(0)]],
    furnishing: ['SEMI_FURNISHED', Validators.required],
    readyToMove: [true],
    askingPrice: [10000000, [Validators.required, Validators.min(1)]],
    estimatedMinPrice: [null as number | null],
    estimatedMaxPrice: [null as number | null],
    sellerId: [''],
    lawyerId: [''],
    inspectorId: [''],
    propertyManagerId: [''],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.propertyId.set(id);
    }

    this.data.staffOptions().subscribe({
      next: (staff) => this.staff.set(staff),
    });
    this.data.listUsers({ role: 'SELLER', limit: 50 }).subscribe({
      next: (res) => {
        const sellers = res.data.map((u) => ({
          id: u.id,
          fullName: u.fullName,
          email: u.email,
          role: u.role,
        }));
        this.staff.update((current) => [...current, ...sellers]);
      },
    });

    if (id) {
      this.loadProperty(id);
    }
  }

  ngOnDestroy(): void {
    this.clearPendingPreviews();
  }

  private clearPendingPreviews(): void {
    this.pendingMedia().forEach((m) => URL.revokeObjectURL(m.previewUrl));
  }

  private loadProperty(id: string): void {
    this.loading.set(true);
    this.data.getProperty(id).subscribe({
      next: (property) => {
        this.form.patchValue({
          title: property.title,
          description: property.description ?? '',
          propertyType: property.propertyType,
          city: property.city,
          locality: property.locality,
          address: property.address,
          state: property.state,
          pincode: property.pincode ?? '',
          bhk: property.bhk ?? 0,
          carpetAreaSqft: property.carpetAreaSqft != null ? Number(property.carpetAreaSqft) : 0,
          builtUpAreaSqft:
            property.builtUpAreaSqft != null ? Number(property.builtUpAreaSqft) : 0,
          floor: property.floor ?? 0,
          totalFloors: property.totalFloors ?? 0,
          ageYears: property.ageYears ?? 0,
          parkingSpaces: property.parkingSpaces ?? 0,
          furnishing: property.furnishing || 'SEMI_FURNISHED',
          readyToMove: property.readyToMove ?? true,
          askingPrice: Number(property.askingPrice),
          estimatedMinPrice:
            property.estimatedMinPrice != null ? Number(property.estimatedMinPrice) : null,
          estimatedMaxPrice:
            property.estimatedMaxPrice != null ? Number(property.estimatedMaxPrice) : null,
          sellerId: property.sellerId ?? '',
          lawyerId: property.lawyerId ?? '',
          inspectorId: property.inspectorId ?? '',
          propertyManagerId: property.propertyManagerId ?? '',
        });

        const qty: Record<string, number> = {};
        for (const item of property.furnishingsInventory ?? []) {
          if (item?.key && item.qty > 0) qty[item.key] = item.qty;
        }
        this.furnishingQty.set(qty);
        this.selectedAmenities.set(new Set(property.amenities ?? []));
        this.nearbyRows.set(
          (property.nearbyPlaces ?? []).map((p) => ({
            name: p.name,
            distance: p.distance,
            category: (p.category as NearbyCategory) || 'OTHER',
          })),
        );

        this.existingMedia.set(property.media ?? []);
        this.loading.set(false);
        this.data.listMedia(id).subscribe({
          next: (media) => this.existingMedia.set(media),
        });
      },
      error: (err) => {
        this.error.set(err?.error?.error?.message ?? 'Failed to load property');
        this.loading.set(false);
      },
    });
  }

  furnishingValue(key: string): number {
    return this.furnishingQty()[key] ?? 0;
  }

  setFurnishingQty(key: FurnishingItemKey, raw: string | number): void {
    const qty = Math.max(0, Math.min(99, Number(raw) || 0));
    this.furnishingQty.update((current) => {
      const next = { ...current };
      if (qty <= 0) delete next[key];
      else next[key] = qty;
      return next;
    });
  }

  isAmenitySelected(key: string): boolean {
    return this.selectedAmenities().has(key);
  }

  toggleAmenity(key: AmenityKey): void {
    this.selectedAmenities.update((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  addNearbyRow(): void {
    this.nearbyRows.update((rows) => [
      ...rows,
      { name: '', distance: '', category: 'OTHER' as NearbyCategory },
    ]);
  }

  updateNearby(index: number, patch: Partial<NearbyRow>): void {
    this.nearbyRows.update((rows) =>
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }

  removeNearby(index: number): void {
    this.nearbyRows.update((rows) => rows.filter((_, i) => i !== index));
  }

  onMediaSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    this.mediaError.set(null);

    let next = [...this.pendingMedia()];
    for (const file of files) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      if (!isImage && !isVideo) {
        this.mediaError.set('Only images (JPG/PNG/WEBP/GIF) or videos (MP4/WEBM/MOV) are allowed.');
        continue;
      }
      if (file.size > 50 * 1024 * 1024) {
        this.mediaError.set(`“${file.name}” is larger than 50 MB.`);
        continue;
      }
      if (next.length + this.existingMedia().length >= 20) {
        this.mediaError.set('Maximum 20 media files per property.');
        break;
      }
      next.push({
        file,
        previewUrl: URL.createObjectURL(file),
        kind: isVideo ? 'video' : 'image',
      });
    }
    this.pendingMedia.set(next);
    input.value = '';
  }

  removePending(index: number): void {
    const list = [...this.pendingMedia()];
    const item = list[index];
    if (item) {
      URL.revokeObjectURL(item.previewUrl);
    }
    list.splice(index, 1);
    this.pendingMedia.set(list);
  }

  removeExisting(media: PropertyMedia): void {
    const propertyId = this.propertyId();
    if (!propertyId || this.removingMediaId()) return;
    if (!window.confirm('Remove this photo/video?')) return;

    this.removingMediaId.set(media.id);
    this.mediaError.set(null);
    this.data.deleteMedia(propertyId, media.id).subscribe({
      next: () => {
        this.existingMedia.update((items) => items.filter((m) => m.id !== media.id));
        this.removingMediaId.set(null);
      },
      error: (err) => {
        this.mediaError.set(err?.error?.error?.message ?? 'Could not remove media');
        this.removingMediaId.set(null);
      },
    });
  }

  mediaHref(media: PropertyMedia): string {
    if (media.url.startsWith('http')) return media.url;
    const base = environment.apiUrl.replace(/\/api\/?$/, '');
    return `${base}${media.url}`;
  }

  isVideo(media: PropertyMedia): boolean {
    return (media.type || '').toUpperCase() === 'VIDEO';
  }

  private buildFurnishingsInventory() {
    return Object.entries(this.furnishingQty())
      .filter(([, qty]) => qty > 0)
      .map(([key, qty]) => ({ key: key as FurnishingItemKey, qty }));
  }

  private buildNearbyPlaces() {
    return this.nearbyRows()
      .map((row) => ({
        name: row.name.trim(),
        distance: row.distance.trim(),
        category: row.category,
      }))
      .filter((row) => row.name.length >= 2 && row.distance.length >= 1);
  }

  submit(): void {
    this.error.set(null);
    this.mediaError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const body = {
      ...raw,
      sellerId: raw.sellerId || undefined,
      lawyerId: raw.lawyerId || undefined,
      inspectorId: raw.inspectorId || undefined,
      propertyManagerId: raw.propertyManagerId || undefined,
      estimatedMinPrice: raw.estimatedMinPrice || undefined,
      estimatedMaxPrice: raw.estimatedMaxPrice || undefined,
      pincode: raw.pincode || undefined,
      description: raw.description || undefined,
      furnishingsInventory: this.buildFurnishingsInventory(),
      amenities: Array.from(this.selectedAmenities()),
      nearbyPlaces: this.buildNearbyPlaces(),
    };

    this.saving.set(true);
    const id = this.propertyId();
    const files = this.pendingMedia().map((m) => m.file);

    const save$ = id ? this.data.updateProperty(id, body) : this.data.createProperty(body);

    save$
      .pipe(
        switchMap((property) => {
          if (!files.length) {
            return of(property);
          }
          return this.data.uploadMedia(property.id, files).pipe(switchMap(() => of(property)));
        }),
      )
      .subscribe({
        next: (property) => {
          this.saving.set(false);
          this.clearPendingPreviews();
          this.pendingMedia.set([]);
          void this.router.navigate(['/properties', property.id]);
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(
            err?.error?.error?.message ??
              (id ? 'Failed to update property' : 'Failed to create property'),
          );
        },
      });
  }

  sellers() {
    return this.staff().filter((s) => s.role === 'SELLER');
  }

  lawyers() {
    return this.staff().filter((s) => ['LAWYER', 'ADMIN', 'SUPER_ADMIN'].includes(s.role));
  }

  inspectors() {
    return this.staff().filter((s) => ['INSPECTOR', 'ADMIN', 'SUPER_ADMIN'].includes(s.role));
  }

  managers() {
    return this.staff().filter((s) =>
      ['PROPERTY_MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(s.role),
    );
  }
}
