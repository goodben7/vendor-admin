
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Edit,
    Trash2,
    Plus,
    Eye,
    Settings2,
    Search,
    Package,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight
} from 'lucide-react';
import { usePlatformCurrency } from '@/hooks/usePlatformCurrency';


import {
    useOptionGroups,
    useCreateOptionGroup,
    useUpdateOptionGroup,
    useDeleteOptionGroup,
    useProducts
} from '@/hooks/useProducts';
import { OptionGroup } from '@/types/entities';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { SearchableSelect } from '@/components/ui/searchable-select';
import RoleGuard from '@/components/shared/RoleGuard';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { cn } from '@/lib/utils';
// Validation Schema
const formSchema = z.object({
    label: z.string().min(1, "Le nom est requis"),
    isRequired: z.boolean(),
    maxChoices: z.number().min(0, "Le nombre doit être positif"),
    isAvailable: z.boolean(),
    product: z.string().min(1, "Veuillez sélectionner un produit"),
    optionItems: z.array(z.object({
        label: z.string().min(1, "Le nom est requis"),
        priceDelta: z.string(),
        isAvailable: z.boolean()
    })).optional()
}).refine((data) => {
    if (data.isRequired && data.maxChoices === 0) {
        return false;
    }
    return true;
}, {
    message: "Si l'option est obligatoire, le nombre de choix doit être au moins 1",
    path: ["maxChoices"],
});

type FormValues = z.infer<typeof formSchema>;

