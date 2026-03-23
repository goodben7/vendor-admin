import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CreditCard, Search, RefreshCw,
    Banknote, Smartphone, Eye, CheckCircle2, XCircle, Clock,
    ChevronLeft, ChevronRight, Plus, TrendingUp, AlertCircle, Hash
} from 'lucide-react';
import { usePayments } from '@/hooks/usePayments';
import { PaymentMethod } from '@/types/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { usePlatformCurrency } from '@/hooks/usePlatformCurrency';

// ── Status config ────────────────────────────────────────────────
const STATUS_CONFIG = {
    S: { label: 'Réussi', icon: CheckCircle2, bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
    P: { label: 'En attente', icon: Clock, bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
    F: { label: 'Échoué', icon: XCircle, bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', dot: 'bg-red-500' },
} as const;

const METHOD_CONFIG = {
    CASH: { label: 'Espèces', icon: Banknote, bg: 'bg-green-500/10', text: 'text-green-700 dark:text-green-400' },
    CARD: { label: 'Carte', icon: CreditCard, bg: 'bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400' },
    MOBILE_MONEY: { label: 'Mobile', icon: Smartphone, bg: 'bg-violet-500/10', text: 'text-violet-700 dark:text-violet-400' },
} as const;

// ── KPI Card ─────────────────────────────────────────────────────
function KpiCard({
    label, value, sub, icon: Icon, iconBg, iconColor, valueCls = ''
}: {
    label: string;
    value: string;
    sub?: string;
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    valueCls?: string;
}) {
    return (
        <div className="relative overflow-hidden rounded-3xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 p-6 flex items-center gap-5 group">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110", iconBg)}>
                <Icon className={cn("w-6 h-6", iconColor)} />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground leading-none mb-2">{label}</p>
                <p className={cn("text-2xl font-black leading-none tracking-tight truncate", valueCls)}>{value}</p>
                {sub && <p className="text-xs text-muted-foreground font-semibold mt-1.5">{sub}</p>}
            </div>
            <div className={cn("absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-10", iconBg)} />
        </div>
    );
}

// ── Status badge ──────────────────────────────────────────────────
function StatusPill({ status }: { status: keyof typeof STATUS_CONFIG }) {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['P'];
    return (
        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", cfg.bg, cfg.text)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
            {cfg.label}
        </span>
    );
}

// ── Method badge ──────────────────────────────────────────────────
function MethodPill({ method }: { method: keyof typeof METHOD_CONFIG }) {
    const cfg = METHOD_CONFIG[method] ?? METHOD_CONFIG['CASH'];
    const Icon = cfg.icon;
    return (
        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", cfg.bg, cfg.text)}>
            <Icon className="w-3 h-3" />
            {cfg.label}
        </span>
    );
}

// ── Main page ────────────────────────────────────────────────────
export default function PaymentsList() {
    const navigate = useNavigate();
    const { symbol: platformCurrSymbol } = usePlatformCurrency();
    const [page, setPage] = useState(0);
    const [pageSize] = useState(15);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [methodFilter, setMethodFilter] = useState('all');

    const { data, isLoading, refetch, isFetching } = usePayments({
        page,
        pageSize,
        status: statusFilter === 'all' ? undefined : [statusFilter],
        method: methodFilter === 'all' ? undefined : [methodFilter as PaymentMethod],
    });

    const payments = data?.data || [];
    const total = data?.total || 0;
    const totalPages = Math.ceil(total / pageSize);

    // Client-side search on referenceUnique or id
    const filtered = useMemo(() => {
        if (!search.trim()) return payments;
        const q = search.toLowerCase();
        return payments.filter(p => {
            const order = typeof p.order === 'object' ? p.order as any : null;
            const ref = (order?.referenceUnique || order?.reference || '').toLowerCase();
            return ref.includes(q) || p.id.toLowerCase().includes(q);
        });
    }, [payments, search]);

    // KPIs
    const kpis = useMemo(() => {
        const success = payments.filter(p => p.status === 'S');
        const totalRevenue = success.reduce((s, p) => s + parseFloat(p.amount || '0'), 0);
        const pending = payments.filter(p => p.status === 'P').length;
        const failed = payments.filter(p => p.status === 'F').length;
        return { totalRevenue, successCount: success.length, pending, failed };
    }, [payments]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-black italic tracking-tighter uppercase underline decoration-primary/30 underline-offset-8">
                            Paiements
                        </h1>
                        {isFetching && <RefreshCw className="w-4 h-4 animate-spin text-primary" />}
                    </div>
                    <p className="text-muted-foreground text-sm font-medium mt-1">
                        {total} paiement{total > 1 ? 's' : ''} au total
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        className="h-11 gap-2 rounded-xl font-black uppercase tracking-wider shadow-md bg-primary hover:bg-primary/90"
                        onClick={() => navigate('/payments/create')}
                    >
                        <Plus className="w-5 h-5" />
                        Nouveau
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 rounded-xl hover:bg-primary/5 shadow-sm"
                        onClick={() => refetch()}
                    >
                        <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    label="Revenus encaissés"
                    value={`${kpis.totalRevenue.toFixed(2)} ${platformCurrSymbol}`}
                    sub={`${kpis.successCount} paiement${kpis.successCount > 1 ? 's' : ''} réussi${kpis.successCount > 1 ? 's' : ''}`}
                    icon={TrendingUp}
                    iconBg="bg-emerald-500/15"
                    iconColor="text-emerald-600 dark:text-emerald-400"
                    valueCls="text-emerald-600 dark:text-emerald-400"
                />
                <KpiCard
                    label="En attente"
                    value={String(kpis.pending)}
                    sub="À confirmer"
                    icon={Clock}
                    iconBg="bg-amber-500/15"
                    iconColor="text-amber-600 dark:text-amber-400"
                    valueCls="text-amber-600 dark:text-amber-400"
                />
                <KpiCard
                    label="Échoués"
                    value={String(kpis.failed)}
                    sub="À retraiter"
                    icon={AlertCircle}
                    iconBg="bg-red-500/15"
                    iconColor="text-red-600 dark:text-red-400"
                    valueCls={kpis.failed > 0 ? "text-red-600 dark:text-red-400" : ""}
                />
                <KpiCard
                    label="Total affiché"
                    value={String(filtered.length)}
                    sub={`sur ${total}`}
                    icon={Hash}
                    iconBg="bg-primary/15"
                    iconColor="text-primary"
                    valueCls="text-primary"
                />
            </div>

            {/* ── Filters ── */}
            <div className="bg-card rounded-2xl p-4 shadow-sm border flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
                    <Input
                        placeholder="Rechercher par référence commande..."
                        className="pl-11 h-11 bg-muted/30 border-none rounded-xl focus-visible:ring-primary text-sm"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
                    <SelectTrigger className="w-full sm:w-[170px] h-11 rounded-xl bg-muted/30 border-none font-bold text-sm">
                        <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                        <SelectItem value="all" className="font-bold">Tous les statuts</SelectItem>
                        <SelectItem value="S">Réussi</SelectItem>
                        <SelectItem value="P">En attente</SelectItem>
                        <SelectItem value="F">Échoué</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={methodFilter} onValueChange={v => { setMethodFilter(v); setPage(0); }}>
                    <SelectTrigger className="w-full sm:w-[170px] h-11 rounded-xl bg-muted/30 border-none font-bold text-sm">
                        <SelectValue placeholder="Méthode" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                        <SelectItem value="all" className="font-bold">Toutes les méthodes</SelectItem>
                        <SelectItem value="CASH">Espèces</SelectItem>
                        <SelectItem value="CARD">Carte</SelectItem>
                        <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* ── Table ── */}
            <div className="bg-card rounded-2xl shadow-sm border overflow-hidden">
                {/* thead */}
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 bg-muted/30 border-b text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                    <span>Commande</span>
                    <span>Montant</span>
                    <span>Méthode</span>
                    <span>Statut</span>
                    <span>Date</span>
                    <span></span>
                </div>

                {/* rows */}
                {isLoading ? (
                    <div className="divide-y">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 animate-pulse">
                                {[...Array(5)].map((_, j) => <div key={j} className="h-5 bg-muted/50 rounded-lg" />)}
                                <div className="h-8 w-8 bg-muted/50 rounded-lg" />
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center">
                            <CreditCard className="w-9 h-9 text-muted-foreground/30" />
                        </div>
                        <p className="font-black italic uppercase tracking-tighter text-xl text-muted-foreground/40">
                            Aucun paiement
                        </p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {filtered.map((payment) => {
                            const order = typeof payment.order === 'object' ? payment.order as any : null;
                            const orderRef = order
                                ? (order.referenceUnique || order.reference || order.id || '—')
                                : (typeof payment.order === 'string' ? payment.order : '—');
                            const orderTotal = order?.totalAmount;
                            const currSymbol = payment.currency?.symbol || '$';
                            const paidSymbol = payment.paidCurrency?.symbol || currSymbol;

                            return (
                                <div
                                    key={payment.id}
                                    className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 items-center hover:bg-muted/20 transition-colors group cursor-pointer"
                                    onClick={() => navigate(`/payments/${payment.id}`)}
                                >
                                    {/* Commande */}
                                    <div>
                                        <p className="font-black text-sm">{orderRef}</p>
                                        {orderTotal != null && (
                                            <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                                                Total : {Number(orderTotal).toFixed(2)} {currSymbol}
                                            </p>
                                        )}
                                    </div>

                                    {/* Montant */}
                                    <div>
                                        <p className="font-black text-primary text-base">
                                            {parseFloat(payment.amount || '0').toFixed(2)} {currSymbol}
                                        </p>
                                        {payment.paidAmount && (
                                            <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                                                Payé : {parseFloat(payment.paidAmount).toFixed(2)} {paidSymbol}
                                            </p>
                                        )}
                                    </div>

                                    {/* Méthode */}
                                    <MethodPill method={payment.method as any} />

                                    {/* Statut */}
                                    <StatusPill status={payment.status as any} />

                                    {/* Date */}
                                    <p className="text-xs text-muted-foreground font-semibold">
                                        {(payment.paidAt || payment.createdAt)
                                            ? format(new Date(payment.paidAt || payment.createdAt), 'dd MMM yyyy HH:mm', { locale: fr })
                                            : '—'}
                                    </p>

                                    {/* Action */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-xl opacity-30 group-hover:opacity-100 transition-opacity hover:bg-primary/10 hover:text-primary"
                                        onClick={e => { e.stopPropagation(); navigate(`/payments/${payment.id}`); }}
                                    >
                                        <Eye className="w-4 h-4" />
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {total > pageSize && (
                    <>
                        <Separator />
                        <div className="flex items-center justify-between px-6 py-4">
                            <p className="text-xs font-bold text-muted-foreground">
                                Page {page + 1} / {totalPages} — {total} paiements
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9 rounded-xl"
                                    disabled={page === 0}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <div className="flex items-center gap-1">
                                    {[...Array(totalPages)].map((_, i) => (
                                        <Button
                                            key={i}
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                                "h-9 w-9 rounded-xl text-sm font-black",
                                                page === i && "bg-primary text-primary-foreground shadow-md"
                                            )}
                                            onClick={() => setPage(i)}
                                        >
                                            {i + 1}
                                        </Button>
                                    ))}
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9 rounded-xl"
                                    disabled={page + 1 >= totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
