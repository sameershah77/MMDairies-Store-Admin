import type { AuthAdminDto, StoreAdminMyProfileDto, StoreAdminPermissionDto, StoreListItemDto } from '@/types/api';
import type { AssignedStoreRef, StoreAdminProfile } from '@/types';

type ProfileSource = {
  user_id: string;
  first_name: string;
  last_name: string | null;
  phone_no: string;
  username: string;
  assigned_store?: string | null;
  assigned_stores?: string[];
  permissions?: StoreAdminPermissionDto[];
};

function storeIdsFrom(source: ProfileSource): string[] {
  const fromList = (source.assigned_stores ?? []).filter(Boolean);
  if (fromList.length) return fromList;
  return source.assigned_store ? [source.assigned_store] : [];
}

export function mapStoreAdminProfile(
  source: ProfileSource,
  stores: StoreListItemDto[] = [],
): StoreAdminProfile {
  const firstName = source.first_name?.trim() || '';
  const lastName = source.last_name?.trim() || '';
  const username = source.username || '';
  const name = [firstName, lastName].filter(Boolean).join(' ') || username || 'Store Admin';
  const ids = storeIdsFrom(source);
  const assignedStores: AssignedStoreRef[] = ids.map((id) => ({
    id,
    name: stores.find((s) => s.store_id === id)?.store_name || id,
  }));
  const primary = assignedStores[0];
  const primaryStore = stores.find((s) => s.store_id === (ids[0] || ''));

  return {
    name,
    firstName,
    lastName,
    username,
    phone: source.phone_no || '',
    email: username ? `${username}@mmdairy.com` : '',
    dairyName: 'M M Dairy',
    zoneName: primary?.name || (ids.length ? 'Assigned store' : 'Unassigned'),
    storeName: assignedStores.map((s) => s.name).join(', ') || (ids.length ? 'Assigned store' : 'No store assigned'),
    storeId: ids[0] || '',
    userId: source.user_id,
    assignedStores,
    contactPhones: primaryStore?.contact_phones?.filter(Boolean) ?? [],
    contactEmails: primaryStore?.contact_emails?.filter(Boolean) ?? [],
    permissionIds: (source.permissions ?? []).map((p) => p.permission_id),
  };
}

export function mapAuthAdminToProfile(admin: AuthAdminDto, stores: StoreListItemDto[] = []) {
  return mapStoreAdminProfile(admin, stores);
}

export function mapMyProfileDto(dto: StoreAdminMyProfileDto, stores: StoreListItemDto[] = []) {
  return mapStoreAdminProfile(dto, stores);
}

