import { useState, useEffect } from 'react';
import { useCreatePlatformTable, useUpdatePlatformTable } from '@/hooks/usePlatforms';
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
import { Switch } from '@/components/ui/switch';
import { PlatformTable } from '@/types/entities';
import { cn } from '@/lib/utils';
import { Armchair, Save, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PlatformTableFormSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    table?: PlatformTable | null;
}

export default function PlatformTableFormSheet({ open, onOpenChange, table }: PlatformTableFormSheetProps) {
    const createMutation = useCreatePlatformTable();
    const updateMutation = useUpdatePlatformTable();

    const [formData, setFormData] = useState({
        label: '',
        capacity: 0,
        active: true,
    });

    useEffect(() => {
        if (table) {
            setFormData({
                label: (table as any).label || '',
                capacity: table.capacity || 0,
                active: table.isActive ?? table.active ?? true,
            });
        } else {
            if (open) {
                setFormData({
                    label: '',
                    capacity: 0,
                    active: true,
                });
            }
        }
    }, [table, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (table) {
                await updateMutation.mutateAsync({
                    id: table.id,
                    data: {
                        label: formData.label,
                        capacity: Number(formData.capacity),
                        active: formData.active
                    } as any
                });
            } else {
                await createMutation.mutateAsync({
                    label: formData.label,
                    capacity: Number(formData.capacity),
                    active: formData.active,
                } as any);
            }
            onOpenChange(false);
        } catch (error: any) {
            const data = error.response?.data;
            const errorMessage = data?.['hydra:description'] || data?.description || data?.detail || data?.message || "Erreur lors de l'enregistrement de la table";
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
                                <Armchair className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <SheetTitle className="text-2xl font-black tracking-tight">
                                    {table ? 'Modifier la table' : 'Nouvelle table'}
                                </SheetTitle>
                                <SheetDescription className="font-bold text-muted-foreground/60 mt-0.5">
                                    {table
                                        ? 'Modifiez les informations de la table existante.'
                                        : 'Remplissez les informations pour créer une nouvelle table.'}
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
                                    <Label htmlFor="label" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">Nom de la table *</Label>
                                    <Input
                                        id="label"
                                        value={formData.label}
                                        onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                        placeholder="Ex: Table 1, Terasse Sud..."
                                        required
                                        className="h-12 rounded-xl bg-background/50 border-border/50 font-bold placeholder:font-medium focus-visible:ring-primary/20"
                                    />
                                    <p className="text-[11px] text-muted-foreground font-medium ml-1">Ce nom sera visible sur le plan de salle.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="capacity" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">Capacité maximale *</Label>
                                    <div className="relative">
                                        <Input
                                            id="capacity"
                                            type="number"
                                            min="1"
                                            value={formData.capacity === 0 ? '' : formData.capacity}
                                            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                                            placeholder="Ex: 4"
                                            required
                                            className="h-12 rounded-xl bg-background/50 border-border/50 font-bold placeholder:font-medium focus-visible:ring-primary/20 pr-24"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                            <span className="text-muted-foreground text-xs font-black uppercase tracking-widest">personnes</span>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground font-medium ml-1">Nombre de couverts disponibles pour cette table.</p>
                                </div>
                            </section>

                            <Separator className="opacity-50" />

                            {/* ── Statut ── */}
                            <section className="space-y-5">
                                <div className="flex items-center gap-2 px-1">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Statut & Disponibilité</h3>
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
                                            <p className="text-sm font-black">Table opérationnelle</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground font-medium pr-8">
                                            {formData.active
                                                ? "Ouverte au service et prête à accueillir des clients."
                                                : "Momentanément fermée (réparation, réservation privée, etc)."}
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
                                disabled={isPending || !formData.label.trim()}
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
                                        {table ? 'Mettre à jour' : 'Créer la table'}
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
