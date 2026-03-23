import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { menusService, GetMenusParams, CreateMenuData, UpdateMenuData } from '@/services/menus.service';
import { toast } from 'sonner';

export function useMenus(params?: GetMenusParams) {
    return useQuery({
        queryKey: ['menus', params],
        queryFn: () => menusService.getAll(params),
    });
}

export function useMenu(id: string) {
    return useQuery({
        queryKey: ['menus', id],
        queryFn: () => menusService.getById(id),
        enabled: !!id,
    });
}

export function useCreateMenu() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateMenuData) => menusService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['menus'] });
            toast.success('Le menu a été créé avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Une erreur est survenue lors de la création du menu');
        },
    });
}

export function useUpdateMenu() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateMenuData }) => menusService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['menus'] });
            toast.success('Le menu a été mis à jour avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Une erreur est survenue lors de la mise à jour du menu');
        },
    });
}

export function useDeleteMenu() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => menusService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['menus'] });
            toast.success('Le menu a été supprimé avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Une erreur est survenue lors de la suppression du menu');
        },
    });
}

export function useToggleMenuStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, active }: { id: string; active: boolean }) => menusService.toggleStatus(id, active),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['menus'] });
            toast.success('Le statut du menu a été mis à jour');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Une erreur est survenue lors du changement de statut');
        },
    });
}
