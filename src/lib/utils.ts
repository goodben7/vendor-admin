import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function getErrorMessage(error: any, defaultMessage: string = 'Une erreur est survenue'): string {
    if (typeof error === 'string') return error;

    // Check for API-specific error structures (detail, description, message)
    if (error?.response?.data) {
        const data = error.response.data;
        return data.detail || data.description || data.message || defaultMessage;
    }

    return error?.message || defaultMessage;
}
