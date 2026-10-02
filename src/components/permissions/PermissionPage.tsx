import { PERMISSION, permissionRequiredMessage } from '@/lib/permissions';
import { PermissionDenied } from '@/components/ui/PermissionDenied';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAuth } from '@/context/AuthContext';
import type { ReactNode } from 'react';

export function PermissionPage({
  title,
  subtitle,
  permissionId,
  children,
}: {
  title: string;
  subtitle?: string;
  permissionId: number;
  children: ReactNode;
}) {
  const { hasPermission } = useAuth();
  if (!hasPermission(permissionId)) {
    return (
      <div>
        <PageHeader title={title} subtitle={subtitle} />
        <PermissionDenied message={permissionRequiredMessage(permissionId)} />
      </div>
    );
  }
  return <>{children}</>;
}

export { PERMISSION, permissionRequiredMessage };
