import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Loader2, Lock, Pencil, Phone, Store, User, UserRound } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  changeStoreAdminPassword,
  getMyProfile,
  sendStoreAdminChangePhoneOtp,
  updateStoreAdminName,
  updateStoreAdminPhone,
  updateStoreAdminUsername,
} from '@/api/profile';
import { sendActionOtp, StoreAdminOtpPurpose } from '@/api/otp';
import { getAllStores } from '@/api/stores';
import { ApiError } from '@/lib/apiClient';
import { mapMyProfileDto } from '@/lib/mapStoreAdminProfile';
import type { AssignedStoreRef } from '@/types';
import type { StoreListItemDto } from '@/types/api';

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,50}$/;

type EditSection = 'name' | 'phone' | 'username' | 'password' | null;

function apiErrorMessage(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : fallback;
}

function SectionCard({
  icon,
  title,
  subtitle,
  children,
  onEdit,
  editing,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onEdit?: () => void;
  editing?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-surface p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            {icon}
          </div>
          <div>
            <p className="font-display text-base font-bold text-ink-900">{title}</p>
            {subtitle && <p className="text-xs text-ink-400">{subtitle}</p>}
          </div>
        </div>
        {onEdit && !editing && (
          <Button variant="outline" size="sm" icon={<Pencil className="size-3.5" />} onClick={onEdit}>
            Edit
          </Button>
        )}
      </div>
      {children}
    </div>
  );
}

function ReadValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-ink-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink-900">{value || '—'}</p>
    </div>
  );
}

