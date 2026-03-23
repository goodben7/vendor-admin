// ============================================
// PERMISSIONS
// ============================================
export type Permission =
    | 'ROLE_USER_CREATE' | 'ROLE_USER_LOCK' | 'ROLE_USER_CHANGE_PWD' | 'ROLE_USER_DETAILS' | 'ROLE_USER_LIST'
    | 'ROLE_USER_EDIT' | 'ROLE_USER_DELETE' | 'ROLE_USER_SET_PROFILE' | 'ROLE_USER_ADD_SIDE_ROLES'
    | 'ROLE_ADMIN_ACCESS_CREATE' | 'ROLE_TABLET_ACCESS_CREATE'
    | 'ROLE_PROFILE_CREATE' | 'ROLE_PROFILE_LIST' | 'ROLE_PROFILE_UPDATE' | 'ROLE_PROFILE_DETAILS' | 'ROLE_PROFILE_DELETE'
    | 'ROLE_CURRENCY_CREATE' | 'ROLE_CURRENCY_LIST' | 'ROLE_CURRENCY_UPDATE' | 'ROLE_CURRENCY_DETAILS' | 'ROLE_CURRENCY_DELETE'
    | 'ROLE_ACTIVITY_LIST' | 'ROLE_ACTIVITY_VIEW'
    | 'ROLE_PLATFORM_CREATE' | 'ROLE_PLATFORM_LIST' | 'ROLE_PLATFORM_UPDATE' | 'ROLE_PLATFORM_DETAILS' | 'ROLE_PLATFORM_DELETE'
    | 'ROLE_MENU_CREATE' | 'ROLE_MENU_LIST' | 'ROLE_MENU_UPDATE' | 'ROLE_MENU_DETAILS' | 'ROLE_MENU_DELETE'
    | 'ROLE_CATEGORY_CREATE' | 'ROLE_CATEGORY_LIST' | 'ROLE_CATEGORY_UPDATE' | 'ROLE_CATEGORY_DETAILS' | 'ROLE_CATEGORY_DELETE'
    | 'ROLE_PRODUCT_CREATE' | 'ROLE_PRODUCT_LIST' | 'ROLE_PRODUCT_UPDATE' | 'ROLE_PRODUCT_DETAILS' | 'ROLE_PRODUCT_DELETE'
    | 'ROLE_OPTION_GROUP_CREATE' | 'ROLE_OPTION_GROUP_LIST' | 'ROLE_OPTION_GROUP_UPDATE' | 'ROLE_OPTION_GROUP_DETAILS' | 'ROLE_OPTION_GROUP_DELETE'
    | 'ROLE_OPTION_ITEM_CREATE' | 'ROLE_OPTION_ITEM_LIST' | 'ROLE_OPTION_ITEM_UPDATE' | 'ROLE_OPTION_ITEM_DETAILS' | 'ROLE_OPTION_ITEM_DELETE'
    | 'ROLE_PLATFORM_TABLE_CREATE' | 'ROLE_PLATFORM_TABLE_LIST' | 'ROLE_PLATFORM_TABLE_UPDATE' | 'ROLE_PLATFORM_TABLE_DETAILS' | 'ROLE_PLATFORM_TABLE_DELETE'
    | 'ROLE_TABLET_CREATE' | 'ROLE_TABLET_LIST' | 'ROLE_TABLET_UPDATE' | 'ROLE_TABLET_DETAILS' | 'ROLE_TABLET_DELETE'
    | 'ROLE_ORDER_DETAILS' | 'ROLE_ORDER_LIST' | 'ROLE_ORDER_CREATE' | 'ROLE_ORDER_SENT_TO_KITCHEN' | 'ROLE_ORDER_AS_READY' | 'ROLE_ORDER_AS_SERVED' | 'ROLE_ORDER_AS_CANCELLED'
    | 'ROLE_ORDER_ITEM_DETAILS' | 'ROLE_ORDER_ITEM_LIST' | 'ROLE_ORDER_ITEM_CREATE'
    | 'ROLE_ORDER_ITEM_OPTION_DETAILS' | 'ROLE_ORDER_ITEM_OPTION_LIST' | 'ROLE_ORDER_ITEM_OPTION_CREATE'
    | 'ROLE_DOC_CREATE' | 'ROLE_DOC_LIST' | 'ROLE_DOC_DETAILS' | 'ROLE_DOC_DELETE'
    | 'ROLE_PAYMENT_DETAILS' | 'ROLE_PAYMENT_LIST' | 'ROLE_PAYMENT_CREATE'
    | 'ROLE_EXCHANGE_RATE_READ' | 'ROLE_EXCHANGE_RATE_CREATE' | 'ROLE_EXCHANGE_RATE_UPDATE' | 'ROLE_EXCHANGE_RATE_DELETE';

