import { Order, OrderStatus } from '@/types/entities';
import { OrderCard } from './OrderCard';
import { cn } from '@/lib/utils';
import { PlayCircle, CheckCircle2, CheckCircle, Clock } from 'lucide-react';

interface OrderKanbanViewProps {
    orders: Order[];
    onStatusChange: (id: string, action: 'send_to_kitchen' | 'mark_ready' | 'mark_served' | 'cancel') => void;
    onOrderClick: (order: Order) => void;
    isTransitioning: boolean;
}

const KANBAN_COLUMNS: { status: OrderStatus; label: string; icon: any; color: string }[] = [
    { status: 'D', label: 'En attente', icon: Clock, color: 'text-amber-500' },
    { status: 'K', label: 'En préparation', icon: PlayCircle, color: 'text-blue-500' },
    { status: 'R', label: 'Prête', icon: CheckCircle2, color: 'text-emerald-500' },
    { status: 'S', label: 'Servie', icon: CheckCircle, color: 'text-zinc-500' },
];

export function OrderKanbanView({ orders, onStatusChange, onOrderClick, isTransitioning }: OrderKanbanViewProps) {
    const getOrdersByStatus = (status: OrderStatus) => {
        return orders.filter(o => o.status === status);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[calc(100vh-250px)]">
            {KANBAN_COLUMNS.map((col) => {
                const columnOrders = getOrdersByStatus(col.status);

                return (
                    <div key={col.status} className="flex flex-col gap-4">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <col.icon className={cn("w-5 h-5", col.color)} />
                                <h3 className="font-black uppercase tracking-tight text-sm italic">{col.label}</h3>
                            </div>
                            <span className="bg-muted px-2 py-0.5 rounded-full text-[10px] font-black">
                                {columnOrders.length}
                            </span>
                        </div>

                        <div className="flex-1 kanban-column overflow-y-auto max-h-[calc(100vh-300px)] scrollbar-hide">
                            <div className="flex flex-col gap-4">
                                {columnOrders.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 opacity-20 filter grayscale">
                                        <col.icon className="w-12 h-12 mb-2" />
                                        <p className="text-xs font-bold uppercase tracking-widest">Vide</p>
                                    </div>
                                ) : (
                                    columnOrders.map((order) => (
                                        <OrderCard
                                            key={order.id}
                                            order={order}
                                            onStatusChange={onStatusChange}
                                            onClick={onOrderClick}
                                            isTransitioning={isTransitioning}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
