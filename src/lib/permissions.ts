import { AuthUser, Permission } from '@/types/entities';

/**
 * Check if user has a specific permission
 */
export function hasPermission(user: AuthUser | null, permission: Permission): boolean {
    if (!user) return false;
    if (user.personType === 'ADM' || user.personType === 'SPADM' ||
        user.roles?.some(r => r === 'ROLE_ADMIN' || r === 'ROLE_SUPER_ADMIN')) {
        return true;
    }
    return user.permissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(user: AuthUser | null, permissions: Permission[]): boolean {
    if (!user) return false;
    // Admin bypass
    if (user.personType === 'ADM' || user.personType === 'SPADM' ||
        user.roles?.some(r => r === 'ROLE_ADMIN' || r === 'ROLE_SUPER_ADMIN')) {
        return true;
    }
    return permissions.some(permission => user.permissions.includes(permission));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(user: AuthUser | null, permissions: Permission[]): boolean {
    if (!user) return false;
    if (user.personType === 'ADM' || user.personType === 'SPADM' ||
        user.roles?.some(r => r === 'ROLE_ADMIN' || r === 'ROLE_SUPER_ADMIN')) {
        return true;
    }
    return permissions.every(permission => user.permissions.includes(permission));
}
