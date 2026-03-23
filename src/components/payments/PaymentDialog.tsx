import { useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Banknote, CreditCard, Smartphone,
    CheckCircle2, Receipt, Armchair, RefreshCw
} from 'lucide-react';
import { useCreatePayment, CreatePaymentData } from '@/hooks/usePayments';
import { useCurrencies } from '@/hooks/useCurrencies';
import { usePlatformCurrency } from '@/hooks/usePlatformCurrency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { cn } from '@/lib/utils';
import { Order } from '@/types/entities';
import CurrencyConversionTicker from '@/components/shared/CurrencyConversionTicker';

// ── Helpers ─────────────────────────────────────────────────────────────
const getPaidAmount = (order: Order) => (order.payments || []).reduce((acc: number, p: any) => p.status !== 'F' ? acc + Number(p.amount) : acc, 0);
const getRemainingAmount = (order: Order) => Math.max(0, order.totalAmount - getPaidAmount(order));

const METHOD_OPTIONS = [
    { id: 'CASH', label: 'Espèces', icon: Banknote, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    { id: 'CARD', label: 'Carte', icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    { id: 'MOBILE_MONEY', label: 'Mobile Money', icon: Smartphone, color: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/30' },
] as const;

const paymentSchema = z.object({
    amount: z.number().positive('Le montant doit être supérieur à zéro'),
    method: z.enum(['CARD', 'CASH', 'MOBILE_MONEY']),
    currencyId: z.string().min(1, 'Veuillez sélectionner une devise'),
    provider: z.string().optional(),
    transactionRef: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentDialogProps {
    order: Order;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function PaymentDialog({ order, isOpen, onClose, onSuccess }: PaymentDialogProps) {
    const createMutation = useCreatePayment();
    const { data: currenciesData } = useCurrencies();
    const { symbol: platformCurrSymbol, code: platformCode } = usePlatformCurrency();
    const currencies = useMemo(() => (currenciesData?.data || []).filter(c => c.active), [currenciesData]);

    const remAmount = getRemainingAmount(order);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<PaymentFormData>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            amount: remAmount,
            method: 'CASH',
        }
    });

    const watchedAmount = watch('amount');
    const watchedMethod = watch('method');
    const watchedCurrencyId = watch('currencyId');

    // Set initial currency when currencies are loaded
    useEffect(() => {
        if (currencies.length > 0 && !watchedCurrencyId) {
            const defaultCurr = currencies.find(c => c.isDefault) || currencies[0];
            setValue('currencyId', defaultCurr.id);
        }
    }, [currencies, watchedCurrencyId, setValue]);

    // Reset form when order changes or dialog opens
    useEffect(() => {
        if (isOpen) {
            reset({
                amount: remAmount,
                method: 'CASH',
                currencyId: currencies.find(c => c.isDefault)?.id || currencies[0]?.id
            });
        }
    }, [isOpen, order, remAmount, reset, currencies]);

    const selectedCurrency = currencies.find(c => c.id === watchedCurrencyId);

    const onSubmit = async (data: PaymentFormData) => {
        const payload: CreatePaymentData = {
            order: `/api/orders/${order.id}`,
            amount: data.amount.toFixed(2),
            currency: `/api/currencies/${data.currencyId}`,
            method: data.method,
            provider: data.provider || undefined,
            transactionRef: data.transactionRef || undefined,
        };
        await createMutation.mutateAsync(payload);
        onSuccess?.();
        onClose();
    };

    const validCurrentAmount = (isNaN(watchedAmount) || watchedAmount < 0) ? 0 : watchedAmount;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-background">
                <DialogHeader className="p-8 pb-0">
                    <DialogTitle className="text-3xl font-black italic tracking-tighter uppercase">Nouveau paiement</DialogTitle>
                    <DialogDescription className="text-muted-foreground font-semibold mt-1">
                        Validation du règlement pour la commande {order.reference}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="p-8 grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
                    {/* Left Side: Inputs */}
                    <div className="space-y-8">
                        {/* Summary Tile */}
                        <div className="bg-muted/30 p-5 rounded-3xl border border-dashed border-muted-foreground/20 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Receipt className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-black text-lg leading-tight">{order.reference}</p>
                                    <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                        <Armchair className="w-3.5 h-3.5" /> Table {order.table?.tableNumber || 'À emporter'}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-xl">{order.totalAmount.toFixed(2)} {platformCurrSymbol}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Total Commande</p>
                            </div>
                        </div>

                        {/* Amount & Currency Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground ml-2">Montant à payer</Label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-muted-foreground">{platformCurrSymbol}</span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        className="pl-12 h-14 rounded-2xl text-xl font-black bg-muted/30 border-none shadow-inner focus-visible:ring-primary/20"
                                        {...register('amount', { valueAsNumber: true })}
                                    />
                                </div>
                                {errors.amount && <p className="text-xs text-destructive font-bold ml-2">{errors.amount.message}</p>}
                            </div>

                            <div className="space-y-3">
                                <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground ml-2">Devise</Label>
                                <Select
                                    value={watchedCurrencyId || ''}
                                    onValueChange={v => setValue('currencyId', v, { shouldValidate: true })}
                                >
                                    <SelectTrigger className="h-14 rounded-2xl bg-muted/30 border-none font-bold text-base shadow-inner">
                                        <SelectValue placeholder="Devise..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-none shadow-2xl">
                                        {currencies.map(c => (
                                            <SelectItem key={c.id} value={c.id} className="font-bold">
                                                {c.symbol} — {c.code}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-3">
                            <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground ml-2">Méthode de paiement</Label>
                            <div className="grid grid-cols-3 gap-3">
                                {METHOD_OPTIONS.map(m => {
                                    const isActive = watchedMethod === m.id;
                                    const Icon = m.icon;
                                    return (
                                        <div key={m.id}
                                            onClick={() => setValue('method', m.id as any, { shouldValidate: true })}
                                            className={cn(
                                                "flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all cursor-pointer gap-2",
                                                isActive ? `${m.border} bg-card shadow-lg scale-[1.02]` : "border-transparent bg-muted/30 hover:bg-muted/50"
                                            )}>
                                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-colors", isActive ? `${m.color} ${m.bg}` : "bg-background text-muted-foreground shadow-sm")}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <span className={cn("font-black text-[10px] uppercase tracking-widest", isActive ? m.color : "text-muted-foreground")}>{m.label}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Recap & Validation */}
                    <div className="bg-muted/20 rounded-[2rem] p-6 border border-border/50 flex flex-col">
                        <div className="flex-1 space-y-6">
                            <h3 className="font-black text-xl italic tracking-tighter uppercase text-center mb-4">Récapitulatif</h3>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground font-semibold">Sous-total</span>
                                    <span className="font-bold">{order.totalAmount.toFixed(2)} {platformCurrSymbol}</span>
                                </div>
                                {getPaidAmount(order) > 0 && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground font-semibold">Déjà payé</span>
                                        <span className="font-bold text-emerald-600">-{getPaidAmount(order).toFixed(2)} {platformCurrSymbol}</span>
                                    </div>
                                )}
                                <Separator className="border-dashed" />
                                <div className="flex justify-between items-center">
                                    <span className="font-black uppercase tracking-widest text-xs">À régler</span>
                                    <span className="text-xl font-black">{remAmount.toFixed(2)} {platformCurrSymbol}</span>
                                </div>

                                {/* Conversion Preview */}
                                {watchedCurrencyId && selectedCurrency && selectedCurrency.code !== platformCurrSymbol && (
                                    <div className="mt-4">
                                        <CurrencyConversionTicker
                                            orderId={order.id}
                                            targetCurrencyId={selectedCurrency.id}
                                            amount={validCurrentAmount}
                                            fromCurrency={platformCurrSymbol || platformCode || 'CDF'}
                                            toCurrency={selectedCurrency.symbol || selectedCurrency.code}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <Button
                            size="lg"
                            type="submit"
                            className={cn(
                                "w-full h-16 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl transition-all mt-8",
                                validCurrentAmount > 0 ? "bg-emerald-500 hover:bg-emerald-600 text-white" : ""
                            )}
                            disabled={createMutation.isPending || validCurrentAmount <= 0}
                        >
                            {createMutation.isPending ? (
                                <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span>Valider le paiement</span>
                                </div>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function Separator({ className }: { className?: string }) {
    return <div className={cn("h-px bg-border w-full", className)} />;
}
