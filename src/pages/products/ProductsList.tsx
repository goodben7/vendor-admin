import { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
    Plus,
    LayoutGrid,
    List,
    MoreHorizontal,
    Search,

    Trash2,
    Power,
    Edit,
    Package,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProducts, useUpdateProduct, useDeleteProduct } from '@/hooks/useProducts';
import { Product } from '@/types/entities';
import DataTable from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import RoleGuard from '@/components/shared/RoleGuard';
import { ProductFilters } from '@/components/products/ProductFilters';
import { ProductGridItem } from '@/components/products/ProductGridItem';
import { useDebounce } from '@/hooks/useDebounce';
import { ProductStats } from '@/components/products/ProductStats';

import { Switch } from '@/components/ui/switch';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { usePlatformCurrency } from '@/hooks/usePlatformCurrency';

export default function ProductsList() {
    const navigate = useNavigate();
    const { symbol: currSymbol } = usePlatformCurrency();
    const [page, setPage] = useState(0);
    const pageSize = 10;
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    // Filters state
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);
    const [category, setCategory] = useState('all');
    const [availability, setAvailability] = useState('all');
    const [sort, setSort] = useState('newest');

    // Selection State - Not yet fully connected to DataTable but prepared
    const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});

    const updateMutation = useUpdateProduct();
    const deleteMutation = useDeleteProduct();


    const filters = useMemo(() => {
        const f: any = { page, pageSize };
        if (debouncedSearch) f.label = debouncedSearch;
        if (category !== 'all') f.category = category; // Assuming category is the ID or IRI


        if (sort === 'newest') f['order[createdAt]'] = 'desc';
        if (sort === 'price_asc') f['order[price]'] = 'asc';
        if (sort === 'price_desc') f['order[price]'] = 'desc';
        if (sort === 'name_asc') f['order[label]'] = 'asc';

        return f;
    }, [page, pageSize, debouncedSearch, category, availability, sort]);

    const { data, isLoading } = useProducts(filters);

    // Client-side filtering as fallback for API issue
    const rawProducts = data?.data || [];
    const products = useMemo(() => {
        if (availability === 'all') return rawProducts;
        return rawProducts.filter(p => availability === 'available' ? p.isAvailable : !p.isAvailable);
    }, [rawProducts, availability]);

    const totalItems = data?.total || 0; // Total form API might be inaccurate if filtered locally, but keeps pagination working somewhat

    // Derived Stats
    const stats = useMemo(() => {
        if (!products) return { totalProducts: 0, activeProducts: 0, outOfStockProducts: 0, productsWithOptions: 0 };
        return {
            totalProducts: totalItems,
            activeProducts: products.filter(p => p.isAvailable).length,
            outOfStockProducts: products.filter(p => !p.isAvailable).length,
            productsWithOptions: products.filter(p => p.optionGroups && p.optionGroups.length > 0).length
        };
    }, [products, totalItems]);

    const handleBulkDelete = () => {
        const ids = Object.keys(selectedRows).filter(id => selectedRows[id]);
        if (ids.length === 0) return;

        if (window.confirm(`Supprimer ${ids.length} produits ?`)) {
            ids.forEach(id => deleteMutation.mutate(id));
            setSelectedRows({});
            toast.success(`${ids.length} produits supprimés`);
        }
    };

    const handleQuickStatusToggle = (product: Product) => {
        // Prepare full payload to satisfy backend constraints
        const { id, createdAt, updatedAt, optionGroups, category, ...rest } = product;

        const payload: any = {
            ...rest,
            label: product.label || product.name || '',
            description: product.description,
            basePrice: product.basePrice || String(product.price),
            isAvailable: !product.isAvailable,
        };

        // Handle relation fields
        if (category) {
            payload.category = (typeof category === 'object' && category)
                ? (category as any)['@id'] || `/api/categories/${category.id}`
                : category;
        }

        updateMutation.mutate({
            id: product.id,
            data: payload
        });
    };



    const columns: ColumnDef<Product>[] = [
        {
            accessorKey: 'image',
            header: 'Produit',
            cell: ({ row }) => (
                <div className="flex items-center gap-4 py-2 group">
                    <div className="h-12 w-12 rounded-xl bg-primary/5 flex-shrink-0 flex items-center justify-center overflow-hidden border border-primary/10 shadow-sm transition-transform duration-300 group-hover:scale-105">
                        {(row.original.contentUrl || row.original.imageUrl) ? (
                            <img src={row.original.contentUrl || row.original.imageUrl} alt={row.original.name} className="h-full w-full object-cover" />
                        ) : (
                            <Package className="w-5 h-5 text-primary/40" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <p className="font-bold text-foreground text-sm leading-tight">{row.original.name}</p>
                        {row.original.description && (
                            <p className="text-[10px] text-muted-foreground/60 line-clamp-1 mt-0.5 max-w-[200px] font-semibold">{row.original.description}</p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'category',
            header: 'Catégorie',
            cell: ({ row }) => {
                const category = row.original.category;
                const categoryLabel = (typeof category === 'object' && category !== null)
                    ? (category.label || category.name || '-')
                    : '-';

                return (
                    <Badge variant="secondary" className="bg-primary/5 text-primary hover:bg-primary/10 border-primary/10 font-bold uppercase tracking-wider text-[10px] px-2.5 py-1 rounded-lg">
                        {categoryLabel}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'price',
            header: 'Prix',
            cell: ({ row }) => (
                <div className="font-black text-primary text-base tabular-nums">
                    {Number(row.original.price).toFixed(2)} {currSymbol}
                </div>
            ),
        },
        {
            accessorKey: 'isAvailable',
            header: 'Statut',
            cell: ({ row }) => (
                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-3 bg-muted/20 p-1.5 pr-3 rounded-full border border-border/50">
                        <Switch
                            checked={row.original.isAvailable}
                            onCheckedChange={() => handleQuickStatusToggle(row.original)}
                            className="scale-75 data-[state=checked]:bg-emerald-500"
                        />
                        <span className={`text-[10px] font-black uppercase tracking-wider ${row.original.isAvailable ? 'text-emerald-600' : 'text-muted-foreground/60'}`}>
                            {row.original.isAvailable ? 'En vente' : 'Masqué'}
                        </span>
                    </div>
                </div>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <RoleGuard permissions={['ROLE_PRODUCT_UPDATE']}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-xl hover:bg-primary/10 transition-colors"
                            onClick={(e) => { e.stopPropagation(); navigate(`/products/${row.original.id}/edit`); }}
                        >
                            <Edit className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        </Button>
                    </RoleGuard>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" className="h-9 w-9 p-0 hover:bg-muted rounded-xl">
                                <span className="sr-only">Menu</span>
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[200px] rounded-2xl border-none shadow-2xl p-2">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-2 py-2">Options avancées</DropdownMenuLabel>
                            <DropdownMenuItem className="rounded-xl font-bold gap-3" onClick={() => handleQuickStatusToggle(row.original)}>
                                <Power className="h-4 w-4" /> {row.original.isAvailable ? 'Masquer du menu' : 'Mettre en vente'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-muted" />
                            <DropdownMenuItem
                                onClick={() => {
                                    if (window.confirm('Supprimer définitivement ce produit ?')) deleteMutation.mutate(row.original.id);
                                }}
                                className="rounded-xl font-bold gap-3 text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4" /> Supprimer
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
                <div>
                    <h1 className="text-3xl font-black italic tracking-tighter uppercase underline decoration-primary/30 underline-offset-8">Produits</h1>
                    <p className="text-muted-foreground mt-2 max-w-lg">
                        Gérez votre catalogue, configurez les options et suivez la disponibilité de vos articles en temps réel.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <div className="flex bg-muted/50 p-1 rounded-lg border border-border">
                        <Button
                            variant={viewMode === 'list' ? 'default' : 'ghost'}
                            size="sm"
                            className={`h-8 px-3 text-xs font-medium transition-all ${viewMode === 'list' ? 'shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            onClick={() => setViewMode('list')}
                        >
                            <List className="h-3.5 w-3.5 mr-2" /> Liste
                        </Button>
                        <Button
                            variant={viewMode === 'grid' ? 'default' : 'ghost'}
                            size="sm"
                            className={`h-8 px-3 text-xs font-medium transition-all ${viewMode === 'grid' ? 'shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            onClick={() => setViewMode('grid')}
                        >
                            <LayoutGrid className="h-3.5 w-3.5 mr-2" /> Cartes
                        </Button>
                    </div>



                    <RoleGuard permissions={['ROLE_PRODUCT_CREATE']}>
                        <Button
                            onClick={() => navigate('/products/create')}
                            className="w-full sm:w-auto h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest shadow-lg shadow-primary/20 px-8 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Plus className="w-5 h-5 mr-3" />
                            Ajouter un produit
                        </Button>
                    </RoleGuard>
                </div>
            </div>

            {/* KPI Stats */}
            <ProductStats {...stats} isLoading={isLoading} />

            {/* Main Content Card */}
            <div className="bg-card rounded-[2rem] border border-border/40 shadow-xl shadow-black/5 overflow-hidden">
                {/* Filters Bar */}
                <div className="p-6 border-b border-border/50 bg-muted/20 backdrop-blur-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
                    <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto flex-1">
                        <div className="relative w-full max-w-sm group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Rechercher par nom..."
                                className="pl-11 h-12 bg-background border-border/50 focus:ring-primary/20 rounded-xl font-bold"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <ProductFilters
                            category={category}
                            onCategoryChange={setCategory}
                            availability={availability}
                            onAvailabilityChange={setAvailability}
                            sort={sort}
                            onSortChange={setSort}
                        />
                    </div>
                </div>

                {/* Bulk Actions (Visible only when selected) */}
                {Object.keys(selectedRows).length > 0 && (
                    <div className="bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center justify-between mb-4 mx-4 animate-in slide-in-from-bottom-2 fade-in">
                        <div className="text-sm font-medium">
                            {Object.keys(selectedRows).length} sélectionné(s)
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-white hover:bg-white/10 h-8"
                                onClick={() => setSelectedRows({})}
                            >
                                Annuler
                            </Button>
                            <div className="h-4 w-px bg-white/20 mx-1" />
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-300 hover:text-red-100 hover:bg-red-900/50 h-8"
                                onClick={handleBulkDelete}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Supprimer
                            </Button>
                        </div>
                    </div>
                )}

                {/* Content */}
                {isLoading ? (
                    <div className="p-8 space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center gap-4 animate-pulse">
                                <div className="h-12 w-12 bg-muted rounded-full" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 w-1/3 bg-muted rounded" />
                                    <div className="h-3 w-1/4 bg-muted rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-muted/10">
                        <div className="h-20 w-20 bg-background rounded-full flex items-center justify-center shadow-sm mb-6 border border-border">
                            <Plus className="h-10 w-10 text-muted-foreground/30" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground">Aucun produit trouvé</h3>
                        <p className="text-muted-foreground mt-2 max-w-md text-center">
                            Il semble que vous n'ayez pas encore de produits correspondant à vos critères.
                        </p>
                        <Button
                            onClick={() => navigate('/products/create')}
                            className="mt-8 h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest shadow-lg shadow-primary/20 px-8 transition-all hover:scale-[1.05]"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Créer mon premier produit
                        </Button>
                    </div>
                ) : viewMode === 'list' ? (
                    <div className="overflow-x-auto">
                        <DataTable
                            columns={columns}
                            data={products}
                            isLoading={isLoading}
                            hidePagination={true}
                            rowSelection={selectedRows}
                            onRowSelectionChange={setSelectedRows}
                            emptyMessage="Aucun produit trouvé"
                        />
                    </div>
                ) : (
                    <div className="flex flex-col">
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {products.map((product) => (
                                <ProductGridItem key={product.id} product={product} />
                            ))}
                        </div>
                        {totalItems > pageSize && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/5">
                                <div className="text-sm text-muted-foreground">
                                    Page {page + 1} sur {Math.ceil(totalItems / pageSize)} ({totalItems} produits)
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(Math.max(0, page - 1))}
                                        disabled={page === 0}
                                    >
                                        Précédent
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(page + 1)}
                                        disabled={(page + 1) * pageSize >= totalItems}
                                    >
                                        Suivant
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* External Pagination */}
            {data && data.total > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-2 border-t border-border/50 pt-6">
                    <div className="text-sm font-bold text-muted-foreground/60 tracking-tight">
                        Page <span className="text-foreground">{page + 1}</span> sur <span className="text-foreground">{Math.ceil(data.total / pageSize)}</span>
                        <span className="mx-2 opacity-50">•</span>
                        ({data.total} produits)
                    </div>

                    <div className="flex items-center gap-2">
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
                            onClick={() => setPage(Math.max(0, page - 1))}
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
                            onClick={() => setPage(page + 1)}
                            disabled={(page + 1) * pageSize >= data.total}
                            className="w-10 h-10 rounded-xl bg-background/50 border-border/50 hover:bg-primary/10 hover:border-primary/30 transition-all font-bold"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setPage(Math.ceil(data.total / pageSize) - 1)}
                            disabled={(page + 1) * pageSize >= data.total}
                            className="w-10 h-10 rounded-xl bg-background/50 border-border/50 hover:bg-primary/10 hover:border-primary/30 transition-all font-bold"
                        >
                            <ChevronsRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
