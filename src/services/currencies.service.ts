import axiosInstance from './axios';
import { Currency, HydraCollection } from '@/types/entities';

export interface GetCurrenciesParams {
    page?: number;
    pageSize?: number;
    search?: string;
}

export interface CreateCurrencyData {
    code: string;
    label: string;
    symbol: string;
    active: boolean;
    isDefault: boolean;
}

export interface UpdateCurrencyData {
    code?: string;
    label?: string;
    symbol?: string;
    active?: boolean;
    isDefault?: boolean;
}

export const currenciesService = {
    getAll: async (params?: GetCurrenciesParams) => {
        const requestParams = {
            page: params?.page || 1,
            itemsPerPage: params?.pageSize || 50,
        };

        const { data } = await axiosInstance.get<HydraCollection<Currency>>('/currencies', { params: requestParams });

        return {
            data: data['hydra:member'] || data['member'] || [],
            total: data['hydra:totalItems'] || data['totalItems'] || 0,
            page: params?.page || 1,
            pageSize: params?.pageSize || 50,
        };
    },

    getById: async (id: string) => {
        const { data } = await axiosInstance.get<Currency>(`/currencies/${id}`);
        return data;
    },

    create: async (body: CreateCurrencyData) => {
        const { data } = await axiosInstance.post<Currency>('/currencies', body);
        return data;
    },

    update: async (id: string, body: UpdateCurrencyData) => {
        const { data } = await axiosInstance.patch<Currency>(`/currencies/${id}`, body, {
            headers: { 'Content-Type': 'application/merge-patch+json' },
        });
        return data;
    },

    delete: async (id: string) => {
        await axiosInstance.delete(`/currencies/${id}`);
    },
};
