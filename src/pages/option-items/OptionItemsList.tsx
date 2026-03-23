
import { useState, useMemo } from 'react';
import { usePlatformCurrency } from '@/hooks/usePlatformCurrency';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Plus,
    Edit,
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    Minus,
    Package,
    Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';

import {
    useOptionItems,
    useCreateOptionItem,
    useUpdateOptionItem,
    useDeleteOptionItem,
    useOptionGroup
} from '@/hooks/useProducts';
import { OptionItem } from '@/types/entities';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import DataTable from '@/components/shared/DataTable';
import RoleGuard from '@/components/shared/RoleGuard';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { cn } from '@/lib/utils';

// Validation Schema
const formSchema = z.object({
    label: z.string().min(1, "Le nom est requis"),
    priceDelta: z.string().refine((val) => !isNaN(parseFloat(val)), {
        message: "L'impact prix doit être un nombre valide",
    }),
    isAvailable: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export default function OptionItemsList() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const groupId = searchParams.get('groupId') || '';
    const { symbol: currSymbol } = usePlatformCurrency();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<OptionItem | null>(null);
    const [deletingItem, setDeletingItem] = useState<OptionItem | null>(null);

    // Queries
    const { data: group, isLoading: isGroupLoading } = useOptionGroup(groupId);
    const { data: optionItemsResult, isLoading: isItemsLoading } = useOptionItems({
        optionGroup: groupId ? `/api/option_groups/${groupId}` : undefined
    });
    const optionItems = optionItemsResult?.data || [];

    // Mutations
    const createMutation = useCreateOptionItem();
    const updateMutation = useUpdateOptionItem();
    const deleteMutation = useDeleteOptionItem();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            label: '',
            priceDelta: '0.00',
            isAvailable: true,
        }
    });

    const watchedPriceDelta = form.watch('priceDelta');
    const priceAnalysis = useMemo(() => {
        const val = parseFloat(watchedPriceDelta || '0');
        if (isNaN(val)) return null;
        if (val > 0) return { text: `Supplément de +${val.toFixed(2)} ${currSymbol}`, color: 'text-green-600 dark:text-green-400', icon: <TrendingUp className="w-4 h-4" /> };
        if (val < 0) return { text: `Réduction de ${val.toFixed(2)} ${currSymbol}`, color: 'text-red-600 dark:text-red-400', icon: <TrendingDown className="w-4 h-4" /> };
        return { text: "Sans impact sur le prix", color: 'text-muted-foreground', icon: <Minus className="w-4 h-4" /> };
    }, [watchedPriceDelta]);

    const handleOpenCreate = () => {
        setEditingItem(null);
        form.reset({
            label: '',
            priceDelta: '0.00',
            isAvailable: true,
        });
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (item: OptionItem) => {
        setEditingItem(item);
        form.reset({
            label: item.label || item.name,
            priceDelta: item.priceDelta || '0.00',
            isAvailable: item.isAvailable !== false,
        });
        setIsDialogOpen(true);
    };

    const onSubmit = (values: FormValues) => {
        const payload = {
            ...values,
            optionGroup: `/api/option_groups/${groupId}`,
            priceDelta: parseFloat(values.priceDelta).toFixed(2)
        };

        if (editingItem) {
            updateMutation.mutate({
                id: editingItem.id,
                data: payload as any,
            }, {
                onSuccess: () => setIsDialogOpen(false)
            });
        } else {
            createMutation.mutate(payload as any, {
                onSuccess: () => setIsDialogOpen(false)
            });
        }
    };

    const handleDelete = (item: OptionItem) => {
        setDeletingItem(item);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!deletingItem) return;
        deleteMutation.mutate(deletingItem.id, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setDeletingItem(null);
            }
        });
    };

    const columns: ColumnDef<OptionItem>[] = [
        {
            accessorKey: 'label',
            header: 'Nom de la variante',
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="flex items-center gap-3 py-1">
                        <div className={cn(
                            "w-2 h-2 rounded-full",
                            item.isAvailable !== false ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-destructive"
                        )} />
                        <div>
                            <p className="font-bold tracking-tight text-sm leading-tight">{item.label || item.name}</p>
                            {item.isAvailable === false && (
                                <p className="text-[9px] font-black text-destructive uppercase tracking-widest mt-0.5">Indisponible</p>
                            )}
                        </div>
                    </div>
                );
            }
        },
        {
            accessorKey: 'priceDelta',
            header: 'Impact Prix',
            cell: ({ row }) => {
                const price = row.original.priceDelta ? parseFloat(row.original.priceDelta) : 0;
                if (price > 0) {
                    return (
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="font-black text-emerald-600 text-sm tabular-nums">
                                +{price.toFixed(2)} {currSymbol}
                            </span>
                        </div>
                    );
                }
                if (price < 0) {
                    return (
                        <div className="flex items-center gap-2">
                            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                            <span className="font-black text-rose-600 text-sm tabular-nums">
                                {price.toFixed(2)} {currSymbol}
                            </span>
                        </div>
                    );
                }
                return (
                    <div className="flex items-center gap-2 text-muted-foreground/40 italic font-bold text-xs uppercase tracking-widest">
                        <Minus className="w-3.5 h-3.5" />
                        Inclus
                    </div>
                );
            }
        },
        {
            id: 'actions',
            header: '',
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-1.5 px-2">
                    <RoleGuard permissions={['ROLE_OPTION_ITEM_UPDATE']}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-primary/5 hover:text-primary transition-all duration-200"
                            onClick={() => handleOpenEdit(row.original)}
                        >
                            <Edit className="w-4 h-4" />
                        </Button>
                    </RoleGuard>
                    <RoleGuard permissions={['ROLE_OPTION_ITEM_DELETE']}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-destructive/5 hover:text-destructive transition-all duration-200"
                            onClick={() => handleDelete(row.original)}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </RoleGuard>
                </div>
            )
        }
    ];

    if (!groupId) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] animate-in fade-in duration-700">
                <div className="w-20 h-20 rounded-[2rem] bg-muted/20 flex items-center justify-center mb-6 border border-border/50">
                    <Package className="w-10 h-10 text-muted-foreground/30" />
                </div>
                <h2 className="text-xl font-black italic uppercase tracking-tighter mb-2">Aucun groupe d'options</h2>
                <p className="text-muted-foreground font-medium text-center max-w-sm">
                    Veuillez d'abord sélectionner un groupe d'options pour gérer ses variantes.
                </p>
                <Button
                    onClick={() => navigate('/option-groups')}
                    className="mt-8 rounded-xl font-bold uppercase tracking-widest px-8"
                    variant="outline"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voir les groupes
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Link
                            to="/option-groups"
                            className="w-10 h-10 rounded-2xl bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all shadow-sm border border-border/40 group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                        </Link>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Variantes & Suppléments</span>
                            <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none mt-0.5">
                                {isGroupLoading ? "..." : group?.label || group?.name}
                            </h1>
                        </div>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground max-w-md ml-[52px]">
                        Gérez les choix disponibles et leurs impacts sur le prix pour ce groupe.
                    </p>
                </div>

                <RoleGuard permissions={['ROLE_OPTION_ITEM_CREATE']}>
                    <Button
                        onClick={handleOpenCreate}
                        className="h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest shadow-lg shadow-primary/20 px-6 transition-all hover:scale-[1.02]"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter un choix
                    </Button>
                </RoleGuard>
            </div>

            {/* List */}
            <div className="bg-card/40 backdrop-blur-md rounded-[2.5rem] p-4 shadow-xl shadow-black/5 border border-border/40 overflow-hidden">
                <DataTable
                    columns={columns}
                    data={optionItems}
                    isLoading={isItemsLoading}
                    emptyMessage={
                        <div className="flex flex-col items-center justify-center py-20 opacity-40">
                            <Plus className="w-12 h-12 mb-4" />
                            <p className="text-lg font-bold italic uppercase tracking-tighter">Aucune variante configurée</p>
                        </div>
                    }
                />
            </div>

            {/* Form Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingItem ? "Modifier la variante" : "Ajouter une variante"}
                        </DialogTitle>
                        <DialogDescription>
                            Définissez le nom et l'impact prix de ce choix.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={form.handleSubmit((v) => onSubmit(v))} className="space-y-6 py-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="label">Nom de la variante <span className="text-destructive">*</span></Label>
                                <Input
                                    id="label"
                                    placeholder="Ex : Sauce barbecue, Supplément Fromage..."
                                    className={cn(form.formState.errors.label && "border-destructive")}
                                    {...form.register('label')}
                                />
                                {form.formState.errors.label && (
                                    <p className="text-xs text-destructive">{form.formState.errors.label.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="priceDelta">Impact sur le prix ({currSymbol})</Label>
                                <div className="relative">
                                    <Input
                                        id="priceDelta"
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        className={cn("pl-3", form.formState.errors.priceDelta && "border-destructive")}
                                        {...form.register('priceDelta')}
                                    />
                                </div>
                                {priceAnalysis && (
                                    <div className={cn("flex items-center gap-1.5 text-xs font-medium mt-1.5", priceAnalysis.color)}>
                                        {priceAnalysis.icon}
                                        {priceAnalysis.text}
                                    </div>
                                )}
                                {form.formState.errors.priceDelta && (
                                    <p className="text-xs text-destructive">{form.formState.errors.priceDelta.message}</p>
                                )}
                                <p className="text-[10px] text-muted-foreground italic mt-1">
                                    Positif pour un supplément, négatif pour une réduction.
                                </p>
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                {createMutation.isPending || updateMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <ConfirmDialog
                open={isDeleteModalOpen}
                onOpenChange={setIsDeleteModalOpen}
                title="Supprimer la variante"
                description={
                    <div className="space-y-2">
                        <p>Êtes-vous sûr de vouloir supprimer la variante <span className="font-bold text-foreground italic">{deletingItem?.label || deletingItem?.name}</span> ?</p>
                        <div className="p-3 bg-destructive/5 rounded-xl border border-destructive/10 text-[11px] text-destructive leading-relaxed">
                            <strong>Attention :</strong> Cette action est irréversible et supprimera ce choix des produits associés.
                        </div>
                    </div>
                }
                confirmText="Supprimer définitivement"
                cancelText="Annuler"
                onConfirm={confirmDelete}
                variant="destructive"
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}
