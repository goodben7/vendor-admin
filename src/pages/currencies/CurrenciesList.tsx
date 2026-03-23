import { useState } from 'react';
import { useCurrencies, useDeleteCurrency } from '@/hooks/useCurrencies';
import { Currency } from '@/types/entities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import CurrencyFormSheet from '@/components/currencies/CurrencyFormSheet';
import { cn } from '@/lib/utils';
import {
    Coins,
    Plus,
    Edit,
    Trash2,
    Star,
    RefreshCw,
    Check,
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

export default function CurrenciesList() {
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selected, setSelected] = useState<Currency | null>(null);
    const [toDelete, setToDelete] = useState<Currency | null>(null);

    const { data, isLoading, refetch, isFetching } = useCurrencies();
    const deleteMutation = useDeleteCurrency();

    const currencies = data?.data || [];

    const handleCreate = () => {
        setSelected(null);
        setIsSheetOpen(true);
    };

    const handleEdit = (c: Currency) => {
        setSelected(c);
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
                        <Coins className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black italic tracking-tighter uppercase underline decoration-primary/30 underline-offset-8">
                            Devises
                        </h1>
                        <p className="text-muted-foreground font-bold text-sm mt-1 flex items-center gap-2">
                            {isFetching
                                ? <><RefreshCw className="w-3 h-3 animate-spin text-primary" /> Actualisation...</>
                                : <>{currencies.length} devise{currencies.length > 1 ? 's' : ''} configurée{currencies.length > 1 ? 's' : ''}</>
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
                        <RefreshCw className={cn("w-5 h-5", isFetching && "animate-spin")} />
                    </Button>
                    <RoleGuard permissions={['ROLE_CURRENCY_CREATE']}>
                        <Button
                            onClick={handleCreate}
                            className="h-11 gap-2 shadow-xl rounded-xl font-black italic uppercase tracking-tighter bg-primary hover:bg-primary/90"
                        >
                            <Plus className="w-5 h-5" />
                            Nouvelle devise
                        </Button>
                    </RoleGuard>
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-36 bg-muted/30 animate-pulse rounded-3xl" />
                    ))}
                </div>
            ) : currencies.length === 0 ? (
                <div className="text-center py-32 bg-muted/10 rounded-3xl border-2 border-dashed border-muted flex flex-col items-center justify-center">
                    <div className="mx-auto w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center mb-6 shadow-inner ring-8 ring-muted/5">
                        <Coins className="w-10 h-10 text-muted-foreground opacity-30" />
                    </div>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter">Aucune devise</h3>
                    <p className="text-muted-foreground mt-2 max-w-xs mx-auto font-medium">
                        Commencez par ajouter votre première devise.
                    </p>
                    <Button
                        onClick={handleCreate}
                        className="mt-8 h-12 px-8 rounded-xl font-black italic uppercase tracking-widest shadow-xl"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Ajouter une devise
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {currencies.map((currency) => (
                        <Card
                            key={currency.id}
                            className={cn(
                                "group relative overflow-hidden border-none shadow-lg rounded-3xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1",
                                currency.isDefault ? "bg-gradient-to-br from-amber-500/5 to-card ring-1 ring-amber-500/20" : "bg-card"
                            )}
                        >
                            {/* Left status bar */}
                            <div className={cn(
                                "absolute left-0 top-0 bottom-0 w-[5px]",
                                currency.active ? (currency.isDefault ? "bg-amber-500" : "bg-primary") : "bg-muted-foreground/20"
                            )} />

                            <CardContent className="p-6 pl-8 space-y-5">
                                {/* Top row */}
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        {/* Big symbol badge */}
                                        <div className={cn(
                                            "w-14 h-14 rounded-2xl flex items-center justify-center text-3xl font-black shadow-inner transition-transform group-hover:scale-110 duration-300",
                                            currency.isDefault ? "bg-amber-500/10 text-amber-600" : "bg-primary/10 text-primary"
                                        )}>
                                            {currency.symbol}
                                        </div>
                                        <div>
                                            <p className="font-black text-2xl tracking-tighter italic leading-none">
                                                {currency.code}
                                            </p>
                                            <p className="text-sm font-bold text-muted-foreground/70 mt-1 leading-tight">
                                                {currency.label}
                                            </p>
                                        </div>
                                    </div>

                                    {currency.isDefault && (
                                        <div className="flex items-center gap-1 bg-amber-500/10 text-amber-600 px-2 py-1 rounded-lg border border-amber-500/20">
                                            <Star className="w-3 h-3 fill-amber-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Défaut</span>
                                        </div>
                                    )}
                                </div>

                                {/* Status badges */}
                                <div className="flex flex-wrap gap-2">
                                    <Badge className={cn(
                                        "rounded-full text-[10px] font-black uppercase tracking-widest border-none px-2.5",
                                        currency.active
                                            ? "bg-emerald-500/10 text-emerald-600"
                                            : "bg-muted text-muted-foreground"
                                    )}>
                                        {currency.active ? (
                                            <><Check className="w-2.5 h-2.5 mr-1" />Active</>
                                        ) : 'Inactive'}
                                    </Badge>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-1 border-t border-border/30">
                                    <RoleGuard permissions={['ROLE_CURRENCY_UPDATE']}>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEdit(currency)}
                                            className="flex-1 h-9 rounded-xl font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all gap-1.5"
                                        >
                                            <Edit className="w-3.5 h-3.5" />
                                            Modifier
                                        </Button>
                                    </RoleGuard>
                                    <RoleGuard permissions={['ROLE_CURRENCY_DELETE']}>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setToDelete(currency)}
                                            className="h-9 w-9 rounded-xl text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all"
                                            disabled={currency.isDefault}
                                            title={currency.isDefault ? 'Impossible de supprimer la devise par défaut' : ''}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </RoleGuard>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create / Edit Sheet */}
            <CurrencyFormSheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                currency={selected}
            />

            {/* Delete Confirm */}
            <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
                <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-black text-xl">Supprimer la devise</AlertDialogTitle>
                        <AlertDialogDescription className="font-medium">
                            Êtes-vous sûr de vouloir supprimer la devise{' '}
                            <strong>{toDelete?.label} ({toDelete?.code})</strong> ?
                            Cette action est irréversible.
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
