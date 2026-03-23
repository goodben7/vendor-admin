import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    currenciesService,
    GetCurrenciesParams,
    CreateCurrencyData,
    UpdateCurrencyData,
} from '@/services/currencies.service';
import { toast } from 'sonner';

export function useCurrencies(params?: GetCurrenciesParams) {
    return useQuery({
        queryKey: ['currencies', params],
        queryFn: () => currenciesService.getAll(params),
    });
}

export function useCurrency(id: string) {
    return useQuery({
        queryKey: ['currencies', id],
        queryFn: () => currenciesService.getById(id),
        enabled: !!id,
    });
}

export function useCreateCurrency() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateCurrencyData) => currenciesService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['currencies'] });
            toast.success('Devise créée avec succès');
        },
        onError: (error: any) => {
            const d = error.response?.data;
            toast.error(
                d?.message || d?.['hydra:description'] || d?.detail ||
                (d?.violations?.[0]?.message) || 'Erreur lors de la création de la devise'
            );
        },
    });
}

export function useUpdateCurrency() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateCurrencyData }) =>
            currenciesService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['currencies'] });
            toast.success('Devise mise à jour avec succès');
        },
        onError: (error: any) => {
            const d = error.response?.data;
            toast.error(
                d?.message || d?.['hydra:description'] || d?.detail ||
                (d?.violations?.[0]?.message) || 'Erreur lors de la mise à jour de la devise'
            );
        },
    });
}

export function useDeleteCurrency() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => currenciesService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['currencies'] });
            toast.success('Devise supprimée avec succès');
        },
        onError: (error: any) => {
            const d = error.response?.data;
            toast.error(
                d?.message || d?.['hydra:description'] || d?.detail ||
                (d?.violations?.[0]?.message) || 'Erreur lors de la suppression de la devise'
            );
        },
    });
}