export default function OptionGroupsList() {
    const navigate = useNavigate();
    const { symbol } = usePlatformCurrency();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<OptionGroup | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [pageSize] = useState(12);

    const [filters, setFilters] = useState({
        label: '',
        product: 'all',
        isRequired: 'all',
        isAvailable: 'all'
    });

    // State for managing new OptionItems in the Create Form
    const [newItemName, setNewItemName] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');

    // Query for products list (limit 100 for dropdown)
    const { data: productsResult } = useProducts({ pageSize: 100 });
    const products = productsResult?.data || [];

    // Prepare API filters - cleaned up
    const apiFilters = {
        label: filters.label || undefined,
        product: filters.product !== 'all' ? filters.product : undefined,
        isRequired: filters.isRequired === 'all' ? undefined : (filters.isRequired === 'true' ? '1' : '0'),
        isAvailable: filters.isAvailable === 'all' ? undefined : (filters.isAvailable === 'true' ? '1' : '0'),
        page,
        pageSize
    };

    const { data: optionGroupsResult, isLoading } = useOptionGroups(apiFilters);
    const optionGroups = optionGroupsResult?.data || [];
    const totalItems = optionGroupsResult?.total || 0;
    const totalPages = Math.ceil(totalItems / pageSize);
    const createMutation = useCreateOptionGroup();
    const updateMutation = useUpdateOptionGroup();
    const deleteMutation = useDeleteOptionGroup();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            label: '',
            isRequired: false,
            maxChoices: 1,
            isAvailable: true,
            optionItems: []
        }
    });

    // Helper to add item to the form's optionItems array
    const handleAddItem = () => {
        if (!newItemName) return;
        const currentItems = form.getValues('optionItems') || [];
        form.setValue('optionItems', [
            ...currentItems,
            { label: newItemName, priceDelta: newItemPrice || '0', isAvailable: true }
        ]);
        setNewItemName('');
        setNewItemPrice('');
    };

    const handleRemoveItem = (index: number) => {
        const currentItems = form.getValues('optionItems') || [];
        const newItems = [...currentItems];
        newItems.splice(index, 1);
        form.setValue('optionItems', newItems);
    };

    const handleOpenCreate = () => {
        setEditingGroup(null);
        form.reset({
            label: '',
            isRequired: false,
            maxChoices: 1,
            isAvailable: true,
            optionItems: [],
            product: '' // Reset product
        });
        setNewItemName('');
        setNewItemPrice('');
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (group: OptionGroup) => {
        setEditingGroup(group);

        // Map product to URI form value
        let productValue = '';
        if (group.product) {
            if (typeof group.product === 'string') {
                productValue = group.product;
            } else if (group.product.id) {
                productValue = `/api/products/${group.product.id}`;
            }
        }

        // Map items to form items
        const rawItems = group.optionItems?.length ? group.optionItems : (group.items || []);
        const formItems = rawItems.map(item => ({
            label: item.label || item.name,
            priceDelta: item.priceDelta || item.price?.toString() || '0',
            isAvailable: item.isAvailable !== false
        }));

        form.reset({
            label: group.label || group.name,
            isRequired: group.isRequired,
            maxChoices: group.maxChoices,
            isAvailable: group.isAvailable !== false,
            product: productValue,
            optionItems: formItems
        });
        setNewItemName('');
        setNewItemPrice('');
        setIsDialogOpen(true);
    };

    const onSubmit = (values: FormValues) => {
        if (editingGroup) {
            updateMutation.mutate({
                id: editingGroup.id,
                data: values as any,
            }, {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    // Toast handled by hook
                }
            });
        } else {
            createMutation.mutate(values as any, {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    // Toast handled by hook
                }
            });
        }
    };

    const handleDelete = async () => {
        if (deleteId) {
            await deleteMutation.mutateAsync(deleteId);
            setDeleteId(null);
        }
    };

    // Helper for maxChoices validation display
    const isRequired = form.watch('isRequired');

    const getProductName = (productData: any) => {
        if (!productData) return 'Produit non défini';

        if (typeof productData === 'object') {
            return productData.name || productData.label || 'Sans nom';
        }

        const productId = String(productData).split('/').pop();
        const found = products.find(p =>
            p.id === productId ||
            (p as any)['@id'] === productData ||
            (p as any).id === productId
        );

        return found ? (found.name || found.label) : 'Chargement...';
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            {/* 1. Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                            <Settings2 className="w-5 h-5" />
                        </div>
                        <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Options & Variantes</h1>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground max-w-md">
                        Configurez les règles de personnalisation et les suppléments pour vos articles.
                    </p>
                </div>

                <RoleGuard permissions={['ROLE_OPTION_GROUP_CREATE']}>
                    <Button
                        onClick={handleOpenCreate}
                        className="h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest shadow-lg shadow-primary/20 px-6 transition-all hover:scale-[1.02]"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nouveau groupe
                    </Button>
                </RoleGuard>
            </div>

            {/* 2. Filters Section */}
            <div className="bg-card/40 backdrop-blur-md rounded-3xl p-4 shadow-xl shadow-black/5 border border-border/40 space-y-4">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="relative group flex-1 min-w-[240px]">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 transition-colors group-focus-within:text-primary" />
                        <Input
                            placeholder="Rechercher une option..."
                            value={filters.label}
                            onChange={(e) => {
                                setFilters(prev => ({ ...prev, label: e.target.value }));
                                setPage(0);
                            }}
                            className="pl-10 h-10 rounded-xl bg-muted/40 border-none focus-visible:ring-primary/20 transition-all font-medium text-sm"
                        />
                    </div>

                    <div className="w-[200px]">
                        <SearchableSelect
                            value={filters.product}
                            onChange={(val) => {
                                setFilters(prev => ({ ...prev, product: val }));
                                setPage(0);
                            }}
                            options={[
                                { label: "Tous les produits", value: "all" },
                                ...products.map((p) => ({
                                    label: p.name,
                                    value: p.id
                                }))
                            ]}
                            placeholder="Produit lié"
                            searchPlaceholder="Rechercher un produit..."
                            className="h-10 rounded-xl bg-muted/40 border-none focus-visible:ring-primary/20 font-bold text-xs uppercase"
                        />
                    </div>

                    <Select
                        value={filters.isRequired}
                        onValueChange={(val) => {
                            setFilters(prev => ({ ...prev, isRequired: val }));
                            setPage(0);
                        }}
                    >
                        <SelectTrigger className="w-[150px] h-10 rounded-xl bg-muted/40 border-none focus:ring-primary/20 font-bold text-xs uppercase tracking-wider">
                            <SelectValue placeholder="Obligatoire ?" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-2xl">
                            <SelectItem value="all" className="font-bold">Tous (Oblig.)</SelectItem>
                            <SelectItem value="true">Oui</SelectItem>
                            <SelectItem value="false">Non</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.isAvailable}
                        onValueChange={(val) => {
                            setFilters(prev => ({ ...prev, isAvailable: val }));
                            setPage(0);
                        }}
                    >
                        <SelectTrigger className="w-[150px] h-10 rounded-xl bg-muted/40 border-none focus:ring-primary/20 font-bold text-xs uppercase tracking-wider">
                            <SelectValue placeholder="Disponibilité" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-2xl">
                            <SelectItem value="all" className="font-bold">Tous (Dispo.)</SelectItem>
                            <SelectItem value="true">Disponible</SelectItem>
                            <SelectItem value="false">Indisponible</SelectItem>
                        </SelectContent>
                    </Select>

                    {(filters.label || filters.product !== 'all' || filters.isRequired !== 'all' || filters.isAvailable !== 'all') && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setFilters({ label: '', product: 'all', isRequired: 'all', isAvailable: 'all' });
                                setPage(0);
                            }}
                            className="h-8 rounded-lg text-destructive hover:bg-destructive/5 font-bold text-[10px] uppercase tracking-widest"
                        >
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            Réinitialiser
                        </Button>
                    )}
                </div>
            </div>

            {/* 2. Liste des groupes d’options (Cards) */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-48 rounded-3xl bg-card/40 animate-pulse border border-border/40" />
                    ))}
                </div>
            ) : (!optionGroups || optionGroups.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-20 bg-card/40 backdrop-blur-md rounded-[2.5rem] border border-border/40 border-dashed">
                    <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-6 border border-primary/10">
                        <Settings2 className="w-10 h-10 text-primary/40" />
                    </div>
                    <h3 className="text-xl font-black italic uppercase tracking-tight text-foreground">Aucune option configurée</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm text-center font-medium">
                        Commencez par ajouter un groupe d'options pour vos produits personnalisables.
                    </p>
                    <Button
                        onClick={handleOpenCreate}
                        className="mt-8 h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest shadow-lg shadow-primary/20 px-8 transition-all hover:scale-[1.05]"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Créer mon premier groupe
                    </Button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {optionGroups.map((group: OptionGroup) => (
                            <Card key={group.id} className="group relative overflow-hidden rounded-3xl border-border/40 hover:border-primary/40 bg-card/40 backdrop-blur-md transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1">
                                <div className="absolute top-0 right-0 p-4">
                                    <div className={cn(
                                        "w-2.5 h-2.5 rounded-full ring-4 ring-background",
                                        group.isAvailable !== false ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" : "bg-destructive"
                                    )} title={group.isAvailable !== false ? "Disponible" : "Indisponible"} />
                                </div>

                                <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                                    <div className="space-y-2">
                                        <CardTitle className="text-lg font-black tracking-tighter uppercase italic group-hover:text-primary transition-colors">
                                            {group.label || group.name}
                                        </CardTitle>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Package className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-black uppercase tracking-widest truncate">
                                                {getProductName(group.product)}
                                            </span>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="py-6 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Contrainte</span>
                                            {group.isRequired ? (
                                                <Badge className="block bg-destructive/10 text-destructive border-none rounded-lg text-[9px] font-black uppercase tracking-widest px-2 py-1">
                                                    Obligatoire
                                                </Badge>
                                            ) : (
                                                <Badge className="block bg-muted text-muted-foreground border-none rounded-lg text-[9px] font-black uppercase tracking-widest px-2 py-1">
                                                    Optionnel
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Variantes</span>
                                            <p className="text-sm font-black text-foreground">
                                                {group.optionItems?.length || group.items?.length || 0}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-primary/5 rounded-2xl border border-primary/10">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-primary/60 uppercase tracking-tight">Mode sélection</span>
                                            <span className="font-black text-primary uppercase italic">
                                                {(group.maxChoices || 0) === 1 ? 'Unique' : (group.maxChoices || 0) > 1 ? `Max ${group.maxChoices}` : 'Illimité'}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>

                                <CardFooter className="pt-0 flex items-center justify-between p-4 bg-muted/20 border-t border-border/40">
                                    <RoleGuard permissions={['ROLE_OPTION_GROUP_UPDATE']}>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-9 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all"
                                            onClick={() => handleOpenEdit(group)}
                                        >
                                            <Edit className="w-3.5 h-3.5 mr-2" />
                                            Gérer
                                        </Button>
                                    </RoleGuard>

                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
                                            onClick={() => navigate(`/option-items?groupId=${group.id}`)}
                                            title="Voir les variantes"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                        <RoleGuard permissions={['ROLE_OPTION_GROUP_DELETE']}>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => setDeleteId(group.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </RoleGuard>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 pt-6 border-t border-border/40 px-4">
                            <div className="text-sm font-bold text-muted-foreground/60 tracking-tight order-2 sm:order-1">
                                Page <span className="text-foreground">{page + 1}</span> sur <span className="text-foreground">{totalPages}</span>
                                <span className="mx-2 opacity-50">•</span>
                                ({totalItems} options)
                            </div>

                            <div className="flex items-center gap-2 order-1 sm:order-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setPage(0)}
                                    disabled={page === 0}
                                    className="w-10 h-10 rounded-xl bg-background/50 border-border/50 hover:bg-primary/10 hover:border-primary/30 transition-all font-bold"
                                >
                                    <ChevronsLeft className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setPage(prev => prev - 1)}
                                    disabled={page === 0}
                                    className="w-10 h-10 rounded-xl bg-background/50 border-border/50 hover:bg-primary/10 hover:border-primary/30 transition-all font-bold"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>

                                <div className="flex items-center px-4 h-10 rounded-xl bg-primary/10 border border-primary/20 transition-all shadow-inner">
                                    <span className="text-sm font-black text-primary">{page + 1}</span>
                                </div>

                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setPage(prev => prev + 1)}
                                    disabled={page >= totalPages - 1}
                                    className="w-10 h-10 rounded-xl bg-background/50 border-border/50 hover:bg-primary/10 hover:border-primary/30 transition-all font-bold"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setPage(totalPages - 1)}
                                    disabled={page >= totalPages - 1}
                                    className="w-10 h-10 rounded-xl bg-background/50 border-border/50 hover:bg-primary/10 hover:border-primary/30 transition-all font-bold"
                                >
                                    <ChevronsRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )
            }

            {/* 3. Formulaire Création / Modification (Modal) */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingGroup ? "Modifier l'option" : "Ajouter une option"}
                        </DialogTitle>
                        <DialogDescription>
                            Configurez les règles de personnalisation pour ce groupe d'options.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                        <div className="space-y-4">
                            {/* Label */}
                            <div className="space-y-2">
                                <Label htmlFor="label" className="text-sm font-medium">
                                    Nom de l'option <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="label"
                                    placeholder="Ex : Sauces, Cuisson..."
                                    className={cn(form.formState.errors.label && "border-red-500 focus-visible:ring-red-500")}
                                    {...form.register('label')}
                                />
                                {form.formState.errors.label && (
                                    <p className="text-xs text-red-500">{form.formState.errors.label.message}</p>
                                )}
                            </div>

                            {/* Product */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                    Produit <span className="text-destructive">*</span>
                                </Label>
                                <SearchableSelect
                                    value={form.watch('product')}
                                    onChange={(value) => form.setValue('product', value)}
                                    options={products.map((p) => ({
                                        label: p.name,
                                        value: `/api/products/${p.id}`
                                    }))}
                                    placeholder="Sélectionner un produit"
                                    searchPlaceholder="Rechercher un produit..."
                                    disabled={!!editingGroup}
                                    className={cn(form.formState.errors.product && "border-red-500 focus-visible:ring-red-500")}
                                />
                                {form.formState.errors.product && (
                                    <p className="text-xs text-red-500">{form.formState.errors.product.message}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                {/* IsRequired */}
                                <div className="flex flex-row items-center justify-between rounded-lg border border-border p-4 shadow-sm bg-muted/20">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-medium">Obligatoire</Label>
                                        <p className="text-xs text-muted-foreground">Le client doit choisir</p>
                                    </div>
                                    <Switch
                                        checked={form.watch('isRequired')}
                                        onCheckedChange={(checked) => {
                                            form.setValue('isRequired', checked);
                                            // Auto-adjust maxChoices min value logic visual feedback if needed
                                            if (checked && form.getValues('maxChoices') < 1) {
                                                form.setValue('maxChoices', 1);
                                            }
                                        }}
                                    />
                                </div>

                                {/* IsAvailable */}
                                <div className="flex flex-row items-center justify-between rounded-lg border border-border p-4 shadow-sm bg-muted/20">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-medium">Disponible</Label>
                                        <p className="text-xs text-muted-foreground">Visible sur la carte</p>
                                    </div>
                                    <Switch
                                        checked={form.watch('isAvailable')}
                                        onCheckedChange={(checked) => form.setValue('isAvailable', checked)}
                                        className="data-[state=checked]:bg-green-500"
                                    />
                                </div>
                            </div>

                            {/* Max Choices */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="maxChoices" className="text-sm font-medium">
                                        Nombre maximum de choix
                                    </Label>
                                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                        {form.watch('maxChoices') === 1 ? 'Choix unique' : 'Choix multiple'}
                                    </span>
                                </div>
                                <Input
                                    id="maxChoices"
                                    type="number"
                                    min={isRequired ? 1 : 0}
                                    className={cn(form.formState.errors.maxChoices && "border-red-500 focus-visible:ring-red-500")}
                                    {...form.register('maxChoices', { valueAsNumber: true })}
                                />
                                {form.formState.errors.maxChoices ? (
                                    <p className="text-xs text-red-500">{form.formState.errors.maxChoices.message}</p>
                                ) : (
                                    <p className="text-xs text-muted-foreground">
                                        {isRequired ? "Minimum 1 choix requis." : "0 = Illimité (si non obligatoire)."}
                                    </p>
                                )}
                            </div>

                            {/* Option Items Management (Only for CREATE usually, or handled differently on Edit) */}
                            <div className="space-y-4 pt-4 border-t border-border">
                                <Label className="text-sm font-medium">Variantes de l'option</Label>

                                <div className="flex gap-2 items-end bg-muted/30 p-3 rounded-lg border border-dashed border-border">
                                    <div className="flex-1 space-y-1">
                                        <Label htmlFor="newItemName" className="text-xs text-muted-foreground">Nom</Label>
                                        <Input
                                            id="newItemName"
                                            value={newItemName}
                                            onChange={(e) => setNewItemName(e.target.value)}
                                            placeholder="Ex: Saignante"
                                            className="h-9 bg-background"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddItem();
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="w-24 space-y-1">
                                        <Label htmlFor="newItemPrice" className="text-xs text-muted-foreground">Prix (+)</Label>
                                        <Input
                                            id="newItemPrice"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={newItemPrice}
                                            onChange={(e) => setNewItemPrice(e.target.value)}
                                            placeholder="0.00"
                                            className="h-9 bg-background"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddItem();
                                                }
                                            }}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={handleAddItem}
                                        disabled={!newItemName}
                                        size="sm"
                                        className="h-9 w-9 p-0 shrink-0"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>

                                {/* List of added items */}
                                {form.watch('optionItems')?.length ? (
                                    <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                                        {form.watch('optionItems')?.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-card border border-border rounded-md shadow-sm text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{item.label}</span>
                                                    {parseFloat(item.priceDelta) > 0 && (
                                                        <Badge variant="secondary" className="text-xs px-1 py-0 h-5 bg-muted">
                                                            +{item.priceDelta}{symbol}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRemoveItem(idx)}
                                                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground italic text-center py-2">
                                        Aucune variante ajoutée pour le moment.
                                    </p>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-primary">
                                {createMutation.isPending || updateMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
                title="Supprimer l'option"
                description="Êtes-vous sûr de vouloir supprimer cette option ? Cette action est irréversible."
                confirmText="Supprimer"
                cancelText="Annuler"
                variant="destructive"
                onConfirm={handleDelete}
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}
