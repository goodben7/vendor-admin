import axiosInstance from './axios';
import { AuthUser, LoginCredentials } from '@/types/entities';

const TOKEN_KEY = 'vendor_admin_token';
const USER_KEY = 'vendor_admin_user';

/**
 * Decode JWT token to extract user information
 * Note: This is a simple base64 decode. In production, validate the token signature.
 */
function decodeToken(token: string): AuthUser | null {
    try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));

        console.log('🔍 Decoded Token Payload:', decoded);

        let permissions = decoded.permissions || [];

        // Temporary fix: If no permissions but has roles, map ROLE_ADMIN to all permissions
        if (permissions.length === 0 && decoded.roles && (decoded.roles.includes('ROLE_ADMIN') || decoded.roles.includes('ROLE_SUPER_ADMIN'))) {
            console.log('⚠️ No permissions found but user has ADMIN role. Assigning all permissions temporarily.');
            permissions = [
                'ROLE_USER_LIST', 'ROLE_USER_DETAILS', 'ROLE_USER_CREATE', 'ROLE_USER_EDIT', 'ROLE_USER_DELETE', 'ROLE_USER_LOCK', 'ROLE_USER_CHANGE_PWD',
                'ROLE_PROFILE_LIST', 'ROLE_PROFILE_DETAILS', 'ROLE_PROFILE_CREATE', 'ROLE_PROFILE_UPDATE', 'ROLE_PROFILE_DELETE',
                'ROLE_ACTIVITY_LIST', 'ROLE_ACTIVITY_VIEW',
                'ROLE_PLATFORM_LIST', 'ROLE_PLATFORM_DETAILS', 'ROLE_PLATFORM_CREATE', 'ROLE_PLATFORM_UPDATE', 'ROLE_PLATFORM_DELETE',
                'ROLE_MENU_LIST', 'ROLE_MENU_DETAILS', 'ROLE_MENU_CREATE', 'ROLE_MENU_UPDATE', 'ROLE_MENU_DELETE',
                'ROLE_CATEGORY_LIST', 'ROLE_CATEGORY_DETAILS', 'ROLE_CATEGORY_CREATE', 'ROLE_CATEGORY_UPDATE', 'ROLE_CATEGORY_DELETE',
                'ROLE_PRODUCT_LIST', 'ROLE_PRODUCT_DETAILS', 'ROLE_PRODUCT_CREATE', 'ROLE_PRODUCT_UPDATE', 'ROLE_PRODUCT_DELETE',
                'ROLE_OPTION_GROUP_LIST', 'ROLE_OPTION_GROUP_DETAILS', 'ROLE_OPTION_GROUP_CREATE', 'ROLE_OPTION_GROUP_UPDATE', 'ROLE_OPTION_GROUP_DELETE',
                'ROLE_OPTION_ITEM_LIST', 'ROLE_OPTION_ITEM_DETAILS', 'ROLE_OPTION_ITEM_CREATE', 'ROLE_OPTION_ITEM_UPDATE', 'ROLE_OPTION_ITEM_DELETE',
                'ROLE_PLATFORM_TABLE_LIST', 'ROLE_PLATFORM_TABLE_DETAILS', 'ROLE_PLATFORM_TABLE_CREATE', 'ROLE_PLATFORM_TABLE_UPDATE', 'ROLE_PLATFORM_TABLE_DELETE',
                'ROLE_TABLET_LIST', 'ROLE_TABLET_DETAILS', 'ROLE_TABLET_CREATE', 'ROLE_TABLET_UPDATE', 'ROLE_TABLET_DELETE',
                'ROLE_ORDER_LIST', 'ROLE_ORDER_DETAILS', 'ROLE_ORDER_CREATE', 'ROLE_ORDER_SENT_TO_KITCHEN', 'ROLE_ORDER_AS_READY', 'ROLE_ORDER_AS_SERVED', 'ROLE_ORDER_AS_CANCELLED',
                'ROLE_PAYMENT_LIST', 'ROLE_PAYMENT_DETAILS', 'ROLE_PAYMENT_CREATE',
                'ROLE_CURRENCY_LIST', 'ROLE_CURRENCY_DETAILS', 'ROLE_CURRENCY_CREATE', 'ROLE_CURRENCY_UPDATE', 'ROLE_CURRENCY_DELETE',
                'ROLE_EXCHANGE_RATE_READ', 'ROLE_EXCHANGE_RATE_CREATE', 'ROLE_EXCHANGE_RATE_UPDATE', 'ROLE_EXCHANGE_RATE_DELETE',
                'ROLE_DOC_LIST', 'ROLE_DOC_DETAILS', 'ROLE_DOC_CREATE', 'ROLE_DOC_DELETE'
            ];
        }

        return {
            id: decoded.id || decoded.sub,
            username: decoded.username,
            email: decoded.email,
            displayName: decoded.displayName || decoded.username,
            permissions: permissions,
            roles: decoded.roles || [],
            personType: decoded.personType,
        };
    } catch (error) {
        console.error('Failed to decode token:', error);
        return null;
    }
}

