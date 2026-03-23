import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    exchangeRatesService,
    GetExchangeRatesParams,
    CreateExchangeRateData,
    UpdateExchangeRateData,
} from '@/services/exchangeRates.service';
import { toast } from 'sonner';

export function useExchangeRates(params?: GetExchangeRatesParams) {
    return useQuery({
        queryKey: ['exchange_rates', params],
        queryFn: () => exchangeRatesService.getAll(params),
    });
}

export function useExchangeRate(id: string) {
    return useQuery({
        queryKey: ['exchange_rates', id],
        queryFn: () => exchangeRatesService.getById(id),
        enabled: !!id,
    });
}

export function useCreateExchangeRate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateExchangeRateData) => exchangeRatesService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exchange_rates'] });
            toast.success('Taux de change créé avec succès');
        },
        onError: (error: any) => {
            const d = error.response?.data;
            toast.error(
                d?.message || d?.['hydra:description'] || d?.detail ||
                (d?.violations?.[0]?.message) || 'Erreur lors de la création du taux de change'
            );
        },
    });
}

export function useUpdateExchangeRate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateExchangeRateData }) =>
            exchangeRatesService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exchange_rates'] });
            toast.success('Taux de change mis à jour avec succès');
        },
        onError: (error: any) => {
            const d = error.response?.data;
            toast.error(
                d?.message || d?.['hydra:description'] || d?.detail ||
                (d?.violations?.[0]?.message) || 'Erreur lors de la mise à jour du taux de change'
            );
        },
    });
}

export function useDeleteExchangeRate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => exchangeRatesService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exchange_rates'] });
            toast.success('Taux de change supprimé avec succès');
        },
        onError: (error: any) => {
            const d = error.response?.data;
            toast.error(
                d?.message || d?.['hydra:description'] || d?.detail ||
                (d?.violations?.[0]?.message) || 'Erreur lors de la suppression du taux de change'
            );
        },
    });
}
