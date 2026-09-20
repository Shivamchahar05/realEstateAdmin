import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { AdminDataService } from '../../core/services/admin-data.service';
import { PermissionService } from '../../core/services/permission.service';
import {
  Property,
  PropertyDocument,
  PropertyInspection,
  StaffOption,
} from '../../core/models/api.models';

const DOCUMENT_CATEGORIES = [
  'OWNERSHIP',
  'SALE_DEED',
  'PREVIOUS_SALE_DEED',
  'TAX',
  'ENCUMBRANCE',
  'MUTATION',
  'APPROVALS',
  'RERA',
  'LOAN_MORTGAGE',
  'SOCIETY',
  'UTILITY',
  'OTHER',
] as const;

const CHECKLIST_ITEMS = [
  { key: 'structure', label: 'Structure / building condition OK' },
  { key: 'access', label: 'Access roads & entry verified' },
  { key: 'boundaries', label: 'Boundaries match documents' },
  { key: 'utilities', label: 'Water / electricity / sewage checked' },
  { key: 'occupancy', label: 'Occupancy / possession status noted' },
  { key: 'safety', label: 'No critical safety hazards' },
] as const;

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CurrencyPipe, DatePipe],
  templateUrl: './property-detail.component.html',
  styleUrl: './property-detail.component.scss',
})
export class PropertyDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly data = inject(AdminDataService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  readonly permissions = inject(PermissionService);

  readonly documentCategories = DOCUMENT_CATEGORIES;
  readonly checklistItems = CHECKLIST_ITEMS;

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly property = signal<Property | null>(null);
  readonly documents = signal<PropertyDocument[]>([]);
  readonly inspections = signal<PropertyInspection[]>([]);
  readonly staff = signal<StaffOption[]>([]);
  readonly reviewingId = signal<string | null>(null);
  readonly editingInspectionId = signal<string | null>(null);

  readonly assignForm = this.fb.group({
    lawyerId: [''],
    inspectorId: [''],
    propertyManagerId: [''],
  });

  readonly transitionForm = this.fb.nonNullable.group({
    toStatus: ['LEGAL_REVIEW', Validators.required],
    notes: ['', [Validators.required, Validators.minLength(3)]],
    trustScore: [85, [Validators.min(0), Validators.max(100)]],
  });

  readonly rejectForm = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.minLength(10)]],
  });

  readonly reviewForm = this.fb.nonNullable.group({
    notes: ['', [Validators.required, Validators.minLength(3)]],
  });

  readonly requestForm = this.fb.nonNullable.group({
    category: ['OTHER' as (typeof DOCUMENT_CATEGORIES)[number], Validators.required],
    title: ['', [Validators.required, Validators.minLength(2)]],
    notes: ['', [Validators.required, Validators.minLength(5)]],
  });

  readonly scheduleForm = this.fb.nonNullable.group({
    inspectorId: ['', Validators.required],
    scheduledAt: ['', Validators.required],
  });

  readonly inspectionForm = this.fb.nonNullable.group({
    status: ['IN_PROGRESS', Validators.required],
    findings: ['', [Validators.required, Validators.minLength(3)]],
    issues: [''],
    latitude: [''],
    longitude: [''],
    structure: [false],
    access: [false],
    boundaries: [false],
    utilities: [false],
    occupancy: [false],
    safety: [false],
  });

  readonly inspectionPhotos = signal<string[]>([]);
  readonly uploadingPhotos = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      void this.router.navigate(['/properties']);
      return;
    }

    if (this.permissions.can('properties.assign') || this.permissions.can('inspections.schedule')) {
      this.data.staffOptions().subscribe({
        next: (staff) => this.staff.set(staff),
        error: () => undefined,
      });
    }

    this.reload(id);
  }

  reload(id: string): void {
    this.loading.set(true);
    this.data.getProperty(id).subscribe({
      next: (property) => {
        this.property.set(property);
        this.documents.set(property.documents ?? []);
        this.inspections.set(property.inspections ?? []);
        this.assignForm.patchValue({
          lawyerId: property.lawyerId ?? '',
          inspectorId: property.inspectorId ?? '',
          propertyManagerId: property.propertyManagerId ?? '',
        });
        this.scheduleForm.patchValue({
          inspectorId: property.inspectorId ?? '',
          scheduledAt: '',
        });
        this.setDefaultTransition(property.verificationStatus);
        this.loading.set(false);

        this.data.listDocuments(id).subscribe({
          next: (docs) => this.documents.set(docs),
        });
        if (this.permissions.can('inspections.view')) {
          this.data.listInspections(id).subscribe({
            next: (items) => this.inspections.set(items),
          });
        }
      },
      error: (err) => {
        this.error.set(err?.error?.error?.message ?? 'Failed to load property');
        this.loading.set(false);
      },
    });
  }

  private setDefaultTransition(status: string): void {
    if (this.permissions.is('INSPECTOR') && status === 'PHYSICAL_INSPECTION') {
      this.transitionForm.patchValue({ toStatus: 'FINAL_REVIEW' });
    } else if (this.permissions.is('LAWYER') && status === 'LEGAL_REVIEW') {
      this.transitionForm.patchValue({ toStatus: 'PHYSICAL_INSPECTION' });
    } else if (status === 'FINAL_REVIEW') {
      this.transitionForm.patchValue({ toStatus: 'VERIFIED' });
    }
  }

  assign(): void {
    const property = this.property();
    if (!property) return;

    const raw = this.assignForm.getRawValue();
    const body: Record<string, string | null> = {};

    if (raw.lawyerId) {
      body['lawyerId'] = raw.lawyerId;
    } else if (property.lawyerId) {
      body['lawyerId'] = null;
    }

    if (raw.inspectorId) {
      body['inspectorId'] = raw.inspectorId;
    } else if (property.inspectorId) {
      body['inspectorId'] = null;
    }

    if (raw.propertyManagerId) {
      body['propertyManagerId'] = raw.propertyManagerId;
    } else if (property.propertyManagerId) {
      body['propertyManagerId'] = null;
    }

    if (Object.keys(body).length === 0) {
      this.error.set('Select at least one staff member to assign');
      return;
    }

    this.saving.set(true);
    this.message.set(null);
    this.error.set(null);
    this.data.assignStaff(property.id, body).subscribe({
      next: (updated) => {
        this.property.set(updated);
        this.message.set('Staff assignment updated');
        this.saving.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.error?.message ?? 'Assignment failed');
        this.saving.set(false);
      },
    });
  }

  transition(): void {
    const property = this.property();
    if (!property || this.transitionForm.invalid) {
      this.transitionForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.data.transitionVerification(property.id, this.transitionForm.getRawValue()).subscribe({
      next: () => {
        this.message.set('Verification status updated');
        this.reload(property.id);
        this.saving.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.error?.message ?? 'Transition failed');
        this.saving.set(false);
      },
    });
  }

  approve(): void {
    const property = this.property();
    if (!property) return;
    this.saving.set(true);
    this.data.approveProperty(property.id, this.transitionForm.controls.trustScore.value).subscribe({
      next: (updated) => {
        this.property.set(updated);
        this.message.set('Property verified and published');
        this.saving.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.error?.message ?? 'Approve failed');
        this.saving.set(false);
      },
    });
  }

  reject(): void {
    const property = this.property();
    if (!property || this.rejectForm.invalid) {
      this.rejectForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.data.rejectProperty(property.id, this.rejectForm.controls.reason.value).subscribe({
      next: (updated) => {
        this.property.set(updated);
        this.message.set('Property rejected');
        this.saving.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.error?.message ?? 'Reject failed');
        this.saving.set(false);
      },
    });
  }

  startReview(doc: PropertyDocument): void {
    this.reviewingId.set(doc.id);
    this.reviewForm.reset({ notes: doc.notes ?? '' });
    this.error.set(null);
  }

  cancelReview(): void {
    this.reviewingId.set(null);
    this.reviewForm.reset({ notes: '' });
  }

  reviewDocument(status: 'VERIFIED' | 'REJECTED'): void {
    const property = this.property();
    const documentId = this.reviewingId();
    if (!property || !documentId || this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.data
      .reviewDocument(property.id, documentId, {
        status,
        notes: this.reviewForm.controls.notes.value.trim(),
      })
      .subscribe({
        next: () => {
          this.message.set(
            status === 'VERIFIED' ? 'Document approved' : 'Document rejected — seller can re-upload',
          );
          this.reviewingId.set(null);
          this.reviewForm.reset({ notes: '' });
          this.reload(property.id);
          this.saving.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.error?.message ?? 'Document review failed');
          this.saving.set(false);
        },
      });
  }

  requestDocument(): void {
    const property = this.property();
    if (!property || this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    const raw = this.requestForm.getRawValue();
    this.data
      .requestDocument(property.id, {
        category: raw.category,
        title: raw.title.trim(),
        notes: raw.notes.trim(),
      })
      .subscribe({
        next: () => {
          this.message.set('Additional document requested from seller');
          this.requestForm.reset({ category: 'OTHER', title: '', notes: '' });
          this.reload(property.id);
          this.saving.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.error?.message ?? 'Could not request document');
          this.saving.set(false);
        },
      });
  }

  scheduleInspection(): void {
    const property = this.property();
    if (!property) return;

    const inspectorId = this.scheduleForm.controls.inspectorId.value.trim();
    const scheduledAt = this.scheduleForm.controls.scheduledAt.value.trim();

    if (!inspectorId) {
      this.error.set('Select an inspector');
      this.scheduleForm.controls.inspectorId.markAsTouched();
      return;
    }
    if (!scheduledAt) {
      this.error.set('Pick inspection date & time');
      this.scheduleForm.controls.scheduledAt.markAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.data
      .createInspection(property.id, {
        inspectorId,
        scheduledAt: new Date(scheduledAt).toISOString(),
      })
      .subscribe({
        next: () => {
          this.message.set('Inspection scheduled — inspector can submit the report after the visit');
          this.scheduleForm.patchValue({ scheduledAt: '' });
          this.reload(property.id);
          this.saving.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.error?.message ?? 'Could not schedule inspection');
          this.saving.set(false);
        },
      });
  }

  startInspectionEdit(item: PropertyInspection): void {
    this.editingInspectionId.set(item.id);
    this.inspectionPhotos.set([...(item.photos ?? [])]);
    const checklist = (item.checklist ?? {}) as Record<string, boolean>;
    this.inspectionForm.reset({
      status: item.status === 'ASSIGNED' ? 'IN_PROGRESS' : item.status,
      findings: item.findings ?? '',
      issues: item.issues ?? '',
      latitude: item.latitude != null ? String(item.latitude) : '',
      longitude: item.longitude != null ? String(item.longitude) : '',
      structure: !!checklist['structure'],
      access: !!checklist['access'],
      boundaries: !!checklist['boundaries'],
      utilities: !!checklist['utilities'],
      occupancy: !!checklist['occupancy'],
      safety: !!checklist['safety'],
    });
    this.error.set(null);
  }

  cancelInspectionEdit(): void {
    this.editingInspectionId.set(null);
    this.inspectionPhotos.set([]);
  }

  onInspectionPhotosSelected(event: Event): void {
    const property = this.property();
    const inspectionId = this.editingInspectionId();
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (!property || !inspectionId || !files.length) return;

    this.uploadingPhotos.set(true);
    this.error.set(null);
    this.data.uploadInspectionPhotos(property.id, inspectionId, files).subscribe({
      next: (updated) => {
        this.inspectionPhotos.set([...(updated.photos ?? [])]);
        this.inspections.update((list) =>
          list.map((item) => (item.id === updated.id ? updated : item)),
        );
        this.uploadingPhotos.set(false);
        this.message.set('Photos uploaded');
      },
      error: (err) => {
        this.error.set(err?.error?.error?.message ?? 'Photo upload failed');
        this.uploadingPhotos.set(false);
      },
    });
  }

  removeInspectionPhoto(url: string): void {
    const property = this.property();
    const inspectionId = this.editingInspectionId();
    if (!property || !inspectionId) return;

    this.uploadingPhotos.set(true);
    this.data.removeInspectionPhoto(property.id, inspectionId, url).subscribe({
      next: (updated) => {
        this.inspectionPhotos.set([...(updated.photos ?? [])]);
        this.inspections.update((list) =>
          list.map((item) => (item.id === updated.id ? updated : item)),
        );
        this.uploadingPhotos.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.error?.message ?? 'Could not remove photo');
        this.uploadingPhotos.set(false);
      },
    });
  }

  photoHref(url: string): string {
    if (!url) return '#';
    if (url.startsWith('http')) return url;
    const base = environment.apiUrl.replace(/\/api\/?$/, '');
    return `${base}${url}`;
  }

  saveInspection(markComplete = false): void {
    const property = this.property();
    const inspectionId = this.editingInspectionId();
    if (!property || !inspectionId) return;

    const findingsCtrl = this.inspectionForm.controls.findings;
    const findingsValue = findingsCtrl.value.trim();
    findingsCtrl.setValue(findingsValue);

    if (findingsValue.length < 3) {
      findingsCtrl.markAsTouched();
      this.error.set('Findings me kam se kam 3 characters likho, phir Mark completed dabao');
      return;
    }

    if (this.inspectionForm.invalid) {
      this.inspectionForm.markAllAsTouched();
      this.error.set('Inspection form incomplete — required fields check karo');
      return;
    }

    const raw = this.inspectionForm.getRawValue();
    const checklist: Record<string, boolean> = {
      structure: raw.structure,
      access: raw.access,
      boundaries: raw.boundaries,
      utilities: raw.utilities,
      occupancy: raw.occupancy,
      safety: raw.safety,
    };

    const body: Record<string, unknown> = {
      status: markComplete ? 'COMPLETED' : raw.status,
      findings: findingsValue,
      checklist,
      photos: this.inspectionPhotos(),
    };

    const issues = raw.issues.trim();
    if (issues) {
      body['issues'] = issues;
    }

    const lat = Number(raw.latitude.trim());
    const lng = Number(raw.longitude.trim());
    if (raw.latitude.trim() && !Number.isNaN(lat)) {
      body['latitude'] = lat;
    }
    if (raw.longitude.trim() && !Number.isNaN(lng)) {
      body['longitude'] = lng;
    }

    this.saving.set(true);
    this.error.set(null);
    this.message.set(null);

    this.data.updateInspection(property.id, inspectionId, body).subscribe({
      next: () => {
        if (
          markComplete &&
          property.verificationStatus === 'PHYSICAL_INSPECTION' &&
          this.permissions.can('properties.transition')
        ) {
          this.data
            .transitionVerification(property.id, {
              toStatus: 'FINAL_REVIEW',
              notes: `Physical inspection completed. ${findingsValue}`.slice(0, 2000),
              trustScore: this.transitionForm.controls.trustScore.value,
            })
            .subscribe({
              next: () => {
                this.message.set('Inspection completed and moved to FINAL_REVIEW');
                this.editingInspectionId.set(null);
                this.inspectionPhotos.set([]);
                this.reload(property.id);
                this.saving.set(false);
              },
              error: (err) => {
                this.message.set(
                  'Inspection report saved as COMPLETED, but status transition failed — use Verification workflow → FINAL_REVIEW',
                );
                this.error.set(err?.error?.error?.message ?? null);
                this.editingInspectionId.set(null);
                this.inspectionPhotos.set([]);
                this.reload(property.id);
                this.saving.set(false);
              },
            });
          return;
        }

        this.message.set(
          markComplete
            ? 'Inspection marked completed'
            : 'Inspection report saved',
        );
        this.editingInspectionId.set(null);
        this.inspectionPhotos.set([]);
        this.reload(property.id);
        this.saving.set(false);
      },
      error: (err) => {
        const details = err?.error?.error?.details;
        const detailMsg =
          details?.fieldErrors && typeof details.fieldErrors === 'object'
            ? Object.values(details.fieldErrors as Record<string, string[]>)
                .flat()
                .join(', ')
            : '';
        this.error.set(
          detailMsg || err?.error?.error?.message || 'Could not save inspection',
        );
        this.saving.set(false);
      },
    });
  }

  activeInspection(): PropertyInspection | null {
    const open = this.inspections().find((i) =>
      ['ASSIGNED', 'IN_PROGRESS'].includes(i.status),
    );
    return open ?? this.inspections()[0] ?? null;
  }

  canEditInspection(item: PropertyInspection): boolean {
    if (!this.permissions.can('inspections.update')) return false;
    if (item.status === 'CANCELLED') return false;
    if (this.permissions.is('INSPECTOR')) {
      return item.inspectorId === this.auth.user()?.id;
    }
    return true;
  }

  showInspectionPanel(): boolean {
    if (!this.permissions.can('inspections.view')) return false;
    const status = this.property()?.verificationStatus;
    if (!status) return false;
    if (this.inspections().length > 0) return true;
    return [
      'PHYSICAL_INSPECTION',
      'FINAL_REVIEW',
      'VALUATION',
      'RISK_ASSESSMENT',
      'GOVERNMENT_CHECK',
      'VERIFIED',
    ].includes(status);
  }

  fileHref(doc: PropertyDocument): string | null {
    if (!doc.fileUrl || doc.fileSize === 0) return null;
    if (doc.fileUrl.startsWith('http')) return doc.fileUrl;
    const base = environment.apiUrl.replace(/\/api\/?$/, '');
    return `${base}${doc.fileUrl}`;
  }

  canReviewDoc(doc: PropertyDocument): boolean {
    return (
      this.permissions.can('documents.review') &&
      ['PENDING', 'UNDER_REVIEW', 'REJECTED'].includes(doc.status) &&
      (doc.fileSize ?? 0) > 0
    );
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
