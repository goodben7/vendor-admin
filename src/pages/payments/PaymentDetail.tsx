import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, CreditCard, Calendar, Receipt,
    Banknote, Smartphone, CheckCircle2, XCircle, Clock,
    Hash, ShoppingBag, Table2, RefreshCw,
} from 'lucide-react';
import { usePayment } from '@/hooks/usePayments';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, ORDER_STATUS_LABELS, type OrderStatus } from '@/types/entities';

// ── Configs ──────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    S: {
        label: 'Réussi',
        icon: CheckCircle2,
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-600',
        dot: 'bg-emerald-500',
        border: 'border-emerald-500/20',
        glow: 'shadow-emerald-500/10',
    },
    P: {
        label: 'En attente',
        icon: Clock,
        bg: 'bg-amber-500/10',
        text: 'text-amber-600',
        dot: 'bg-amber-500',
        border: 'border-amber-500/20',
        glow: 'shadow-amber-500/10',
    },
    F: {
        label: 'Échoué',
        icon: XCircle,
        bg: 'bg-red-500/10',
        text: 'text-red-600',
        dot: 'bg-red-500',
        border: 'border-red-500/20',
        glow: 'shadow-red-500/10',
    },
} as const;

const METHOD_CONFIG = {
    CASH: { icon: Banknote, color: 'text-green-700', bg: 'bg-green-500/10' },
    CARD: { icon: CreditCard, color: 'text-blue-700', bg: 'bg-blue-500/10' },
    MOBILE_MONEY: { icon: Smartphone, color: 'text-violet-700', bg: 'bg-violet-500/10' },
} as const;

// Statuts de commande (back: D | K | R | S | P | C)
const ORDER_STATUS_CONFIG: Record<string, { dot: string; bg: string; text: string }> = {
    D: { dot: 'bg-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-700' }, // Brouillon / En attente
    K: { dot: 'bg-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-700' }, // Envoyée en cuisine
    R: { dot: 'bg-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-700' }, // Prête
    S: { dot: 'bg-zinc-500', bg: 'bg-zinc-500/10', text: 'text-zinc-700' }, // Servie
    P: { dot: 'bg-green-600', bg: 'bg-green-500/10', text: 'text-green-700' }, // Payée
    C: { dot: 'bg-red-500', bg: 'bg-red-500/10', text: 'text-red-700' }, // Annulée
};

// ── Info Row ──────────────────────────────────────────────────────────
function InfoRow({
    icon: Icon,
    label,
    value,
    iconClass,
    valueClass,
}: {
    icon: React.ElementType;
    label: string;
    value: React.ReactNode;
    iconClass?: string;
    valueClass?: string;
}) {
    return (
        <div className="flex items-start gap-4 py-4">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-muted/40', iconClass)}>
                <Icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-0.5">{label}</p>
                <div className={cn('font-bold text-sm', valueClass)}>{value}</div>
            </div>
        </div>
    );
}

// ── Skeleton ──────────────────────────────────────────────────────────
function DetailSkeleton() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-muted/50 animate-pulse" />
                <div className="space-y-2">
                    <div className="h-8 w-56 bg-muted/50 rounded-lg animate-pulse" />
                    <div className="h-4 w-36 bg-muted/30 rounded-lg animate-pulse" />
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-2xl border bg-card p-6 space-y-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <div className="w-9 h-9 rounded-xl bg-muted/50 animate-pulse" />
                            <div className="space-y-1.5 flex-1">
                                <div className="h-2.5 w-20 bg-muted/40 rounded animate-pulse" />
                                <div className="h-4 w-40 bg-muted/50 rounded animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="rounded-2xl border bg-card p-6 space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <div className="w-9 h-9 rounded-xl bg-muted/50 animate-pulse" />
                            <div className="space-y-1.5 flex-1">
                                <div className="h-2.5 w-20 bg-muted/40 rounded animate-pulse" />
                                <div className="h-4 w-32 bg-muted/50 rounded animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────
