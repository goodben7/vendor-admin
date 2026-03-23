import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Order } from '@/types/entities';
import { Printer, X, MapPin, Phone, QrCode } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { usePlatformCurrency } from '@/hooks/usePlatformCurrency';
import CurrencyConversionTicker from '@/components/shared/CurrencyConversionTicker';
import { useCurrencies } from '@/hooks/useCurrencies';

// ── Animated Total Component ─────────────────────────────────────────────
function AnimatedTotal({ value, currency }: { value: number; currency: string }) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let start = 0;
        const end = value;
        const duration = 1000;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = progress * (end - start) + start;
            setDisplayValue(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [value]);

    return (
        <span className="text-3xl font-black tracking-tighter tabular-nums antialiased">
            {displayValue.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xl ml-1">{currency}</span>
        </span>
    );
}

interface OrderTicketSheetProps {
    order: Order | null;
    isOpen: boolean;
    onClose: () => void;
}

export function OrderTicketSheet({ order, isOpen, onClose }: OrderTicketSheetProps) {
    const { symbol: platformSymbol, code: platformCode, platform } = usePlatformCurrency();
    const { data: currenciesData } = useCurrencies();
    // Filter secondary active currencies (different from platform currency)
    const currencies = (currenciesData?.data || [])
        .filter(c => c.active && c.code !== platformCode);

    // Set first secondary currency as default for preview (using ID)
    const [targetCurrencyId, setTargetCurrencyId] = useState<string | null>(null);
    const activeTargetCurrencyId = targetCurrencyId || currencies[0]?.id;
    const selectedCurrency = currencies.find(c => c.id === activeTargetCurrencyId);

    if (!order) return null;

    const handlePrint = () => {
        const printContent = document.getElementById('printable-ticket');
        if (!printContent) return;

        const printWindow = window.open('', '_blank', 'width=800,height=900');
        if (!printWindow) return;

        // Collect all styles from the current document
        const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
            .map(style => style.outerHTML)
            .join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Impression Ticket - ${order.reference}</title>
                    ${styles}
                    <style>
                        @page {
                            margin: 0;
                        }
                        @media print {
                            body { background: white !important; margin: 0; padding: 20mm; }
                            .receipt-paper { 
                                box-shadow: none !important; 
                                border: 1px solid #eee !important;
                                margin: 0 auto !important;
                                width: 100% !important;
                                max-width: 400px !important;
                            }
                        }
                        body { 
                            font-family: sans-serif; 
                            display: flex; 
                            justify-content: center; 
                            padding: 20px;
                            background: #f4f4f5;
                        }
                    </style>
                </head>
                <body>
                    <div style="width: 100%; max-width: 400px;">
                        ${printContent.outerHTML}
                    </div>
                    <script>
                        window.onload = () => {
                            setTimeout(() => {
                                window.print();
                                window.close();
                            }, 500);
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="sm:max-w-md w-full p-0 flex flex-col gap-0 border-l-0 shadow-2xl bg-black/5 backdrop-blur-xl border-white/10 overflow-hidden">
                {/* 1. Modern Structured Header */}
                <SheetHeader className="p-8 bg-background/50 border-b border-white/10 sticky top-0 z-20 backdrop-blur-md">
                    <div className="flex justify-between items-center">
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 leading-none">Ticket de caisse</p>
                            <SheetTitle className="text-2xl font-black italic tracking-tighter uppercase leading-none pt-1">
                                Commande <span className="font-light text-muted-foreground/40 font-mono">#{order.reference.slice(-6)}</span>
                            </SheetTitle>
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-white/10" onClick={onClose}>
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                    {/* 2. Premium Receipt Card (Paper Effect) */}
                    <div id="printable-ticket" className="receipt-paper relative bg-white text-zinc-900 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-8 flex flex-col items-center gap-8 overflow-hidden group">

                        {/* Perforated edge at top (Premium version) */}
                        <div className="absolute top-0 left-0 right-0 h-4 flex gap-1 justify-center translate-y-[-50%] z-10">
                            {Array.from({ length: 30 }).map((_, i) => (
                                <div key={i} className="w-2.5 h-2.5 bg-background rounded-full shrink-0" />
                            ))}
                        </div>

                        {/* Subtle paper grain texture overlay */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />

                        {/* 3. Restaurant Information (Centered & Typed) */}
                        <div className="text-center space-y-3 z-10 w-full">
                            <h2 className="text-2xl font-black uppercase tracking-tighter leading-tight italic">
                                {platform?.name || 'Gourmet Bistro'}
                            </h2>
                            <div className="flex flex-col items-center gap-1.5 opacity-60">
                                <p className="text-[10px] font-bold flex items-center gap-2">
                                    <MapPin className="w-3 h-3" />
                                    {platform?.address || '123 Avenue des Champs-Élysées, Paris'}
                                </p>
                                <p className="text-[10px] font-bold tracking-widest flex items-center gap-2 font-mono">
                                    <Phone className="w-3 h-3" />
                                    {platform?.phone || '+33 1 23 45 67 89'}
                                </p>
                            </div>
                        </div>

                        <div className="w-full h-px bg-zinc-200/50 border-t border-dashed z-10" />

                        {/* 4. Order Meta Info Clean Grid */}
                        <div className="w-full grid grid-cols-2 gap-y-6 text-[10px] z-10">
                            <div className="space-y-1">
                                <p className="font-black uppercase tracking-[0.2em] text-zinc-600">Référence</p>
                                <p className="text-sm font-black italic underline decoration-zinc-200 underline-offset-4">{order.reference}</p>
                            </div>
                            <div className="space-y-1 text-right">
                                <p className="font-black uppercase tracking-[0.2em] text-zinc-600">Date & Heure</p>
                                <p className="text-sm font-bold uppercase">{format(new Date(order.createdAt), 'dd MMM yyyy · HH:mm', { locale: fr })}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="font-black uppercase tracking-[0.2em] text-zinc-600">Service</p>
                                <p className="text-sm font-black uppercase text-primary">{(order.table as any)?.label || order.table?.tableNumber || 'À Emporter'}</p>
                            </div>
                            <div className="space-y-1 text-right">
                                <p className="font-black uppercase tracking-[0.2em] text-zinc-600">Statut</p>
                                <p className="text-sm font-black uppercase tracking-tighter">Payé</p>
                            </div>
                        </div>

                        <div className="w-full h-px bg-zinc-200/50 border-t z-10" />

                        {/* 5. Modernized Items List */}
                        <div className="w-full space-y-6 z-10">
                            {order.items.map((item) => {
                                const total = (item.unitPrice + (item.options?.reduce((s, o) => s + (o.price || 0), 0) ?? 0)) * item.quantity;
                                return (
                                    <div key={item.id} className="group/item">
                                        <div className="flex justify-between items-center gap-4">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="w-7 h-7 bg-zinc-100 rounded-lg flex items-center justify-center shrink-0">
                                                    <span className="text-[10px] font-black">{item.quantity}</span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold truncate leading-tight">{item.product.name}</p>
                                                    <p className="text-[9px] font-bold text-zinc-600">{item.unitPrice.toFixed(2)} {platformSymbol}/u</p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-black italic tracking-tighter">{total.toFixed(2)} {platformSymbol}</span>
                                        </div>
                                        {/* Extras indented */}
                                        {item.options?.length > 0 && (
                                            <div className="mt-2 ml-10 space-y-1">
                                                {item.options.map((opt) => (
                                                    <div key={opt.id} className="flex justify-between items-center text-[10px] text-zinc-700 font-bold italic">
                                                        <span>+ {opt.name}</span>
                                                        {opt.price > 0 && <span className="text-zinc-500">+{opt.price.toFixed(2)}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="w-full h-[2px] bg-zinc-100 z-10" />

                        {/* 6. Dominant Total Section */}
                        <div className="w-full z-10">
                            <div className="flex justify-between items-end">
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Total à payer</p>
                                </div>
                                <div className="text-right">
                                    <AnimatedTotal value={order.totalAmount} currency={platformSymbol} />
                                </div>
                            </div>
                        </div>

                        {/* 7. Footer QR Code & Verifier */}
                        <div className="w-full pt-10 pb-4 text-center space-y-6 z-10 flex flex-col items-center">
                            <div className="p-2 border-2 border-zinc-100 rounded-3xl opacity-80 hover:opacity-100 transition-opacity">
                                <QrCode className="w-16 h-16 text-zinc-200" strokeWidth={1} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-500 italic">Merci de votre visite</p>
                                <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Scanner pour vérifier la transaction</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-md rounded-3xl p-5 border border-white/5 space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Aperçu FOREX</h4>
                            {currencies.length > 1 && (
                                <select
                                    className="bg-primary/10 text-[9px] font-black uppercase tracking-widest text-primary outline-none px-2 py-1 rounded-lg cursor-pointer"
                                    value={activeTargetCurrencyId || ''}
                                    onChange={(e) => setTargetCurrencyId(e.target.value)}
                                >
                                    {currencies.map(c => (
                                        <option key={c.id} value={c.id} className="bg-zinc-900">{c.code}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {activeTargetCurrencyId && selectedCurrency && (
                            <CurrencyConversionTicker
                                orderId={order.id}
                                targetCurrencyId={activeTargetCurrencyId}
                                amount={order.totalAmount}
                                fromCurrency={platformCode}
                                toCurrency={selectedCurrency.code}
                            />
                        )}
                    </div>
                </div>

                {/* 8. Bouton d'action principal */}
                <div className="p-8 bg-background/50 border-t border-white/10 sticky bottom-0 backdrop-blur-xl">
                    <Button
                        className="w-full h-16 rounded-[1.5rem] gap-3 font-black uppercase tracking-[0.2em] text-sm bg-zinc-900 text-white shadow-2xl shadow-zinc-900/20 hover:shadow-none transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]"
                        onClick={handlePrint}
                    >
                        <Printer className="w-5 h-5" /> Imprimer le ticket
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
