import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesService, GetCategoriesParams, CreateCategoryData, UpdateCategoryData } from '@/services/categories.service';
import { toast } from 'sonner';

export function useCategories(params?: GetCategoriesParams) {
    return useQuery({
        queryKey: ['categories', params],
        queryFn: () => categoriesService.getAll(params),
    });
}

export function useCategory(id: string) {
    return useQuery({
        queryKey: ['categories', id],
        queryFn: () => categoriesService.getById(id),
        enabled: !!id,
    });
}

export function useCreateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateCategoryData) => categoriesService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('La catégorie a été créée avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Une erreur est survenue lors de la création de la catégorie');
        },
    });
}

export function useUpdateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateCategoryData }) => categoriesService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('La catégorie a été mise à jour avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Une erreur est survenue lors de la mise à jour de la catégorie');
        },
    });
}

export function useDeleteCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => categoriesService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('La catégorie a été supprimée avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Une erreur est survenue lors de la suppression de la catégorie');
        },
    });
}
