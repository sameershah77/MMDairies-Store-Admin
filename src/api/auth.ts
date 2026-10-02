import {
  apiRequest,
  apiRequestMessage,
  clearAuthStorage,
  getRefreshToken,
  saveProfileJson,
  setTokens,
} from '@/lib/apiClient';
import { mapAuthAdminToProfile } from '@/lib/mapStoreAdminProfile';
import type { AuthTokenResponse, OtpSentDto } from '@/types/api';

export async function signInStoreAdmin(login: string, password: string) {
  const data = await apiRequest<AuthTokenResponse>('/api/v1/Auth/SignInStoreAdmin', {
    method: 'POST',
    auth: false,
    body: { login, password },
  });

  setTokens(data.access_token, data.refresh_token);
  localStorage.setItem('mm_store_admin_auth', 'true');
  const profile = mapAuthAdminToProfile(data.admin);
  saveProfileJson(profile);
  return { tokens: data, profile };
}

export function sendForgotPasswordOtp(phoneNo: string) {
  return apiRequest<OtpSentDto | undefined>('/api/v1/Auth/SendForgotPasswordOtp', {
    method: 'POST',
    auth: false,
    body: { phoneNo },
  });
}

export function resetPassword(body: {
  phoneNo: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}) {
  return apiRequestMessage('/api/v1/Auth/ResetPassword', {
    method: 'POST',
    auth: false,
    body,
  });
}

export async function logoutApi() {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) {
      await apiRequestMessage('/api/v1/Auth/Logout', {
        method: 'POST',
        auth: false,
        body: { refreshToken },
      });
    }
  } catch {
    // ignore logout API errors — clear local session anyway
  } finally {
    clearAuthStorage();
  }
}
