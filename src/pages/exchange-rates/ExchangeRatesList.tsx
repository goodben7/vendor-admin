import { useState } from 'react';
import { useExchangeRates, useDeleteExchangeRate } from '@/hooks/useExchangeRates';
import { useCurrencies } from '@/hooks/useCurrencies';
import { ExchangeRate } from '@/types/entities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    TrendingUp,
    Plus,
    Edit,
    Trash2,
    RefreshCw,
    ArrowRight,
    Check,
    X,
} from 'lucide-react';
import RoleGuard from '@/components/shared/RoleGuard';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useCreateExchangeRate, useUpdateExchangeRate } from '@/hooks/useExchangeRates';

// ── Form Sheet ─────────────────────────────────────────────────────────────────
interface FormSheetProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    rate: ExchangeRate | null;
}

function ExchangeRateFormSheet({ open, onOpenChange, rate }: FormSheetProps) {
    const isEdit = !!rate;
    const { data: currData } = useCurrencies();
    const currencies = currData?.data || [];

    const createMutation = useCreateExchangeRate();
    const updateMutation = useUpdateExchangeRate();

    const [baseCurrency, setBaseCurrency] = useState(rate?.baseCurrency?.id || '');
    const [targetCurrency, setTargetCurrency] = useState(rate?.targetCurrency?.id || '');
    const [baseRate, setBaseRate] = useState(rate?.baseRate || '');
    const [targetRate, setTargetRate] = useState(rate?.targetRate || '');
    const [active, setActive] = useState(rate?.active ?? true);

    const handleOpen = (v: boolean) => {
        if (v) {
            setBaseCurrency(rate?.baseCurrency?.id || '');
            setTargetCurrency(rate?.targetCurrency?.id || '');
            setBaseRate(rate?.baseRate || '');
            setTargetRate(rate?.targetRate || '');
            setActive(rate?.active ?? true);
        }
        onOpenChange(v);
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit && rate) {
            // API only accepts { active } on PATCH
            await updateMutation.mutateAsync({ id: rate.id, data: { active } });
        } else {
            await createMutation.mutateAsync({
                baseCurrency: `/api/currencies/${baseCurrency}`,
                targetCurrency: `/api/currencies/${targetCurrency}`,
                baseRate: baseRate || undefined,
                targetRate: targetRate || undefined,
                active,
            });
        }
        onOpenChange(false);
    };

    return (
        <Sheet open={open} onOpenChange={handleOpen}>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader className="pb-6">
                    <SheetTitle className="text-2xl font-black italic tracking-tighter uppercase">
                        {isEdit ? 'Modifier le taux' : 'Nouveau taux de change'}
                    </SheetTitle>
                    <SheetDescription className="font-medium">
                        {isEdit
                            ? 'Activez ou désactivez ce taux de change.'
                            : 'Définissez un nouveau taux de conversion entre deux devises.'}
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* ── EDIT MODE : active only ── */}
                    {isEdit && (
                        <>
                            {/* Recap de la paire */}
                            <div className="rounded-2xl bg-muted/20 border border-border/40 p-4 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-xl font-black text-primary">
                                    {rate.baseCurrency.symbol}
                                </div>
                                <ArrowRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                                <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-xl font-black text-violet-600">
                                    {rate.targetCurrency.symbol}
                                </div>
                                <div>
                                    <p className="font-black text-lg tracking-tighter italic">
                                        {rate.baseCurrency.code} / {rate.targetCurrency.code}
                                    </p>
                                    <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                                        Taux : {parseFloat(rate.rate).toLocaleString('fr-FR', { maximumFractionDigits: 6 })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/40">
                                <div>
                                    <p className="font-black text-sm">Actif</p>
                                    <p className="text-xs text-muted-foreground font-medium mt-0.5">
                                        Ce taux sera utilisé pour les conversions
                                    </p>
                                </div>
                                <Switch checked={active} onCheckedChange={setActive} />
                            </div>
                        </>
                    )}

                    {/* ── CREATE MODE : full form ── */}
                    {!isEdit && (
                        <>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    Devise de base
                                </Label>
                                <Select value={baseCurrency} onValueChange={setBaseCurrency} required>
                                    <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-none font-bold">
                                        <SelectValue placeholder="Sélectionner une devise..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {currencies.map(c => (
                                            <SelectItem key={c.id} value={c.id} className="font-bold">
                                                {c.symbol} — {c.code} ({c.label})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    Devise cible
                                </Label>
                                <Select value={targetCurrency} onValueChange={setTargetCurrency} required>
                                    <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-none font-bold">
                                        <SelectValue placeholder="Sélectionner une devise..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {currencies.map(c => (
                                            <SelectItem key={c.id} value={c.id} className="font-bold">
                                                {c.symbol} — {c.code} ({c.label})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        Taux base
                                    </Label>
                                    <Input
                                        type="number"
                                        step="any"
                                        min="0"
                                        placeholder="1"
                                        value={baseRate}
                                        onChange={e => setBaseRate(e.target.value)}
                                        className="h-11 rounded-xl bg-muted/30 border-none font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        Taux cible
                                    </Label>
                                    <Input
                                        type="number"
                                        step="any"
                                        min="0"
                                        placeholder="655.957"
                                        value={targetRate}
                                        onChange={e => setTargetRate(e.target.value)}
                                        className="h-11 rounded-xl bg-muted/30 border-none font-bold"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/40">
                                <div>
                                    <p className="font-black text-sm">Actif</p>
                                    <p className="text-xs text-muted-foreground font-medium mt-0.5">
                                        Ce taux sera utilisé pour les conversions
                                    </p>
                                </div>
                                <Switch checked={active} onCheckedChange={setActive} />
                            </div>
                        </>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1 h-11 rounded-xl font-bold"
                            onClick={() => onOpenChange(false)}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="flex-1 h-11 rounded-xl font-black uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                        >
                            {isPending ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : isEdit ? 'Enregistrer' : 'Créer'}
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function ExchangeRatesList() {
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selected, setSelected] = useState<ExchangeRate | null>(null);
    const [toDelete, setToDelete] = useState<ExchangeRate | null>(null);

    const { data, isLoading, refetch, isFetching } = useExchangeRates();
    const deleteMutation = useDeleteExchangeRate();

    const rates = data?.data || [];

    const handleCreate = () => {
        setSelected(null);
        setIsSheetOpen(true);
    };

    const handleEdit = (r: ExchangeRate) => {
        setSelected(r);
        setIsSheetOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!toDelete) return;
        await deleteMutation.mutateAsync(toDelete.id);
        setToDelete(null);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary shadow-xl shadow-primary/20 flex items-center justify-center text-primary-foreground transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                        <TrendingUp className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black italic tracking-tighter uppercase underline decoration-primary/30 underline-offset-8">
                            Taux de change
                        </h1>
                        <p className="text-muted-foreground font-bold text-sm mt-1 flex items-center gap-2">
                            {isFetching
                                ? <><RefreshCw className="w-3 h-3 animate-spin text-primary" /> Actualisation...</>
                                : <>{rates.length} taux configuré{rates.length > 1 ? 's' : ''}</>
                            }
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => refetch()}
                        className="h-11 w-11 rounded-xl shadow-sm border-border/50 hover:bg-primary/5"
                        disabled={isFetching}
                    >
                        <RefreshCw className={cn('w-5 h-5', isFetching && 'animate-spin')} />
                    </Button>
                    <RoleGuard permissions={['ROLE_EXCHANGE_RATE_CREATE']}>
                        <Button
                            onClick={handleCreate}
                            className="h-11 gap-2 shadow-xl rounded-xl font-black italic uppercase tracking-tighter bg-primary hover:bg-primary/90"
                        >
                            <Plus className="w-5 h-5" />
                            Nouveau taux
                        </Button>
                    </RoleGuard>
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-44 bg-muted/30 animate-pulse rounded-3xl" />
                    ))}
                </div>
            ) : rates.length === 0 ? (
                <div className="text-center py-32 bg-muted/10 rounded-3xl border-2 border-dashed border-muted flex flex-col items-center justify-center">
                    <div className="mx-auto w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center mb-6 shadow-inner ring-8 ring-muted/5">
                        <TrendingUp className="w-10 h-10 text-muted-foreground opacity-30" />
                    </div>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter">Aucun taux configuré</h3>
                    <p className="text-muted-foreground mt-2 max-w-xs mx-auto font-medium">
                        Ajoutez un taux de change pour permettre les conversions entre devises.
                    </p>
                    <Button
                        onClick={handleCreate}
                        className="mt-8 h-12 px-8 rounded-xl font-black italic uppercase tracking-widest shadow-xl"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Ajouter un taux
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {rates.map((rate) => (
                        <div
                            key={rate.id}
                            className={cn(
                                'group relative overflow-hidden bg-card border rounded-3xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1',
                                rate.active ? 'ring-1 ring-primary/10' : 'opacity-60'
                            )}
                        >
                            {/* Left accent bar */}
                            <div className={cn(
                                'absolute left-0 top-0 bottom-0 w-[5px]',
                                rate.active ? 'bg-primary' : 'bg-muted-foreground/20'
                            )} />

                            <div className="p-6 pl-8 space-y-4">
                                {/* Currency pair */}
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-xl font-black text-primary transition-transform group-hover:scale-110 duration-300">
                                            {rate.baseCurrency.symbol}
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground/40" />
                                        <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-xl font-black text-violet-600 transition-transform group-hover:scale-110 duration-300">
                                            {rate.targetCurrency.symbol}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-lg tracking-tighter italic leading-none">
                                            {rate.baseCurrency.code}
                                            <span className="text-muted-foreground/40 mx-1 font-medium not-italic">/</span>
                                            {rate.targetCurrency.code}
                                        </p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mt-0.5">
                                            Paire de devises
                                        </p>
                                    </div>
                                </div>

                                {/* Rate */}
                                <div className="rounded-2xl bg-muted/30 px-4 py-3 flex items-center justify-between">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        Taux
                                    </p>
                                    <p className="text-2xl font-black text-primary tracking-tighter">
                                        {parseFloat(rate.rate).toLocaleString('fr-FR', { maximumFractionDigits: 6 })}
                                    </p>
                                </div>

                                {/* Base / Target rates */}
                                {(rate.baseRate || rate.targetRate) && (
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        {rate.baseRate && (
                                            <div className="rounded-xl bg-muted/20 px-3 py-2">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Base</p>
                                                <p className="font-black mt-0.5">{parseFloat(rate.baseRate).toLocaleString('fr-FR')}</p>
                                            </div>
                                        )}
                                        {rate.targetRate && (
                                            <div className="rounded-xl bg-muted/20 px-3 py-2">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Cible</p>
                                                <p className="font-black mt-0.5">{parseFloat(rate.targetRate).toLocaleString('fr-FR')}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Status + Date */}
                                <div className="flex items-center justify-between pt-1">
                                    <Badge className={cn(
                                        'rounded-full text-[10px] font-black uppercase tracking-widest border-none px-2.5',
                                        rate.active
                                            ? 'bg-emerald-500/10 text-emerald-600'
                                            : 'bg-muted text-muted-foreground'
                                    )}>
                                        {rate.active
                                            ? <><Check className="w-2.5 h-2.5 mr-1" />Actif</>
                                            : <><X className="w-2.5 h-2.5 mr-1" />Inactif</>}
                                    </Badge>
                                    {rate.createdAt && (
                                        <p className="text-[10px] text-muted-foreground/50 font-semibold">
                                            {format(new Date(rate.createdAt), 'dd MMM yyyy · HH:mm', { locale: fr })}
                                        </p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-1 border-t border-border/30">
                                    <RoleGuard permissions={['ROLE_EXCHANGE_RATE_UPDATE']}>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEdit(rate)}
                                            className="flex-1 h-9 rounded-xl font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all gap-1.5"
                                        >
                                            <Edit className="w-3.5 h-3.5" />
                                            Modifier
                                        </Button>
                                    </RoleGuard>
                                    <RoleGuard permissions={['ROLE_EXCHANGE_RATE_DELETE']}>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setToDelete(rate)}
                                            className="h-9 w-9 rounded-xl text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </RoleGuard>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Form Sheet */}
            <ExchangeRateFormSheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                rate={selected}
            />

            {/* Delete Confirm */}
            <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
                <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-black text-xl">Supprimer le taux</AlertDialogTitle>
                        <AlertDialogDescription className="font-medium">
                            Êtes-vous sûr de vouloir supprimer le taux{' '}
                            <strong>
                                {toDelete?.baseCurrency.code} / {toDelete?.targetCurrency.code}
                            </strong>{' '}
                            ? Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl font-bold">Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="rounded-xl font-black bg-destructive hover:bg-destructive/90"
                        >
                            {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
