import { useState, useEffect } from 'react';
import { useCreateTablet, useUpdateTablet, usePlatformTables } from '@/hooks/usePlatforms';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tablet } from '@/types/entities';
import { cn } from '@/lib/utils';
import { Smartphone, Save, X, Loader2, HardDrive, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface TabletFormSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tablet?: Tablet | null;
}

export default function TabletFormSheet({ open, onOpenChange, tablet }: TabletFormSheetProps) {
    const createMutation = useCreateTablet();
    const updateMutation = useUpdateTablet();
    // Fetch available platform tables. Assuming we can fetch all or paginate. 
    // Ideally we should filter by platform if context available, but here we just list all for assignment.
    // 'page: 0, pageSize: 100' to try to get enough tables.
    const { data: tablesData } = usePlatformTables({ page: 0, pageSize: 100 });
    const platformTables = tablesData?.data || [];

    const [formData, setFormData] = useState({
        label: '',
        deviceId: '',
        deviceModel: '',
        mode: 'cashier',
        active: true,
        platformTable: 'none',
    });

    useEffect(() => {
        if (tablet) {
            let platformTableId = '';
            if (typeof tablet.platformTable === 'string') {
                platformTableId = tablet.platformTable;
            } else if (tablet.platformTable && typeof tablet.platformTable === 'object') {
                platformTableId = (tablet.platformTable as any)['@id'] || `/api/platform_tables/${tablet.platformTable.id}`;
            }

            setFormData({
                label: tablet.label || '',
                deviceId: tablet.deviceId || '',
                deviceModel: (tablet as any).deviceModel || '',
                mode: (tablet as any).mode || 'cashier',
                active: tablet.active ?? true,
                platformTable: platformTableId || 'none',
            });
        } else {
            if (open) {
                setFormData({
                    label: '',
                    deviceId: '',
                    deviceModel: '',
                    mode: 'cashier',
                    active: true,
                    platformTable: 'none',
                });
            }
        }
    }, [tablet, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const payload: any = {
                label: formData.label,
                deviceId: formData.deviceId,
                deviceModel: formData.deviceModel,
                mode: formData.mode,
                active: formData.active,
            };

            if (formData.platformTable && formData.platformTable !== 'none') {
                payload.platformTable = formData.platformTable;
            }

            if (tablet) {
                await updateMutation.mutateAsync({
                    id: tablet.id,
                    data: payload
                });
            } else {
                payload.lastHeartbeat = new Date().toISOString();
                await createMutation.mutateAsync(payload);
            }
            onOpenChange(false);
        } catch (error: any) {
            const data = error.response?.data;
            const errorMessage = data?.['hydra:description'] || data?.description || data?.detail || data?.message || "Erreur lors de l'enregistrement de la tablette";
            toast.error(errorMessage);
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl p-0 border-none rounded-l-[2.5rem] overflow-hidden bg-background">
                <div className="flex flex-col h-full bg-gradient-to-b from-card/50 to-background">
                    {/* Header */}
                    <SheetHeader className="p-8 pb-6 border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                <Smartphone className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <SheetTitle className="text-2xl font-black tracking-tight">
                                    {tablet ? 'Modifier la tablette' : 'Nouvelle tablette'}
                                </SheetTitle>
                                <SheetDescription className="font-bold text-muted-foreground/60 mt-0.5">
                                    {tablet
                                        ? 'Modifiez les informations de la tablette existante.'
                                        : 'Remplissez les informations pour enregistrer un nouvel appareil.'}
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto no-scrollbar">
                        <div className="p-8 space-y-10 pb-32">

                            {/* ── Matériel ── */}
                            <section className="space-y-5">
                                <div className="flex items-center gap-2 px-1">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Matériel</h3>
                                    <div className="h-px bg-gradient-to-r from-primary/20 to-transparent flex-1" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="label" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">Nom (Label)</Label>
                                    <Input
                                        id="label"
                                        value={formData.label}
                                        onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                        placeholder="Ex: Tablette Bar, Caisse Principale..."
                                        className="h-12 rounded-xl bg-background/50 border-border/50 font-bold placeholder:font-medium focus-visible:ring-primary/20"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="deviceId" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">Device ID (UUID) *</Label>
                                    <div className="relative">
                                        <Input
                                            id="deviceId"
                                            value={formData.deviceId}
                                            onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
                                            placeholder="Saisissez l'identifiant unique"
                                            required
                                            className="h-12 rounded-xl bg-background/50 border-border/50 font-mono text-xs font-bold focus-visible:ring-primary/20"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                            <HardDrive className="w-4 h-4 text-muted-foreground/40" />
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground font-medium ml-1">Identifiant unique pour la connexion Websocket/API.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="deviceModel" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">Modèle de tablette *</Label>
                                    <Input
                                        id="deviceModel"
                                        value={formData.deviceModel}
                                        onChange={(e) => setFormData({ ...formData, deviceModel: e.target.value })}
                                        placeholder="Ex: iPad Pro, Samsung Tab S8..."
                                        required
                                        className="h-12 rounded-xl bg-background/50 border-border/50 font-bold placeholder:font-medium focus-visible:ring-primary/20"
                                    />
                                </div>
                            </section>

                            <Separator className="opacity-50" />

                            {/* ── Configuration ── */}
                            <section className="space-y-5">
                                <div className="flex items-center gap-2 px-1">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Assignation & Mode</h3>
                                    <div className="h-px bg-gradient-to-r from-primary/20 to-transparent flex-1" />
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="platformTable" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">Table assignée</Label>
                                        <Select
                                            value={formData.platformTable}
                                            onValueChange={(value) => setFormData({ ...formData, platformTable: value })}
                                        >
                                            <SelectTrigger id="platformTable" className="h-12 rounded-xl bg-background/50 border-border/50 font-bold focus:ring-primary/20">
                                                <SelectValue placeholder="Positionner la tablette sur une table" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                                                <SelectItem value="none" className="font-bold">Aucune table (Mobile / Caisse)</SelectItem>
                                                {platformTables.map((table: any) => {
                                                    const tableId = table['@id'] || (table.id ? `/api/platform_tables/${table.id}` : '');
                                                    return (
                                                        <SelectItem key={tableId} value={tableId} className="font-medium py-3">
                                                            {table.label || `Table ${table.tableNumber}`}
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="mode" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">Mode d'utilisation *</Label>
                                        <Select
                                            value={formData.mode}
                                            onValueChange={(value) => setFormData({ ...formData, mode: value })}
                                        >
                                            <SelectTrigger id="mode" className="h-12 rounded-xl bg-background/50 border-border/50 font-bold focus:ring-primary/20">
                                                <div className="flex items-center gap-2">
                                                    <Settings className="w-4 h-4 text-primary" />
                                                    <SelectValue placeholder="Choisir le rôle" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                                                <SelectItem value="cashier" className="font-bold py-3">Caisse (Cashier)</SelectItem>
                                                <SelectItem value="self_order" className="font-bold py-3">Borne de commande (Self Order)</SelectItem>
                                                <SelectItem value="waiter" className="font-bold py-3">Serveur Mobile (Waiter)</SelectItem>
                                                <SelectItem value="kitchen" className="font-bold py-3">Écran Cuisine (Kitchen)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </section>

                            <Separator className="opacity-50" />

                            {/* ── Statut ── */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 px-1">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Statut</h3>
                                    <div className="h-px bg-gradient-to-r from-primary/20 to-transparent flex-1" />
                                </div>

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
                                            <p className="text-sm font-black">Appareil Autorisé</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground font-medium pr-8">
                                            {formData.active
                                                ? "L'appareil est autorisé à se connecter et à opérer."
                                                : "L'accès est révoqué pour cet identifiant matériel."}
                                        </p>
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
                                disabled={isPending || !formData.deviceId.trim() || !formData.deviceModel.trim()}
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
                                        {tablet ? 'Mettre à jour' : 'Ajouter la tablette'}
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
