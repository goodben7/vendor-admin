import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/services/axios';
import { Order, OrderItem, OrderStatus, OptionItem, PlatformTable, Product, Tablet } from '@/types/entities';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';

interface OrderFilters {
    status?: OrderStatus[];
    dateFrom?: string;
    dateTo?: string;
    platformTable?: string;
    search?: string;
    page?: number;
    pageSize?: number;
}

/** Normalize a raw API order object into our typed Order shape */
function normalizeOrder(order: any): Order {
    const items = (order.orderItems || order.items || []).map((item: any) => {
        const rawProduct = item.product || {};
        const product: Product = {
            ...rawProduct,
            id: rawProduct.id || rawProduct['@id']?.split('/').pop() || '',
            name: rawProduct.label || rawProduct.name || (rawProduct as any).title || '',
            price: rawProduct.basePrice ? parseFloat(rawProduct.basePrice) : (rawProduct.price || 0),
            imageUrl: rawProduct.imageUrl || rawProduct.contentUrl || (rawProduct as any).image,
            contentUrl: rawProduct.contentUrl || rawProduct.imageUrl,
            category: rawProduct.category,
            isAvailable: rawProduct.isAvailable ?? true,
            optionGroups: rawProduct.optionGroups || [],
            createdAt: rawProduct.createdAt || '',
            updatedAt: rawProduct.updatedAt || '',
        };

        // Flatten all optionItems from the product's optionGroups for lookup
        const allProductOptions: any[] = (rawProduct.optionGroups || [])
            .flatMap((g: any) => g.optionItems || g.items || []);

        const rawOptions = item.orderItemOptions || item.options || [];

        const options = rawOptions.map((opt: any) => {
            // The API only returns `priceSnapshot` on each OrderItemOption (no optionItem name).
            // Strategy:
            // 1. If optionItem is an embedded object → use it directly
            // 2. Otherwise, match by price against the product's optionGroups.optionItems
            let name = 'Option';
            let price = 0;

            if (opt.optionItem && typeof opt.optionItem === 'object') {
                // Embedded optionItem object
                const inner = opt.optionItem;
                name = inner.label || inner.name || 'Option';
                price = inner.priceDelta
                    ? parseFloat(inner.priceDelta)
                    : inner.price != null ? parseFloat(inner.price) : 0;
            } else {
                // Only priceSnapshot available — find matching option by price
                price = opt.priceSnapshot
                    ? parseFloat(opt.priceSnapshot)
                    : opt.price != null ? parseFloat(opt.price) : 0;

                const matched = allProductOptions.find((oi: any) => {
                    const delta = parseFloat(oi.priceDelta ?? oi.price ?? 0);
                    return Math.abs(delta - price) < 0.001;
                });
                name = matched?.label || matched?.name || opt.label || opt.name || 'Option';
            }

            return {
                id: opt.id || opt['@id']?.split('/').pop() || '',
                name,
                price,
                isAvailable: true,
                createdAt: '',
                updatedAt: '',
            } as OptionItem;
        });

        return {
            id: item.id || item['@id']?.split('/').pop() || '',
            product,
            quantity: item.quantity || 1,
            unitPrice: item.unitPriceOrder ? parseFloat(item.unitPriceOrder) : (item.unitPrice ? parseFloat(item.unitPrice) : product.price),
            options,
            subtotal: 0,
        } as OrderItem;
    });

    // back-fill subtotals
    items.forEach((i: OrderItem) => {
        (i as any).subtotal = i.unitPrice * i.quantity;
    });

    const rawTable = order.platformTable;
    const table: PlatformTable | undefined = rawTable && typeof rawTable === 'object' ? {
        ...rawTable,
        id: rawTable.id || rawTable['@id']?.split('/').pop() || '',
        tableNumber: rawTable.tableNumber || rawTable.label || '',
        platform: rawTable.platform || '',
        capacity: rawTable.capacity || 0,
        active: rawTable.active ?? true,
        createdAt: rawTable.createdAt || '',
        updatedAt: rawTable.updatedAt || '',
    } : undefined;

    const rawTablet = order.tablet;
    const tablet: Tablet | undefined = rawTablet && typeof rawTablet === 'object' ? {
        ...rawTablet,
        id: rawTablet.id || rawTablet['@id']?.split('/').pop() || '',
        label: rawTablet.label || rawTablet.deviceId || '',
        deviceId: rawTablet.deviceId || '',
        status: rawTablet.status || 'offline',
        isOnline: rawTablet.active ?? false,
        active: rawTablet.active ?? false,
        createdAt: rawTablet.createdAt || '',
        updatedAt: rawTablet.updatedAt || '',
    } : undefined;

    return {
        ...order,
        id: order.id || order['@id']?.split('/').pop() || '',
        reference: order.referenceUnique || order.reference || 'N/A',
        status: order.status || 'D',
        paymentStatus: order.paymentStatus || 'N',
        totalAmount: order.totalAmount ? parseFloat(order.totalAmount) : 0,
        items,
        table,
        tablet,
        payments: order.payments || [],
        createdAt: order.createdAt || '',
        updatedAt: order.updatedAt || '',
    } as Order;
}

/**
 * Fetch paginated list of orders
 */
