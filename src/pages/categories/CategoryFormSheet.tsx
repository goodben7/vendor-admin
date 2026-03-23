import { useEffect } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCategory, useCreateCategory, useUpdateCategory } from '@/hooks/useProducts';
import { useMenus } from '@/hooks/useMenus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
import { cn } from '@/lib/utils';
import { Tag, Save, X, Loader2, Layout, Hash, AlignLeft } from 'lucide-react';
import { toast } from 'sonner';

const categorySchema = z.object({
    label: z.string().min(1, 'Le nom est requis'),
    description: z.string().optional(),
    menu: z.string().min(1, 'Le menu est requis'),
    position: z.coerce.number().optional(),
    active: z.boolean(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormSheetProps {
    categoryId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function CategoryFormSheet({
    categoryId,
    open,
    onOpenChange,
}: CategoryFormSheetProps) {
    const isEditing = !!categoryId;
    const { data: category, isLoading: isLoadingCategory } = useCategory(categoryId || '');
    const { data: menusData } = useMenus({ pageSize: 100 });

    const createMutation = useCreateCategory();
    const updateMutation = useUpdateCategory();

    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors },
    } = useForm<CategoryFormData>({
        resolver: zodResolver(categorySchema) as unknown as Resolver<CategoryFormData>,
        defaultValues: {
            label: '',
            description: '',
            menu: '',
            position: 0,
            active: true,
        },
    });

    useEffect(() => {
        if (open) {
            if (isEditing && category) {
                let menuValue = '';
                if (typeof category.menu === 'string') {
                    menuValue = category.menu;
                } else if (category.menu && typeof category.menu === 'object') {
                    // Try to extract ID or IRI
                    menuValue = (category.menu as any)['@id'] || `/api/menus/${category.menu.id}`;
                }

                reset({
                    label: category.label || category.name || '',
                    description: category.description || '',
                    menu: menuValue,
                    position: category.position ?? 0,
                    active: category.active ?? category.isAvailable ?? true,
                });
            } else if (!isEditing) {
                reset({
                    label: '',
                    description: '',
                    menu: '',
                    position: 0,
                    active: true,
                });
            }
        }
    }, [open, isEditing, category, reset]);

    const onSubmit = async (data: CategoryFormData) => {
        // Ensure position is a number just in case
        const payload = {
            ...data,
            position: Number(data.position) || 0
        };

        try {
            if (isEditing && categoryId) {
                await updateMutation.mutateAsync({ id: categoryId, data: payload });
            } else {
                await createMutation.mutateAsync(payload);
            }
            onOpenChange(false);
            reset();
        } catch (error: any) {
            const data = error.response?.data;
            const errorMessage = data?.['hydra:description'] || data?.description || data?.detail || data?.message || "Erreur lors de l'enregistrement de la catégorie";
            toast.error(errorMessage);
        }
    };

    const isLoading = createMutation.isPending || updateMutation.isPending || (isEditing && isLoadingCategory);
    const menus = menusData?.data || [];

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl p-0 border-none rounded-l-[2.5rem] overflow-hidden bg-background">
                <div className="flex flex-col h-full bg-gradient-to-b from-card/50 to-background">
                    {/* Header */}
                    <SheetHeader className="p-8 pb-6 border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                <Tag className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <SheetTitle className="text-2xl font-black tracking-tight">
                                    {isEditing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
                                </SheetTitle>
                                <SheetDescription className="font-bold text-muted-foreground/60 mt-0.5">
                                    {isEditing
                                        ? 'Modifiez les informations de la catégorie ci-dessous.'
                                        : 'Organisez vos produits en créant une nouvelle catégorie.'}
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto no-scrollbar">
                        <div className="p-8 space-y-10 pb-32">

                            {/* ── Identité ── */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-2 px-1">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Identité & Visuel</h3>
                                    <div className="h-px bg-gradient-to-r from-primary/20 to-transparent flex-1" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="label" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">Nom de la catégorie *</Label>
                                    <Input
                                        id="label"
                                        placeholder="Ex: Entrées, Boissons, Desserts..."
                                        {...register('label')}
                                        className="h-12 rounded-xl bg-background/50 border-border/50 font-bold placeholder:font-medium focus-visible:ring-primary/20"
                                    />
                                    {errors.label && (
                                        <p className="text-[11px] text-destructive font-bold ml-1">{errors.label.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">Description</Label>
                                    <div className="relative">
                                        <Textarea
                                            id="description"
                                            placeholder="Une courte description pour vos clients..."
                                            className="min-h-[100px] rounded-xl bg-background/50 border-border/50 font-medium placeholder:font-medium focus-visible:ring-primary/20 p-4 resize-none"
                                            {...register('description')}
                                        />
                                        <div className="absolute top-3 right-4">
                                            <AlignLeft className="w-4 h-4 text-muted-foreground/30" />
                                        </div>
                                    </div>
                                    {errors.description && (
                                        <p className="text-[11px] text-destructive font-bold ml-1">{errors.description.message}</p>
                                    )}
                                </div>
                            </section>

                            <Separator className="opacity-50" />

                            {/* ── Organisation ── */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-2 px-1">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Organisation</h3>
                                    <div className="h-px bg-gradient-to-r from-primary/20 to-transparent flex-1" />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="menu" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">Menu associé *</Label>
                                        <Controller
                                            control={control}
                                            name="menu"
                                            render={({ field }) => (
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <SelectTrigger id="menu" className="h-12 rounded-xl bg-background/50 border-border/50 font-bold focus:ring-primary/20">
                                                        <div className="flex items-center gap-2">
                                                            <Layout className="w-4 h-4 text-primary" />
                                                            <SelectValue placeholder="Choisir un menu" />
                                                        </div>
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                                                        {menus.map((menu) => (
                                                            <SelectItem key={menu.id} value={`/api/menus/${menu.id}`} className="py-3 font-medium">
                                                                {menu.label || menu.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.menu && (
                                            <p className="text-[11px] text-destructive font-bold ml-1">{errors.menu.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="position" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">Position / Ordre</Label>
                                        <div className="relative">
                                            <Input
                                                id="position"
                                                type="number"
                                                {...register('position')}
                                                className="h-12 rounded-xl bg-background/50 border-border/50 font-bold focus-visible:ring-primary/20 pr-10"
                                            />
                                            <Hash className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
                                        </div>
                                        {errors.position && (
                                            <p className="text-[11px] text-destructive font-bold ml-1">{errors.position.message}</p>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <Separator className="opacity-50" />

                            {/* ── Visibilité ── */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 px-1">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Visibilité</h3>
                                    <div className="h-px bg-gradient-to-r from-primary/20 to-transparent flex-1" />
                                </div>

                                <Controller
                                    control={control}
                                    name="active"
                                    render={({ field }) => (
                                        <div
                                            className={cn(
                                                "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer",
                                                field.value ? "bg-emerald-500/5 border-emerald-500/20" : "bg-muted/30 border-border/40"
                                            )}
                                            onClick={() => field.onChange(!field.value)}
                                        >
                                            <div className="space-y-0.5 text-left">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn("w-2 h-2 rounded-full", field.value ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/30")} />
                                                    <p className="text-sm font-black">Catégorie active</p>
                                                </div>
                                                <p className="text-xs text-muted-foreground font-medium pr-8">
                                                    {field.value
                                                        ? "Visible pour les clients sur les interfaces de commande."
                                                        : "Masquée temporairement de la carte."}
                                                </p>
                                            </div>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                className="shrink-0 ml-4 data-[state=checked]:bg-emerald-500"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    )}
                                />
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
                                onClick={handleSubmit(onSubmit)}
                                disabled={isLoading}
                                className="flex-[2] h-12 rounded-xl font-black bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all group"
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Enregistrement...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        {isEditing ? 'Mettre à jour' : 'Créer la catégorie'}
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
