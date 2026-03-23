import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Clock, Smartphone, Armchair, ChevronRight,
    CheckCircle2, PlayCircle, XCircle, Printer, LayoutList,
    CheckCircle, RefreshCw, Hash, CreditCard, Banknote,
    AlertTriangle, UtensilsCrossed, Star, Package,
} from 'lucide-react';
import { useOrder, useOrderStatusTransition } from '@/hooks/useOrders';
import { usePlatformCurrency } from '@/hooks/usePlatformCurrency';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import RoleGuard from '@/components/shared/RoleGuard';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { CancelOrderDialog } from '@/components/orders/CancelOrderDialog';
import { PaymentDialog } from '@/components/payments/PaymentDialog';
import { OrderTicketSheet } from '@/components/orders/OrderTicketSheet';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState } from 'react';
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '@/types/entities';

// ── Status config ────────────────────────────────────────────────────
const STATUS_FLOW = [
    {
        key: 'D',
        label: 'Commande validée',
        sub: 'La commande a été enregistrée',
        icon: Clock,
        color: 'bg-amber-500',
        ring: 'ring-amber-500/20',
        text: 'text-amber-700',
        bg: 'bg-amber-500/10',
    },
    {
        key: 'K',
        label: 'Envoyée en cuisine',
        sub: 'La cuisine a commencé le travail',
        icon: UtensilsCrossed,
        color: 'bg-blue-500',
        ring: 'ring-blue-500/20',
        text: 'text-blue-700',
        bg: 'bg-blue-500/10',
    },
    {
        key: 'R',
        label: 'Prête à servir',
        sub: 'La commande est prête pour le client',
        icon: CheckCircle2,
        color: 'bg-emerald-500',
        ring: 'ring-emerald-500/20',
        text: 'text-emerald-700',
        bg: 'bg-emerald-500/10',
    },
    {
        key: 'S',
        label: 'Servie',
        sub: 'La commande a été remise au client',
        icon: CheckCircle,
        color: 'bg-zinc-500',
        ring: 'ring-zinc-500/20',
        text: 'text-zinc-700',
        bg: 'bg-zinc-500/10',
    },
] as const;

// Order of status in workflow (used to determine "done" steps)
const STATUS_ORDER: Record<string, number> = {
    D: 0, K: 1, R: 2, S: 3, C: 99,
};

const PAYMENT_METHOD_ICON: Record<string, React.ElementType> = {
    CASH: Banknote,
    CARD: CreditCard,
    MOBILE_MONEY: Smartphone,
};

// ── Section wrapper ───────────────────────────────────────────────────
function Section({ title, icon: Icon, children, badge }: {
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
    badge?: React.ReactNode;
}) {
    return (
        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/20">
                <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-primary" />
                    <p className="font-black text-sm uppercase tracking-widest">{title}</p>
                </div>
                {badge}
            </div>
            {children}
        </div>
    );
}

