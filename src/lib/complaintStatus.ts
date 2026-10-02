import { ComplaintStatus } from '@/types/api';

export { ComplaintStatus };

export const COMPLAINT_PAGE_SIZE = 10;

export function complaintStatusTone(
  status: number,
): 'success' | 'danger' | 'warning' | 'neutral' | 'brand' {
  switch (status) {
    case ComplaintStatus.Open:
      return 'danger';
    case ComplaintStatus.InProgress:
      return 'warning';
    case ComplaintStatus.Resolved:
      return 'success';
    default:
      return 'neutral';
  }
}
