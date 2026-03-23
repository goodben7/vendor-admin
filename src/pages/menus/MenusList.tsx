import { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
    Edit, Trash2, Plus, BookOpen, Search, Filter,
    CheckCircle2, XCircle, Hash, RefreshCw,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import RoleGuard from '@/components/shared/RoleGuard';
import MenuFormSheet from './MenuFormSheet';
import { useMenus, useDeleteMenu, useToggleMenuStatus } from '@/hooks/useMenus';
import { Menu } from '@/types/entities';
import DataTable from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
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

export default function MenusList() {
    const [page, setPage] = useState(0);
    const [pageSize] = useState(10);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 500);
    const [activeFilter, setActiveFilter] = useState('all');

    const queryFilters: any = { page: page + 1, pageSize };
    if (debouncedSearch) queryFilters.label = debouncedSearch;
    if (activeFilter !== 'all') queryFilters.active = activeFilter === 'true' ? '1' : '0';

    const { data, isLoading, isFetching, refetch } = useMenus(queryFilters);
    const deleteMutation = useDeleteMenu();
    const toggleStatusMutation = useToggleMenuStatus();

    const menus = data?.data || [];
    const total = data?.total || 0;

    const kpis = useMemo(() => {
        const active = menus.filter(m => m.active).length;
        const inactive = menus.filter(m => !m.active).length;
        return { active, inactive };
    }, [menus]);

    const handleCreate = () => {
        setSelectedMenu(null);
        setIsSheetOpen(true);
    };

    const handleEdit = (menu: Menu) => {
        setSelectedMenu(menu);
        setIsSheetOpen(true);
    };

    const handleDelete = async () => {
        if (deleteId) {
            await deleteMutation.mutateAsync(deleteId);
            setDeleteId(null);
        }
    };

    const columns: ColumnDef<Menu>[] = [
        {
            accessorKey: 'label',
            header: 'Carte / Menu',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
                        <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-base leading-tight">{row.original.label}</span>
                        {row.original.description && (
                            <span className="text-xs text-muted-foreground line-clamp-1 max-w-[200px] mt-0.5">{row.original.description}</span>
                        )}
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'createdAt',
            header: 'Création',
            cell: ({ row }) => (
                <span className="text-sm font-medium text-muted-foreground/80 lowercase">
                    {new Date(row.original.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                    })}
                </span>
            ),
        },
        {
            accessorKey: 'active',
            header: 'Statut',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <RoleGuard permissions={['ROLE_MENU_UPDATE']} fallback={
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${row.original.active
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : 'bg-muted text-muted-foreground border-border'
                            }`}>
                            {row.original.active ? 'Actif' : 'Inactif'}
                        </span>
                    }>
                        <div className="flex items-center gap-3 bg-muted/20 p-1.5 pr-3 rounded-full border border-border/50">
                            <Switch
                                checked={row.original.active}
                                onCheckedChange={() => toggleStatusMutation.mutate({ id: row.original.id, active: !row.original.active })}
                                disabled={toggleStatusMutation.isPending}
                                className="scale-75 data-[state=checked]:bg-emerald-500"
                            />
                            <span className={`text-[10px] font-black uppercase tracking-wider ${row.original.active ? 'text-emerald-600' : 'text-muted-foreground/60'}`}>
                                {row.original.active ? 'Actif' : 'Inactif'}
                            </span>
                        </div>
                    </RoleGuard>
                </div>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <RoleGuard permissions={['ROLE_MENU_UPDATE']}>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(row.original)}
                            className="hover:bg-primary/10 transition-colors"
                        >
                            <Edit className="w-4 h-4 text-muted-foreground hover:text-primary" />
                        </Button>
                    </RoleGuard>
                    <RoleGuard permissions={['ROLE_MENU_DELETE']}>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(row.original.id)}
                            className="hover:bg-destructive/10 transition-colors"
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
                            Cartes / Menus
                        </h1>
                        {isFetching && <RefreshCw className="w-4 h-4 animate-spin text-primary" />}
                    </div>
                    <p className="text-muted-foreground text-sm font-medium mt-4">
                        Gérez vos catalogues de produits ({total} cartes enregistrées)
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <RoleGuard permissions={['ROLE_MENU_CREATE']}>
                        <Button
                            onClick={handleCreate}
                            className="h-11 gap-2 rounded-xl font-black uppercase tracking-wider shadow-md bg-primary hover:bg-primary/90 transition-all active:scale-95 px-6"
                        >
                            <Plus className="w-5 h-5 stroke-[3]" />
                            Nouveau menu
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KpiCard
                    label="Total Cartes"
                    value={String(total)}
                    sub="Catalogues créés"
                    icon={Hash}
                    iconBg="bg-primary/10"
                    iconColor="text-primary"
                    valueCls="text-primary"
                />
                <KpiCard
                    label="Cartes Actives"
                    value={String(kpis.active)}
                    sub="Visibles par les clients"
                    icon={CheckCircle2}
                    iconBg="bg-emerald-500/10"
                    iconColor="text-emerald-600"
                    valueCls="text-emerald-600"
                />
                <KpiCard
                    label="Cartes Inactives"
                    value={String(kpis.inactive)}
                    sub="En pause ou masquées"
                    icon={XCircle}
                    iconBg="bg-muted"
                    iconColor="text-muted-foreground"
                    valueCls="text-muted-foreground"
                />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors w-4 h-4" />
                    <Input
                        placeholder="Rechercher une carte par nom..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-12 pl-10 bg-background/50 border-border/50 rounded-xl font-bold focus:border-primary/50 focus:ring-primary/20"
                    />
                </div>
                <div className="flex flex-wrap gap-4">
                    <Select value={activeFilter} onValueChange={setActiveFilter}>
                        <SelectTrigger className="w-[180px] h-12 bg-background/50 rounded-xl border-border/50 font-bold focus:ring-primary/20">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-primary" />
                                <SelectValue placeholder="Filtrer par statut" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                            <SelectItem value="all" className="font-bold">Tous les menus</SelectItem>
                            <SelectItem value="true" className="font-bold text-emerald-600 py-3">Actifs uniquement</SelectItem>
                            <SelectItem value="false" className="font-bold text-muted-foreground py-3">Inactifs uniquement</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-card/50 backdrop-blur-sm rounded-3xl border border-border/40 overflow-hidden shadow-xl shadow-black/5">
                <DataTable
                    columns={columns}
                    data={menus}
                    isLoading={isLoading}
                    pagination={{
                        pageIndex: page,
                        pageSize,
                        total,
                        onPageChange: setPage,
                        onPageSizeChange: () => { },
                    }}
                    hidePagination={true}
                    emptyMessage="Aucun menu trouvé"
                />
            </div>

            {/* External Pagination */}
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

                        <div className="flex items-center px-4 h-10 rounded-xl bg-primary/10 border border-primary/20 transition-all shadow-inner">
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

            <MenuFormSheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                menu={selectedMenu}
            />

            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
                title="Supprimer le menu"
                description="Êtes-vous sûr de vouloir supprimer cette carte ? Les produits associés ne seront pas supprimés, mais cette carte ne sera plus accessible."
                confirmText="Supprimer"
                cancelText="Annuler"
                variant="destructive"
                onConfirm={handleDelete}
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}
