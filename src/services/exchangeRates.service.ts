import axiosInstance from './axios';
import { ExchangeRate, HydraCollection } from '@/types/entities';

export interface GetExchangeRatesParams {
    page?: number;
    pageSize?: number;
}

export interface CreateExchangeRateData {
    baseCurrency: string;   // IRI
    targetCurrency: string; // IRI
    baseRate?: string;
    targetRate?: string;
    active?: boolean;
}

export interface UpdateExchangeRateData {
    active: boolean;
}

export const exchangeRatesService = {
    getAll: async (params?: GetExchangeRatesParams) => {
        const requestParams = {
            page: params?.page || 1,
            itemsPerPage: params?.pageSize || 50,
        };
        const { data } = await axiosInstance.get<HydraCollection<ExchangeRate>>('/exchange_rates', { params: requestParams });
        return {
            data: data['hydra:member'] || data['member'] || [],
            total: data['hydra:totalItems'] || data['totalItems'] || 0,
        };
    },

    getById: async (id: string) => {
        const { data } = await axiosInstance.get<ExchangeRate>(`/exchange_rates/${id}`);
        return data;
    },

    create: async (body: CreateExchangeRateData) => {
        const { data } = await axiosInstance.post<ExchangeRate>('/exchange_rates', body);
        return data;
    },

    update: async (id: string, body: UpdateExchangeRateData) => {
        const { data } = await axiosInstance.patch<ExchangeRate>(`/exchange_rates/${id}`, body, {
            headers: { 'Content-Type': 'application/merge-patch+json' },
        });
        return data;
    },

    delete: async (id: string) => {
        await axiosInstance.delete(`/exchange_rates/${id}`);
    },
};
