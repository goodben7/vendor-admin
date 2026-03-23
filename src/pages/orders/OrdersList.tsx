import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, RefreshCw, LayoutGrid, List, Kanban, Maximize2, Minimize2, Bell, TrendingUp } from 'lucide-react';
import { useOrders, useOrderStatusTransition } from '@/hooks/useOrders';
import { usePlatformTables } from '@/hooks/usePlatforms';
import { Order, OrderStatus, ORDER_STATUS_LABELS } from '@/types/entities';
import { OrderCard } from '@/components/orders/OrderCard';
import { OrderKanbanView } from '@/components/orders/OrderKanbanView';
import { OrderStats } from '@/components/orders/OrderStats';
import { OrderQuickView } from '@/components/orders/OrderQuickView';
import { CancelOrderDialog } from '@/components/orders/CancelOrderDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RoleGuard from '@/components/shared/RoleGuard';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function OrdersList() {
    const navigate = useNavigate();
    const [page, setPage] = useState(0);
    const [pageSize] = useState(12);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [tableFilter, setTableFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'kanban'>('kanban');
    const [isKitchenMode, setIsKitchenMode] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
    const lastOrderCountRef = useRef<number>(0);

    const { data, isLoading, refetch, isFetching } = useOrders({
        status: statusFilter === 'all' ? undefined : [statusFilter as OrderStatus],
        platformTable: tableFilter === 'all' ? undefined : tableFilter,
        search: searchTerm,
        page,
        pageSize: viewMode === 'kanban' ? 100 : pageSize // Load more for Kanban
    });

    const { data: tablesData } = usePlatformTables({ pageSize: 100 });
    const transitionMutation = useOrderStatusTransition();

    // Sound notification logic
    useEffect(() => {
        if (data?.data && data.data.length > lastOrderCountRef.current && lastOrderCountRef.current !== 0) {
            // New order detected!
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(() => { }); // Browser might block auto-play
            toast.info('Nouvelle commande reçue !', {
                icon: <Bell className="w-4 h-4 text-blue-500 animate-bounce" />,
                duration: 5000,
            });
        }
        if (data?.data) {
            lastOrderCountRef.current = data.data.length;
        }
    }, [data?.data]);

    // Auto-refresh every 15 seconds for more real-time feel
    useEffect(() => {
        const interval = setInterval(() => {
            refetch();
        }, 15000);
        return () => clearInterval(interval);
    }, [refetch]);

    const handleStatusTransition = (id: string, action: 'send_to_kitchen' | 'mark_ready' | 'mark_served' | 'cancel') => {
        if (action === 'cancel') {
            setOrderToCancel(id);
        } else {
            transitionMutation.mutate({ id, action });
        }
    };

    const handleCancelConfirm = (reason: string) => {
        if (orderToCancel) {
            transitionMutation.mutate({ id: orderToCancel, action: 'cancel', reason }, {
                onSuccess: () => setOrderToCancel(null)
            });
        }
    };

    const orders = data?.data || [];
    const activeOrdersCount = orders.filter(o => ['D', 'K', 'R'].includes(o.status)).length;

    // Sync with browser fullscreen state
    useEffect(() => {
        const onFullscreenChange = () => {
            if (!document.fullscreenElement && isKitchenMode) {
                setIsKitchenMode(false);
            }
        };
        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, [isKitchenMode]);

    const handleKitchenModeToggle = async () => {
        const nextMode = !isKitchenMode;
        
        if (nextMode) {
            try {
                await document.documentElement.requestFullscreen();
                setIsKitchenMode(true);
            } catch (err) {
                console.error("Error enabling fullscreen:", err);
                // Fallback to just state if fullscreen fails
                setIsKitchenMode(true);
            }
        } else {
            if (document.fullscreenElement) {
                await document.exitFullscreen().catch(() => {});
            }
            setIsKitchenMode(false);
        }
    };

    return (
        <div className={cn(
            "space-y-6 transition-all duration-500",
            isKitchenMode && "fixed inset-0 z-[100] bg-background p-8 overflow-auto animate-in fade-in zoom-in-95 duration-300"
        )}>
            {/* Top Toolbar / Mode Toggle */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    {isKitchenMode && (
                        <div className="bg-primary/10 px-4 py-2 rounded-2xl flex items-center gap-2 border border-primary/20">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                            </span>
                            <span className="font-black italic uppercase tracking-tighter text-lg">MODE CUISINE</span>
                        </div>
                    )}
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black italic tracking-tighter uppercase underline decoration-primary/30 underline-offset-8">
                                Commandes
                            </h1>
                            <div className="flex items-center gap-2 ml-4">
                                {isFetching && <RefreshCw className="w-4 h-4 animate-spin text-primary" />}
                                <Badge variant="outline" className="h-6 gap-1 bg-primary/5 border-primary/20 font-black">
                                    <TrendingUp className="w-3 h-3" />
                                    {activeOrdersCount} actives
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-muted p-1 rounded-xl flex border shadow-inner">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-9 px-3 gap-2 font-bold rounded-lg transition-all",
                                viewMode === 'kanban'
                                    ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => setViewMode('kanban')}
                        >
                            <Kanban className="w-4 h-4" />
                            <span className="hidden sm:inline italic">Kanban</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-9 px-3 gap-2 font-bold rounded-lg transition-all",
                                viewMode === 'grid'
                                    ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => setViewMode('grid')}
                        >
                            <LayoutGrid className="w-4 h-4" />
                            <span className="hidden sm:inline italic">Grille</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-9 px-3 gap-2 font-bold rounded-lg transition-all",
                                viewMode === 'list'
                                    ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => setViewMode('list')}
                        >
                            <List className="w-4 h-4" />
                            <span className="hidden sm:inline italic">Liste</span>
                        </Button>
                    </div>

                    <Button
                        variant="outline"
                        size="icon"
                        className={cn("h-11 w-11 rounded-xl shadow-sm transition-all", isKitchenMode ? "bg-primary text-primary-foreground border-primary" : "hover:bg-primary/5")}
                        onClick={handleKitchenModeToggle}
                        title={isKitchenMode ? "Quitter Plein Écran" : "Mode Cuisine Plein Écran"}
                    >
                        {isKitchenMode ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </Button>

                    {!isKitchenMode && (
                        <RoleGuard permissions={['ROLE_ORDER_CREATE']}>
                            <Button onClick={() => navigate('/orders/create')} className="h-11 gap-2 shadow-xl rounded-xl font-black italic uppercase tracking-tighter bg-primary hover:bg-primary/90">
                                <Plus className="w-5 h-5" />
                                Nouvelle
                            </Button>
                        </RoleGuard>
                    )}
                </div>
            </div>

            {/* Mini Dashboard */}
            {!isKitchenMode && (
                <div className="animate-in slide-in-from-top-4 duration-500 delay-150">
                    <OrderStats orders={orders} />
                </div>
            )}

            {/* Filters & Search */}
            <div className="bg-card border-none rounded-2xl p-5 shadow-xl flex flex-col md:flex-row gap-4 animate-in slide-in-from-top-6 duration-700">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
                    <Input
                        placeholder="Rechercher par référence, table..."
                        className="pl-11 h-12 bg-muted/30 border-none rounded-xl focus-visible:ring-primary shadow-inner"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px] h-12 rounded-xl bg-muted/30 border-none shadow-sm font-bold">
                                <SelectValue placeholder="Filtrer par Statut" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-none shadow-2xl">
                                <SelectItem value="all" className="font-bold">Tous les statuts</SelectItem>
                                {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                                    <SelectItem key={value} value={value} className="font-medium">{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Select value={tableFilter} onValueChange={(v) => { setTableFilter(v); setPage(0); }}>
                        <SelectTrigger className="w-[150px] h-12 rounded-xl bg-muted/30 border-none shadow-sm font-bold">
                            <SelectValue placeholder="Table" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-2xl">
                            <SelectItem value="all" className="font-bold">Toutes les tables</SelectItem>
                            {tablesData?.data.map((table) => (
                                <SelectItem key={table.id} value={table.id} className="font-medium italic">
                                    {(table as any).label || `Table ${table.tableNumber}` || table.id}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-12 w-12 rounded-xl hover:bg-primary/10 hover:text-primary transition-all shadow-sm"
                        onClick={() => refetch()}
                    >
                        <RefreshCw className={cn("w-5 h-5", isFetching && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="min-h-[500px]">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <LoadingSkeleton key={i} className="h-[250px] rounded-2xl" />
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-32 bg-muted/10 rounded-3xl border-2 border-dashed border-muted flex flex-col items-center justify-center animate-in zoom-in duration-500">
                        <div className="mx-auto w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center mb-6 shadow-inner ring-8 ring-muted/5">
                            <Search className="w-10 h-10 text-muted-foreground opacity-30" />
                        </div>
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter">Silence radio...</h3>
                        <p className="text-muted-foreground mt-2 max-w-xs mx-auto font-medium">
                            Aucune commande pour le moment. C'est peut-être le calme avant la tempête ?
                        </p>
                        <Button
                            variant="default"
                            className="mt-8 h-12 px-8 rounded-xl font-black italic uppercase tracking-widest shadow-xl"
                            onClick={() => {
                                setStatusFilter('all');
                                setTableFilter('all');
                                setSearchTerm('');
                            }}
                        >
                            Réinitialiser
                        </Button>
                    </div>
                ) : (
                    <>
                        {viewMode === 'kanban' ? (
                            <OrderKanbanView
                                orders={orders}
                                onStatusChange={handleStatusTransition}
                                onOrderClick={setSelectedOrder}
                                isTransitioning={transitionMutation.isPending}
                            />
                        ) : (
                            <div className={cn(
                                "animate-in fade-in duration-700",
                                viewMode === 'grid'
                                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
                                    : "space-y-3"
                            )}>
                                {orders.map((order) => (
                                    <OrderCard
                                        key={order.id}
                                        order={order}
                                        onStatusChange={handleStatusTransition}
                                        onClick={setSelectedOrder}
                                        isTransitioning={transitionMutation.isPending}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Pagination */}
            {!isKitchenMode && viewMode !== 'kanban' && data && (data.total ?? 0) > pageSize && (
                <div className="flex justify-center pt-12 pb-8">
                    <div className="flex items-center gap-1 bg-card border px-2 py-1.5 rounded-2xl shadow-xl">
                        <Button
                            variant="ghost"
                            className="h-10 px-4 font-bold border-none"
                            disabled={page === 0}
                            onClick={() => setPage(p => p - 1)}
                        >
                            Précédent
                        </Button>
                        <div className="flex items-center gap-1 px-4">
                            {[...Array(Math.ceil((data.total ?? 0) / pageSize))].map((_, i) => (
                                <Button
                                    key={i}
                                    variant={page === i ? 'default' : 'ghost'}
                                    size="sm"
                                    className={cn("h-8 w-8 p-0 rounded-lg font-black italic", page === i && "shadow-lg bg-primary text-primary-foreground")}
                                    onClick={() => setPage(i)}
                                >
                                    {i + 1}
                                </Button>
                            ))}
                        </div>
                        <Button
                            variant="ghost"
                            className="h-10 px-4 font-bold border-none"
                            disabled={(page + 1) * pageSize >= (data.total ?? 0)}
                            onClick={() => setPage(p => p + 1)}
                        >
                            Suivant
                        </Button>
                    </div>
                </div>
            )}

            {/* Global Quick View Drawer */}
            <OrderQuickView
                order={selectedOrder}
                isOpen={!!selectedOrder}
                onClose={() => setSelectedOrder(null)}
                onStatusChange={handleStatusTransition}
                isTransitioning={transitionMutation.isPending}
            />

            {/* Cancel Confirmation Dialog */}
            <CancelOrderDialog
                isOpen={!!orderToCancel}
                onClose={() => setOrderToCancel(null)}
                onConfirm={handleCancelConfirm}
                isPending={transitionMutation.isPending}
            />
        </div>
    );
}
