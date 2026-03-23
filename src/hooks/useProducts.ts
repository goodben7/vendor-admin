import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axiosInstance from '@/services/axios';
import { Product, Category, OptionGroup, OptionItem, HydraCollection } from '@/types/entities';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';

// ============================================
// PRODUCTS
// ============================================
export function useProducts(filters: any = {}) {
    return useQuery({
        queryKey: ['products', filters],
        queryFn: async () => {
            const params = {
                ...filters,
                page: (filters.page ?? 0) + 1,
                itemsPerPage: filters.pageSize || 10,
            };
            delete params.pageSize;

            const response = await axiosInstance.get<HydraCollection<Product>>('/products', { params });

            const data = response.data['hydra:member'] || response.data['member'] || [];
            const total = response.data['hydra:totalItems'] || response.data['totalItems'] || 0;

            // Normalize data if necessary (handling label vs name, basePrice vs price)
            const normalizedData = data.map((item: any) => ({
                ...item,
                name: item.label || item.name,
                price: item.basePrice ? parseFloat(item.basePrice) : item.price,
                // Ensure category is handled if it's an object or string (it might stay string if generic)
            }));

            return {
                data: normalizedData,
                total: total,
                page: (filters.page || 0) + 1,
                pageSize: filters.pageSize || 10
            };
        },
    });
}

export function useProduct(id: string) {
    return useQuery({
        queryKey: ['product', id],
        queryFn: async () => {
            const response = await axiosInstance.get<Product>(`/products/${id}`);
            const data = response.data as any;
            return {
                ...data,
                name: data.label || data.name,
                price: data.basePrice ? parseFloat(data.basePrice) : data.price,
                // Ensure other fields are mapped if needed
            } as Product;
        },
        enabled: !!id,
    });
}

export function useCreateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Partial<Product>) => {
            const response = await axiosInstance.post<Product>('/products', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Produit créé avec succès');
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, 'Erreur lors de la création du produit'));
        },
    });
}

export function useUpdateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Product> }) => {
            const response = await axiosInstance.patch<Product>(`/products/${id}`, data, {
                headers: {
                    'Content-Type': 'application/merge-patch+json',
                },
            });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['product', data.id] });
            toast.success('Produit mis à jour avec succès');
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, 'Erreur lors de la mise à jour du produit'));
        },
    });
}

export function useDeleteProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await axiosInstance.delete(`/products/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Produit supprimé avec succès');
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, 'Erreur lors de la suppression du produit'));
        },
    });
}

// ============================================
// CATEGORIES
// ============================================
export function useCategories(filters: any = {}) {
    return useQuery({
        queryKey: ['categories', filters],
        queryFn: async () => {
            const params = {
                ...filters,
                page: (filters.page ?? 0) + 1,
                itemsPerPage: filters.pageSize || 10,
            };
            delete params.pageSize;

            const response = await axiosInstance.get<HydraCollection<Category>>('/categories', { params });
            return {
                data: response.data['hydra:member'] || response.data['member'] || [],
                total: response.data['hydra:totalItems'] || response.data['totalItems'] || 0,
                page: (filters.page || 0) + 1,
                pageSize: filters.pageSize || 10
            };
        },
    });
}

export function useAllCategories() {
    return useQuery({
        queryKey: ['all-categories'],
        queryFn: async () => {
            const response = await axiosInstance.get<HydraCollection<Category>>('/categories', {
                params: { pagination: false }
            });
            return response.data['hydra:member'] || response.data['member'] || [];
        },
    });
}

export function useCategory(id: string) {
    return useQuery({
        queryKey: ['category', id],
        queryFn: async () => {
            const response = await axiosInstance.get<Category>(`/categories/${id}`);
            return response.data;
        },
        enabled: !!id,
    });
}

export function useCreateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Partial<Category>) => {
            const response = await axiosInstance.post<Category>('/categories', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('Catégorie créée avec succès');
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, 'Erreur lors de la création de la catégorie'));
        },
    });
}

export function useUpdateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Category> }) => {
            const response = await axiosInstance.patch<Category>(`/categories/${id}`, data, {
                headers: {
                    'Content-Type': 'application/merge-patch+json',
                },
            });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            queryClient.invalidateQueries({ queryKey: ['category', data.id] });
            toast.success('Catégorie mise à jour avec succès');
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, 'Erreur lors de la mise à jour de la catégorie'));
        },
    });
}

export function useDeleteCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await axiosInstance.delete(`/categories/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('Catégorie supprimée avec succès');
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, 'Erreur lors de la suppression de la catégorie'));
        },
    });
}

