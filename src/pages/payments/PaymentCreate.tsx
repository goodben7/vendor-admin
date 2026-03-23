import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    ArrowLeft, Banknote, CreditCard, Smartphone, Search,
    CheckCircle2, Receipt, Armchair, Calculator, RefreshCw, TrendingUp
} from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { useCreatePayment, CreatePaymentData } from '@/hooks/usePayments';
import { useCurrencies } from '@/hooks/useCurrencies';
import { usePlatformCurrency } from '@/hooks/usePlatformCurrency';
import axiosInstance from '@/services/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Order } from '@/types/entities';

// ── Helpers ─────────────────────────────────────────────────────────────
const getPaidAmount = (order: Order) => (order.payments || []).reduce((acc: number, p: any) => p.status !== 'F' ? acc + Number(p.amount) : acc, 0);
const getRemainingAmount = (order: Order) => Math.max(0, order.totalAmount - getPaidAmount(order));

// ── Configuration ────────────────────────────────────────────────────────
const METHOD_OPTIONS = [
    { id: 'CASH', label: 'Espèces', icon: Banknote, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    { id: 'CARD', label: 'Carte', icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    { id: 'MOBILE_MONEY', label: 'Mobile Money', icon: Smartphone, color: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/30' },
] as const;

const paymentSchema = z.object({
    orderId: z.string().min(1, 'Veuillez sélectionner une commande'),
    amount: z.number().positive('Le montant doit être supérieur à zéro'),
    method: z.enum(['CARD', 'CASH', 'MOBILE_MONEY']),
    currencyId: z.string().min(1, 'Veuillez sélectionner une devise'),
    provider: z.string().optional(),
    transactionRef: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

// ── Local Components ─────────────────────────────────────────────────────
function OrderTile({ order, onClick, selected, currSymbol = '$' }: { order: Order, onClick?: () => void, selected?: boolean, currSymbol?: string }) {
    const total = order.totalAmount;
    const paid = getPaidAmount(order);
    const rem = getRemainingAmount(order);

    return (
        <div
            onClick={onClick}
            className={cn(
                "p-4 rounded-3xl border transition-all cursor-pointer flex justify-between items-center group",
                selected
                    ? "bg-primary/5 border-primary ring-4 ring-primary/10 shadow-md"
                    : "hover:bg-muted/30 border-border/50 shadow-sm hover:border-border"
            )}
        >
            <div className="flex gap-4 items-center min-w-0">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors", selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                    <Receipt className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                    <p className="font-black text-lg truncate pr-2">{order.reference}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-semibold mt-1">
                        <span className="flex items-center gap-1.5"><Armchair className="w-3.5 h-3.5" /> Table {order.table?.tableNumber || '?'}</span>
                        {paid > 0 && <span className="text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-md uppercase tracking-wider text-[10px] font-black shrink-0">Reste : {rem.toFixed(2)}{currSymbol}</span>}
                    </div>
                </div>
            </div>
            <div className="text-right shrink-0 pl-4">
                <p className="text-xl font-black">{total.toFixed(2)} {currSymbol}</p>
                <p className="text-xs font-semibold text-muted-foreground/60 mt-0.5">{order.items.reduce((acc, i) => acc + i.quantity, 0)} articles</p>
            </div>
        </div>
    )
}

// ── Main Page ────────────────────────────────────────────────────────────
export default function PaymentCreate() {
    const navigate = useNavigate();
    const { data: ordersData, isLoading } = useOrders({ status: ['D', 'K', 'R', 'S'], page: 0, pageSize: 150 }); // Fetch broadly to find unpaid orders
    const createMutation = useCreatePayment();
    const { data: currenciesData } = useCurrencies();
    const { symbol: platformCurrSymbol } = usePlatformCurrency();
    const currencies = (currenciesData?.data || []).filter(c => c.active);

    // ── Conversion preview ────────────────────────────────────────────────
    const [conversionPreview, setConversionPreview] = useState<{
        orderId: string;
        baseCurrency: string;
        targetCurrency: string;
        baseAmount: string;
        targetAmount: string;
        rate: string;
    } | null>(null);
    const [isLoadingConversion, setIsLoadingConversion] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<PaymentFormData>({
        resolver: zodResolver(paymentSchema),
    });

    const watchedOrderId = watch('orderId');
    const watchedAmount = watch('amount');
    const watchedMethod = watch('method');
    const watchedCurrencyId = watch('currencyId');

    // ── Trigger conversion preview on currency / order change ─────────────
    useEffect(() => {
        if (!watchedOrderId || !watchedCurrencyId) {
            setConversionPreview(null);
            return;
        }
        // Find selected currency to check if it's not the platform default
        const selCurr = currencies.find(c => c.id === watchedCurrencyId);
        if (!selCurr) { setConversionPreview(null); return; }

        let cancelled = false;
        setIsLoadingConversion(true);
        axiosInstance
            .post('/orders/preview-conversion', {
                order: `/api/orders/${watchedOrderId}`,
                paidCurrency: `/api/currencies/${watchedCurrencyId}`,
            })
            .then((res) => {
                if (!cancelled) setConversionPreview(res.data);
            })
            .catch(() => {
                if (!cancelled) setConversionPreview(null);
            })
            .finally(() => {
                if (!cancelled) setIsLoadingConversion(false);
            });

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [watchedOrderId, watchedCurrencyId]);

    const selectedCurrency = currencies.find(c => c.id === watchedCurrencyId);
    const currSymbol = selectedCurrency?.symbol || '$';

    const selectedOrder = useMemo(() => ordersData?.data?.find(o => o.id === watchedOrderId), [ordersData, watchedOrderId]);

    const [searchTerm, setSearchTerm] = useState('');

    const filteredOrders = useMemo(() => {
        if (!ordersData?.data) return [];
        let list = ordersData.data.filter(o => getRemainingAmount(o) > 0);
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            list = list.filter(o => o.reference.toLowerCase().includes(lower) || o.table?.tableNumber?.toString().includes(searchTerm));
        }
        return list;
    }, [ordersData?.data, searchTerm]);

    const handleOrderSelect = (order: Order) => {
        setValue('orderId', order.id);
        const rem = getRemainingAmount(order);
        setValue('amount', rem);
        if (!watchedMethod) setValue('method', 'CARD');
        setSearchTerm('');
    };


    const onSubmit = async (data: PaymentFormData) => {
        if (!selectedOrder) return;
        const payload: CreatePaymentData = {
            order: `/api/orders/${selectedOrder.id}`,
            amount: data.amount.toFixed(2),
            currency: `/api/currencies/${data.currencyId}`,
            method: data.method,
            provider: data.provider || undefined,
            transactionRef: data.transactionRef || undefined,
        };
        await createMutation.mutateAsync(payload);
        navigate('/payments');
    };

    // Derived properties for UI
    const orderTotal = selectedOrder?.totalAmount || 0;
    const alreadyPaid = selectedOrder ? getPaidAmount(selectedOrder) : 0;
    const validCurrentAmount = (isNaN(watchedAmount) || watchedAmount < 0) ? 0 : watchedAmount;

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">

            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-muted" onClick={() => navigate('/payments')}>
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <div>
                    <h1 className="text-3xl font-black italic tracking-tighter uppercase">Nouveau paiement</h1>
                    <p className="text-muted-foreground font-semibold mt-1">Encaissement et gestion de la monnaie</p>
                </div>
            </div>

            {/* Main Layout */}
            <form onSubmit={handleSubmit(onSubmit)} className="gap-8 grid grid-cols-1 lg:grid-cols-[1fr_420px] items-start">

                {/* Left Column Config */}
                <div className="space-y-8">

                    {/* Order Selection */}
                    <div className="bg-card rounded-[2rem] p-6 shadow-sm border border-border/50">
                        {!selectedOrder ? (
                            <div className="space-y-4">
                                <Label className="font-black text-sm uppercase tracking-widest text-muted-foreground ml-2">Sélectionnez une commande</Label>
                                <div className="relative">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground opacity-50" />
                                    <Input
                                        placeholder="Chercher par référence ou N° de table..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="pl-14 h-16 rounded-[1.5rem] text-lg bg-muted/30 border-none shadow-inner focus-visible:ring-primary/20"
                                    />
                                </div>
                                <div className="space-y-3 mt-6 max-h-[450px] overflow-y-auto pr-2">
                                    {isLoading && <p className="text-center font-bold text-muted-foreground py-10 animate-pulse">Chargement...</p>}
                                    {!isLoading && filteredOrders.length === 0 && (
                                        <div className="text-center py-10 text-muted-foreground">
                                            <Receipt className="w-10 h-10 mx-auto opacity-20 mb-3" />
                                            <p className="font-bold">Aucune commande en attente de paiement.</p>
                                        </div>
                                    )}
                                    {filteredOrders.map(o => <OrderTile key={o.id} order={o} onClick={() => handleOrderSelect(o)} currSymbol={platformCurrSymbol} />)}
                                </div>
                                {errors.orderId && <p className="text-sm font-semibold text-destructive px-2 mt-2">{errors.orderId.message}</p>}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center ml-2">
                                    <Label className="font-black text-sm uppercase tracking-widest text-muted-foreground">Commande en cours</Label>
                                    <Button variant="ghost" size="sm" onClick={() => setValue('orderId', '')} className="text-primary font-bold h-8 px-3 rounded-lg hover:bg-primary/10">
                                        Changer
                                    </Button>
                                </div>
                                <OrderTile order={selectedOrder} selected currSymbol={platformCurrSymbol} />
                            </div>
                        )}
                    </div>

                    {/* Payment Params - Show only if order selected */}
                    {selectedOrder && (
                        <div className="bg-card rounded-[2rem] p-6 shadow-sm border border-border/50 space-y-8 animate-in slide-in-from-bottom-4 duration-500 fade-in">

                            {/* Amount */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center ml-2">
                                    <Label className="font-black text-sm uppercase tracking-widest text-muted-foreground">Montant à encaisser</Label>
                                </div>
                                <div>
                                    <div className="relative">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-muted-foreground">{platformCurrSymbol}</span>
                                        <Input
                                            type="number" step="0.01"
                                            readOnly
                                            className="pl-16 h-[5.5rem] text-5xl font-black rounded-3xl bg-muted/50 border-2 shadow-inner border-border/50 text-muted-foreground pointer-events-none"
                                            {...register('amount', { valueAsNumber: true })}
                                        />
                                    </div>
                                    {errors.amount && <p className="text-sm text-destructive mt-2 font-semibold px-4">{errors.amount.message}</p>}
                                </div>
                            </div>

                            {/* Currency */}
                            <div className="space-y-4">
                                <Label className="font-black text-sm uppercase tracking-widest text-muted-foreground ml-2">Devise</Label>
                                <Select
                                    value={watchedCurrencyId || ''}
                                    onValueChange={v => setValue('currencyId', v, { shouldValidate: true })}
                                >
                                    <SelectTrigger className="h-14 rounded-2xl bg-muted/30 border-none font-bold text-base">
                                        <SelectValue placeholder="Sélectionner une devise..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {currencies.map(c => (
                                            <SelectItem key={c.id} value={c.id} className="font-bold">
                                                {c.symbol} — {c.code} ({c.label})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.currencyId && <p className="text-sm text-destructive font-semibold px-2">{errors.currencyId.message}</p>}
                            </div>

                            {/* Method */}
                            <div className="space-y-4">
                                <Label className="font-black text-sm uppercase tracking-widest text-muted-foreground ml-2">Méthode de paiement</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {METHOD_OPTIONS.map(m => {
                                        const isActive = watchedMethod === m.id;
                                        const Icon = m.icon;
                                        return (
                                            <div key={m.id}
                                                onClick={() => {
                                                    setValue('method', m.id as any, { shouldValidate: true });
                                                }}
                                                className={cn(
                                                    "flex flex-col items-center justify-center p-5 rounded-3xl border-2 transition-all cursor-pointer gap-3",
                                                    isActive ? `${m.border} bg-card shadow-lg scale-[1.02] ring-2 ring-transparent` : "border-transparent bg-muted/30 hover:bg-muted/50 hover:scale-[1.01]"
                                                )}>
                                                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-300", isActive ? `${m.color} ${m.bg}` : "bg-background text-muted-foreground shadow-sm")}>
                                                    <Icon className="w-6 h-6" />
                                                </div>
                                                <span className={cn("font-black text-sm uppercase tracking-wider", isActive ? m.color : "text-muted-foreground")}>{m.label}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                                {errors.method && <p className="text-sm text-destructive mt-2 font-semibold px-4">{errors.method.message}</p>}
                            </div>

                            {/* The Cash Tendered Block has been removed. */}

                        </div>
                    )}
                </div>

                {/* Right Column (Ticket/Summary) */}
                <div className="sticky top-6">
                    <Card className="rounded-[2.5rem] shadow-xl border-0 overflow-hidden bg-card">
                        <div className="h-32 bg-primary/5 border-b border-primary/10 relative flex items-center justify-center">
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:16px_16px]"></div>
                            <Calculator className="w-14 h-14 text-primary/30 relative z-10" />
                        </div>

                        <CardContent className="p-8 pb-10 space-y-8 relative z-20">
                            {/* Summary Details */}
                            <div className="space-y-4">
                                <h3 className="font-black text-2xl text-center italic tracking-tight mb-6">Récapitulatif</h3>

                                {selectedOrder ? (
                                    <div className="space-y-4 px-2">
                                        <div className="pb-4 border-b border-border/60 border-dashed space-y-2.5">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground font-semibold">Commande</span>
                                                <span className="font-bold text-muted-foreground">{selectedOrder.reference}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground font-semibold">Table</span>
                                                <span className="font-bold text-primary">{selectedOrder.table?.tableNumber || 'À emporter'}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground font-semibold">Articles</span>
                                                <span className="font-bold text-muted-foreground">{selectedOrder.items.reduce((acc, i) => acc + i.quantity, 0)}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-2">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground font-semibold">Total commande</span>
                                                <span className="font-bold text-lg">{orderTotal.toFixed(2)} {platformCurrSymbol}</span>
                                            </div>
                                            {alreadyPaid > 0 && (
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-muted-foreground font-semibold">Déjà réglé</span>
                                                    <span className="font-bold text-emerald-600">-{alreadyPaid.toFixed(2)} {platformCurrSymbol}</span>
                                                </div>
                                            )}

                                            {/* Conversion Preview */}
                                            {watchedCurrencyId && (
                                                <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <TrendingUp className="w-4 h-4 text-primary" />
                                                        <span className="text-xs font-black uppercase tracking-widest text-primary">Conversion</span>
                                                        {isLoadingConversion && <RefreshCw className="w-3 h-3 text-primary animate-spin ml-auto" />}
                                                    </div>
                                                    {isLoadingConversion ? (
                                                        <div className="h-8 bg-primary/10 rounded-lg animate-pulse" />
                                                    ) : conversionPreview ? (
                                                        <>
                                                            <div className="flex justify-between items-center text-sm">
                                                                <span className="text-muted-foreground font-semibold">Montant converti</span>
                                                                <span className="font-black text-primary text-lg">
                                                                    {Number(conversionPreview.targetAmount).toFixed(2)} {selectedCurrency?.symbol}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-xs">
                                                                <span className="text-muted-foreground">Montant de base</span>
                                                                <span className="font-bold text-muted-foreground">
                                                                    {Number(conversionPreview.baseAmount).toFixed(2)} {platformCurrSymbol}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-xs">
                                                                <span className="text-muted-foreground">Taux de change</span>
                                                                <span className="font-bold text-muted-foreground">
                                                                    1 {platformCurrSymbol} = {Number(conversionPreview.rate).toLocaleString('fr-FR', { minimumFractionDigits: 4, maximumFractionDigits: 6 })} {selectedCurrency?.symbol}
                                                                </span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <p className="text-xs text-muted-foreground font-semibold text-center py-1">Pas de taux disponible pour cette devise</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-6 pb-2 text-muted-foreground text-sm font-semibold opacity-60">
                                        Sélectionnez une commande <br /> pour voir les détails
                                    </div>
                                )}
                            </div>

                            {/* Submit */}
                            <Button
                                size="lg"
                                type="submit"
                                className={cn("w-full h-16 rounded-[1.5rem] font-black uppercase tracking-widest text-base shadow-xl transition-all",
                                    (validCurrentAmount > 0) ? "bg-emerald-500 hover:bg-emerald-600 text-white" : ""
                                )}
                                disabled={!selectedOrder || createMutation.isPending || validCurrentAmount <= 0}
                            >
                                {createMutation.isPending ? (
                                    <span className="flex items-center gap-2"><RefreshCw className="w-5 h-5 animate-spin" /> Validation...</span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5" />
                                        {validCurrentAmount > 0
                                            ? conversionPreview
                                                ? `Encaisser ${Number(conversionPreview.targetAmount).toFixed(2)} ${selectedCurrency?.symbol}`
                                                : `Encaisser ${validCurrentAmount.toFixed(2)} ${currSymbol}`
                                            : 'Valider'}
                                    </span>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </div>
    );
}

