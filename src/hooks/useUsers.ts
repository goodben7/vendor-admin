import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/services/axios';
import { User, Profile, HydraCollection } from '@/types/entities';
import { toast } from 'sonner';

// ============================================
// USERS
// ============================================
export function useUsers(filters: any = {}) {
    return useQuery({
        queryKey: ['users', filters],
        queryFn: async () => {
            const params = {
                ...filters,
                page: (filters.page ?? 0) + 1,
                itemsPerPage: filters.pageSize || 10,
            };
            delete params.pageSize;

            const response = await axiosInstance.get<HydraCollection<User>>('/users', { params });
            return {
                data: response.data['hydra:member'] || response.data['member'] || [],
                total: response.data['hydra:totalItems'] || response.data['totalItems'] || 0,
                page: (filters.page || 0) + 1,
                pageSize: filters.pageSize || 10
            };
        },
    });
}

export function useUser(id: string) {
    return useQuery({
        queryKey: ['user', id],
        queryFn: async () => {
            const response = await axiosInstance.get<User>(`/users/${id}`);
            return response.data;
        },
        enabled: !!id,
    });
}

export function useAboutMe() {
    return useQuery({
        queryKey: ['user', 'about'],
        queryFn: async () => {
            const response = await axiosInstance.get<User>('/users/about');
            return response.data;
        },
    });
}

export function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Partial<User>) => {
            // Filter out empty strings
            const filteredData = Object.fromEntries(
                Object.entries(data).filter(([_, v]) => v !== '')
            );
            const response = await axiosInstance.post<User>('/users', filteredData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Utilisateur créé avec succès');
        },
        onError: (error: any) => {
            const data = error.response?.data;
            const errorMessage =
                data?.message ||
                data?.['hydra:description'] ||
                data?.detail ||
                (data?.violations && data.violations[0]?.message) ||
                'Erreur lors de la création de l\'utilisateur';
            toast.error(errorMessage);
        },
    });
}

export function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
            // Filter out empty strings
            const filteredData = Object.fromEntries(
                Object.entries(data).filter(([_, v]) => v !== '')
            );
            const response = await axiosInstance.patch<User>(`/users/${id}`, filteredData, {
                headers: {
                    'Content-Type': 'application/merge-patch+json',
                },
            });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['user', data.id] });
            toast.success('Utilisateur mis à jour avec succès');
        },
        onError: (error: any) => {
            const data = error.response?.data;
            const errorMessage =
                data?.message ||
                data?.['hydra:description'] ||
                data?.detail ||
                (data?.violations && data.violations[0]?.message) ||
                'Erreur lors de la mise à jour de l\'utilisateur';
            toast.error(errorMessage);
        },
    });
}

export function useToggleUserLock() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await axiosInstance.post<User>(`/users/${id}/lock_toggle`, {});
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['user', data.id] });
            toast.success(data.locked ? 'Utilisateur verrouillé' : 'Utilisateur déverrouillé');
        },
        onError: (error: any) => {
            const data = error.response?.data;
            const errorMessage =
                data?.message ||
                data?.['hydra:description'] ||
                data?.detail ||
                'Erreur lors du changement de statut de verrouillage';
            toast.error(errorMessage);
        },
    });
}

export function useUpdateUserSideRoles() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, sideRoles }: { id: string; sideRoles: string[] }) => {
            const response = await axiosInstance.post(`/users/${id}/side_roles`, { sideRoles });
            return response.data;
        },
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['user', data.id] });
            toast.success('Rôles secondaires mis à jour avec succès');
        },
        onError: (error: any) => {
            const data = error.response?.data;
            const errorMessage =
                data?.message ||
                data?.['hydra:description'] ||
                data?.detail ||
                'Erreur lors de la mise à jour des rôles secondaires';
            toast.error(errorMessage);
        },
    });
}
export function useUpdateMe() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
            const response = await axiosInstance.patch<User>(`/users/${id}`, data, {
                headers: {
                    'Content-Type': 'application/merge-patch+json',
                },
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user', 'about'] });
            toast.success('Profil mis à jour avec succès');
        },
        onError: (error: any) => {
            const data = error.response?.data;
            const errorMessage =
                data?.message ||
                data?.['hydra:description'] ||
                data?.detail ||
                (data?.violations && data.violations[0]?.message) ||
                'Erreur lors de la mise à jour du profil';
            toast.error(errorMessage);
        },
    });
}