// ============================================
// OPTION GROUPS
// ============================================
export function useOptionGroups(filters: any = {}) {
    return useQuery({
        queryKey: ['option-groups', filters],
        queryFn: async () => {
            const params = {
                ...filters,
                page: (filters.page ?? 0) + 1,
                itemsPerPage: filters.pageSize || 12,
            };
            delete params.pageSize;

            const response = await axiosInstance.get<HydraCollection<OptionGroup>>('/option_groups', { params });
            return {
                data: response.data['hydra:member'] || response.data['member'] || [],
                total: response.data['hydra:totalItems'] || response.data['totalItems'] || 0,
                page: (filters.page || 0) + 1,
                pageSize: filters.pageSize || 12
            };
        },
    });
}

export function useCreateOptionGroup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Partial<OptionGroup>) => {
            const response = await axiosInstance.post<OptionGroup>('/option_groups', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['option-groups'] });
            toast.success('Groupe d\'options créé avec succès');
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, 'Erreur lors de la création du groupe d\'options'));
        },
    });
}

export function useUpdateOptionGroup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<OptionGroup> }) => {
            const response = await axiosInstance.patch<OptionGroup>(`/option_groups/${id}`, data, {
                headers: {
                    'Content-Type': 'application/merge-patch+json',
                },
            });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['option-groups'] });
            queryClient.invalidateQueries({ queryKey: ['option-group', data.id] });
            toast.success('Groupe d\'options mis à jour avec succès');
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, 'Erreur lors de la mise à jour du groupe d\'options'));
        },
    });
}

export function useDeleteOptionGroup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await axiosInstance.delete(`/option_groups/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['option-groups'] });
            toast.success('Groupe d\'options supprimé avec succès');
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, 'Erreur lors de la suppression du groupe d\'options'));
        },
    });
}

export function useOptionGroup(id: string) {
    return useQuery({
        queryKey: ['option-group', id],
        queryFn: async () => {
            const response = await axiosInstance.get<OptionGroup>(`/option_groups/${id}`);
            const data = response.data;
            return {
                ...data,
                name: data.label || data.name,
            } as OptionGroup;
        },
        enabled: !!id,
    });
}

// ============================================
// OPTION ITEMS
// ============================================
export function useOptionItems(filters: any = {}) {
    return useQuery({
        queryKey: ['option-items', filters],
        queryFn: async () => {
            const params = {
                ...filters,
                page: (filters.page ?? 0) + 1,
                itemsPerPage: filters.pageSize || 100, // Default to a larger number for variations
            };
            delete params.pageSize;

            const response = await axiosInstance.get<HydraCollection<OptionItem>>('/option_items', { params });
            const data = response.data['hydra:member'] || response.data['member'] || [];

            // Normalize data (handling label vs name, priceDelta)
            const normalizedData = data.map((item: any) => ({
                ...item,
                label: item.label || item.name,
                price: item.priceDelta ? parseFloat(item.priceDelta) : (item.price || 0),
            }));

            return {
                data: normalizedData,
                total: response.data['hydra:totalItems'] || response.data['totalItems'] || 0,
                page: (filters.page || 0) + 1,
                pageSize: filters.pageSize || 100
            };
        },
    });
}

export function useOptionItem(id: string) {
    return useQuery({
        queryKey: ['option-item', id],
        queryFn: async () => {
            const response = await axiosInstance.get<OptionItem>(`/option_items/${id}`);
            return response.data;
        },
        enabled: !!id,
    });
}

export function useCreateOptionItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Partial<OptionItem>) => {
            const response = await axiosInstance.post<OptionItem>('/option_items', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['option-items'] });
            queryClient.invalidateQueries({ queryKey: ['option-groups'] });
            toast.success('Option créée avec succès');
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, 'Erreur lors de la création de l\'option'));
        },
    });
}

export function useUpdateOptionItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<OptionItem> }) => {
            const response = await axiosInstance.patch<OptionItem>(`/option_items/${id}`, data, {
                headers: {
                    'Content-Type': 'application/merge-patch+json',
                },
            });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['option-items'] });
            queryClient.invalidateQueries({ queryKey: ['option-item', data.id] });
            queryClient.invalidateQueries({ queryKey: ['option-groups'] });
            toast.success('Option mise à jour avec succès');
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, 'Erreur lors de la mise à jour de l\'option'));
        },
    });
}

export function useDeleteOptionItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await axiosInstance.delete(`/option_items/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['option-items'] });
            queryClient.invalidateQueries({ queryKey: ['option-groups'] });
            toast.success('Option supprimée avec succès');
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, 'Erreur lors de la suppression de l\'option'));
        },
    });
}
