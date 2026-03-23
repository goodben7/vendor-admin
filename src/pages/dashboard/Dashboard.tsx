import React from 'react';
import { useOrders } from '@/hooks/useOrders';
import { usePayments } from '@/hooks/usePayments';
import { usePlatformCurrency } from '@/hooks/usePlatformCurrency';
import { ShoppingCart, CreditCard, TrendingUp, Clock, Package, Activity, RefreshCw, ArrowUpRight, CheckCircle2, XCircle, Wallet, Trophy, Star } from 'lucide-react';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useAllCategories, useProducts } from '@/hooks/useProducts';

// ── KPI Card Component ──────────────────────────────────────────
function KpiCard({
    label, value, sub, icon: Icon, iconBg, iconColor, valueCls = '', trend
}: {
    label: string;
    value: string | number;
    sub?: string;
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    valueCls?: string;
    trend?: { val: string; positive: boolean }
}) {
    return (
        <div className="relative overflow-hidden rounded-[2rem] bg-card border border-border/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col gap-4 group">
            <div className="flex items-center justify-between">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110", iconBg)}>
                    <Icon className={cn("w-6 h-6", iconColor)} />
                </div>
                {trend && (
                    <div className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter",
                        trend.positive ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"
                    )}>
                        <ArrowUpRight className={cn("w-3 h-3", !trend.positive && "rotate-90")} />
                        {trend.val}
                    </div>
                )}
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 leading-none mb-2">{label}</p>
                <div className="flex items-baseline gap-2">
                    <p className={cn("text-3xl font-black leading-none tracking-tighter", valueCls)}>{value}</p>
                </div>
                {sub && <p className="text-xs text-muted-foreground font-semibold mt-3 flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    <Activity className="w-3 h-3" />
                    {sub}
                </p>}
            </div>
            {/* Background design elements */}
            <div className={cn("absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-[0.03] group-hover:scale-150 transition-transform duration-700", iconBg)} />
        </div>
    );
}

