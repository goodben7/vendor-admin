import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/services/axios';
import {
    RefreshCw,
    ArrowRightLeft,
    Info,
    TrendingUp,
    Clock,
    AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ConversionResponse {
    originalAmount: number;
    originalCurrency: string;
    convertedAmount: number;
    convertedCurrency: string;
    rate: number;
    updatedAt: string;
}

interface CurrencyConversionTickerProps {
    orderId: string;
    targetCurrencyId: string;
    amount: number; // Keep for display purposes
    fromCurrency: string; // Keep for display purposes
    toCurrency: string; // Keep for display purposes
    className?: string;
    onRateChange?: (rate: number) => void;
}

/**
 * CurrencyConversionTicker
 * A premium fintech-style component to display real-time currency conversion previews.
 */
export default function CurrencyConversionTicker({
    orderId,
    targetCurrencyId,
    amount,
    fromCurrency,
    toCurrency,
    className,
    onRateChange
}: CurrencyConversionTickerProps) {
    const [isUpdating, setIsUpdating] = useState(false);

    const { data, isLoading, error, refetch, isFetching } = useQuery({
        queryKey: ['conversion-preview', orderId, targetCurrencyId],
        queryFn: async () => {
            const response = await axiosInstance.post<ConversionResponse>('/orders/preview-conversion', {
                order: `/api/orders/${orderId}`,
                paidCurrency: `/api/currencies/${targetCurrencyId}`
            });
            return response.data;
        },
        enabled: !!orderId && !!targetCurrencyId,
        staleTime: 30000, // 30 seconds
    });

    // Notify parent of rate change if needed
    useEffect(() => {
        if (data?.rate && onRateChange) {
            onRateChange(data.rate);
        }
    }, [data?.rate, onRateChange]);

    // Visual highlight when data updates
    useEffect(() => {
        if (isFetching && !isLoading) {
            setIsUpdating(true);
            const timer = setTimeout(() => setIsUpdating(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [isFetching, isLoading]);

    const formatCurrency = (val: number, symbol: string) => {
        const formattedVal = new Intl.NumberFormat('fr-FR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(val);
        
        return `${formattedVal} ${symbol || ''}`;
    };

    if (error) {
        return (
            <div className={cn("p-4 rounded-2xl bg-destructive/5 border border-destructive/20 flex items-center gap-3", className)}>
                <AlertCircle className="w-5 h-5 text-destructive" />
                <p className="text-sm font-medium text-destructive">
                    Erreur de conversion. Veuillez réessayer.
                </p>
                <button onClick={() => refetch()} className="ml-auto text-xs font-black uppercase text-destructive hover:underline">
                    Réessayer
                </button>
            </div>
        );
    }

    const showLoading = isLoading || (isFetching && !data);

    return (
        <div className={cn(
            "group relative overflow-hidden bg-card rounded-2xl border border-border shadow-sm transition-all duration-300 hover:shadow-md",
            isUpdating && "ring-1 ring-primary/20",
            className
        )}>
            {/* Glassmorphism accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 group-hover:opacity-100 transition-opacity" />

            <div className="p-5 space-y-4">
                {/* Header: Amounts */}
                <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none">Montant initial</p>
                        <p className="text-lg font-bold text-foreground">
                            {formatCurrency(amount, fromCurrency)}
                        </p>
                    </div>

                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted/50 border border-border/50 text-muted-foreground">
                        {isFetching ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                        ) : (
                            <ArrowRightLeft className="w-4 h-4" />
                        )}
                    </div>

                    <div className="space-y-1 text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary leading-none">Montant converti</p>
                        <p className={cn(
                            "text-xl font-black text-foreground transition-all duration-500",
                            showLoading ? "opacity-40 blur-sm" : "opacity-100 blur-0"
                        )}>
                            {data ? formatCurrency(
                                Number(data.convertedAmount || (amount * (data.rate || 1))),
                                data.convertedCurrency || toCurrency
                            ) : '---'}
                        </p>
                    </div>
                </div>

                {/* Body: Rate & Info */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60 leading-none mb-1">Taux actuel</span>
                            <span className="text-xs font-bold font-mono">
                                1 {fromCurrency} = {data ? Number(data.rate).toLocaleString('fr-FR', { maximumFractionDigits: 4 }) : '---'} {toCurrency}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/30">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground/60" />
                        <span className="text-[10px] font-bold text-muted-foreground">
                            {data?.updatedAt && !isNaN(new Date(data.updatedAt).getTime())
                                ? `Mis à jour à ${format(new Date(data.updatedAt), 'HH:mm', { locale: fr })}`
                                : data ? 'Taux en temps réel' : 'Chargement...'}
                        </span>
                    </div>
                </div>

                {/* Footer: Disclaimer */}
                <div className="flex gap-2.5 p-3 rounded-xl bg-primary/[0.03] border border-primary/10">
                    <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-[10px] font-medium text-primary/80 leading-relaxed">
                        Le taux de conversion est indicatif et peut être ajusté au moment du paiement effectif par votre établissement financier.
                    </p>
                </div>
            </div>

            {/* Subtle loading progress bar at bottom */}
            {isFetching && (
                <div className="absolute bottom-0 left-0 h-0.5 bg-primary/20 w-full overflow-hidden">
                    <div className="h-full bg-primary animate-progress-stripes w-1/2" />
                </div>
            )}
        </div>
    );
}

// Add these keyframes to your global CSS or index.css for the progress effect
/*
@keyframes progress-stripes {
  from { transform: translateX(-100%); }
  to { transform: translateX(200%); }
}
.animate-progress-stripes {
  animation: progress-stripes 2s infinite linear;
}
*/
