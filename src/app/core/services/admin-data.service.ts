import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import {
  AuthUser,
  DashboardMetrics,
  Property,
  PropertyDocument,
  PropertyInspection,
  PropertyMedia,
  StaffOption,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AdminDataService {
  private readonly api = inject(ApiService);

  getMetrics(): Observable<DashboardMetrics> {
    return this.api.get<DashboardMetrics>('/dashboard/metrics').pipe(map((r) => r.data));
  }

  listProperties(query: Record<string, string | number | undefined> = {}) {
    return this.api.get<Property[]>('/properties', query);
  }

  getProperty(id: string) {
    return this.api.get<Property>(`/properties/${id}`).pipe(map((r) => r.data));
  }

  createProperty(body: unknown) {
    return this.api.post<Property>('/properties', body).pipe(map((r) => r.data));
  }

  updateProperty(id: string, body: unknown) {
    return this.api.patch<Property>(`/properties/${id}`, body).pipe(map((r) => r.data));
  }

  listMedia(propertyId: string) {
    return this.api
      .get<PropertyMedia[]>(`/properties/${propertyId}/media`)
      .pipe(map((r) => r.data));
  }

  uploadMedia(propertyId: string, files: File[], caption?: string) {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    if (caption) {
      formData.append('caption', caption);
    }
    return this.api
      .upload<PropertyMedia[]>(`/properties/${propertyId}/media`, formData)
      .pipe(map((r) => r.data));
  }

  deleteMedia(propertyId: string, mediaId: string) {
    return this.api
      .delete<{ message: string }>(`/properties/${propertyId}/media/${mediaId}`)
      .pipe(map((r) => r.data));
  }

  assignStaff(id: string, body: unknown) {
    return this.api.post<Property>(`/properties/${id}/assign`, body).pipe(map((r) => r.data));
  }

  approveProperty(id: string, trustScore?: number) {
    return this.api
      .post<Property>(`/properties/${id}/approve`, trustScore ? { trustScore } : {})
      .pipe(map((r) => r.data));
  }

  rejectProperty(id: string, reason: string) {
    return this.api.post<Property>(`/properties/${id}/reject`, { reason }).pipe(map((r) => r.data));
  }

  transitionVerification(propertyId: string, body: unknown) {
    return this.api
      .post(`/properties/${propertyId}/verifications/transition`, body)
      .pipe(map((r) => r.data));
  }

  listDocuments(propertyId: string) {
    return this.api
      .get<PropertyDocument[]>(`/properties/${propertyId}/documents`)
      .pipe(map((r) => r.data));
  }

  reviewDocument(propertyId: string, documentId: string, body: { status: string; notes: string }) {
    return this.api
      .patch<PropertyDocument>(`/properties/${propertyId}/documents/${documentId}/review`, body)
      .pipe(map((r) => r.data));
  }

  requestDocument(
    propertyId: string,
    body: { category: string; title: string; notes: string },
  ) {
    return this.api
      .post<PropertyDocument>(`/properties/${propertyId}/documents/request`, body)
      .pipe(map((r) => r.data));
  }

  listInspections(propertyId: string) {
    return this.api
      .get<PropertyInspection[]>(`/properties/${propertyId}/inspections`)
      .pipe(map((r) => r.data));
  }

  createInspection(
    propertyId: string,
    body: { inspectorId: string; scheduledAt: string },
  ) {
    return this.api
      .post<PropertyInspection>(`/properties/${propertyId}/inspections`, body)
      .pipe(map((r) => r.data));
  }

  updateInspection(
    propertyId: string,
    inspectionId: string,
    body: Record<string, unknown>,
  ) {
    return this.api
      .patch<PropertyInspection>(`/properties/${propertyId}/inspections/${inspectionId}`, body)
      .pipe(map((r) => r.data));
  }

  uploadInspectionPhotos(propertyId: string, inspectionId: string, files: File[]) {
    const formData = new FormData();
    files.forEach((file) => formData.append('photos', file));
    return this.api
      .upload<PropertyInspection>(
        `/properties/${propertyId}/inspections/${inspectionId}/photos`,
        formData,
      )
      .pipe(map((r) => r.data));
  }

  removeInspectionPhoto(propertyId: string, inspectionId: string, url: string) {
    return this.api
      .delete<PropertyInspection>(`/properties/${propertyId}/inspections/${inspectionId}/photos`, {
        url,
      })
      .pipe(map((r) => r.data));
  }

  listUsers(query: Record<string, string | number | undefined> = {}) {
    return this.api.get<AuthUser[]>('/users', query);
  }

  createUser(body: unknown) {
    return this.api.post<AuthUser>('/users', body).pipe(map((r) => r.data));
  }

  updateUser(id: string, body: unknown) {
    return this.api.patch<AuthUser>(`/users/${id}`, body).pipe(map((r) => r.data));
  }

  staffOptions() {
    return this.api.get<StaffOption[]>('/users/staff-options').pipe(map((r) => r.data));
  }

  listTransactions(query: Record<string, string | number | undefined> = {}) {
    return this.api.get<unknown[]>('/transactions', query);
  }

  listPropertyRequests(query: Record<string, string | number | undefined> = {}) {
    return this.api.get<unknown[]>('/property-requests', query);
  }

  updatePropertyRequest(id: string, body: { status?: string }) {
    return this.api.patch<unknown>(`/property-requests/${id}`, body).pipe(map((r) => r.data));
  }

  listAuditLogs(query: Record<string, string | number | undefined> = {}) {
    return this.api.get<unknown[]>('/audit-logs', query);
  }
}