// ── Progress Bar Component ──────────────────────────────────────
function StatRow({ label, value, total, color, icon: Icon }: { label: string, value: number, total: number, color: string, icon?: any }) {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
        <div className="group space-y-2">
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                    {Icon && <Icon className={cn("w-4 h-4", color.replace('bg-', 'text-'))} />}
                    <span className="font-bold text-muted-foreground/80 group-hover:text-foreground transition-colors">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-black">{value}</span>
                    <span className="text-[10px] text-muted-foreground/40 font-bold">({percentage.toFixed(0)}%)</span>
                </div>
            </div>
            <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden">
                <div
                    className={cn("h-full transition-all duration-1000 ease-out rounded-full", color)}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

export default function Dashboard() {
    const { data: ordersData, isLoading: ordersLoading, refetch: refetchOrders, isFetching: fetchingOrders } = useOrders({ page: 0, pageSize: 100 });
    const { data: paymentsData, isLoading: paymentsLoading, refetch: refetchPayments, isFetching: fetchingPayments } = usePayments({ page: 0, pageSize: 100 });
    const { data: categories = [] } = useAllCategories();
    const { data: productsData } = useProducts({ page: 0, pageSize: 200 }); // Master product list
    const { symbol: currSymbol } = usePlatformCurrency();

    const isRefreshing = fetchingOrders || fetchingPayments;

    if (ordersLoading || paymentsLoading) {
        return <LoadingSkeleton />;
    }

    const orders = ordersData?.data || [];
    const payments = paymentsData?.data || [];
    const allProducts = productsData?.data || [];

    // TOP PRODUCTS logic
    const productCounts = new Map<string, { name: string; count: number; revenue: number; category?: string; image?: string }>();
    
    // Master Lookups
    const catLookup = new Map<string, string>();
    categories.forEach(c => {
        const catName = c.label || c.name || '';
        if (c.id) catLookup.set(String(c.id), catName);
        if ((c as any)['@id']) catLookup.set(String((c as any)['@id']), catName);
    });

    const productMaster = new Map<string, any>();
    allProducts.forEach(p => {
        if (p.id) productMaster.set(String(p.id), p);
        if ((p as any)['@id']) productMaster.set(String((p as any)['@id']), p);
    });

    orders.forEach(order => {
        order.items?.forEach(item => {
            if (!item.product) return;
            const productId = String(item.product.id || 'unknown');
            const productRef = item.product as any;
            
            // Get full product data from master lookup if possible
            const master = productMaster.get(productId) || productMaster.get(productRef['@id']) || {};
            
            const productName = master.name || productRef.name || master.label || productRef.label || 'Produit inconnu';
            const productImage = master.contentUrl || master.imageUrl || productRef.imageUrl || productRef.contentUrl || master.image || productRef.image;
                               
            // Category resolution
            let categoryName = 'Standard';
            const catRaw = master.category || productRef.category;
            
            if (catRaw) {
                if (typeof catRaw === 'object') {
                    categoryName = catRaw.label || catRaw.name || 'Standard';
                } else {
                    const catKey = String(catRaw);
                    categoryName = catLookup.get(catKey) || 
                                  catLookup.get(catKey.split('/').pop() || '') || 
                                  'Standard';
                }
            }

            const existing = productCounts.get(productId);
            if (existing) {
                existing.count += item.quantity;
                existing.revenue += item.unitPrice * item.quantity;
            } else {
                productCounts.set(productId, {
                    name: productName,
                    count: item.quantity,
                    revenue: item.unitPrice * item.quantity,
                    category: categoryName,
                    image: productImage
                });
            }
        });
    });

    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => ['D', 'K', 'R'].includes(o.status)).length;
    const completedOrders = orders.filter(o => o.status === 'S').length;
    const canceledOrders = orders.filter(o => o.status === 'C').length;

    const totalRevenue = payments
        .filter(p => p.status === 'S')
        .reduce((sum, p) => sum + parseFloat(String(p.amount) || '0'), 0);

    const topProducts = Array.from(productCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    const handleRefresh = () => {
        refetchOrders();
        refetchPayments();
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-4xl font-black italic tracking-tighter uppercase underline decoration-primary/30 underline-offset-[12px]">
                            Tableau de Bord
                        </h1>
                        <Badge variant="outline" className="ml-2 uppercase tracking-widest text-[10px] font-black bg-primary/5 border-primary/20 text-primary">Live</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm font-medium mt-6 max-w-md leading-relaxed">
                        Bienvenue ! Voici un aperçu complet de la performance de votre restaurant en temps réel.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleRefresh}
                        className="h-12 w-12 rounded-2xl hover:bg-primary/5 border-border/50 shadow-sm active:scale-95 transition-all"
                    >
                        <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin text-primary")} />
                    </Button>
                </div>
            </div>

            {/* Main KPIs Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard
                    label="Volume Commandes"
                    value={totalOrders}
                    sub={`${completedOrders} servies aujourd'hui`}
                    icon={ShoppingCart}
                    iconBg="bg-blue-500/15"
                    iconColor="text-blue-600"
                    valueCls="text-blue-600"
                    trend={{ val: "+12%", positive: true }}
                />
                <KpiCard
                    label="Commandes en cours"
                    value={pendingOrders}
                    sub="À envoyer en cuisine"
                    icon={Clock}
                    iconBg="bg-orange-500/15"
                    iconColor="text-orange-600"
                    valueCls="text-orange-600"
                />
                <KpiCard
                    label="Chiffre d'Affaires"
                    value={`${totalRevenue.toLocaleString()} ${currSymbol}`}
                    sub={`${payments.filter(p => p.status === 'S').length} transactions`}
                    icon={CreditCard}
                    iconBg="bg-emerald-500/15"
                    iconColor="text-emerald-600"
                    valueCls="text-emerald-600"
                    trend={{ val: "+8.4%", positive: true }}
                />
                <KpiCard
                    label="Taux de Service"
                    value={totalOrders > 0 ? `${((completedOrders / totalOrders) * 100).toFixed(0)}%` : "0%"}
                    sub="Performance globale"
                    icon={TrendingUp}
                    iconBg="bg-violet-500/15"
                    iconColor="text-violet-600"
                    valueCls="text-violet-600"
                />
            </div>

            {/* Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Status Breakdown */}
                <div className="lg:col-span-1 p-8 rounded-[2.5rem] bg-card border border-border/40 shadow-sm flex flex-col gap-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h2 className="text-xl font-black uppercase tracking-tighter italic">Flux Commandes</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Répartition par statut</p>
                        </div>
                        <Activity className="w-5 h-5 text-primary opacity-50" />
                    </div>

                    <div className="space-y-6">
                        <StatRow label="En préparation" value={orders.filter(o => o.status === 'K').length} total={totalOrders} color="bg-orange-500" icon={Clock} />
                        <StatRow label="Prêt à servir" value={orders.filter(o => o.status === 'R').length} total={totalOrders} color="bg-blue-500" icon={Activity} />
                        <StatRow label="Terminées" value={completedOrders} total={totalOrders} color="bg-emerald-500" icon={CheckCircle2} />
                        <StatRow label="Annulées" value={canceledOrders} total={totalOrders} color="bg-destructive/60" icon={XCircle} />
                    </div>

                    <div className="mt-4 p-6 rounded-3xl bg-muted/20 border border-border/30 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Wallet className="w-4 h-4 text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Encaissements</span>
                        </div>
                        <StatRow label="Payés" value={orders.filter(o => o.paymentStatus === 'S').length} total={totalOrders} color="bg-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]" />
                        <StatRow label="En attente" value={orders.filter(o => o.paymentStatus === 'N' || !o.paymentStatus).length} total={totalOrders} color="bg-muted-foreground/30" />
                    </div>
                </div>

                {/* Recent Orders List */}
                <div className="lg:col-span-2 p-8 rounded-[2.5rem] bg-card border border-border/40 shadow-sm flex flex-col gap-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h2 className="text-xl font-black uppercase tracking-tighter italic">Commandes Récentes</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Flux d'activité en temps réel</p>
                        </div>
                        <Link to="/orders">
                            <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 gap-2">
                                Voir tout <ArrowUpRight className="w-3 h-3" />
                            </Button>
                        </Link>
                    </div>

                    {orders.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-16 text-muted-foreground bg-muted/10 rounded-[2rem] border border-dashed border-border">
                            <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                                <Package className="w-8 h-8 opacity-20" />
                            </div>
                            <p className="font-black uppercase tracking-widest text-xs">Aucune commande aujourd'hui</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.slice(0, 6).map((order) => {
                                const itemCount = order.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
                                return (
                                    <Link key={order.id} to={`/orders/${order.id}`} className="group flex items-center justify-between p-4 rounded-[1.5rem] hover:bg-muted/40 transition-all border border-transparent hover:border-border/50 hover:shadow-xl hover:shadow-black/5">
                                        <div className="flex items-center gap-5">
                                            {/* Table Name Badge */}
                                            <div className={cn(
                                                "min-w-[60px] px-4 py-2 rounded-xl flex items-center justify-center transition-all duration-300 border font-black text-sm uppercase tracking-tight whitespace-nowrap",
                                                order.status === 'S'
                                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 group-hover:bg-emerald-500/20"
                                                    : "bg-primary/10 text-primary border-primary/20 group-hover:bg-primary/20 shadow-sm"
                                            )}>
                                                {order.table?.label || order.table?.tableNumber || '??'}
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-sm text-foreground uppercase tracking-tight">{order.reference}</span>
                                                    <span className="text-[10px] text-muted-foreground/50 font-black">•</span>
                                                    <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                                                        {itemCount} {itemCount > 1 ? 'articles' : 'article'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border",
                                                        order.status === 'D' && "bg-slate-500/10 text-slate-600 border-slate-500/20",
                                                        order.status === 'K' && "bg-orange-500/10 text-orange-600 border-orange-500/20 animate-pulse",
                                                        order.status === 'R' && "bg-blue-500/10 text-blue-600 border-blue-500/20",
                                                        order.status === 'S' && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                                                        order.status === 'C' && "bg-destructive/10 text-destructive border-destructive/20"
                                                    )}>
                                                        {order.status === 'D' && 'Brouillon'}
                                                        {order.status === 'K' && 'En Cuisine'}
                                                        {order.status === 'R' && 'Prête'}
                                                        {order.status === 'S' && 'Servie'}
                                                        {order.status === 'C' && 'Annulée'}
                                                    </div>

                                                    {/* Time ago - mock if no createdAt for now, or use real if available */}
                                                    <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground opacity-60">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-right flex flex-col items-end">
                                                <p className="font-black text-lg text-foreground leading-none mb-1.5">{order.totalAmount.toFixed(2)} {currSymbol}</p>
                                                {order.paymentStatus === 'S' ? (
                                                    <div className="flex items-center gap-1 text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        <span className="text-[9px] font-black uppercase tracking-tighter">Payé</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-md border border-border/50">
                                                        <Clock className="w-3 h-3" />
                                                        <span className="text-[9px] font-black uppercase tracking-tighter italic">À régler</span>
                                                    </div>
                                                )}
                                            </div>
                                            <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted/40 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:bg-primary group-hover:text-white transition-all transform group-hover:translate-x-0 translate-x-4 shadow-lg shadow-primary/20">
                                                <ArrowUpRight className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>

            {/* Top Products Row */}
            <div className="p-8 rounded-[2.5rem] bg-card border border-border/40 shadow-sm flex flex-col gap-8">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-black uppercase tracking-tighter italic">Top 5 Ventes</h2>
                            <div className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest rounded-md border border-primary/20">Performance</div>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 text-wrap">Découvrez les produits qui génèrent le plus de succès</p>
                    </div>
                    <Trophy className="w-6 h-6 text-yellow-500 opacity-50 animate-bounce-subtle" />
                </div>

                {topProducts.length === 0 ? (
                    <div className="py-20 text-center text-muted-foreground bg-muted/10 rounded-[2rem] border border-dashed border-border/50">
                        <Package className="w-12 h-12 opacity-10 mx-auto mb-4" />
                        <p className="font-bold italic uppercase tracking-widest text-xs">Données de vente indisponibles</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        {topProducts.map((product, index) => {
                            const maxRevenue = Math.max(...topProducts.map(p => p.revenue));
                            const revenueShare = (product.revenue / maxRevenue) * 100;
                            
                            return (
                                <div key={index} className="relative group p-5 rounded-[2.5rem] bg-muted/30 border border-border/30 hover:bg-card hover:border-primary/30 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col gap-4 overflow-hidden">
                                    {/* Rank Number Badge */}
                                    <div className={cn(
                                        "absolute -top-2 -right-2 w-16 h-16 flex items-center justify-center font-black text-4xl italic opacity-5 group-hover:opacity-10 transition-all duration-700 pointer-events-none group-hover:scale-125 group-hover:-rotate-12",
                                        index === 0 ? "text-yellow-500" : "text-foreground"
                                    )}>
                                        {index + 1}
                                    </div>

                                    {/* Product Image / Placeholder */}
                                    <div className="relative aspect-square rounded-[1.5rem] bg-gradient-to-br from-muted/50 to-muted border border-border/50 overflow-hidden group-hover:scale-[1.02] transition-transform duration-500 shadow-inner">
                                        {product.image ? (
                                            <img 
                                                src={product.image} 
                                                alt={product.name}
                                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Package className="w-10 h-10 text-muted-foreground/20 group-hover:text-primary/20 transition-colors" />
                                            </div>
                                        )}
                                        
                                        {index === 0 && (
                                            <div className="absolute top-3 left-3 px-3 py-1 bg-yellow-400 text-black text-[9px] font-black uppercase tracking-wider rounded-full shadow-lg flex items-center gap-1.5 ring-4 ring-black/5 z-20">
                                                <Star className="w-3 h-3 fill-black" />
                                                Best Seller
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>

                                    <div className="space-y-3 z-10">
                                        <div>
                                            <p className="font-black text-xs uppercase tracking-tight line-clamp-1 group-hover:text-primary transition-colors">{product.name}</p>
                                            <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">{product.category || 'Standard'}</p>
                                        </div>

                                        <div className="space-y-2 pt-2 border-t border-border/50">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-wider">Quantité</span>
                                                <span className="text-sm font-black text-foreground">{product.count}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase text-emerald-600/60 tracking-wider">Revenus</span>
                                                <span className="text-sm font-black text-emerald-600">{product.revenue.toFixed(0)} {currSymbol}</span>
                                            </div>
                                            
                                            {/* Revenue Share Bar */}
                                            <div className="h-1.5 w-full bg-muted/50 rounded-full mt-2 overflow-hidden shadow-inner">
                                                <div 
                                                    className={cn(
                                                        "h-full rounded-full transition-all duration-1000 ease-out",
                                                        index === 0 ? "bg-yellow-400" : "bg-primary"
                                                    )}
                                                    style={{ width: `${revenueShare}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
