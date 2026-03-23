import { useNavigate } from 'react-router-dom';
import { Order, OrderStatus } from '@/types/entities';
import { Card } from '@/components/ui/card';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Clock, Armchair, CheckCircle2, PlayCircle, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { usePlatformCurrency } from '@/hooks/usePlatformCurrency';
import RoleGuard from '@/components/shared/RoleGuard';
import { Permission } from '@/types/entities';

interface OrderCardProps {
    order: Order;
    onStatusChange?: (id: string, action: 'send_to_kitchen' | 'mark_ready' | 'mark_served' | 'cancel') => void;
    onClick?: (order: Order) => void;
    isTransitioning?: boolean;
}

const statusColorBar: Record<OrderStatus, string> = {
    D: '#F59E0B', // En attente -> Orange
    K: '#3B82F6', // En préparation -> Blue
    R: '#10B981', // Prête -> Emerald
    S: '#6B7280', // Servie -> Zinc/Gray
    C: '#EF4444', // Annulée -> Red
};

export function OrderCard({ order, onStatusChange, onClick, isTransitioning }: OrderCardProps) {
    const navigate = useNavigate();
    const { symbol: currSymbol } = usePlatformCurrency();

    const getStatusAction = () => {
        switch (order.status) {
            case 'D':
                return { label: 'En cuisine', action: 'send_to_kitchen' as const, icon: PlayCircle, color: 'bg-blue-500 hover:bg-blue-600', permission: 'ROLE_ORDER_SENT_TO_KITCHEN' as Permission };
            case 'K':
                return { label: 'Prête', action: 'mark_ready' as const, icon: CheckCircle2, color: 'bg-emerald-500 hover:bg-emerald-600', permission: 'ROLE_ORDER_AS_READY' as Permission };
            case 'R':
                return { label: 'Servir', action: 'mark_served' as const, icon: CheckCircle, color: 'bg-zinc-600 hover:bg-zinc-700', permission: 'ROLE_ORDER_AS_SERVED' as Permission };
            default:
                return null;
        }
    };

    const nextAction = getStatusAction();

    return (
        <Card
            className={cn(
                "group relative overflow-hidden transition-all duration-300",
                "hover:shadow-xl hover:-translate-y-1 cursor-pointer border-none shadow-sm rounded-2xl bg-card",
                "p-0"
            )}
            onClick={() => onClick ? onClick(order) : navigate(`/orders/${order.id}`)}
        >
            {/* Slim Vertical Status Bar */}
            <div
                className="absolute left-0 top-0 bottom-0 w-[4px] z-10"
                style={{ backgroundColor: statusColorBar[order.status] }}
            />

            <div className="p-4 pl-6 space-y-3">
                {/* 1️⃣ Header Row Refactored */}
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1.5">
                        <span className="font-medium text-[13px] text-muted-foreground tracking-tight leading-none">#{order.reference}</span>
                        <div className="flex items-center gap-2">
                            <StatusBadge status={order.status} type="order" className="w-fit rounded-full px-2 py-0 h-5 text-[10px] font-black uppercase tracking-wider border-none" />
                            {order.paymentStatus === 'S' && (
                                <Badge className="bg-purple-500 text-white border-none rounded-full px-2 py-0 h-5 text-[10px] font-black uppercase tracking-wider">Payée</Badge>
                            )}
                        </div>
                    </div>
                    <span className="font-semibold text-[17px] text-primary tracking-tight leading-none pt-0.5">
                        {order.totalAmount.toFixed(2)} {currSymbol}
                    </span>
                </div>

                {/* 2️⃣ Secondary Info Row (No minutes) */}
                <div className="flex items-center gap-2 text-[12px] text-muted-foreground font-medium">
                    <div className="flex items-center gap-1">
                        <Armchair className="w-3.5 h-3.5 opacity-60" />
                        <span>Table {order.table?.tableNumber || '-'}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 opacity-60" />
                        <span>{format(new Date(order.createdAt), 'HH:mm')}</span>
                    </div>
                </div>

                {/* 3️⃣ Footer / Actions */}
                <div className="flex items-center gap-2 pt-1">
                    {/* Secondary Action: View */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-[36px] w-[36px] rounded-xl hover:bg-muted text-muted-foreground"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClick ? onClick(order) : navigate(`/orders/${order.id}`);
                        }}
                    >
                        <Eye className="w-4 h-4" />
                    </Button>

                    {/* Primary Action Button */}
                    {nextAction && onStatusChange && (
                        <RoleGuard permissions={[nextAction.permission]}>
                            <Button
                                size="sm"
                                className={cn(
                                    "flex-1 h-[36px] px-3 gap-2 rounded-xl text-[12px] font-black uppercase tracking-wider shadow-sm transition-all",
                                    nextAction.color,
                                    "text-white border-none"
                                )}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onStatusChange(order.id, nextAction.action);
                                }}
                                disabled={isTransitioning}
                            >
                                <nextAction.icon className="w-4 h-4" />
                                {nextAction.label}
                            </Button>
                        </RoleGuard>
                    )}

                    {/* Cancel Action if needed */}
                    {(order.status === 'D' || order.status === 'K') && (
                        <RoleGuard permissions={['ROLE_ORDER_AS_CANCELLED']}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-[36px] w-[36px] text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onStatusChange?.(order.id, 'cancel');
                                }}
                                disabled={isTransitioning}
                            >
                                <XCircle className="w-4 h-4" />
                            </Button>
                        </RoleGuard>
                    )}
                </div>
            </div>

            {/* Subtle Hover Overlay */}
            <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/[0.02] transition-colors pointer-events-none" />
        </Card>
    );
}
