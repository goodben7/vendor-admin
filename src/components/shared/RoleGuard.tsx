import { ReactNode } from 'react';
import { getCurrentUser } from '@/services/auth.service';
import { hasAnyPermission } from '@/lib/permissions';
import { Permission } from '@/types/entities';

interface RoleGuardProps {
    permissions: Permission[];
    children: ReactNode;
    fallback?: ReactNode;
}

export default function RoleGuard({ permissions, children, fallback = null }: RoleGuardProps) {
    const user = getCurrentUser();

    if (!hasAnyPermission(user, permissions)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
