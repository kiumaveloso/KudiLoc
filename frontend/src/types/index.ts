// ---------------------------------------------------------------------------
// KudiLoc TypeScript type definitions – mirrors backend DTOs
// ---------------------------------------------------------------------------

export interface LocationDto {
  latitude: number;
  longitude: number;
  province: string;
  municipality: string;
}

export interface ATMStatusDto {
  hasCash: boolean;
  hasMoney: boolean;
  hasPaper: boolean;
  operationalStatus: string;
  reliabilityScore: number;
  lastVerified: string;
  statusDescription: string;
  totalReports: number;
}

export interface AddressDto {
  street: string;
  neighborhood: string;
  landmark?: string;
}

export interface ATMDto {
  id: string;
  name: string;
  bankName: string;
  location: LocationDto;
  /** GeoJSON-ordered [longitude, latitude] */
  coordinates: [number, number];
  hasMoney: boolean;
  hasPaper: boolean;
  status: ATMStatusDto;
  address: AddressDto;
  supportedServices: string[];
  photoUrls: string[];
}

export interface FlatATMDto {
  id: string;
  bankName: string;
  locationName: string;
  latitude: number;
  longitude: number;
  status: string;
  isOnline: string;
  hasPaper: boolean;
  reliabilityScore: number;
  recentReportsCount: number;
  lastReportTime: string | null;
  updatedDate: string;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// Auth
export interface AuthResponse {
  token: string;
  userId: string;
  phoneNumber: string;
  name: string | null;
  reputationScore: number;
}

export interface OtpResponse {
  message: string;
  expiresInSeconds: number;
}

// User
export interface UserDto {
  id: string;
  name: string | null;
  reputationScore: number;
  totalReports: number;
  accurateReports: number;
  role: string;
  createdAt: string;
}

// Status Reports
export interface CreateStatusReport {
  atmId: string;
  userId?: string;
  hasCash: boolean;
  hasPaper?: boolean;
  operationalStatus?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
}

export interface StatusReportResponse {
  id: string;
  atmId: string;
  userId: string | null;
  hasCash: boolean;
  hasPaper: boolean;
  operationalStatus: string;
  notes: string | null;
  reportedAt: string;
  status: string;
  statusReported: string;
  reporterReputation: number;
  createdBy: string | null;
}

// Comments
export interface CommentDto {
  id: string;
  atmId: string;
  userId: string;
  userName: string;
  text: string;
  helpfulCount: number;
  createdAt: string;
}

// Leaderboard
export interface BadgeDto {
  id: string;
  userId: string;
  badgeType: string;
  earnedAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  name: string | null;
  totalReports: number;
  accurateReports: number;
  reputationScore: number;
  badges: BadgeDto[];
}

// Nearby sorted response
export interface NearbyATMResult {
  id: string;
  name: string;
  bankName: string;
  location: LocationDto;
  status: ATMStatusDto;
  address: AddressDto;
  distanceKm: number;
  estimatedWalkingTime: number;
}

export interface NearbyResponse {
  userLocation: { latitude: number; longitude: number };
  totalATMsFound: number;
  atms: NearbyATMResult[];
}