// ── Detail row ────────────────────────────────────────────────────────
function DetailRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
    return (
        <div className="flex items-center justify-between py-3 border-b last:border-0 border-border/40">
            <span className="text-[11px] font-black uppercase tracking-[0.15em] text-muted-foreground">{label}</span>
            <span className={cn('text-sm font-bold text-right', mono && 'font-mono text-xs')}>{value}</span>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────
export default function OrderDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: order, isLoading, refetch, isFetching } = useOrder(id!);
    const transitionMutation = useOrderStatusTransition();
    const [cancelOpen, setCancelOpen] = useState(false);
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [ticketOpen, setTicketOpen] = useState(false);
    const { symbol: currSymbol } = usePlatformCurrency();

    if (isLoading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center gap-4">
                    <LoadingSkeleton className="h-11 w-11 rounded-xl" />
                    <div className="space-y-2">
                        <LoadingSkeleton className="h-8 w-64" />
                        <LoadingSkeleton className="h-4 w-40" />
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <LoadingSkeleton className="h-72 rounded-2xl" />
                        <LoadingSkeleton className="h-56 rounded-2xl" />
                    </div>
                    <div className="space-y-6">
                        <LoadingSkeleton className="h-52 rounded-2xl" />
                        <LoadingSkeleton className="h-44 rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-6 animate-in fade-in">
                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
                    <XCircle className="w-9 h-9 text-red-400" />
                </div>
                <div className="text-center">
                    <p className="font-black italic uppercase tracking-tighter text-xl text-muted-foreground/60">Commande introuvable</p>
                    <p className="text-sm text-muted-foreground/40 mt-1">L'identifiant ne correspond à aucune commande.</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/orders')}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Retour aux commandes
                </Button>
            </div>
        );
    }

    const isCancelled = order.status === 'C';
    const canTransition = !['C', 'S'].includes(order.status);
    const currentStatusIndex = STATUS_ORDER[order.status] ?? 0;

    const totalItems = order.items.reduce((acc, i) => acc + i.quantity, 0);

    const handleTransition = (action: 'send_to_kitchen' | 'mark_ready' | 'mark_served' | 'cancel', reason?: string) => {
        if (action === 'cancel' && !reason) { setCancelOpen(true); return; }
        transitionMutation.mutate({ id: order.id, action, reason }, {
            onSuccess: () => { if (action === 'cancel') setCancelOpen(false); }
        });
    };

    const calculateItemTotal = (item: any) => {
        const base = item.unitPrice || item.product?.price || 0;
        const opts = (item.options || []).reduce((s: number, o: any) => s + (o.price || 0), 0);
        return (base + opts) * item.quantity;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 rounded-xl hover:bg-muted/60"
                        onClick={() => navigate('/orders')}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-3xl font-black italic tracking-tighter uppercase underline decoration-primary/30 underline-offset-8">
                                Commande
                            </h1>
                            {isFetching && <RefreshCw className="w-4 h-4 animate-spin text-primary" />}
                        </div>
                        <p className="text-muted-foreground font-mono text-sm mt-1">#{order.reference}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Status badge */}
                    {isCancelled ? (
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-700 border border-red-500/20 text-xs font-black uppercase tracking-widest">
                            <XCircle className="w-4 h-4" /> Annulée
                        </span>
                    ) : (
                        (() => {
                            const cfg = STATUS_FLOW.find(s => s.key === order.status) ?? STATUS_FLOW[0];
                            const Icon = cfg.icon;
                            return (
                                <span className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-black uppercase tracking-widest', cfg.bg, cfg.text, 'border-current/20')}>
                                    <Icon className="w-4 h-4" />
                                    {cfg.label}
                                </span>
                            );
                        })()
                    )}

                    {/* Payment Status Badge */}
                    <span className={cn(
                        'inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-black uppercase tracking-widest',
                        order.paymentStatus === 'S'
                            ? 'bg-purple-500/10 text-purple-700 border-purple-500/20'
                            : order.paymentStatus === 'F'
                                ? 'bg-red-500/10 text-red-700 border-red-500/20'
                                : 'bg-zinc-500/10 text-zinc-700 border-zinc-500/20'
                    )}>
                        <CreditCard className="w-4 h-4" />
                        {order.paymentStatus === 'S' ? 'Payée' : order.paymentStatus === 'P' ? 'Paiement en attente' : order.paymentStatus === 'F' ? 'Paiement Échoué' : 'Non Payée'}
                    </span>

                    {(order.paymentStatus === 'N' || order.paymentStatus === 'F') && (
                        <Button
                            className="h-10 gap-2 rounded-xl font-black uppercase tracking-widest text-xs bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20"
                            onClick={() => setPaymentOpen(true)}
                        >
                            <Banknote className="w-4 h-4" /> Payer
                        </Button>
                    )}

                    <Button variant="outline" className="h-10 gap-2 rounded-xl font-bold text-sm" onClick={() => setTicketOpen(true)}>
                        <Printer className="w-4 h-4" /> Ticket
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl hover:bg-primary/5"
                        onClick={() => refetch()}
                    >
                        <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── LEFT COLUMN ── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Produits */}
                    <Section
                        title="Produits commandés"
                        icon={LayoutList}
                        badge={
                            <span className="text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                                {totalItems} article{totalItems > 1 ? 's' : ''}
                            </span>
                        }
                    >
                        <div className="divide-y divide-border/40">
                            {order.items.map((item) => {
                                const lineTotal = calculateItemTotal(item);
                                const sku = (item.product as any)?.sku;
                                return (
                                    <div key={item.id} className="p-5 hover:bg-muted/10 transition-colors">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex gap-4 flex-1 min-w-0">
                                                {/* Quantity badge */}
                                                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                                    <span className="font-black text-primary text-sm">{item.quantity}x</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-black text-base leading-tight">{item.product.name}</p>
                                                    {sku && (
                                                        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">SKU: {sku}</p>
                                                    )}
                                                    <p className="text-xs text-muted-foreground font-semibold mt-1">
                                                        {item.unitPrice.toFixed(2)} {currSymbol} / unité
                                                    </p>

                                                    {/* Options */}
                                                    {(item.options || []).length > 0 && (
                                                        <div className="mt-3 space-y-1.5 pl-0">
                                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">
                                                                Personnalisations
                                                            </p>
                                                            {item.options.map((opt) => (
                                                                <div key={opt.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-1.5">
                                                                    <span className="flex items-center gap-1.5 text-xs font-semibold">
                                                                        <ChevronRight className="w-3 h-3 text-primary/50" />
                                                                        {opt.name}
                                                                    </span>
                                                                    {opt.price > 0 && (
                                                                        <span className="text-[11px] font-black text-emerald-600">
                                                                            +{opt.price.toFixed(2)} {currSymbol}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0 pt-1">
                                                <p className="text-lg font-black text-primary">{lineTotal.toFixed(2)} {currSymbol}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Totals */}
                        <div className="border-t bg-muted/10 px-5 py-4 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="font-black uppercase tracking-tighter">Total</span>
                                <span className="text-2xl font-black text-primary">{order.totalAmount.toFixed(2)} {currSymbol}</span>
                            </div>
                        </div>
                    </Section>

                    {/* Timeline */}
                    <Section title="Suivi de préparation" icon={Star}>
                        <div className="p-6">
                            {isCancelled ? (
                                /* Cancelled state */
                                <div className="space-y-6">
                                    {/* Step 1: always done */}
                                    <div className="flex items-start gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center shadow ring-4 ring-amber-500/20 flex-shrink-0">
                                                <Clock className="w-4 h-4" />
                                            </div>
                                            <div className="w-0.5 h-6 bg-red-300/40 mt-1" />
                                        </div>
                                        <div className="pt-1.5">
                                            <p className="font-black text-sm">Commande validée</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {format(new Date(order.createdAt), "dd MMMM à HH:mm", { locale: fr })}
                                            </p>
                                        </div>
                                    </div>
                                    {/* Cancelled step */}
                                    <div className="flex items-start gap-4">
                                        <div className="w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center shadow ring-4 ring-red-500/20 flex-shrink-0">
                                            <XCircle className="w-4 h-4" />
                                        </div>
                                        <div className="pt-1.5">
                                            <p className="font-black text-sm text-red-700">Commande annulée</p>
                                            {(order as any).cancelReason && (
                                                <div className="mt-2 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                                                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                                                    <p className="text-xs text-red-700 font-semibold">
                                                        {(order as any).cancelReason}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Normal flow timeline */
                                <div className="space-y-0">
                                    {STATUS_FLOW.map((step, idx) => {
                                        const stepIndex = STATUS_ORDER[step.key];
                                        const isDone = currentStatusIndex >= stepIndex;
                                        const isCurrent = currentStatusIndex === stepIndex;
                                        const isLast = idx === STATUS_FLOW.length - 1;
                                        const Icon = step.icon;

                                        return (
                                            <div key={step.key} className="flex items-start gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className={cn(
                                                        'w-9 h-9 rounded-full flex items-center justify-center shadow flex-shrink-0 transition-all duration-300',
                                                        isDone
                                                            ? `${step.color} text-white ring-4 ${step.ring}`
                                                            : 'bg-muted/50 text-muted-foreground/40 ring-4 ring-muted/20',
                                                        isCurrent && 'scale-110'
                                                    )}>
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    {!isLast && (
                                                        <div className={cn(
                                                            'w-0.5 h-8 mt-1 transition-colors duration-500',
                                                            isDone && currentStatusIndex > stepIndex
                                                                ? step.color.replace('bg-', 'bg-') + '/40'
                                                                : 'bg-muted/30'
                                                        )} />
                                                    )}
                                                </div>
                                                <div className={cn('pt-1.5 pb-8', isLast && 'pb-0')}>
                                                    <p className={cn(
                                                        'font-black text-sm transition-colors',
                                                        isDone ? step.text : 'text-muted-foreground/40'
                                                    )}>
                                                        {step.label}
                                                        {isCurrent && (
                                                            <span className={cn('ml-2 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full', step.bg, step.text)}>
                                                                ● Actuel
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className={cn(
                                                        'text-xs mt-0.5 font-medium',
                                                        isDone ? 'text-muted-foreground' : 'text-muted-foreground/30'
                                                    )}>
                                                        {isDone && step.key === 'D'
                                                            ? format(new Date(order.createdAt), "dd MMMM à HH:mm", { locale: fr })
                                                            : step.sub
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </Section>

                    {/* Paiements associés */}
                    {order.payments && order.payments.length > 0 && (
                        <Section title="Paiements" icon={CreditCard}>
                            <div className="divide-y divide-border/40">
                                {order.payments.map((payment: any) => {
                                    const pStatus = payment.status as string;
                                    const pMethod = payment.method as string;
                                    const MethodIcon = PAYMENT_METHOD_ICON[pMethod] ?? CreditCard;
                                    const statusLabel = PAYMENT_STATUS_LABELS[pStatus as keyof typeof PAYMENT_STATUS_LABELS] ?? pStatus;
                                    const statusColor = pStatus === 'S' ? 'text-emerald-600 bg-emerald-500/10' : pStatus === 'F' ? 'text-red-600 bg-red-500/10' : 'text-amber-600 bg-amber-500/10';
                                    return (
                                        <div key={payment.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/10 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-muted/40 flex items-center justify-center">
                                                    <MethodIcon className="w-4 h-4 text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-sm">
                                                        {PAYMENT_METHOD_LABELS[pMethod as keyof typeof PAYMENT_METHOD_LABELS] ?? pMethod}
                                                    </p>
                                                    <p className="text-[10px] font-mono text-muted-foreground">{payment.id}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={cn('text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full', statusColor)}>
                                                    {statusLabel}
                                                </span>
                                                <span className="font-black text-primary">
                                                    {Number(payment.amount).toFixed(2)} {currSymbol}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Section>
                    )}
                </div>

                {/* ── RIGHT COLUMN ── */}
                <div className="space-y-6">

                    {/* Identifiants */}
                    <Section title="Identifiants" icon={Hash}>
                        <div className="px-5 py-2">
                            <DetailRow label="ID interne" value={order.id} mono />
                            <DetailRow label="Référence" value={order.reference} mono />
                            <DetailRow label="Placée le" value={
                                format(new Date(order.createdAt), "dd MMM yyyy 'à' HH:mm", { locale: fr })
                            } />
                            {order.updatedAt && order.updatedAt !== order.createdAt && (
                                <DetailRow label="Modifiée le" value={
                                    format(new Date(order.updatedAt), "dd MMM yyyy 'à' HH:mm", { locale: fr })
                                } />
                            )}
                        </div>
                    </Section>

                    {/* Infos générales */}
                    <Section title="Table & Appareil" icon={Armchair}>
                        <div className="px-5 py-2">
                            <DetailRow
                                label="Table"
                                value={
                                    order.table
                                        ? <span className="flex items-center gap-1.5">
                                            <Armchair className="w-3.5 h-3.5 text-muted-foreground" />
                                            {(order.table as any).label || `Table ${order.table.tableNumber}`}
                                        </span>
                                        : '—'
                                }
                            />
                            {(order.table?.capacity ?? 0) > 0 && (
                                <DetailRow label="Capacité" value={`${order.table?.capacity} pers.`} />
                            )}
                            <DetailRow
                                label="Tablette"
                                value={
                                    order.tablet
                                        ? <span className="flex items-center gap-1.5">
                                            <Smartphone className="w-3.5 h-3.5 text-muted-foreground" />
                                            {order.tablet.label || order.tablet.deviceId || '—'}
                                        </span>
                                        : 'Commande directe'
                                }
                            />
                            {order.tablet?.serialNumber && (
                                <DetailRow label="N° série" value={order.tablet.serialNumber} mono />
                            )}
                        </div>
                    </Section>

                    {/* Résumé montant */}
                    <Section title="Montant" icon={Package}>
                        <div className="px-5 py-2">
                            <DetailRow label="Articles" value={`${totalItems} article${totalItems > 1 ? 's' : ''}`} />
                        </div>
                        <div className="m-4 flex items-center justify-between bg-primary text-primary-foreground rounded-xl px-5 py-4 shadow-lg ring-4 ring-primary/10">
                            <span className="font-black italic uppercase tracking-tighter">Total</span>
                            <span className="text-2xl font-black">{order.totalAmount.toFixed(2)} {currSymbol}</span>
                        </div>
                    </Section>

                    {/* Actions statut */}
                    {canTransition && (
                        <Section title="Faire progresser" icon={PlayCircle}>
                            <div className="p-4 space-y-3">
                                <RoleGuard permissions={['ROLE_ORDER_SENT_TO_KITCHEN', 'ROLE_ORDER_AS_READY', 'ROLE_ORDER_AS_SERVED', 'ROLE_ORDER_AS_CANCELLED']}>
                                    {order.status === 'D' && (
                                        <Button
                                            className="w-full h-12 gap-2 font-black uppercase tracking-wider text-sm bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg"
                                            onClick={() => handleTransition('send_to_kitchen')}
                                            disabled={transitionMutation.isPending}
                                        >
                                            {transitionMutation.isPending
                                                ? <RefreshCw className="w-4 h-4 animate-spin" />
                                                : <UtensilsCrossed className="w-4 h-4" />
                                            }
                                            Envoyer en cuisine
                                        </Button>
                                    )}
                                    {order.status === 'K' && (
                                        <Button
                                            className="w-full h-12 gap-2 font-black uppercase tracking-wider text-sm bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg"
                                            onClick={() => handleTransition('mark_ready')}
                                            disabled={transitionMutation.isPending}
                                        >
                                            {transitionMutation.isPending
                                                ? <RefreshCw className="w-4 h-4 animate-spin" />
                                                : <CheckCircle2 className="w-4 h-4" />
                                            }
                                            Prête à servir
                                        </Button>
                                    )}
                                    {order.status === 'R' && (
                                        <Button
                                            className="w-full h-12 gap-2 font-black uppercase tracking-wider text-sm bg-zinc-800 hover:bg-zinc-900 rounded-xl shadow-lg"
                                            onClick={() => handleTransition('mark_served')}
                                            disabled={transitionMutation.isPending}
                                        >
                                            {transitionMutation.isPending
                                                ? <RefreshCw className="w-4 h-4 animate-spin" />
                                                : <CheckCircle className="w-4 h-4" />
                                            }
                                            Marquer comme servie
                                        </Button>
                                    )}

                                    <Separator className="my-1" />

                                    <Button
                                        variant="ghost"
                                        className="w-full h-10 gap-2 font-bold text-destructive hover:bg-destructive/10 rounded-xl text-sm"
                                        onClick={() => setCancelOpen(true)}
                                        disabled={transitionMutation.isPending}
                                    >
                                        <XCircle className="w-4 h-4" /> Annuler la commande
                                    </Button>
                                </RoleGuard>
                            </div>
                        </Section>
                    )}

                    {/* Raison annulation */}
                    {isCancelled && (order as any).cancelReason && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 space-y-2">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                                <p className="text-xs font-black uppercase tracking-widest text-red-700">Raison d'annulation</p>
                            </div>
                            <p className="text-sm text-red-800 font-semibold">{(order as any).cancelReason}</p>
                        </div>
                    )}

                    {/* Back */}
                    <Button
                        variant="outline"
                        className="w-full rounded-xl font-bold"
                        onClick={() => navigate('/orders')}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Retour à la liste
                    </Button>
                </div>
            </div>

            {/* Cancel dialog */}
            <CancelOrderDialog
                isOpen={cancelOpen}
                onClose={() => setCancelOpen(false)}
                onConfirm={(reason) => handleTransition('cancel', reason)}
                isPending={transitionMutation.isPending}
            />

            {/* Direct Payment Dialog */}
            {order && (
                <PaymentDialog
                    order={order}
                    isOpen={paymentOpen}
                    onClose={() => setPaymentOpen(false)}
                    onSuccess={() => refetch()}
                />
            )}

            {/* Ticket Preview */}
            <OrderTicketSheet
                order={order}
                isOpen={ticketOpen}
                onClose={() => setTicketOpen(false)}
            />
        </div>
    );
}
