import { apiRequest } from '@/lib/apiClient';
import type { OtpSentDto } from '@/types/api';

/** Store Admin may only send ChangeUsername (15). Super Admin purposes 5–14 are not used here. */
export const StoreAdminOtpPurpose = {
  ChangeUsername: 15,
} as const;

export function sendActionOtp(purpose: typeof StoreAdminOtpPurpose.ChangeUsername) {
  return apiRequest<OtpSentDto>('/api/v1/Otp/SendActionOtp', {
    method: 'POST',
    body: { purpose },
  });
}
