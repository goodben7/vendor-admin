import { useState, useEffect } from 'react';
import { useCreatePlatform, useUpdatePlatform } from '@/hooks/usePlatforms';
import { useCurrencies } from '@/hooks/useCurrencies';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Platform, Currency } from '@/types/entities';
import { cn } from '@/lib/utils';
import { Building2, Save, X, Coins, Loader2, ShieldAlert } from 'lucide-react';
import { getCurrentUser } from '@/services/auth.service';

interface PlatformFormSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    platform?: Platform | null;
}

const DEFAULT_FORM = {
    name: '',
    address: '',
    description: '',
    currency: '',       // IRI, e.g. /api/currencies/{id}
    phone: '',
    email: '',
    allowTableManagement: true,
    allowOnlineOrder: true,
    paymentConfigJson: '',
    active: true,
};

/** Returns the IRI (/api/currencies/{id}) of the current platform currency, if any. */
function getCurrencyIri(platform: Platform | null | undefined): string {
    if (!platform?.currency) return '';
    const cur = platform.currency;
    if (typeof cur === 'string') return cur; // already an IRI
    // It's a Currency object — reconstruct the IRI
    return `/api/currencies/${cur.id}`;
}

export default function PlatformFormSheet({ open, onOpenChange, platform }: PlatformFormSheetProps) {
    const createMutation = useCreatePlatform();
    const updateMutation = useUpdatePlatform();
    const { data: currenciesData, isLoading: isLoadingCurrencies } = useCurrencies({ pageSize: 100 });

    // Detect if current user is SUPER_ADMIN — they don't see platform currencies
    const currentUser = getCurrentUser();
    const isSuperAdmin = currentUser?.personType === 'SPADM';

    const [formData, setFormData] = useState(DEFAULT_FORM);

    useEffect(() => {
        if (platform) {
            setFormData({
                name: platform.name || '',
                address: platform.address || '',
                description: platform.description || '',
                currency: getCurrencyIri(platform),
                phone: platform.phone || '',
                email: platform.email || '',
                allowTableManagement: platform.allowTableManagement ?? true,
                allowOnlineOrder: platform.allowOnlineOrder ?? true,
                paymentConfigJson: platform.paymentConfigJson?.join(', ') || '',
                active: platform.active ?? true,
            });
        } else if (open) {
            setFormData(DEFAULT_FORM);
        }
    }, [platform, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const paymentConfigArray = formData.paymentConfigJson
            .split(',')
            .map(item => item.trim())
            .filter(item => item.length > 0);

        const dataToSubmit: Record<string, unknown> = {
            ...formData,
            paymentConfigJson: paymentConfigArray,
        };

        // Super admin cannot update currency (API returns 404 for their scoped /api/currencies/{id})
        // So we simply omit the field on update to preserve the existing value server-side.
        if (platform && isSuperAdmin) {
            delete dataToSubmit.currency;
        } else {
            // For normal users: only send if a currency was selected
            if (!formData.currency) delete dataToSubmit.currency;
        }
        try {
            if (platform) {
                await updateMutation.mutateAsync({ id: platform.id, data: dataToSubmit });
            } else {
                await createMutation.mutateAsync(dataToSubmit);
            }
            onOpenChange(false);
        } catch {
            // handled by mutation toast
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;
    const currencies: Currency[] = currenciesData?.data || [];

    // Find selected currency object for display
    const selectedCurrency = currencies.find(c => `/api/currencies/${c.id}` === formData.currency);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl p-0 border-none rounded-l-[2.5rem] overflow-hidden bg-background">
                <div className="flex flex-col h-full bg-gradient-to-b from-card/50 to-background">
                    {/* Header */}
                    <SheetHeader className="p-8 pb-6 border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                <Building2 className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <SheetTitle className="text-2xl font-black tracking-tight">
                                    {platform ? 'Modifier la plateforme' : 'Nouvelle plateforme'}
                                </SheetTitle>
                                <SheetDescription className="font-bold text-muted-foreground/60 mt-0.5">
                                    {platform
                                        ? 'Modifiez les informations de votre établissement.'
                                        : 'Remplissez les informations pour créer un nouveau restaurant.'}
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto no-scrollbar">
                        <div className="p-8 space-y-10 pb-32">

                            {/* ── Identité ── */}
                            <section className="space-y-5">
                                <div className="flex items-center gap-2 px-1">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Identité</h3>
                                    <div className="h-px bg-gradient-to-r from-primary/20 to-transparent flex-1" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">Nom *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ex: Restaurant Centre-Ville"
                                        required
                                        className="h-12 rounded-xl bg-background/50 border-border/50 font-bold placeholder:font-medium focus-visible:ring-primary/20"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="address" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">Adresse</Label>
                                    <Input
                                        id="address"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="123 Rue de la Paix, Kinshasa"
                                        className="h-12 rounded-xl bg-background/50 border-border/50 font-bold placeholder:font-medium focus-visible:ring-primary/20"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Description de la plateforme..."
                                        rows={3}
                                        className="rounded-xl bg-background/50 border-border/50 font-medium focus-visible:ring-primary/20 resize-none"
                                    />
                                </div>
                            </section>

                            <Separator className="opacity-50" />

                            {/* ── Contact ── */}
                            <section className="space-y-5">
                                <div className="flex items-center gap-2 px-1">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Contact</h3>
                                    <div className="h-px bg-gradient-to-r from-primary/20 to-transparent flex-1" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">Téléphone</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="+243 99 000 0000"
                                            className="h-12 rounded-xl bg-background/50 border-border/50 font-bold placeholder:font-medium focus-visible:ring-primary/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="contact@resto.com"
                                            className="h-12 rounded-xl bg-background/50 border-border/50 font-bold placeholder:font-medium focus-visible:ring-primary/20"
                                        />
                                    </div>
                                </div>
                            </section>

                            <Separator className="opacity-50" />

                            {/* ── Devise ── */}
                            <section className="space-y-5">
                                <div className="flex items-center gap-2 px-1">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Devise</h3>
                                    <div className="h-px bg-gradient-to-r from-primary/20 to-transparent flex-1" />
                                </div>

                                {isSuperAdmin ? (
                                    /* Super admin: can't touch currency — show info only */
                                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                                        <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-black text-amber-700 dark:text-amber-400">Devise non modifiable</p>
                                            <p className="text-xs text-amber-600/80 font-medium mt-0.5">
                                                En tant que Super Admin, vous n'avez pas accès aux devises de cette plateforme. La devise existante sera conservée.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Label htmlFor="currency" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">Devise utilisée</Label>
                                        <Select
                                            value={formData.currency}
                                            onValueChange={(value) => setFormData({ ...formData, currency: value })}
                                            disabled={isLoadingCurrencies}
                                        >
                                            <SelectTrigger
                                                id="currency"
                                                className="h-12 rounded-xl bg-background/50 border-border/50 font-bold focus:ring-primary/20"
                                            >
                                                {isLoadingCurrencies ? (
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        <span className="text-sm">Chargement...</span>
                                                    </div>
                                                ) : selectedCurrency ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg font-black">{selectedCurrency.symbol}</span>
                                                        <span className="font-bold">{selectedCurrency.code}</span>
                                                        <span className="text-muted-foreground font-medium text-sm">— {selectedCurrency.label}</span>
                                                    </div>
                                                ) : (
                                                    <SelectValue placeholder="Sélectionnez une devise" />
                                                )}
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                                                {currencies.length === 0 ? (
                                                    <div className="p-4 text-center text-muted-foreground text-sm font-medium">
                                                        Aucune devise disponible.
                                                        <br />
                                                        <span className="text-xs opacity-60">Créez d'abord une devise dans Paramètres → Devises.</span>
                                                    </div>
                                                ) : (
                                                    currencies.map((c) => (
                                                        <SelectItem
                                                            key={c.id}
                                                            value={`/api/currencies/${c.id}`}
                                                            className="font-medium py-3"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-xl font-black w-8 text-center">{c.symbol}</span>
                                                                <div>
                                                                    <p className="font-black text-sm">{c.code}</p>
                                                                    <p className="text-xs text-muted-foreground">{c.label}</p>
                                                                </div>
                                                                {c.isDefault && (
                                                                    <span className="ml-auto text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-md border border-amber-500/20">
                                                                        Défaut
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>

                                        {/* Currency preview */}
                                        {selectedCurrency && (
                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10 mt-2">
                                                <Coins className="w-4 h-4 text-primary shrink-0" />
                                                <p className="text-xs font-bold text-primary/70">
                                                    Les prix seront affichés en <strong>{selectedCurrency.label}</strong> ({selectedCurrency.symbol})
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </section>

                            <Separator className="opacity-50" />

                            {/* ── Paiement ── */}
                            <section className="space-y-5">
                                <div className="flex items-center gap-2 px-1">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Modes de paiement</h3>
                                    <div className="h-px bg-gradient-to-r from-primary/20 to-transparent flex-1" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="paymentConfig" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">
                                        Configuration de paiement
                                    </Label>
                                    <Textarea
                                        id="paymentConfig"
                                        value={formData.paymentConfigJson}
                                        onChange={(e) => setFormData({ ...formData, paymentConfigJson: e.target.value })}
                                        placeholder="CASH, CARD, MOBILE_MONEY"
                                        rows={2}
                                        className="rounded-xl bg-background/50 border-border/50 font-mono text-sm focus-visible:ring-primary/20 resize-none"
                                    />
                                    <p className="text-[11px] text-muted-foreground font-medium ml-1">
                                        Séparez les modes de paiement par des virgules.
                                    </p>
                                </div>
                            </section>

                            <Separator className="opacity-50" />

                            {/* ── Paramètres ── */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 px-1">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Paramètres</h3>
                                    <div className="h-px bg-gradient-to-r from-primary/20 to-transparent flex-1" />
                                </div>

                                {/* allowTableManagement */}
                                <div
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer",
                                        formData.allowTableManagement ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border/40"
                                    )}
                                    onClick={() => setFormData({ ...formData, allowTableManagement: !formData.allowTableManagement })}
                                >
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-black">Gestion des tables</p>
                                        <p className="text-xs text-muted-foreground font-medium">Activer le module de placement et de gestion des tables en salle.</p>
                                    </div>
                                    <Switch
                                        checked={formData.allowTableManagement}
                                        onCheckedChange={(v) => setFormData({ ...formData, allowTableManagement: v })}
                                        className="shrink-0 ml-4"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>

                                {/* allowOnlineOrder */}
                                <div
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer",
                                        formData.allowOnlineOrder ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border/40"
                                    )}
                                    onClick={() => setFormData({ ...formData, allowOnlineOrder: !formData.allowOnlineOrder })}
                                >
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-black">Commande en ligne</p>
                                        <p className="text-xs text-muted-foreground font-medium">Permettre aux clients de commander à distance.</p>
                                    </div>
                                    <Switch
                                        checked={formData.allowOnlineOrder}
                                        onCheckedChange={(v) => setFormData({ ...formData, allowOnlineOrder: v })}
                                        className="shrink-0 ml-4"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>

                                {/* active */}
                                <div
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer",
                                        formData.active ? "bg-emerald-500/5 border-emerald-500/20" : "bg-muted/30 border-border/40"
                                    )}
                                    onClick={() => setFormData({ ...formData, active: !formData.active })}
                                >
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-2 h-2 rounded-full", formData.active ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/30")} />
                                            <p className="text-sm font-black">Plateforme active</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground font-medium">Rendre la plateforme ouverte et opérationnelle.</p>
                                    </div>
                                    <Switch
                                        checked={formData.active}
                                        onCheckedChange={(v) => setFormData({ ...formData, active: v })}
                                        className="shrink-0 ml-4 data-[state=checked]:bg-emerald-500"
                                        onClick={(e) => e.stopPropagation()}
                                    />
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
                                disabled={isPending || !formData.name.trim()}
                                className="flex-[2] h-12 rounded-xl font-black bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all group"
                            >
                                {isPending ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Enregistrement...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        {platform ? 'Mettre à jour' : 'Créer la plateforme'}
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