// ============================================
// CURRENCY TYPES
// ============================================
export interface Currency {
    id: string;
    code: string;
    label: string;
    symbol: string;
    active: boolean;
    isDefault: boolean;
    platformId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ExchangeRate {
    id: string;
    baseCurrency: {
        id: string;
        code: string;
        symbol: string;
    };
    targetCurrency: {
        id: string;
        code: string;
        symbol: string;
    };
    rate: string;
    baseRate: string;
    targetRate: string;
    platformId?: string;
    createdAt: string;
    active: boolean;
}


// ============================================
// ORDER TYPES
// ============================================
export type OrderStatus = 'D' | 'K' | 'R' | 'S' | 'C';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
    D: 'En attente',
    K: 'En préparation',
    R: 'Prête',
    S: 'Servie',
    C: 'Annulée',
};

export type OrderPaymentStatus = 'N' | 'P' | 'S' | 'F';

export const ORDER_PAYMENT_STATUS_LABELS: Record<OrderPaymentStatus, string> = {
    N: 'Impayée',
    P: 'En attente',
    S: 'Payée',
    F: 'Échouée',
};

export interface OrderItem {
    id: string;
    product: Product;
    quantity: number;
    unitPrice: number;
    options: OptionItem[];
    subtotal: number;
}

export interface Order {
    id: string;
    reference: string;
    status: OrderStatus;
    paymentStatus: OrderPaymentStatus;
    totalAmount: number;
    table?: PlatformTable;
    tablet?: Tablet;
    items: OrderItem[];
    payments: Payment[];
    cancelReason?: string;
    createdAt: string;
    updatedAt: string;
}

// ============================================
// PAYMENT TYPES
// ============================================
export type PaymentMethod = 'CARD' | 'CASH' | 'MOBILE_MONEY';
export type PaymentStatus = 'P' | 'S' | 'F';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
    CARD: 'Carte bancaire',
    CASH: 'Espèces',
    MOBILE_MONEY: 'Mobile Money',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
    P: 'En attente',
    S: 'Réussi',
    F: 'Échoué',
};

export interface PaymentCurrencySummary {
    id: string;
    code: string;
    symbol: string;
}

export interface PaymentOrderSummary {
    id: string;
    referenceUnique?: string;
    reference?: string;
    status: string;
    totalAmount: string;
}

export interface Payment {
    id: string;
    order: PaymentOrderSummary | Order | string;
    amount: string;
    currency?: PaymentCurrencySummary;
    exchangeRateUsed?: string;
    paidAmount?: string;
    paidCurrency?: PaymentCurrencySummary;
    method: PaymentMethod;
    provider?: string;
    transactionRef?: string;
    status: PaymentStatus;
    rawResponseJson?: string[];
    paidAt?: string;
    platformId?: string;
    createdAt: string;
    updatedAt: string;
}



// ============================================
// PRODUCT & MENU TYPES
// ============================================
export interface Category {
    id: string;
    label: string; // was name
    description?: string;
    menu?: string | Menu;
    position?: number;
    active: boolean; // was isAvailable
    // Legacy mapping (optional or derived)
    name?: string;
    isAvailable?: boolean;
    products?: Product[];
    createdAt: string;
    updatedAt: string;
}