export function useUpdateCredentials() {
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const response = await axiosInstance.patch(`/users/${id}/credentials`, data, {
                headers: {
                    'Content-Type': 'application/merge-patch+json',
                },
            });
            return response.data;
        },
        onSuccess: () => {
            toast.success('Mot de passe mis à jour avec succès');
        },
        onError: (error: any) => {
            const data = error.response?.data;
            const errorMessage =
                data?.message ||
                data?.['hydra:description'] ||
                data?.detail ||
                (data?.violations && data.violations[0]?.message) ||
                'Erreur lors de la mise à jour du mot de passe';
            toast.error(errorMessage);
        },
    });
}

export function useDeleteUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await axiosInstance.delete(`/users/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Utilisateur supprimé avec succès');
        },
        onError: (error: any) => {
            const data = error.response?.data;
            const errorMessage =
                data?.message ||
                data?.['hydra:description'] ||
                data?.detail ||
                (data?.violations && data.violations[0]?.message) ||
                'Erreur lors de la suppression de l\'utilisateur';
            toast.error(errorMessage);
        },
    });
}

export function useCreateTabletAccess() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: any) => {
            const response = await axiosInstance.post('/users/tablet_access', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['tablets'] });
            toast.success('Accès tablette créé avec succès');
        },
        onError: (error: any) => {
            const data = error.response?.data;
            const errorMessage =
                data?.message ||
                data?.['hydra:description'] ||
                data?.detail ||
                (data?.violations && data.violations[0]?.message) ||
                'Erreur lors de la création de l\'accès tablette';
            toast.error(errorMessage);
        },
    });
}

// ============================================
// PROFILES
// ============================================
export function useProfiles() {
    return useQuery({
        queryKey: ['profiles'],
        queryFn: async () => {
            const response = await axiosInstance.get<HydraCollection<Profile>>('/profiles');
            return response.data['hydra:member'] || response.data['member'] || [];
        },
    });
}

export function useCreateProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Partial<Profile>) => {
            const response = await axiosInstance.post<Profile>('/profiles', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
            toast.success('Profil créé avec succès');
        },
        onError: (error: any) => {
            const data = error.response?.data;
            const errorMessage =
                data?.message ||
                data?.['hydra:description'] ||
                data?.detail ||
                (data?.violations && data.violations[0]?.message) ||
                'Erreur lors de la création du profil';
            toast.error(errorMessage);
        },
    });
}

export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Profile> }) => {
            const response = await axiosInstance.patch<Profile>(`/profiles/${id}`, data, {
                headers: {
                    'Content-Type': 'application/merge-patch+json',
                },
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
            toast.success('Profil mis à jour avec succès');
        },
        onError: (error: any) => {
            const data = error.response?.data;
            const errorMessage =
                data?.message ||
                data?.['hydra:description'] ||
                data?.detail ||
                (data?.violations && data.violations[0]?.message) ||
                'Erreur lors de la mise à jour du profil';
            toast.error(errorMessage);
        },
    });
}

// ============================================
// PERMISSIONS
// ============================================
export function usePermissions() {
    return useQuery({
        queryKey: ['permissions'],
        queryFn: async () => {
            const response = await axiosInstance.get<HydraCollection<{
                '@id': string;
                '@type': string;
                role: string;
                label: string;
            }>>('/permissions');
            return response.data['hydra:member'] || response.data['member'] || [];
        },
    });
}