/**
 * Login with username and password
 */
export async function login(credentials: LoginCredentials): Promise<AuthUser> {
    console.log('🔐 Login attempt with credentials:', { username: credentials.username });

    const response = await axiosInstance.post<{ token: string }>('/authentication_token', credentials);
    const { token } = response.data;

    console.log('✅ Login successful, received token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');

    // Store token
    localStorage.setItem(TOKEN_KEY, token);

    // Fetch full user info from /api/users/about
    try {
        const aboutResponse = await axiosInstance.get('/users/about');
        const aboutData = aboutResponse.data;

        const decoded = decodeToken(token); // Still decode for any extra info

        // The backend puts everything in `roles`: both functional roles (ROLE_USER, ROLE_CASHIER…)
        // and granular permissions (ROLE_ORDER_LIST, ROLE_PRODUCT_LIST…).
        // We split them: entries with at least two underscores (e.g. ROLE_ORDER_LIST) are permissions.
        const allRoles: string[] = aboutData.roles || decoded?.roles || [];
        const permissionsFromRoles = allRoles.filter(r => (r.match(/_/g) || []).length >= 2);
        // Merge with any permissions that might come from the JWT payload
        const mergedPermissions = Array.from(new Set([
            ...permissionsFromRoles,
            ...(decoded?.permissions || []),
        ]));

        // Specific personType fallbacks for essential navigation (e.g. seeing the platform name)
        const internalPersonTypes = ['ADM', 'SPADM', 'MGR', 'STF', 'KIT', 'WTR', 'CSR', 'SFO'];
        const currentPersonType = aboutData.personType || decoded?.personType;
        if (internalPersonTypes.includes(currentPersonType) && !mergedPermissions.includes('ROLE_PLATFORM_LIST' as any)) {
            mergedPermissions.push('ROLE_PLATFORM_LIST' as any);
        }

        console.log('🔑 Extracted permissions from roles:', permissionsFromRoles);

        const user: AuthUser = {
            id: aboutData.id || decoded?.id,
            username: aboutData.username || decoded?.username,
            email: aboutData.email || decoded?.email,
            displayName: aboutData.displayName || aboutData.email || decoded?.displayName || decoded?.username,
            permissions: mergedPermissions as any,
            roles: allRoles,
            personType: aboutData.personType || decoded?.personType,
            holderType: aboutData.holderType,
            holderId: aboutData.holderId,
            phone: aboutData.phone,
            tablet: aboutData.tablet,
        };

        localStorage.setItem(USER_KEY, JSON.stringify(user));
        console.log('👤 User info fetched from /about and stored:', user);
        return user;
    } catch (error) {
        console.error('❌ Failed to fetch detailed user info from /users/about:', error);

        // Fallback to decoded token if /about fails
        const user = decodeToken(token);
        if (user) {
            localStorage.setItem(USER_KEY, JSON.stringify(user));
        }
        return user!;
    }
}

/**
 * Logout: clear token and user data
 */
export function logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = '/login';
}

/**
 * Get stored JWT token
 */
export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
    return !!getToken();
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser(): AuthUser | null {
    const userJson = localStorage.getItem(USER_KEY);
    if (!userJson) return null;

    try {
        return JSON.parse(userJson);
    } catch {
        return null;
    }
}
