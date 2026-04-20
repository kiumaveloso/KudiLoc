// ---------------------------------------------------------------------------
// ATM API calls
// ---------------------------------------------------------------------------

import { apiFetch } from './client';
import type {
  ATMDto,
  FlatATMDto,
  NearbyResponse,
  PagedResult,
  StatusReportResponse,
  CreateStatusReport,
  CommentDto,
} from '../types';

/** List ATMs (flat format) with pagination. */
export async function getATMs(params?: {
  page?: number;
  pageSize?: number;
  id?: string;
}): Promise<FlatATMDto[]> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
  if (params?.id) qs.set('id', params.id);
  const q = qs.toString();
  return apiFetch<FlatATMDto[]>(`/atm${q ? `?${q}` : ''}`);
}

/** Get a single ATM by ID (full detail). */
export async function getATMById(id: string): Promise<ATMDto> {
  return apiFetch<ATMDto>(`/atm/${id}`);
}

/** Create a new ATM (Admin only). */
export async function createATM(dto: {
  name: string;
  bankName: string;
  latitude: number;
  longitude: number;
  locationName?: string;
  province?: string;
  municipality?: string;
  street?: string;
  neighborhood?: string;
  landmark?: string;
}): Promise<ATMDto> {
  return apiFetch<ATMDto>('/atm', {
    method: 'POST',
    body: JSON.stringify({
      name: dto.name,
      bank_name: dto.bankName,
      latitude: dto.latitude,
      longitude: dto.longitude,
      location_name: dto.locationName,
      province: dto.province,
      municipality: dto.municipality,
      street: dto.street,
      neighborhood: dto.neighborhood,
      landmark: dto.landmark,
    }),
  });
}

/** Delete an ATM (Admin only). */
export async function deleteATM(id: string): Promise<void> {
  return apiFetch<void>(`/atm/${id}`, { method: 'DELETE' });
}

/** Search ATMs by text query. */
export async function searchATMs(
  query: string,
  page = 1,
  pageSize = 20,
): Promise<PagedResult<ATMDto>> {
  return apiFetch<PagedResult<ATMDto>>(
    `/atm/search?query=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`,
  );
}

/** Get nearby ATMs sorted by distance. */
export async function getNearbyATMs(
  latitude: number,
  longitude: number,
  radiusKm?: number,
): Promise<NearbyResponse> {
  return apiFetch<NearbyResponse>('/atm/nearby/auto/sorted', {
    method: 'POST',
    body: JSON.stringify({ latitude, longitude, radius_km: radiusKm }),
  });
}

// ---------------------------------------------------------------------------
// Status Reports
// ---------------------------------------------------------------------------

/** Submit a crowd-sourced status report for an ATM. */
export async function submitStatusReport(
  report: CreateStatusReport,
): Promise<{ message: string; report: StatusReportResponse }> {
  return apiFetch('/statusreport', {
    method: 'POST',
    body: JSON.stringify({
      atm_id: report.atmId,
      user_id: report.userId,
      has_cash: report.hasCash,
      has_paper: report.hasPaper,
      operational_status: report.operationalStatus,
      notes: report.notes,
      latitude: report.latitude,
      longitude: report.longitude,
    }),
  });
}

/** Get recent reports for an ATM. */
export async function getATMReports(
  atmId: string,
  page = 1,
  pageSize = 20,
): Promise<PagedResult<StatusReportResponse>> {
  return apiFetch<PagedResult<StatusReportResponse>>(
    `/statusreport/atm/${atmId}?page=${page}&pageSize=${pageSize}`,
  );
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

/** Get comments for an ATM. */
export async function getATMComments(
  atmId: string,
  limit = 20,
): Promise<CommentDto[]> {
  return apiFetch<CommentDto[]>(`/comment/atm/${atmId}?limit=${limit}`);
}

/** Post a comment on an ATM. */
export async function addComment(
  atmId: string,
  userId: string,
  userName: string,
  text: string,
): Promise<CommentDto> {
  return apiFetch<CommentDto>('/comment', {
    method: 'POST',
    body: JSON.stringify({ atm_id: atmId, user_id: userId, user_name: userName, text }),
  });
}

/** Mark a comment as helpful. */
export async function markCommentHelpful(id: string): Promise<CommentDto> {
  return apiFetch<CommentDto>(`/comment/${id}/helpful`, { method: 'POST' });
}
