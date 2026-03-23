import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Order } from '@/types/entities';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, Armchair, Smartphone, ChevronRight, PlayCircle, CheckCircle2, CheckCircle, XCircle, Printer, Hash, ExternalLink, Banknote } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import StatusBadge from '@/components/shared/StatusBadge';
import { PaymentDialog } from '@/components/payments/PaymentDialog';
import { OrderTicketSheet } from './OrderTicketSheet';
import { usePlatformCurrency } from '@/hooks/usePlatformCurrency';

interface OrderQuickViewProps {
    order: Order | null;
    isOpen: boolean;
    onClose: () => void;
    onStatusChange: (id: string, action: 'send_to_kitchen' | 'mark_ready' | 'mark_served' | 'cancel') => void;
    isTransitioning: boolean;
}

export function OrderQuickView({ order, isOpen, onClose, onStatusChange, isTransitioning }: OrderQuickViewProps) {
    const navigate = useNavigate();
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [ticketOpen, setTicketOpen] = useState(false);
    const { symbol: currSymbol } = usePlatformCurrency();
    if (!order) return null;

    const totalItems = order.items.reduce((acc, i) => acc + i.quantity, 0);

    const handleAction = (action: 'send_to_kitchen' | 'mark_ready' | 'mark_served' | 'cancel') => {
        onStatusChange(order.id, action);
    };

    // Table: prefer label (e.g. "TABLE 2"), fallback to tableNumber
    const tableLabel = (order.table as any)?.label || order.table?.tableNumber || '—';
    // Tablet
    const tabletLabel = order.tablet?.label || order.tablet?.deviceId || 'Directe';

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="sm:max-w-md w-full p-0 flex flex-col gap-0 border-l-0 shadow-2xl">

                {/* ── HEADER ── */}
                <SheetHeader className="p-6 bg-muted/30 border-b relative">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-primary rounded-t-lg" />
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3 flex-wrap">
                                <SheetTitle className="text-xl font-black italic tracking-tighter uppercase">
                                    {order.reference}
                                </SheetTitle>
                                <StatusBadge status={order.status} type="order" />
                                {order.paymentStatus === 'S' && (
                                    <Badge className="bg-purple-500 text-white border-none rounded-full h-6 px-2 font-black italic text-[10px] uppercase tracking-wider">Payée</Badge>
                                )}
                                {(order.paymentStatus === 'N' || !order.paymentStatus) && (
                                    <Badge variant="outline" className="border-muted-foreground/20 text-muted-foreground rounded-full h-6 px-2 font-black italic text-[10px] uppercase tracking-wider">Impayée</Badge>
                                )}
                            </div>
                            <SheetDescription className="flex items-center gap-1.5 text-xs">
                                <Clock className="w-3.5 h-3.5" />
                                {format(new Date(order.createdAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                {/* ── BODY ── */}
                <div className="flex-1 px-6 overflow-auto">
                    <div className="py-6 space-y-6">

                        {/* Context chips */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-muted/50 p-3 rounded-2xl">
                                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1 mb-1">
                                    <Armchair className="w-3 h-3 text-primary" /> Table
                                </p>
                                <p className="font-black text-base leading-tight">{tableLabel}</p>
                            </div>
                            <div className="bg-muted/50 p-3 rounded-2xl">
                                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1 mb-1">
                                    <Smartphone className="w-3 h-3 text-primary" /> Source
                                </p>
                                <p className="font-bold text-sm truncate">{tabletLabel}</p>
                            </div>
                            <div className="bg-muted/50 p-3 rounded-2xl">
                                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1 mb-1">
                                    <Hash className="w-3 h-3 text-primary" /> Articles
                                </p>
                                <p className="font-black text-base">{totalItems}</p>
                            </div>
                        </div>

                        <Separator className="border-dashed border-muted-foreground/20" />

                        {/* Items */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                                Détail des articles
                            </h4>
                            <div className="space-y-3">
                                {order.items.map((item) => {
                                    const optionsTotal = item.options?.reduce((s, o) => s + (o.price || 0), 0) ?? 0;
                                    const lineTotal = (item.unitPrice + optionsTotal) * item.quantity;

                                    return (
                                        <div key={item.id} className="bg-muted/30 rounded-2xl p-4 space-y-2 border border-transparent hover:border-primary/10 transition-colors">
                                            <div className="flex justify-between items-start gap-3">
                                                <div className="flex gap-3 items-start">
                                                    <Badge className="h-6 w-6 p-0 flex items-center justify-center font-black bg-primary text-primary-foreground border-none shrink-0 text-xs">
                                                        {item.quantity}
                                                    </Badge>
                                                    <div>
                                                        <p className="font-black text-sm leading-tight">{item.product.name}</p>
                                                        <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                                                            {item.unitPrice.toFixed(2)} {currSymbol} / unité
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="font-black text-sm text-primary shrink-0">{lineTotal.toFixed(2)} {currSymbol}</p>
                                            </div>

                                            {/* Options */}
                                            {item.options && item.options.length > 0 && (
                                                <div className="pl-9 space-y-1 pt-1 border-t border-muted/50">
                                                    {item.options.map((opt) => (
                                                        <div key={opt.id} className="flex items-center justify-between">
                                                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                                <ChevronRight className="w-2.5 h-2.5 text-primary/50 shrink-0" />
                                                                {opt.name}
                                                            </p>
                                                            {opt.price > 0 && (
                                                                <span className="text-[10px] font-bold text-emerald-600">
                                                                    +{opt.price.toFixed(2)} {currSymbol}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <Separator className="border-dashed border-muted-foreground/20" />

                        {/* Total */}
                        <div className="flex justify-between items-center bg-primary/5 p-4 rounded-2xl border border-primary/10">
                            <span className="font-black italic uppercase tracking-tighter">Total</span>
                            <span className="text-3xl font-black text-primary">{order.totalAmount.toFixed(2)} {currSymbol}</span>
                        </div>
                    </div>
                </div>

                {/* ── FOOTER ACTIONS ── */}
                <SheetFooter className="p-6 bg-muted/20 border-t grid grid-cols-2 gap-3 sm:flex-col lg:grid-cols-2">
                    {order.status === 'D' && (
                        <Button
                            className="w-full h-12 gap-2 font-black uppercase text-xs tracking-widest bg-blue-600 hover:bg-blue-700 shadow-lg"
                            onClick={() => handleAction('send_to_kitchen')}
                            disabled={isTransitioning}
                        >
                            <PlayCircle className="w-4 h-4" /> Cuisine
                        </Button>
                    )}
                    {order.status === 'K' && (
                        <Button
                            className="w-full h-12 gap-2 font-black uppercase text-xs tracking-widest bg-emerald-600 hover:bg-emerald-700 shadow-lg"
                            onClick={() => handleAction('mark_ready')}
                            disabled={isTransitioning}
                        >
                            <CheckCircle2 className="w-4 h-4" /> Prête
                        </Button>
                    )}
                    {order.status === 'R' && (
                        <Button
                            className="w-full h-12 gap-2 font-black uppercase text-xs tracking-widest bg-zinc-800 hover:bg-zinc-900 shadow-lg"
                            onClick={() => handleAction('mark_served')}
                            disabled={isTransitioning}
                        >
                            <CheckCircle className="w-4 h-4" /> Servir
                        </Button>
                    )}

                    {order.status !== 'S' && order.status !== 'C' && (
                        <Button
                            variant="ghost"
                            className="w-full h-12 gap-2 font-bold text-destructive hover:bg-destructive/10"
                            onClick={() => handleAction('cancel')}
                            disabled={isTransitioning}
                        >
                            <XCircle className="w-4 h-4" /> Annuler
                        </Button>
                    )}

                    <Button variant="outline" className="w-full h-12 gap-2 font-bold" onClick={() => setTicketOpen(true)}>
                        <Printer className="w-4 h-4" /> Ticket
                    </Button>

                    {(order.paymentStatus === 'N' || order.paymentStatus === 'F' || !order.paymentStatus) && (
                        <Button
                            className="col-span-2 w-full h-12 gap-2 font-black uppercase tracking-widest text-xs bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20"
                            onClick={() => setPaymentOpen(true)}
                        >
                            <Banknote className="w-4 h-4" /> Encaisser la commande
                        </Button>
                    )}

                    <Button
                        variant="default"
                        className="col-span-2 w-full h-12 gap-2 font-black uppercase tracking-wider text-xs rounded-xl"
                        onClick={() => { onClose(); navigate(`/orders/${order.id}`); }}
                    >
                        <ExternalLink className="w-4 h-4" /> Voir le détail complet
                    </Button>
                </SheetFooter>

                {/* Direct Payment Dialog */}
                {order && (
                    <PaymentDialog
                        order={order}
                        isOpen={paymentOpen}
                        onClose={() => setPaymentOpen(false)}
                        onSuccess={() => { }}
                    />
                )}

                {/* Ticket Preview */}
                <OrderTicketSheet
                    order={order}
                    isOpen={ticketOpen}
                    onClose={() => setTicketOpen(false)}
                />
            </SheetContent>
        </Sheet>
    );
}