export function ProfilePage() {
  const { profile, applyProfile, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<EditSection>(null);
  const [saving, setSaving] = useState(false);
  const [storeNames, setStoreNames] = useState<AssignedStoreRef[]>(profile.assignedStores);

  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);

  const [newPhone, setNewPhone] = useState('');
  const [phonePassword, setPhonePassword] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [sendingPhoneOtp, setSendingPhoneOtp] = useState(false);

  const [newUsername, setNewUsername] = useState('');
  const [usernamePassword, setUsernamePassword] = useState('');
  const [usernameOtp, setUsernameOtp] = useState('');
  const [usernameOtpSent, setUsernameOtpSent] = useState(false);
  const [sendingUsernameOtp, setSendingUsernameOtp] = useState(false);

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const relogin = useCallback(
    async (message: string, loginHint?: string) => {
      await logout();
      toast(message, 'info');
      navigate('/login', { replace: true, state: loginHint ? { login: loginHint } : undefined });
    },
    [logout, navigate, toast],
  );

  const syncFromProfile = useCallback(
    (next: {
      firstName: string;
      lastName: string;
      assignedStores: AssignedStoreRef[];
    }) => {
      setFirstName(next.firstName);
      setLastName(next.lastName);
      setStoreNames(next.assignedStores);
    },
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dto, stores] = await Promise.all([
        getMyProfile(),
        getAllStores().catch(() => [] as StoreListItemDto[]),
      ]);
      if (dto.must_relogin) {
        await relogin('Please sign in again.');
        return;
      }
      const next = mapMyProfileDto(dto, stores);
      applyProfile(next);
      syncFromProfile(next);
    } catch (err) {
      toast(apiErrorMessage(err, 'Failed to load profile'), 'error');
    } finally {
      setLoading(false);
    }
  }, [applyProfile, relogin, syncFromProfile, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const cancelEdit = () => {
    setEdit(null);
    setFirstName(profile.firstName);
    setLastName(profile.lastName);
    setNewPhone('');
    setPhonePassword('');
    setPhoneOtp('');
    setPhoneOtpSent(false);
    setNewUsername('');
    setUsernamePassword('');
    setUsernameOtp('');
    setUsernameOtpSent(false);
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
  };

  const saveName = async () => {
    if (!firstName.trim()) {
      toast('First name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const dto = await updateStoreAdminName({
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
      });
      if (dto.must_relogin) {
        await relogin('Please sign in again.');
        return;
      }
      const stores = await getAllStores().catch(() => [] as StoreListItemDto[]);
      const next = mapMyProfileDto(dto, stores);
      applyProfile(next);
      syncFromProfile(next);
      setEdit(null);
      toast('Name updated');
    } catch (err) {
      toast(apiErrorMessage(err, 'Failed to update name'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const sendPhoneOtp = async () => {
    const digits = newPhone.replace(/\D/g, '');
    if (!phonePassword) {
      toast('Current password is required', 'error');
      return;
    }
    if (digits.length !== 10) {
      toast('Enter a valid 10-digit phone number', 'error');
      return;
    }
    setSendingPhoneOtp(true);
    try {
      await sendStoreAdminChangePhoneOtp({
        currentPassword: phonePassword,
        newPhoneNo: digits,
      });
      setPhoneOtp('');
      setPhoneOtpSent(true);
      toast('OTP sent to the new phone number.', 'info');
    } catch (err) {
      toast(apiErrorMessage(err, 'Could not send OTP'), 'error');
    } finally {
      setSendingPhoneOtp(false);
    }
  };

  const savePhone = async () => {
    const digits = newPhone.replace(/\D/g, '');
    if (!phoneOtp.trim()) {
      toast('OTP is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const dto = await updateStoreAdminPhone({
        currentPassword: phonePassword,
        newPhoneNo: digits,
        otp: phoneOtp.trim(),
      });
      if (dto.must_relogin) {
        await relogin('Phone updated. Sign in with your new phone number.', digits);
        return;
      }
    } catch (err) {
      toast(apiErrorMessage(err, 'Failed to update phone'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const sendUsernameOtp = async () => {
    setSendingUsernameOtp(true);
    try {
      await sendActionOtp(StoreAdminOtpPurpose.ChangeUsername);
      setUsernameOtp('');
      setUsernameOtpSent(true);
      toast('OTP sent to your registered phone number.', 'info');
    } catch (err) {
      toast(apiErrorMessage(err, 'Could not send OTP'), 'error');
    } finally {
      setSendingUsernameOtp(false);
    }
  };

  const saveUsername = async () => {
    const value = newUsername.trim();
    if (!USERNAME_PATTERN.test(value)) {
      toast('Username must be 3–50 characters: letters, numbers, underscore.', 'error');
      return;
    }
    if (!usernamePassword) {
      toast('Current password is required', 'error');
      return;
    }
    if (!usernameOtp.trim()) {
      toast('OTP is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const dto = await updateStoreAdminUsername({
        currentPassword: usernamePassword,
        newUsername: value,
        otp: usernameOtp.trim(),
      });
      if (dto.must_relogin) {
        await relogin('Username updated. Sign in with your new username.', value);
        return;
      }
    } catch (err) {
      toast(apiErrorMessage(err, 'Failed to update username'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    if (!currentPass) {
      toast('Current password is required', 'error');
      return;
    }
    if (newPass.length < 8) {
      toast('Password must be at least 8 characters.', 'error');
      return;
    }
    if (newPass !== confirmPass) {
      toast('New password and confirm password do not match.', 'error');
      return;
    }
    setSaving(true);
    try {
      await changeStoreAdminPassword({
        currentPassword: currentPass,
        newPassword: newPass,
        confirmPassword: confirmPass,
      });
      await relogin('Password updated. Please sign in.');
    } catch (err) {
      toast(apiErrorMessage(err, 'Failed to update password'), 'error');
      setSaving(false);
    }
  };

  const footer = (onSave: () => void, saveLabel = 'Save') => (
    <div className="mt-4 flex justify-end gap-2">
      <Button variant="outline" onClick={cancelEdit} disabled={saving}>
        Cancel
      </Button>
      <Button onClick={onSave} loading={saving}>
        {saveLabel}
      </Button>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Profile"
        subtitle="Your Store Admin account — assigned stores are set by Super Admin"
      />

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-ink-500">
          <Loader2 className="size-5 animate-spin" />
          Loading profile...
        </div>
      ) : (
        <div className="max-w-2xl space-y-4">
          <SectionCard
            icon={<UserRound className="size-5" />}
            title="Name"
            subtitle="No OTP required"
            editing={edit === 'name'}
            onEdit={() => {
              cancelEdit();
              setEdit('name');
            }}
          >
            {edit === 'name' ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                  <Input
                    label="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
                {footer(() => void saveName())}
              </>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <ReadValue label="First name" value={profile.firstName} />
                <ReadValue label="Last name" value={profile.lastName} />
              </div>
            )}
          </SectionCard>

          <SectionCard
            icon={<Phone className="size-5" />}
            title="Phone number"
            subtitle="Password + OTP on the new number. You will be signed out after save."
            editing={edit === 'phone'}
            onEdit={() => {
              cancelEdit();
              setEdit('phone');
            }}
          >
            {edit === 'phone' ? (
              <>
                <div className="space-y-4">
                  <ReadValue label="Current phone" value={profile.phone} />
                  <Input
                    label="Current password"
                    type="password"
                    value={phonePassword}
                    onChange={(e) => setPhonePassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <Input
                    label="New phone number"
                    type="tel"
                    value={newPhone}
                    onChange={(e) => {
                      setNewPhone(e.target.value);
                      setPhoneOtpSent(false);
                      setPhoneOtp('');
                    }}
                    placeholder="Enter 10-digit number"
                  />
                  {phoneOtpSent && (
                    <Input
                      label="OTP"
                      value={phoneOtp}
                      onChange={(e) => setPhoneOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                    />
                  )}
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" onClick={cancelEdit} disabled={saving || sendingPhoneOtp}>
                    Cancel
                  </Button>
                  {!phoneOtpSent ? (
                    <Button onClick={() => void sendPhoneOtp()} loading={sendingPhoneOtp}>
                      Send OTP
                    </Button>
                  ) : (
                    <Button onClick={() => void savePhone()} loading={saving}>
                      Save
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <ReadValue label="Phone" value={profile.phone} />
            )}
          </SectionCard>

          <SectionCard
            icon={<User className="size-5" />}
            title="Username"
            subtitle="OTP is sent to your registered phone. You will be signed out after save."
            editing={edit === 'username'}
            onEdit={() => {
              cancelEdit();
              setEdit('username');
            }}
          >
            {edit === 'username' ? (
              <>
                <div className="space-y-4">
                  <ReadValue label="Current username" value={profile.username} />
                  <Input
                    label="Current password"
                    type="password"
                    value={usernamePassword}
                    onChange={(e) => setUsernamePassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <Input
                    label="New username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="letters, numbers, underscore"
                    hint="3–50 characters. Letters, numbers, and underscore only."
                  />
                  {usernameOtpSent && (
                    <Input
                      label="OTP"
                      value={usernameOtp}
                      onChange={(e) => setUsernameOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                    />
                  )}
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={cancelEdit}
                    disabled={saving || sendingUsernameOtp}
                  >
                    Cancel
                  </Button>
                  {!usernameOtpSent ? (
                    <Button onClick={() => void sendUsernameOtp()} loading={sendingUsernameOtp}>
                      Send OTP
                    </Button>
                  ) : (
                    <Button onClick={() => void saveUsername()} loading={saving}>
                      Save
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <ReadValue label="Username" value={profile.username} />
            )}
          </SectionCard>

          <SectionCard
            icon={<KeyRound className="size-5" />}
            title="Password"
            subtitle="No OTP. You will be signed out after save."
            editing={edit === 'password'}
            onEdit={() => {
              cancelEdit();
              setEdit('password');
            }}
          >
            {edit === 'password' ? (
              <>
                <div className="space-y-4">
                  <Input
                    label="Current password"
                    type="password"
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    autoComplete="current-password"
                  />
                  <Input
                    label="New password"
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    leftIcon={<Lock className="size-4" />}
                  />
                  <Input
                    label="Confirm new password"
                    type="password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                  />
                </div>
                {footer(() => void savePassword())}
              </>
            ) : (
              <ReadValue label="Password" value="••••••••" />
            )}
          </SectionCard>

          <SectionCard
            icon={<Store className="size-5" />}
            title="Assigned stores"
            subtitle="Read-only. Super Admin assigns stores."
          >
            {storeNames.length === 0 ? (
              <p className="text-sm text-ink-500">No store assigned.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {storeNames.map((store) => (
                  <Badge key={store.id} tone="brand">
                    {store.name}
                  </Badge>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      )}
    </div>
  );
}
