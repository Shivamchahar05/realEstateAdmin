import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminDataService } from '../../core/services/admin-data.service';
import { StaffOption } from '../../core/models/api.models';

@Component({
  selector: 'app-property-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './property-form.component.html',
  styleUrl: './property-form.component.scss',
})
export class PropertyFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly data = inject(AdminDataService);
  private readonly router = inject(Router);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly staff = signal<StaffOption[]>([]);

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
  }

  submit(): void {
    this.error.set(null);
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
    };

    this.saving.set(true);
    this.data.createProperty(body).subscribe({
      next: (property) => {
        this.saving.set(false);
        void this.router.navigate(['/properties', property.id]);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.error?.message ?? 'Failed to create property');
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