export function useOrders(filters: OrderFilters = {}) {
    return useQuery({
        queryKey: ['orders', filters],
        queryFn: async () => {
            const params = new URLSearchParams();

            if (filters.status?.length) {
                filters.status.forEach(s => params.append('status[]', s));
            }
            if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
            if (filters.dateTo) params.append('dateTo', filters.dateTo);
            if (filters.platformTable) params.append('platformTable', filters.platformTable);
            if (filters.search) params.append('search', filters.search);
            if (filters.page !== undefined) params.append('page', ((filters.page ?? 0) + 1).toString());
            if (filters.pageSize) params.append('itemsPerPage', filters.pageSize.toString());

            const response = await axiosInstance.get<any>(`/orders?${params}`);

            const rawItems = response.data['hydra:member'] || response.data['member'] || [];
            const totalItems = response.data['hydra:totalItems'] || response.data['totalItems'] || 0;

            return {
                data: rawItems.map(normalizeOrder) as Order[],
                total: typeof totalItems === 'string' ? parseInt(totalItems, 10) : totalItems,
                page: (filters.page || 0) + 1,
                pageSize: filters.pageSize || 10,
            };
        },
    });
}

/**
 * Fetch single order by ID
 */
export function useOrder(id: string) {
    return useQuery({
        queryKey: ['order', id],
        queryFn: async () => {
            const response = await axiosInstance.get<any>(`/orders/${id}`);
            return normalizeOrder(response.data) as Order;
        },
        enabled: !!id,
    });
}

interface CreateOrderItemOption {
    optionItem: string; // IRI
}

interface CreateOrderItemPayload {
    product: string;       // IRI
    quantity: number;
    note?: string;
    orderItemOptions: CreateOrderItemOption[];
}

interface CreateOrderPayload {
    platformTable: string; // IRI
    tablet: string;        // IRI — required by CreateOrderDto
    orderItems: CreateOrderItemPayload[];
}

/**
 * Create new order — 3-step flow:
 *  1. POST /orders  (with all items, but WITHOUT options in the body)
 *  2. For items that have options: POST /order_items to get back each orderItem IRI
 *  3. For each option: POST /order_item_options
 */
export function useCreateOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateOrderPayload) => {
            if (data.orderItems.length === 0) throw new Error('Aucun article dans la commande');

            const firstItem = data.orderItems[0];
            const otherItems = data.orderItems.slice(1);

            // --- Step 1: Create the order with ONLY the first item ---
            // This satisfies the "not blank" constraint while avoiding duplicating the other items
            const orderPayload: any = {
                platformTable: data.platformTable,
                tablet: data.tablet,
                orderItems: [{
                    product: firstItem.product,
                    quantity: firstItem.quantity,
                    ...(firstItem.note ? { note: firstItem.note } : {}),
                }],
            };

            const orderResponse = await axiosInstance.post<any>('/orders', orderPayload);
            const order = orderResponse.data;
            const orderIri: string = order['@id'] || `/api/orders/${order.id}`;

            // --- Step 2: Handle options for the FIRST item ---
            // We need to find the IRI of the orderItem we just created. 
            // It's the first one in the returned orderItems list.
            const firstOrderItemRaw = order.orderItems?.[0];
            const firstOrderItemIri = typeof firstOrderItemRaw === 'object'
                ? (firstOrderItemRaw['@id'] || `/api/order_items/${firstOrderItemRaw.id}`)
                : firstOrderItemRaw;

            if (firstOrderItemIri && firstItem.orderItemOptions?.length > 0) {
                for (const opt of firstItem.orderItemOptions) {
                    await axiosInstance.post('/order_item_options', {
                        orderItem: firstOrderItemIri,
                        optionItem: opt.optionItem,
                    });
                }
            }

            // --- Step 3: Handle all OTHER items ---
            for (const item of otherItems) {
                const orderItemResponse = await axiosInstance.post<any>('/order_items', {
                    order: orderIri,
                    product: item.product,
                    quantity: item.quantity,
                    ...(item.note ? { note: item.note } : {}),
                });

                const orderItemIri: string =
                    orderItemResponse.data['@id'] ||
                    `/api/order_items/${orderItemResponse.data.id}`;

                if (item.orderItemOptions?.length > 0) {
                    for (const opt of item.orderItemOptions) {
                        await axiosInstance.post('/order_item_options', {
                            orderItem: orderItemIri,
                            optionItem: opt.optionItem,
                        });
                    }
                }
            }

            return order;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            toast.success('Commande envoyée en cuisine !');
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, 'Erreur lors de la création de la commande'));
        },
    });
}

/**
 * Update order
 */
export function useUpdateOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Order> }) => {
            const response = await axiosInstance.put<Order>(`/orders/${id}`, data);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['order', data.id] });
            toast.success('Commande mise à jour avec succès');
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, 'Erreur lors de la mise à jour de la commande'));
        },
    });
}

/**
 * Delete order
 */
export function useDeleteOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await axiosInstance.delete(`/orders/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            toast.success('Commande supprimée avec succès');
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, 'Erreur lors de la suppression de la commande'));
        },
    });
}

/**
 * Transition order status
 */
export function useOrderStatusTransition() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, action, reason }: { id: string; action: 'send_to_kitchen' | 'mark_ready' | 'mark_served' | 'cancel'; reason?: string }) => {
            const endpointMap = {
                'send_to_kitchen': '/orders/status/sent-to-kitchen',
                'mark_ready': '/orders/status/ready',
                'mark_served': '/orders/status/served',
                'cancel': '/orders/status/cancelled'
            };

            const payload: any = {
                order: `/api/orders/${id}`
            };

            if (action === 'cancel' && reason) {
                payload.reason = reason;
            }

            const response = await axiosInstance.post<Order>(endpointMap[action], payload);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['order', data.id] });
            toast.success('Statut de la commande mis à jour');
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, 'Erreur lors de la mise à jour du statut'));
        },
    });
}