export interface OptionItem {
    id: string;
    name: string;
    label?: string; // API uses label sometimes
    price: number;
    priceDelta?: string; // API uses priceDelta
    isAvailable: boolean;
    optionGroup?: OptionGroup;
    createdAt: string;
    updatedAt: string;
}

export interface OptionGroup {
    id: string;
    label?: string;
    name: string;
    isRequired: boolean;
    maxSelections?: number;
    maxChoices?: number;
    isAvailable?: boolean;
    items: OptionItem[];
    optionItems?: OptionItem[];
    product?: Product | string;
    createdAt: string;
    updatedAt: string;
}

export interface Product {
    id: string;
    label?: string; // API uses label
    name: string;   // Frontend uses name (mapped from label)
    sku?: string;
    description?: string;
    price: number;
    basePrice?: string; // API uses basePrice
    category?: Category | string;
    optionGroups: OptionGroup[] | string[];
    isAvailable: boolean;
    imageUrl?: string;
    contentUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Menu {
    id: string;
    label: string;
    description?: string;
    active: boolean;
    isActive?: boolean;
    name?: string;
    categories: Category[];
    createdAt: string;
    updatedAt: string;
}

// ============================================
// PLATFORM & INFRASTRUCTURE TYPES
// ============================================
export interface Platform {
    id: string;
    name: string;
    description?: string;
    address?: string;
    phone?: string;
    email?: string;
    currency?: Currency | string;
    paymentConfigJson?: string[];
    allowTableManagement?: boolean;
    allowOnlineOrder?: boolean;
    adminAccountCreated?: boolean;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface PlatformTable {
    id: string;
    platform: Platform | string;
    label?: string;
    tableNumber: string;
    capacity: number;
    tablet?: Tablet;
    active: boolean;
    isActive?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Tablet {
    id: string;
    deviceId: string;
    serialNumber?: string;
    label?: string;
    table?: PlatformTable;
    platformTable?: PlatformTable | string;
    status: 'online' | 'offline';
    isOnline: boolean;
    active: boolean;
    tabletAccountCreated?: boolean;
    platformId?: string;
    lastSeen?: string;
    createdAt: string;
    updatedAt: string;
}

// ============================================
// USER TYPES
// ============================================
export type PersonType = 'SPADM' | 'ADM' | 'MGR' | 'STF' | 'KIT' | 'WTR' | 'CSR' | 'SFO';

export const PERSON_TYPE_LABELS: Record<PersonType, string> = {
    SPADM: 'Super Administrateur',
    ADM: 'Administrateur',
    MGR: 'Manager',
    STF: 'Staff',
    KIT: 'Cuisine',
    WTR: 'Serveur',
    CSR: 'Caissier',
    SFO: 'Borne (Self-Order)',
};

export interface Profile {
    id: string;
    label: string;
    personType?: PersonType;
    permission: string[];
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface User {
    id: string;
    username?: string;
    email: string;
    displayName?: string;
    profile?: Profile | string;
    isActive: boolean;
    phone?: string;
    personType?: PersonType;
    platformId?: string;
    confirmed?: boolean;
    deleted?: boolean;
    locked?: boolean;
    roles?: string[];
    adminAccountCreated?: boolean;
    createdAt: string;
    updatedAt?: string;
}

// ============================================
// AUTH TYPES
// ============================================
export interface AuthUser {
    id: string;
    username: string;
    email: string;
    displayName: string;
    permissions: Permission[];
    roles?: string[];
    personType?: PersonType;
    holderType?: string;
    holderId?: string;
    phone?: string;
    tablet?: any;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: AuthUser;
}

// ============================================
// API TYPES
// ============================================
export interface HydraCollection<T> {
    'hydra:member'?: T[];
    'hydra:totalItems'?: number;
    'member'?: T[];
    'totalItems'?: number;
    'hydra:view'?: {
        '@id': string;
        'hydra:first': string;
        'hydra:last': string;
        'hydra:next': string;
    };
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
}

export interface ApiError {
    message: string;
    code?: string;
    errors?: Record<string, string[]>;
}
