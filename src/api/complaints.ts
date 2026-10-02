import { apiRequest } from '@/lib/apiClient';
import type {
  ComplaintDetailsDto,
  ComplaintListItemDto,
  ComplaintListQuery,
  PagedResultDto,
  ReplyComplaintRequest,
  ResolveComplaintRequest,
} from '@/types/api';

export function getStoreComplaints(query: ComplaintListQuery = {}) {
  const params = new URLSearchParams();
  if (query.status != null) params.set('status', String(query.status));
  params.set('page', String(query.page ?? 1));
  params.set('pageSize', String(query.pageSize ?? 10));

  return apiRequest<PagedResultDto<ComplaintListItemDto>>(
    `/api/v1/Complaint/GetStoreComplaints?${params.toString()}`,
  );
}

export function getComplaintById(complaintId: string) {
  return apiRequest<ComplaintDetailsDto>(`/api/v1/Complaint/GetComplaintById/${complaintId}`);
}

export function replyToComplaint(complaintId: string, body: ReplyComplaintRequest) {
  return apiRequest<ComplaintDetailsDto>(`/api/v1/Complaint/ReplyToComplaint/${complaintId}`, {
    method: 'POST',
    body,
  });
}

export function resolveComplaint(complaintId: string, body: ResolveComplaintRequest = {}) {
  return apiRequest<ComplaintDetailsDto>(`/api/v1/Complaint/ResolveComplaint/${complaintId}`, {
    method: 'POST',
    body,
  });
}
