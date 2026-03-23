import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/services/axios';
import { Platform, PlatformTable, Tablet, HydraCollection } from '@/types/entities';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';

// ============================================
// PLATFORMS
// ============================================
export function usePlatforms(filters: any = {}) {
    return useQuery({
        queryKey: ['platforms', filters],
        queryFn: async () => {
            const params = {
                ...filters,
                page: (filters.page ?? 0) + 1,
                itemsPerPage: filters.pageSize || 10,
            };
            delete params.pageSize;

            const response = await axiosInstance.get<HydraCollection<Platform>>('/platforms', { params });
            return {
                data: response.data['hydra:member'] || response.data['member'] || [],
                total: response.data['hydra:totalItems'] || response.data['totalItems'] || 0,
                page: (filters.page || 0) + 1,
                pageSize: filters.pageSize || 10
            };
        },
    });
}

export function usePlatform(id: string) {
    return useQuery({
        queryKey: ['platform', id],
        queryFn: async () => {
            const response = await axiosInstance.get<Platform>(`/platforms/${id}`);
            return response.data;
        },
        enabled: !!id,
    });
}

export function useCreatePlatform() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Partial<Platform>) => {
            const response = await axiosInstance.post<Platform>('/platforms', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platforms'] });
            toast.success('Plateforme créée avec succès');
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, 'Erreur lors de la création de la plateforme'));
        },
    });
}

export function useUpdatePlatform() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Platform> }) => {
            const response = await axiosInstance.patch<Platform>(`/platforms/${id}`, data, {
                headers: {
                    'Content-Type': 'application/merge-patch+json',
                },
            });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['platforms'] });
            queryClient.invalidateQueries({ queryKey: ['platform', data.id] });
            toast.success('Plateforme mise à jour avec succès');
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, 'Erreur lors de la mise à jour de la plateforme'));
        },
    });
}

export function useDeletePlatform() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await axiosInstance.delete(`/platforms/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platforms'] });
            toast.success('Plateforme supprimée avec succès');
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, 'Erreur lors de la suppression de la plateforme'));
        },
    });
}

// ============================================
// PLATFORM TABLES
// ============================================
export function usePlatformTables(filters: any = {}) {
    return useQuery({
        queryKey: ['platform-tables', filters],
        queryFn: async () => {
            const params = {
                ...filters,
                page: (filters.page ?? 0) + 1,
                itemsPerPage: filters.pageSize || 10,
            };
            delete params.pageSize;

            const response = await axiosInstance.get<HydraCollection<PlatformTable>>('/platform_tables', { params });
            return {
                data: response.data['hydra:member'] || response.data['member'] || [],
                total: response.data['hydra:totalItems'] || response.data['totalItems'] || 0,
                page: (filters.page || 0) + 1,
                pageSize: filters.pageSize || 10
            };
        },
    });
}

export function usePlatformTable(id: string) {
    return useQuery({
        queryKey: ['platform-table', id],
        queryFn: async () => {
            const response = await axiosInstance.get<PlatformTable>(`/platform_tables/${id}`);
            return response.data;
        },
        enabled: !!id,
    });
}

export function useCreatePlatformTable() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Partial<PlatformTable>) => {
            const response = await axiosInstance.post<PlatformTable>('/platform_tables', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-tables'] });
            toast.success('Table créée avec succès');
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, 'Erreur lors de la création de la table'));
        },
    });
}

export function useUpdatePlatformTable() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<PlatformTable> }) => {
            const response = await axiosInstance.patch<PlatformTable>(`/platform_tables/${id}`, data, {
                headers: {
                    'Content-Type': 'application/merge-patch+json',
                },
            });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['platform-tables'] });
            queryClient.invalidateQueries({ queryKey: ['platform-table', data.id] });
            toast.success('Table mise à jour avec succès');
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, 'Erreur lors de la mise à jour de la table'));
        },
    });
}

export function useDeletePlatformTable() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await axiosInstance.delete(`/platform_tables/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-tables'] });
            toast.success('Table supprimée avec succès');
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, 'Erreur lors de la suppression de la table'));
        },
    });
}

// ============================================
// TABLETS
// ============================================
export function useTablets(filters: any = {}) {
    return useQuery({
        queryKey: ['tablets', filters],
        queryFn: async () => {
            const params = {
                ...filters,
                page: (filters.page ?? 0) + 1,
                itemsPerPage: filters.pageSize || 10,
            };
            delete params.pageSize;

            const response = await axiosInstance.get<HydraCollection<Tablet>>('/tablets', { params });
            return {
                data: response.data['hydra:member'] || response.data['member'] || [],
                total: response.data['hydra:totalItems'] || response.data['totalItems'] || 0,
                page: (filters.page || 0) + 1,
                pageSize: filters.pageSize || 10
            };
        },
    });
}

export function useTablet(id: string) {
    return useQuery({
        queryKey: ['tablet', id],
        queryFn: async () => {
            const response = await axiosInstance.get<Tablet>(`/tablets/${id}`);
            return response.data;
        },
        enabled: !!id,
    });
}

export function useCreateTablet() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Partial<Tablet>) => {
            const response = await axiosInstance.post<Tablet>('/tablets', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tablets'] });
            toast.success('Tablette créée avec succès');
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, 'Erreur lors de la création de la tablette'));
        },
    });
}

export function useUpdateTablet() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Tablet> }) => {
            const response = await axiosInstance.patch<Tablet>(`/tablets/${id}`, data, {
                headers: {
                    'Content-Type': 'application/merge-patch+json',
                },
            });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['tablets'] });
            queryClient.invalidateQueries({ queryKey: ['tablet', data.id] });
            toast.success('Tablette mise à jour avec succès');
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, 'Erreur lors de la mise à jour de la tablette'));
        },
    });
}

export function useDeleteTablet() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await axiosInstance.delete(`/tablets/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tablets'] });
            toast.success('Tablette supprimée avec succès');
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, 'Erreur lors de la suppression de la tablette'));
        },
    });
}
