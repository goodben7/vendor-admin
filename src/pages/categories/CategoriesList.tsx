import { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
    Edit, Trash2, Plus, Search, Filter, Tag, Layers, Layout,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    CheckCircle2, XCircle, Hash, RefreshCw
} from 'lucide-react';

import { useCategories, useDeleteCategory } from '@/hooks/useProducts';
import { useMenus } from '@/hooks/useMenus';
import { Category } from '@/types/entities';
import DataTable from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RoleGuard from '@/components/shared/RoleGuard';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import CategoryFormSheet from './CategoryFormSheet';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

// ── KPI Card ─────────────────────────────────────────────────────
function KpiCard({
    label, value, sub, icon: Icon, iconBg, iconColor, valueCls = ''
}: {
    label: string;
    value: string;
    sub?: string;
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    valueCls?: string;
}) {
    return (
        <div className="relative overflow-hidden rounded-3xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 p-6 flex items-center gap-5 group">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110", iconBg)}>
                <Icon className={cn("w-6 h-6", iconColor)} />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground leading-none mb-2">{label}</p>
                <p className={cn("text-2xl font-black leading-none tracking-tight truncate", valueCls)}>{value}</p>
                {sub && <p className="text-xs text-muted-foreground font-semibold mt-1.5">{sub}</p>}
            </div>
            <div className={cn("absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-10", iconBg)} />
        </div>
    );
}

