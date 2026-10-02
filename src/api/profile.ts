import { apiRequest } from '@/lib/apiClient';
import type {
  ChangeStoreAdminPasswordRequest,
  MustReloginDto,
  OtpSentDto,
  SendStoreAdminChangePhoneOtpRequest,
  StoreAdminMyProfileDto,
  UpdateStoreAdminNameRequest,
  UpdateStoreAdminPhoneRequest,
  UpdateStoreAdminUsernameRequest,
} from '@/types/api';

export function getMyProfile() {
  return apiRequest<StoreAdminMyProfileDto>('/api/v1/Profile/GetMyProfile');
}

export function updateStoreAdminName(body: UpdateStoreAdminNameRequest) {
  return apiRequest<StoreAdminMyProfileDto>('/api/v1/Profile/UpdateStoreAdminName', {
    method: 'PUT',
    body,
  });
}

export function sendStoreAdminChangePhoneOtp(body: SendStoreAdminChangePhoneOtpRequest) {
  return apiRequest<OtpSentDto>('/api/v1/Profile/SendStoreAdminChangePhoneOtp', {
    method: 'POST',
    body,
  });
}

export function updateStoreAdminPhone(body: UpdateStoreAdminPhoneRequest) {
  return apiRequest<StoreAdminMyProfileDto>('/api/v1/Profile/UpdateStoreAdminPhone', {
    method: 'PUT',
    body,
  });
}

export function updateStoreAdminUsername(body: UpdateStoreAdminUsernameRequest) {
  return apiRequest<StoreAdminMyProfileDto>('/api/v1/Profile/UpdateStoreAdminUsername', {
    method: 'PUT',
    body,
  });
}

export function changeStoreAdminPassword(body: ChangeStoreAdminPasswordRequest) {
  return apiRequest<MustReloginDto>('/api/v1/Profile/ChangeStoreAdminPassword', {
    method: 'PUT',
    body,
  });
}
