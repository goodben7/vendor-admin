import axiosInstance from './axios';
import { Category, PaginatedResponse } from '@/types/entities';

export interface GetCategoriesParams {
    page?: number;
    pageSize?: number;
    search?: string;
}

export interface CreateCategoryData {
    name: string;
    description?: string;
    isAvailable: boolean;
}

export interface UpdateCategoryData {
    name?: string;
    description?: string;
    isAvailable?: boolean;
}

export const categoriesService = {
    getAll: async (params?: GetCategoriesParams) => {
        const { data } = await axiosInstance.get<PaginatedResponse<Category>>('/categories', { params });
        return data;
    },

    getById: async (id: string) => {
        const { data } = await axiosInstance.get<Category>(`/categories/${id}`);
        return data;
    },

    create: async (data: CreateCategoryData) => {
        const { data: response } = await axiosInstance.post<Category>('/categories', data);
        return response;
    },

    update: async (id: string, data: UpdateCategoryData) => {
        const { data: response } = await axiosInstance.put<Category>(`/categories/${id}`, data);
        return response;
    },

    delete: async (id: string) => {
        await axiosInstance.delete(`/categories/${id}`);
    }
};
