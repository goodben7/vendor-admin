import { useState, useEffect } from 'react';
import { useCreateCurrency, useUpdateCurrency } from '@/hooks/useCurrencies';
import { Currency } from '@/types/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Coins, Save, X, Info, Star } from 'lucide-react';

interface CurrencyFormSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currency?: Currency | null;
}

const DEFAULT_FORM = {
    code: '',
    label: '',
    symbol: '',
    active: true,
    isDefault: false,
};

export default function CurrencyFormSheet({ open, onOpenChange, currency }: CurrencyFormSheetProps) {
    const createMutation = useCreateCurrency();
    const updateMutation = useUpdateCurrency();
    const [formData, setFormData] = useState(DEFAULT_FORM);

    useEffect(() => {
        if (currency) {
            setFormData({
                code: currency.code,
                label: currency.label,
                symbol: currency.symbol,
                active: currency.active,
                isDefault: currency.isDefault,
            });
        } else if (open) {
            setFormData(DEFAULT_FORM);
        }
    }, [currency, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = { ...formData, code: formData.code.toUpperCase() };
            if (currency) {
                await updateMutation.mutateAsync({ id: currency.id, data: payload });
            } else {
                await createMutation.mutateAsync(payload);
            }
            onOpenChange(false);
        } catch {
            // handled by mutation
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;
    const isFormValid = formData.code.trim() && formData.label.trim() && formData.symbol.trim();

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-lg p-0 border-none rounded-l-[2.5rem] overflow-hidden bg-background">
                <div className="flex flex-col h-full bg-gradient-to-b from-card/50 to-background">
                    {/* Header */}
                    <SheetHeader className="p-8 pb-6 border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Coins className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <SheetTitle className="text-2xl font-black tracking-tight">
                                    {currency ? 'Modifier la devise' : 'Nouvelle devise'}
                                </SheetTitle>
                                <SheetDescription className="font-bold text-muted-foreground/60">
                                    {currency ? 'Modifiez les informations de la devise' : 'Ajoutez une nouvelle devise à votre plateforme'}
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto no-scrollbar">
                        <div className="p-8 space-y-10 pb-32">
                            {/* Info banner */}
                            <div className="bg-primary/5 rounded-2xl p-4 flex gap-3 border border-primary/10">
                                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <p className="text-xs font-bold text-primary/80 leading-relaxed">
                                    Le code devise (ex: EUR, USD) sera automatiquement mis en majuscules.
                                </p>
                            </div>

                            {/* Identité */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-2 px-1">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Identité</h3>
                                    <div className="h-px bg-gradient-to-r from-primary/20 to-transparent flex-1" />
                                </div>
                                <div className="grid gap-5">
                                    {/* Code */}
                                    <div className="space-y-2">
                                        <Label htmlFor="code" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">
                                            Code ISO *
                                        </Label>
                                        <Input
                                            id="code"
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            placeholder="EUR, USD, XOF..."
                                            required
                                            maxLength={10}
                                            className="h-12 rounded-xl bg-background/50 border-border/50 font-black uppercase placeholder:normal-case placeholder:font-medium focus-visible:ring-primary/20"
                                        />
                                    </div>

                                    {/* Label */}
                                    <div className="space-y-2">
                                        <Label htmlFor="label" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">
                                            Nom complet *
                                        </Label>
                                        <Input
                                            id="label"
                                            value={formData.label}
                                            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                            placeholder="Euro, Dollar américain..."
                                            required
                                            className="h-12 rounded-xl bg-background/50 border-border/50 font-bold placeholder:font-medium focus-visible:ring-primary/20"
                                        />
                                    </div>

                                    {/* Symbol */}
                                    <div className="space-y-2">
                                        <Label htmlFor="symbol" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">
                                            Symbole *
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="symbol"
                                                value={formData.symbol}
                                                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                                                placeholder="€, $, ₣..."
                                                required
                                                maxLength={5}
                                                className="h-12 rounded-xl bg-background/50 border-border/50 font-black text-lg focus-visible:ring-primary/20 pr-16"
                                            />
                                            {formData.symbol && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-lg">
                                                    {formData.symbol}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <Separator className="opacity-50" />

                            {/* Options */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 px-1">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Options</h3>
                                    <div className="h-px bg-gradient-to-r from-primary/20 to-transparent flex-1" />
                                </div>

                                {/* Active toggle */}
                                <div
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer",
                                        formData.active ? "bg-emerald-500/5 border-emerald-500/20" : "bg-muted/40 border-border/40"
                                    )}
                                    onClick={() => setFormData({ ...formData, active: !formData.active })}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            formData.active ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/30"
                                        )} />
                                        <Label className="font-black uppercase tracking-widest text-[10px] cursor-pointer">Devise active</Label>
                                    </div>
                                    <div className={cn(
                                        "w-12 h-6 rounded-full p-1 transition-colors duration-300",
                                        formData.active ? "bg-emerald-500" : "bg-muted-foreground/20"
                                    )}>
                                        <div className={cn(
                                            "w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm",
                                            formData.active ? "translate-x-6" : "translate-x-0"
                                        )} />
                                    </div>
                                </div>

                                {/* isDefault toggle */}
                                <div
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer",
                                        formData.isDefault ? "bg-amber-500/5 border-amber-500/20" : "bg-muted/40 border-border/40"
                                    )}
                                    onClick={() => setFormData({ ...formData, isDefault: !formData.isDefault })}
                                >
                                    <div className="flex items-center gap-3">
                                        <Star className={cn("w-4 h-4", formData.isDefault ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30")} />
                                        <Label className="font-black uppercase tracking-widest text-[10px] cursor-pointer">Devise par défaut</Label>
                                    </div>
                                    <div className={cn(
                                        "w-12 h-6 rounded-full p-1 transition-colors duration-300",
                                        formData.isDefault ? "bg-amber-500" : "bg-muted-foreground/20"
                                    )}>
                                        <div className={cn(
                                            "w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm",
                                            formData.isDefault ? "translate-x-6" : "translate-x-0"
                                        )} />
                                    </div>
                                </div>
                            </section>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="p-8 bg-card/80 backdrop-blur-xl border-t border-border/50 absolute bottom-0 left-0 right-0 z-10">
                        <div className="flex gap-4">
                            <Button
                                type="button"
                                variant="ghost"
                                className="flex-1 h-12 rounded-xl font-bold text-muted-foreground hover:bg-accent"
                                onClick={() => onOpenChange(false)}
                            >
                                <X className="w-4 h-4 mr-2" />
                                Annuler
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={isPending || !isFormValid}
                                className="flex-[2] h-12 rounded-xl font-black bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all group"
                            >
                                {isPending ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Enregistrement...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        {currency ? 'Mettre à jour' : 'Créer la devise'}
                                    </span>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
