import { useState, useEffect } from 'react';
import { useOrders, useOrderStatusTransition } from '@/hooks/useOrders';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Maximize, Minimize, Clock, UtensilsCrossed, CheckCircle2, RefreshCw, Armchair } from 'lucide-react';
import { Order, OrderItem } from '@/types/entities';
import { differenceInMinutes } from 'date-fns';

// ── Variables & Helpers ────────────────────────────────────────────────────────
const REFRESH_INTERVAL = 15000; // 15 secondes pour le fetch réseau
const TICKER_INTERVAL = 60000; // 1 min pour maj de l'affichage temps (il y a un interval local)

function getMinutesPassed(dateString: string) {
    if (!dateString) return 0;
    return differenceInMinutes(new Date(), new Date(dateString));
}

// ── Composant Ticket ─────────────────────────────────────────────────────────
function Ticket({ order, onAction, isPending }: { order: Order; onAction: (a: 'send_to_kitchen' | 'mark_ready') => void; isPending: boolean }) {
    const isNew = order.status === 'D';
    const minutesPassed = getMinutesPassed(order.createdAt);

    // Déterminer la couleur d'alerte selon l'attente
    let statusColor = 'bg-primary';
    let alertLabel = '';
    let alertClass = '';

    if (minutesPassed > 20) {
        statusColor = 'bg-red-500';
        alertLabel = 'RETARD';
        alertClass = 'border-red-500/50 shadow-red-500/10 bg-red-500/[0.02]';
    } else if (minutesPassed > 10) {
        statusColor = 'bg-amber-500';
        alertLabel = 'ATTENTE';
        alertClass = 'border-amber-500/50 shadow-amber-500/10 bg-amber-500/[0.02]';
    }

    return (
        <Card className={cn(
            "group relative overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-none shadow-lg rounded-3xl bg-card/80 backdrop-blur-sm",
            alertClass
        )}>
            {/* Slim Status Bar (inspired by OrderCard) */}
            <div className={cn("absolute left-0 top-0 bottom-0 w-[5px] z-10", statusColor)} />

            {/* Header */}
            <div className="p-5 pb-4 flex justify-between items-start">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="font-black text-xl tracking-tighter leading-none uppercase">#{order.reference}</span>
                        {alertLabel && (
                            <Badge className={cn("text-[8px] font-black tracking-widest px-1.5 py-0 border-none", statusColor, "text-white")}>
                                {alertLabel}
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 font-black uppercase tracking-widest text-[10px] text-muted-foreground/60">
                        {order.table?.tableNumber ? (
                            <div className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-md">
                                <Armchair className="w-3 h-3" /> Table {order.table.tableNumber}
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-md text-primary">
                                <span className="w-1 h-1 rounded-full bg-primary" /> À emporter
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-end">
                    <div className={cn(
                        "flex items-center gap-1 p-2 rounded-2xl font-black text-xs transition-colors shadow-sm",
                        minutesPassed > 20 ? "bg-red-500 text-white" : minutesPassed > 10 ? "bg-amber-500 text-white" : "bg-muted text-foreground"
                    )}>
                        <Clock className="w-3.5 h-3.5" />
                        {minutesPassed} <span className="opacity-70">MIN</span>
                    </div>
                </div>
            </div>

            {/* Articles List */}
            <div className="px-5 py-2 space-y-3 flex-1 overflow-hidden">
                {order.items.map((item: OrderItem, idx) => (
                    <div key={idx} className="flex gap-4 p-3 rounded-2xl bg-muted/40 group-hover:bg-muted/60 transition-colors border border-border/10">
                        <div className="flex flex-col items-center gap-1">
                            <span className="font-black text-lg w-10 h-10 rounded-xl bg-primary shadow-lg shadow-primary/20 text-primary-foreground flex items-center justify-center shrink-0 transform group-hover:scale-110 transition-transform">
                                {item.quantity}
                            </span>
                        </div>
                        <div className="flex-1 pt-0.5">
                            <h4 className="font-black text-base leading-tight uppercase tracking-tight tracking-tighter italic">
                                {item.product?.name || 'Produit inconnu'}
                            </h4>
                            {item.options && item.options.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {item.options.map((opt, oIdx) => (
                                        <Badge key={oIdx} variant="outline" className="text-[9px] font-black uppercase tracking-widest py-0 px-2 bg-background/50 border-border/40 text-muted-foreground">
                                            + {opt.name}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Action */}
            <div className="p-5 pt-4 mt-auto">
                <Button
                    onClick={() => onAction(isNew ? 'send_to_kitchen' : 'mark_ready')}
                    disabled={isPending}
                    className={cn(
                        "w-full h-14 font-black italic uppercase tracking-widest text-sm gap-3 shadow-xl transition-all rounded-[1.25rem] group/btn",
                        isNew
                            ? "bg-zinc-900 hover:bg-black text-white"
                            : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                    )}
                >
                    {isPending ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : isNew ? (
                        <>
                            <UtensilsCrossed className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />
                            Préparer
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="w-6 h-6 group-hover/btn:scale-125 transition-transform" />
                            Prêt à servir
                        </>
                    )}
                </Button>
            </div>

            {/* Subtle Texture/Glare */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />
        </Card>
    );
}

// ── Composant Principal ──────────────────────────────────────────────────────
export default function KitchenDisplay() {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Auto-refresh via query fetching + interval de maj UI locale
    const { data: ordersData, refetch, isFetching } = useOrders({
        status: ['D', 'K'],
        page: 0,
        pageSize: 150
    });
    const transitionMutation = useOrderStatusTransition();

    useEffect(() => {
        const fetchInterval = setInterval(() => { refetch(); }, REFRESH_INTERVAL);
        const tickInterval = setInterval(() => { setCurrentTime(new Date()); }, TICKER_INTERVAL);
        return () => { clearInterval(fetchInterval); clearInterval(tickInterval); };
    }, [refetch]);

    const handleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    useEffect(() => {
        const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, []);

    const newOrders = (ordersData?.data || []).filter(o => o.status === 'D').sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const cookingOrders = (ordersData?.data || []).filter(o => o.status === 'K').sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const handleAction = (id: string, action: 'send_to_kitchen' | 'mark_ready') => {
        transitionMutation.mutate({ id, action });
    };

    return (
        <div className={cn(
            "flex flex-col bg-background transition-all duration-500",
            isFullscreen
                ? "fixed inset-0 z-[100] h-screen w-screen p-8 animate-in fade-in zoom-in-95 duration-300 overflow-auto"
                : "h-[calc(100vh-8rem)]"
        )}>
            {/* Header KDS Refactored to match Orders page style */}
            <div className="flex flex-wrap items-center justify-between mb-8 shrink-0 gap-4">
                <div className="flex items-center gap-6">
                    {isFullscreen && (
                        <div className="bg-primary/10 px-4 py-2 rounded-2xl flex items-center gap-2 border border-primary/20 animate-pulse">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                            </span>
                            <span className="font-black italic uppercase tracking-tighter text-lg text-primary">LIVE CUISINE</span>
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary shadow-xl shadow-primary/20 flex items-center justify-center text-primary-foreground transform -rotate-3 transition-transform hover:rotate-0 duration-300">
                            <UtensilsCrossed className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black italic tracking-tighter uppercase leading-none underline decoration-primary/30 underline-offset-8">
                                Écran Cuisine
                            </h1>
                            <div className="flex items-center gap-3 mt-3">
                                <p className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 uppercase tracking-widest bg-muted/50 px-2 py-0.5 rounded-lg">
                                    <Clock className="w-3.5 h-3.5" />
                                    {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                {isFetching && (
                                    <div className="flex items-center gap-2">
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Mise à jour...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => refetch()}
                        className="w-12 h-12 rounded-xl shadow-sm border-border/50 hover:bg-primary/5 transition-all"
                        disabled={isFetching}
                    >
                        <RefreshCw className={cn("w-5 h-5", isFetching && "animate-spin text-primary")} />
                    </Button>
                    <Button
                        variant="default"
                        onClick={handleFullscreen}
                        className={cn(
                            "h-12 px-6 rounded-xl shadow-xl font-black italic uppercase tracking-widest gap-2 transition-all",
                            isFullscreen ? "bg-zinc-800 hover:bg-zinc-900" : "bg-primary hover:bg-primary/90"
                        )}
                    >
                        {isFullscreen ? (
                            <>
                                <Minimize className="w-5 h-5" />
                                <span className="hidden sm:inline">Quitter</span>
                            </>
                        ) : (
                            <>
                                <Maximize className="w-5 h-5" />
                                <span className="hidden sm:inline">Plein Écran</span>
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-hidden">

                {/* Column: À PRÉPARER (D) */}
                <div className="flex flex-col rounded-[2rem] bg-muted/20 border border-border/40 p-2 overflow-hidden shadow-inner">
                    <div className="p-6 shrink-0 flex justify-between items-center bg-card/40 rounded-t-[1.5rem] mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] animate-pulse" />
                            <h2 className="font-black uppercase tracking-[0.2em] text-xs text-amber-600">Nouvelles commandes</h2>
                        </div>
                        <span className="bg-amber-500/10 text-amber-600 text-sm font-black px-3 py-1 rounded-full border border-amber-500/20">
                            {newOrders.length}
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
                        {newOrders.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 pb-10">
                                <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                                    <CheckCircle2 className="w-10 h-10 opacity-20" />
                                </div>
                                <p className="font-black uppercase tracking-widest text-xs italic">Cuisine à jour</p>
                            </div>
                        ) : (
                            newOrders.map(order => (
                                <Ticket
                                    key={order.id}
                                    order={order}
                                    onAction={(action) => handleAction(order.id, action)}
                                    isPending={transitionMutation.isPending && transitionMutation.variables?.id === order.id}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Column: EN PRÉPARATION (K) */}
                <div className="flex flex-col rounded-[2rem] bg-primary/[0.03] border border-primary/20 p-2 overflow-hidden shadow-inner">
                    <div className="p-6 shrink-0 flex justify-between items-center bg-card/40 rounded-t-[1.5rem] mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-pulse" />
                            <h2 className="font-black uppercase tracking-[0.2em] text-xs text-primary">En préparation</h2>
                        </div>
                        <span className="bg-primary/10 text-primary text-sm font-black px-3 py-1 rounded-full border border-primary/20">
                            {cookingOrders.length}
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
                        {cookingOrders.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-primary/20 pb-10">
                                <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                                    <UtensilsCrossed className="w-10 h-10 opacity-20" />
                                </div>
                                <p className="font-black uppercase tracking-widest text-xs italic">Prêt pour le rush</p>
                            </div>
                        ) : (
                            cookingOrders.map(order => (
                                <Ticket
                                    key={order.id}
                                    order={order}
                                    onAction={(action) => handleAction(order.id, action)}
                                    isPending={transitionMutation.isPending && transitionMutation.variables?.id === order.id}
                                />
                            ))
                        )}
                    </div>
                </div>

            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 10px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(var(--primary-rgb), 0.1); border-radius: 20px; border: 3px solid transparent; background-clip: content-box; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(var(--primary-rgb), 0.2); }
                .no-scrollbar::-webkit-scrollbar { display: none; }
            `}} />
        </div>
    );
}
