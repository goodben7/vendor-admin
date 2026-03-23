import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/services/axios';
import { Payment, PaymentMethod } from '@/types/entities';
import { toast } from 'sonner';

interface PaymentFilters {
    status?: string[];
    method?: PaymentMethod[];
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
}

/**
 * Fetch paginated list of payments
 */
export function usePayments(filters: PaymentFilters = {}) {
    return useQuery({
        queryKey: ['payments', filters],
        queryFn: async () => {
            const params = new URLSearchParams();

            if (filters.status?.length) {
                filters.status.forEach(s => params.append('status[]', s));
            }
            if (filters.method?.length) {
                filters.method.forEach(m => params.append('method[]', m));
            }
            if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
            if (filters.dateTo) params.append('dateTo', filters.dateTo);
            if (filters.page !== undefined) params.append('page', ((filters.page ?? 0) + 1).toString());
            if (filters.pageSize) params.append('itemsPerPage', filters.pageSize.toString());

            const response = await axiosInstance.get<any>(`/payments?${params}`);
            const rawItems = response.data['hydra:member'] || response.data['member'] || [];
            const total = response.data['hydra:totalItems'] || response.data['totalItems'] || 0;

            const data: Payment[] = rawItems.map((p: any) => ({
                ...p,
                id: p.id || p['@id']?.split('/').pop() || '',
                amount: p.amount ? parseFloat(p.amount) : 0,
                order: p.order && typeof p.order === 'object'
                    ? {
                        ...p.order,
                        id: p.order.id || p.order['@id']?.split('/').pop() || '',
                        reference: p.order.referenceUnique || p.order.reference || p.order.id || '—',
                        status: p.order.status || 'D',
                        totalAmount: p.order.totalAmount ? parseFloat(p.order.totalAmount) : 0,
                        items: [],
                        payments: [],
                        createdAt: p.order.createdAt || '',
                        updatedAt: p.order.updatedAt || '',
                    }
                    : p.order,
                createdAt: p.paidAt || p.createdAt || '',
                updatedAt: p.updatedAt || '',
            }));

            return {
                data,
                total: typeof total === 'string' ? parseInt(total, 10) : total,
                page: (filters.page || 0) + 1,
                pageSize: filters.pageSize || 10,
            };
        },
    });
}

/**
 * Fetch single payment by ID
 */
export function usePayment(id: string) {
    return useQuery({
        queryKey: ['payment', id],
        queryFn: async () => {
            const response = await axiosInstance.get<any>(`/payments/${id}`);
            const p = response.data;
            return {
                ...p,
                id: p.id || p['@id']?.split('/').pop() || '',
                amount: p.amount ? parseFloat(p.amount) : 0,
                order: p.order && typeof p.order === 'object'
                    ? { ...p.order, reference: p.order.referenceUnique || p.order.reference || '—' }
                    : p.order,
                createdAt: p.paidAt || p.createdAt || '',
            } as Payment;
        },
        enabled: !!id,
    });
}

/**
 * Create new payment
 */
export interface CreatePaymentData {
    order: string;          // IRI: /api/orders/{id}
    amount: string;
    currency: string;       // IRI: /api/currencies/{id}
    method: string;
    provider?: string;
    transactionRef?: string;
}

export function useCreatePayment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreatePaymentData) => {
            const response = await axiosInstance.post<Payment>('/payments', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            toast.success('Paiement créé avec succès');
        },
        onError: (error: any) => {
            const d = error.response?.data;
            toast.error(
                d?.['hydra:description'] || d?.description || d?.detail || d?.message ||
                (d?.violations?.[0]?.message) || 'Erreur lors de la création du paiement'
            );
        },
    });
}
