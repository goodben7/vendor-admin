import { Order } from '@/types/entities';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingBag, TrendingUp, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlatformCurrency } from '@/hooks/usePlatformCurrency';

interface OrderStatsProps {
    orders: Order[];
    className?: string;
}

export function OrderStats({ orders, className }: OrderStatsProps) {
    const { symbol: currSymbol } = usePlatformCurrency();
    const activeOrders = orders.filter(o => ['D', 'K', 'R'].includes(o.status)).length;
    const totalRevenue = orders.reduce((acc, o) => acc + o.totalAmount, 0);
    const completedOrders = orders.filter(o => o.status === 'S' || o.paymentStatus === 'S').length;

    const stats = [
        { label: 'Actives', value: activeOrders, icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Revenue', value: `${totalRevenue.toFixed(0)} ${currSymbol}`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: 'Prêtes', value: completedOrders, icon: CheckCircle2, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    ];

    return (
        <Card className={cn("rounded-2xl border-none shadow-xl bg-card/50 backdrop-blur-xl overflow-hidden", className)}>
            <CardContent className="p-0">
                <div className="flex flex-wrap md:flex-nowrap divide-x divide-muted/20">
                    {stats.map((stat, i) => (
                        <div key={i} className="flex-1 min-w-[120px] p-4 flex items-center justify-center gap-3 hover:bg-muted/30 transition-colors group cursor-default">
                            <div className={cn("p-2 rounded-xl transition-transform group-hover:scale-110", stat.bg)}>
                                <stat.icon className={cn("w-4 h-4", stat.color)} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1 opacity-60">
                                    {stat.label}
                                </span>
                                <span className="text-xl font-black italic tracking-tighter leading-none">
                                    {stat.value}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