export default function PaymentDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: payment, isLoading, isError, refetch, isFetching } = usePayment(id!);

    if (isLoading) return <DetailSkeleton />;

    if (isError || !payment) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-6 animate-in fade-in duration-500">
                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
                    <XCircle className="w-9 h-9 text-red-500/60" />
                </div>
                <div className="text-center">
                    <p className="font-black italic uppercase tracking-tighter text-xl text-muted-foreground/60">
                        Paiement introuvable
                    </p>
                    <p className="text-sm text-muted-foreground/40 mt-1">
                        L'identifiant <span className="font-mono">{id}</span> ne correspond à aucun paiement.
                    </p>
                </div>
                <Button variant="outline" onClick={() => navigate('/payments')}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour aux paiements
                </Button>
            </div>
        );
    }

    // Resolve status config (fallback to P)
    const statusKey = payment.status as keyof typeof STATUS_CONFIG;
    const statusCfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG['P'];
    const StatusIcon = statusCfg.icon;

    // Resolve method config
    const methodKey = payment.method as keyof typeof METHOD_CONFIG;
    const methodCfg = METHOD_CONFIG[methodKey] ?? METHOD_CONFIG['CASH'];
    const MethodIcon = methodCfg.icon;

    // Resolve order
    const order = payment.order && typeof payment.order === 'object' ? payment.order as any : null;
    const orderRef = order?.referenceUnique || order?.reference || (typeof payment.order === 'string' ? payment.order : null);
    const orderTotal = order?.totalAmount != null ? parseFloat(order.totalAmount) : null;
    const orderId = order?.id || order?.['@id']?.split('/').pop();
    const tableNumber = order?.table?.tableNumber ?? order?.platformTable?.tableNumber ?? null;

    // Currency symbols
    const currSymbol = payment.currency?.symbol || '$';
    const paidSymbol = payment.paidCurrency?.symbol || currSymbol;

    // Dates — prefer paidAt for the effective payment date
    const displayDate = payment.paidAt || payment.createdAt;
    const createdDate = displayDate
        ? format(new Date(displayDate), 'dd MMMM yyyy', { locale: fr })
        : '—';
    const createdTime = displayDate
        ? format(new Date(displayDate), 'HH:mm:ss', { locale: fr })
        : '';

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl hover:bg-muted/60"
                        onClick={() => navigate('/payments')}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black italic tracking-tighter uppercase underline decoration-primary/30 underline-offset-8">
                                Paiement
                            </h1>
                            {isFetching && <RefreshCw className="w-4 h-4 animate-spin text-primary" />}
                        </div>
                        <p className="text-muted-foreground text-sm font-mono font-medium mt-1">
                            #{payment.id}
                        </p>
                    </div>
                </div>

                {/* Status pill */}
                <div className={cn(
                    'inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border text-sm font-black uppercase tracking-widest shadow-lg',
                    statusCfg.bg, statusCfg.text, statusCfg.border, statusCfg.glow,
                )}>
                    <StatusIcon className="w-4 h-4" />
                    {PAYMENT_STATUS_LABELS[statusKey] ?? statusCfg.label}
                </div>
            </div>

            {/* ── Amount hero ── */}
            <div className={cn(
                'rounded-2xl border p-6 flex items-center justify-between gap-6',
                statusCfg.bg, statusCfg.border
            )}>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">
                        Montant encaissé
                    </p>
                    <p className={cn('text-5xl font-black tracking-tight', statusCfg.text)}>
                        {parseFloat(payment.amount || '0').toFixed(2)} {currSymbol}
                    </p>
                    {payment.paidAmount && (
                        <p className="text-sm text-muted-foreground font-semibold mt-1">
                            Payé : {parseFloat(payment.paidAmount).toFixed(2)} {paidSymbol}
                            {payment.exchangeRateUsed && (
                                <span className="ml-2 text-[10px] opacity-60">(taux : {payment.exchangeRateUsed})</span>
                            )}
                        </p>
                    )}
                    <p className="text-sm text-muted-foreground font-semibold mt-2">
                        {createdDate} à {createdTime}
                    </p>
                </div>
                <div className={cn(
                    'w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0',
                    statusCfg.bg, 'border', statusCfg.border
                )}>
                    <StatusIcon className={cn('w-9 h-9', statusCfg.text)} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── Détails du paiement ── */}
                <div className="lg:col-span-2 bg-card rounded-2xl border shadow-sm overflow-hidden">
                    <div className="px-6 pt-5 pb-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                            Détails du paiement
                        </p>
                    </div>
                    <div className="px-6 divide-y divide-border/50">

                        <InfoRow
                            icon={Hash}
                            label="Identifiant"
                            value={<span className="font-mono text-xs">{payment.id}</span>}
                        />

                        <InfoRow
                            icon={MethodIcon}
                            label="Méthode de paiement"
                            value={
                                <span className={cn(
                                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-widest',
                                    methodCfg.bg, methodCfg.color
                                )}>
                                    <MethodIcon className="w-3 h-3" />
                                    {PAYMENT_METHOD_LABELS[methodKey] ?? payment.method}
                                </span>
                            }
                        />

                        <InfoRow
                            icon={Receipt}
                            label="Montant"
                            value={
                                <div className="space-y-0.5">
                                    <span className={cn('text-2xl font-black', statusCfg.text)}>
                                        {parseFloat(payment.amount || '0').toFixed(2)} {currSymbol}
                                    </span>
                                    {payment.paidAmount && (
                                        <p className="text-xs text-muted-foreground font-semibold">
                                            Payé : {parseFloat(payment.paidAmount).toFixed(2)} {paidSymbol}
                                        </p>
                                    )}
                                    {payment.exchangeRateUsed && payment.paidCurrency && payment.paidCurrency.code !== payment.currency?.code && (
                                        <p className="text-[10px] text-muted-foreground/60 font-medium">
                                            Taux de change : {payment.exchangeRateUsed}
                                        </p>
                                    )}
                                </div>
                            }
                        />

                        {payment.provider && (
                            <InfoRow
                                icon={CreditCard}
                                label="Fournisseur"
                                value={payment.provider}
                            />
                        )}

                        {payment.transactionRef && (
                            <InfoRow
                                icon={Hash}
                                label="Réf. transaction"
                                value={<span className="font-mono text-xs">{payment.transactionRef}</span>}
                            />
                        )}

                        <InfoRow
                            icon={Calendar}
                            label="Date du paiement"
                            value={
                                displayDate
                                    ? format(new Date(displayDate), "EEEE dd MMMM yyyy 'à' HH:mm:ss", { locale: fr })
                                    : '—'
                            }
                            valueClass="capitalize"
                        />

                    </div>
                    <div className="h-5" />
                </div>

                {/* ── Commande associée ── */}
                <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
                    <div className="px-6 pt-5 pb-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                            Commande associée
                        </p>
                    </div>

                    {order ? (
                        <>
                            <div className="px-6 divide-y divide-border/50">
                                {orderRef && (
                                    <InfoRow
                                        icon={ShoppingBag}
                                        label="Référence"
                                        value={<span className="font-mono">{orderRef}</span>}
                                    />
                                )}
                                {tableNumber && (
                                    <InfoRow
                                        icon={Table2}
                                        label="Table"
                                        value={`Table ${tableNumber}`}
                                    />
                                )}
                                {orderTotal != null && (
                                    <InfoRow
                                        icon={Receipt}
                                        label="Total commande"
                                        value={`${orderTotal.toFixed(2)} ${currSymbol}`}
                                    />
                                )}
                                {order.status && (() => {
                                    const sCfg = ORDER_STATUS_CONFIG[order.status] ?? { dot: 'bg-muted-foreground', bg: 'bg-muted/30', text: 'text-muted-foreground' };
                                    const sLabel = ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status;
                                    return (
                                        <InfoRow
                                            icon={CheckCircle2}
                                            label="Statut commande"
                                            value={
                                                <span className={cn(
                                                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-widest',
                                                    sCfg.bg, sCfg.text
                                                )}>
                                                    <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', sCfg.dot)} />
                                                    {sLabel}
                                                </span>
                                            }
                                        />
                                    );
                                })()}
                            </div>

                            {orderId && (
                                <>
                                    <Separator className="mx-6 w-auto" />
                                    <div className="px-6 py-4">
                                        <Button
                                            variant="outline"
                                            className="w-full rounded-xl font-bold"
                                            onClick={() => navigate(`/orders/${orderId}`)}
                                        >
                                            <ShoppingBag className="w-4 h-4 mr-2" />
                                            Voir la commande
                                        </Button>
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="px-6 pb-8 pt-4 flex flex-col items-center gap-3 text-center">
                            <div className="w-14 h-14 rounded-full bg-muted/30 flex items-center justify-center">
                                <ShoppingBag className="w-6 h-6 text-muted-foreground/30" />
                            </div>
                            <p className="text-sm text-muted-foreground font-semibold">
                                Aucune commande associée
                            </p>
                        </div>
                    )}
                </div>

            </div>

            {/* ── Actions ── */}
            <div className="flex items-center gap-3">
                <Button
                    variant="outline"
                    className="rounded-xl font-bold"
                    onClick={() => navigate('/payments')}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour à la liste
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl hover:bg-primary/5"
                    onClick={() => refetch()}
                    title="Rafraîchir"
                >
                    <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
                </Button>
            </div>

        </div>
    );
}
