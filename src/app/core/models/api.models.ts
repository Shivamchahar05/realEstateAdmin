export type Role =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'LAWYER'
  | 'INSPECTOR'
  | 'PROPERTY_MANAGER'
  | 'BUYER'
  | 'SELLER';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  phone?: string | null;
  fullName: string;
  role: Role;
  status: string;
  avatarUrl?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface DashboardMetrics {
  totals: {
    totalProperties: number;
    verifiedProperties: number;
    rejectedProperties: number;
    pendingVerification: number;
    liveListings: number;
    buyers: number;
    sellers: number;
    activeTransactions: number;
    completedTransactions: number;
  };
  recentProperties: Array<{
    id: string;
    propertyCode: string;
    title: string;
    city: string;
    verificationStatus: string;
    listingStatus: string;
    askingPrice: string | number;
    updatedAt: string;
  }>;
  recentAudits: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId?: string | null;
    createdAt: string;
    actor?: { id: string; fullName: string; role: string } | null;
  }>;
}

export interface Property {
  id: string;
  propertyCode: string;
  title: string;
  description?: string | null;
  propertyType: string;
  city: string;
  locality: string;
  address: string;
  state: string;
  pincode?: string | null;
  bhk?: number | null;
  carpetAreaSqft?: string | number | null;
  builtUpAreaSqft?: string | number | null;
  floor?: number | null;
  totalFloors?: number | null;
  ageYears?: number | null;
  parkingSpaces?: number | null;
  furnishing: string;
  readyToMove: boolean;
  askingPrice: string | number;
  estimatedMinPrice?: string | number | null;
  estimatedMaxPrice?: string | number | null;
  trustScore?: number | null;
  listingStatus: string;
  verificationStatus: string;
  rejectionReason?: string | null;
  lastVerifiedAt?: string | null;
  sellerId?: string | null;
  lawyerId?: string | null;
  inspectorId?: string | null;
  propertyManagerId?: string | null;
  seller?: { id: string; fullName: string; email: string; phone?: string | null } | null;
  lawyer?: { id: string; fullName: string; email: string } | null;
  inspector?: { id: string; fullName: string; email: string } | null;
  propertyManager?: { id: string; fullName: string; email: string } | null;
  verificationHistory?: Array<{
    id: string;
    fromStatus?: string | null;
    toStatus: string;
    notes?: string | null;
    createdAt: string;
    actor?: { id: string; fullName: string; role: string } | null;
  }>;
  healthReport?: Record<string, unknown> | null;
  documents?: PropertyDocument[];
  inspections?: PropertyInspection[];
  createdAt: string;
  updatedAt: string;
}

export interface PropertyDocument {
  id: string;
  propertyId: string;
  category: string;
  title: string;
  notes: string | null;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize?: number;
  version?: number;
  status: string;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  uploadedBy?: { id: string; fullName: string } | null;
  reviewedBy?: { id: string; fullName: string } | null;
}

export interface PropertyInspection {
  id: string;
  propertyId: string;
  inspectorId: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | string;
  scheduledAt: string | null;
  completedAt: string | null;
  checklist: Record<string, unknown> | null;
  findings: string | null;
  issues: string | null;
  photos: string[];
  latitude: number | string | null;
  longitude: number | string | null;
  createdAt: string;
  updatedAt: string;
  inspector?: { id: string; fullName: string; email: string } | null;
}

export interface StaffOption {
  id: string;
  fullName: string;
  email: string;
  role: Role;
}
