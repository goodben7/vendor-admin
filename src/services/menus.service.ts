import axiosInstance from './axios';
import { Menu, HydraCollection } from '@/types/entities';

export interface GetMenusParams {
    page?: number;
    pageSize?: number;
    search?: string;
}

export interface CreateMenuData {
    label: string;
    description?: string;
    active: boolean;
}

export interface UpdateMenuData {
    label?: string;
    description?: string;
    active?: boolean;
}

export const menusService = {
    getAll: async (params?: GetMenusParams) => {
        // Adjust params for Hydra (page 1-based usually, but passed params might be different)
        const requestParams = {
            page: params?.page || 1,
            itemsPerPage: params?.pageSize || 10,
            ...params
        };
        delete requestParams.pageSize; // Hydra uses itemsPerPage

        const { data } = await axiosInstance.get<HydraCollection<Menu>>('/menus', { params: requestParams });

        return {
            data: data['hydra:member'] || data['member'] || [],
            total: data['hydra:totalItems'] || data['totalItems'] || 0,
            page: params?.page || 1,
            pageSize: params?.pageSize || 10
        };
    },

    // Add get for single menu if you want the user request: "fait un get sur le menu et affiche ça dans le tableau"
    // The user provided JSON structure implies they want to see this structure or ensure it's handled.
    // The existing getById is fine.

    getById: async (id: string) => {
        const { data } = await axiosInstance.get<Menu>(`/menus/${id}`);
        return data;
    },

    create: async (data: CreateMenuData) => {
        const { data: response } = await axiosInstance.post<Menu>('/menus', data);
        return response;
    },

    update: async (id: string, data: UpdateMenuData) => {
        const { data: response } = await axiosInstance.patch<Menu>(`/menus/${id}`, data, {
            headers: {
                'Content-Type': 'application/merge-patch+json',
            },
        });
        return response;
    },

    delete: async (id: string) => {
        await axiosInstance.delete(`/menus/${id}`);
    },

    toggleStatus: async (id: string, active: boolean) => {
        const { data } = await axiosInstance.patch<Menu>(`/menus/${id}`, { active }, {
            headers: {
                'Content-Type': 'application/merge-patch+json',
            },
        });
        return data;
    }
};
