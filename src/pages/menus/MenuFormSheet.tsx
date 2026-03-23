import { useState, useEffect } from 'react';
import { useCreateMenu, useUpdateMenu } from '@/hooks/useMenus';
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
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Menu } from '@/types/entities';
import { cn } from '@/lib/utils';
import { BookOpen, Save, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface MenuFormSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    menu?: Menu | null;
}

export default function MenuFormSheet({ open, onOpenChange, menu }: MenuFormSheetProps) {
    const createMutation = useCreateMenu();
    const updateMutation = useUpdateMenu();

    const [formData, setFormData] = useState({
        label: '',
        description: '',
        active: true,
    });

    useEffect(() => {
        if (menu) {
            setFormData({
                label: menu.label || '',
                description: menu.description || '',
                active: menu.active ?? true,
            });
        } else {
            if (open) {
                setFormData({
                    label: '',
                    description: '',
                    active: true,
                });
            }
        }
    }, [menu, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const payload = {
                label: formData.label,
                description: formData.description,
                active: formData.active,
            };

            if (menu) {
                await updateMutation.mutateAsync({
                    id: menu.id,
                    data: payload
                });
            } else {
                await createMutation.mutateAsync(payload);
            }
            onOpenChange(false);
            toast.success(menu ? "Menu mis à jour" : "Menu créé avec succès");
        } catch (error: any) {
            const data = error.response?.data;
            const errorMessage = data?.['hydra:description'] || data?.description || data?.detail || data?.message || "Erreur lors de l'enregistrement du menu";
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
                                <BookOpen className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <SheetTitle className="text-2xl font-black tracking-tight">
                                    {menu ? 'Modifier le menu' : 'Nouveau menu'}
                                </SheetTitle>
                                <SheetDescription className="font-bold text-muted-foreground/60 mt-0.5">
                                    {menu
                                        ? 'Modifiez les informations de votre carte existante.'
                                        : 'Créez une nouvelle carte pour votre établissement.'}
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto no-scrollbar">
                        <div className="p-8 space-y-10 pb-32">

                            {/* ── Identité du Menu ── */}
                            <section className="space-y-5">
                                <div className="flex items-center gap-2 px-1">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Identité du Menu</h3>
                                    <div className="h-px bg-gradient-to-r from-primary/20 to-transparent flex-1" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="label" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">Nom du menu *</Label>
                                    <Input
                                        id="label"
                                        value={formData.label}
                                        onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                        placeholder="Ex: Carte du Soir, Menu Midi..."
                                        required
                                        className="h-12 rounded-xl bg-background/50 border-border/50 font-bold placeholder:font-medium focus-visible:ring-primary/20"
                                    />
                                    <p className="text-[11px] text-muted-foreground font-medium ml-1">Ce nom servira de titre à votre carte.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Décrivez brièvement le thème ou le contenu de ce menu..."
                                        className="min-h-[120px] rounded-xl bg-background/50 border-border/50 font-medium focus-visible:ring-primary/20 resize-none"
                                    />
                                </div>
                            </section>

                            <Separator className="opacity-50" />

                            {/* ── Statut ── */}
                            <section className="space-y-5">
                                <div className="flex items-center gap-2 px-1">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Statut & Visibilité</h3>
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
                                            <p className="text-sm font-black">Menu Actif</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground font-medium pr-8">
                                            {formData.active
                                                ? "Le menu est visible par les clients et disponible à la commande."
                                                : "Le menu est masqué et indisponible pour le moment."}
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
                                        {menu ? 'Enregistrer les modifications' : 'Créer le menu'}
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