export default function CategoriesList() {
    const [page, setPage] = useState(0);
    const [pageSize] = useState(10);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 500);
    const [activeFilter, setActiveFilter] = useState('all');
    const [menuFilter, setMenuFilter] = useState('all');

    const filters: any = { page, pageSize };
    if (debouncedSearch) filters.label = debouncedSearch;
    if (activeFilter !== 'all') filters.active = activeFilter === 'true' ? '1' : '0';
    if (menuFilter !== 'all') filters.menu = menuFilter;

    const { data: menusData } = useMenus({ pageSize: 100 });
    const { data, isLoading, isFetching, refetch } = useCategories(filters);
    const deleteMutation = useDeleteCategory();

    const categories = data?.data || [];
    const total = data?.total || 0;
    const menus = menusData?.data || [];

    // KPIs based on current view
    const kpis = useMemo(() => {
        const active = categories.filter(c => c.active ?? (c as any).isAvailable).length;
        const hasMenu = categories.filter(c => c.menu).length;
        const hidden = categories.length - active;
        return { active, hasMenu, hidden };
    }, [categories]);

    const handleDelete = async () => {
        if (deleteId) {
            await deleteMutation.mutateAsync(deleteId);
            setDeleteId(null);
        }
    };

    const handleCreate = () => {
        setSelectedCategoryId(null);
        setIsSheetOpen(true);
    };

    const handleEdit = (id: string) => {
        setSelectedCategoryId(id);
        setIsSheetOpen(true);
    };

    const columns: ColumnDef<Category>[] = [
        {
            accessorKey: 'label',
            header: 'Catégorie',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
                        <Tag className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="font-bold text-base leading-tight">
                            {row.original.label || row.original.name}
                        </p>
                        {row.original.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 font-medium mt-0.5">
                                {row.original.description}
                            </p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            id: 'menu',
            header: 'Menu Source',
            cell: ({ row }) => {
                const menu = row.original.menu;
                if (!menu) return <span className="text-muted-foreground italic text-xs font-medium">Non assigné</span>;

                const menuLabel = typeof menu === 'object'
                    ? (menu.label || menu.name || 'Menu')
                    : 'Menu';

                return (
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center">
                            <Layers className="w-3 h-3 text-muted-foreground" />
                        </div>
                        <span className="font-bold text-sm tracking-tight">{menuLabel}</span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'position',
            header: 'Ordre',
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest">Pos.</span>
                    <span className="font-bold text-sm">{row.original.position ?? '0'}</span>
                </div>
            ),
        },
        {
            accessorKey: 'active',
            header: 'Visibilité',
            cell: ({ row }) => {
                const isActive = row.original.active ?? row.original.isAvailable;
                return (
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition-colors ${isActive
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                        : 'bg-muted text-muted-foreground border-border'
                        }`}>
                        {isActive ? 'Actif' : 'Masqué'}
                    </span>
                );
            },
        },

        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <RoleGuard permissions={['ROLE_CATEGORY_UPDATE']}>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(row.original.id)}
                            className="hover:bg-primary/10 transition-colors"
                            title="Modifier"
                        >
                            <Edit className="w-4 h-4 text-muted-foreground hover:text-primary" />
                        </Button>
                    </RoleGuard>
                    <RoleGuard permissions={['ROLE_CATEGORY_DELETE']}>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(row.original.id)}
                            className="hover:bg-destructive/10 transition-colors"
                            title="Supprimer"
                        >
                            <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                    </RoleGuard>
                </div>
            ),
        },
    ];

    const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-black italic tracking-tighter uppercase underline decoration-primary/30 underline-offset-8">
                            Catégories
                        </h1>
                        {isFetching && <RefreshCw className="w-4 h-4 animate-spin text-primary" />}
                    </div>
                    <p className="text-muted-foreground text-sm font-medium mt-4">
                        Gérez l'organisation de vos produits et menus ({total} au total)
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <RoleGuard permissions={['ROLE_CATEGORY_CREATE']}>
                        <Button
                            onClick={handleCreate}
                            className="h-11 gap-2 rounded-xl font-black uppercase tracking-wider shadow-md bg-primary hover:bg-primary/90 transition-all active:scale-95"
                        >
                            <Plus className="w-5 h-5 stroke-[3]" />
                            Nouvelle catégorie
                        </Button>
                    </RoleGuard>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 rounded-xl hover:bg-primary/5 shadow-sm"
                        onClick={() => refetch()}
                    >
                        <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    label="Catégories affichées"
                    value={String(categories.length)}
                    sub={`sur ${total} au total`}
                    icon={Hash}
                    iconBg="bg-primary/15"
                    iconColor="text-primary"
                    valueCls="text-primary"
                />
                <KpiCard
                    label="Actives"
                    value={String(kpis.active)}
                    sub="Visibles par les clients"
                    icon={CheckCircle2}
                    iconBg="bg-emerald-500/15"
                    iconColor="text-emerald-600 dark:text-emerald-400"
                    valueCls="text-emerald-600 dark:text-emerald-400"
                />
                <KpiCard
                    label="Assignées à un Menu"
                    value={String(kpis.hasMenu)}
                    sub="Organisation complète"
                    icon={Layers}
                    iconBg="bg-blue-500/15"
                    iconColor="text-blue-600 dark:text-blue-400"
                    valueCls="text-blue-600 dark:text-blue-400"
                />
                <KpiCard
                    label="Masquées"
                    value={String(kpis.hidden)}
                    sub="En attente/Privé"
                    icon={XCircle}
                    iconBg="bg-muted"
                    iconColor="text-muted-foreground"
                    valueCls="text-muted-foreground"
                />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors w-4 h-4" />
                    <Input
                        placeholder="Rechercher par libellé..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-12 pl-10 bg-background/50 border-border/50 rounded-xl font-bold focus:border-primary/50 focus:ring-primary/20"
                    />
                </div>
                <div className="flex flex-wrap gap-4">
                    <Select value={menuFilter} onValueChange={setMenuFilter}>
                        <SelectTrigger className="w-[180px] h-12 bg-background/50 rounded-xl border-border/50 font-bold focus:ring-primary/20">
                            <div className="flex items-center gap-2">
                                <Layout className="w-4 h-4 text-primary" />
                                <SelectValue placeholder="Tous les menus" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                            <SelectItem value="all" className="font-bold">Tous les menus</SelectItem>
                            {menus.map((menu) => (
                                <SelectItem key={menu.id} value={`/api/menus/${menu.id}`} className="font-medium py-3">
                                    {menu.label || menu.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={activeFilter} onValueChange={setActiveFilter}>
                        <SelectTrigger className="w-[160px] h-12 bg-background/50 rounded-xl border-border/50 font-bold focus:ring-primary/20">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-primary" />
                                <SelectValue placeholder="Visibilité" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                            <SelectItem value="all" className="font-bold">Tous statuts</SelectItem>
                            <SelectItem value="true" className="font-bold text-emerald-600 py-3">Public (Actif)</SelectItem>
                            <SelectItem value="false" className="font-bold text-muted-foreground py-3">Masqué (Inactif)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-card/50 backdrop-blur-sm rounded-3xl border border-border/40 overflow-hidden shadow-xl shadow-black/5">
                <DataTable
                    columns={columns}
                    data={data?.data || []}
                    isLoading={isLoading}
                    pagination={{
                        pageIndex: page,
                        pageSize,
                        total: data?.total || 0,
                        onPageChange: setPage,
                        onPageSizeChange: () => { },
                    }}
                    hidePagination={true}
                    emptyMessage="Aucune catégorie trouvée"
                />
            </div>

            {/* Pagination Extérieure */}
            {data && data.total > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-2">
                    <div className="text-sm font-bold text-muted-foreground/60 tracking-tight">
                        Page <span className="text-foreground">{page + 1}</span> sur <span className="text-foreground">{totalPages}</span>
                        <span className="mx-2 opacity-50">•</span>
                        ({data.total} résultats)
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
                            onClick={() => setPage(page - 1)}
                            disabled={page === 0}
                            className="w-10 h-10 rounded-xl bg-background/50 border-border/50 hover:bg-primary/10 hover:border-primary/30 transition-all font-bold"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>

                        <div className="flex items-center px-4 h-10 rounded-xl bg-primary/10 border border-primary/20 transition-all">
                            <span className="text-sm font-black text-primary">{page + 1}</span>
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setPage(page + 1)}
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

            {/* Delete Confirmation */}
            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
                title="Supprimer la catégorie"
                description="Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette action est irréversible."
                confirmText="Supprimer"
                cancelText="Annuler"
                variant="destructive"
                onConfirm={handleDelete}
                isLoading={deleteMutation.isPending}
            />

            <CategoryFormSheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                categoryId={selectedCategoryId}
            />
        </div>
    );
}
