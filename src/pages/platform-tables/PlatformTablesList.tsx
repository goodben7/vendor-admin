import { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
    Edit, Trash2, Plus, Search, Filter,
    Armchair, CheckCircle2, Clock, Activity,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    Hash, RefreshCw
} from 'lucide-react';
import { usePlatformTables, useDeletePlatformTable } from '@/hooks/usePlatforms';
import { PlatformTable } from '@/types/entities';
import DataTable from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RoleGuard from '@/components/shared/RoleGuard';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import PlatformTableFormSheet from './PlatformTableFormSheet';
import { useDebounce } from '@/hooks/useDebounce';

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

// Helper to use cn without import issues since we might have it or not
import { cn } from '@/lib/utils';

export default function PlatformTablesList() {
    const [page, setPage] = useState(0);
    const [pageSize] = useState(10);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedTable, setSelectedTable] = useState<PlatformTable | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 500);
    const [statusFilter, setStatusFilter] = useState('all');
    const [activeFilter, setActiveFilter] = useState('all');

    const filters: any = { page, pageSize };
    if (debouncedSearch) filters.label = debouncedSearch;
    if (statusFilter !== 'all') filters.status = statusFilter;
    if (activeFilter !== 'all') filters.active = activeFilter === 'true' ? '1' : '0';

    const { data, isLoading, isFetching, refetch } = usePlatformTables(filters);
    const deleteMutation = useDeletePlatformTable();

    const tables = data?.data || [];
    const total = data?.total || 0;

    // KPIs based on current view
    const kpis = useMemo(() => {
        const available = tables.filter(t => (t as any).status === 'available').length;
        const occupied = tables.filter(t => (t as any).status === 'occupied').length;
        const active = tables.filter(t => t.active ?? (t as any).isActive).length;
        return { available, occupied, active };
    }, [tables]);

    const handleDelete = async () => {
        if (deleteId) {
            await deleteMutation.mutateAsync(deleteId);
            setDeleteId(null);
        }
    };

    const columns: ColumnDef<PlatformTable>[] = [
        {
            accessorKey: 'label',
            header: 'Table & Capacité',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
                        <Armchair className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="font-bold text-base leading-tight">
                            {(row.original as any).label || 'Table ' + (row.original as any).tableNumber || 'N/A'}
                        </p>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">
                            {row.original.capacity ? `${row.original.capacity} personnes max` : 'Capacité non définie'}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Disponibilité',
            cell: ({ row }) => {
                const status = (row.original as any).status;
                if (status === 'available') {
                    return <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 text-[10px] font-black uppercase tracking-wider border border-blue-500/20">Libre</span>;
                } else if (status === 'occupied') {
                    return <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 text-[10px] font-black uppercase tracking-wider border border-orange-500/20">Occupée</span>;
                } else {
                    return <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-black uppercase tracking-wider border border-border">{status || 'N/A'}</span>;
                }
            },
        },
        {
            accessorKey: 'active',
            header: 'Statut',
            cell: ({ row }) => {
                const isActive = row.original.active ?? (row.original as any).isActive;
                return (
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition-colors ${isActive ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-muted text-muted-foreground border border-border'}`}>
                        {isActive ? 'Opérationnelle' : 'Inactif'}
                    </span>
                );
            },
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <RoleGuard permissions={['ROLE_PLATFORM_TABLE_UPDATE']}>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSelectedTable(row.original);
                                setIsSheetOpen(true);
                            }}
                            className="hover:bg-primary/10 transition-colors"
                            title="Modifier"
                        >
                            <Edit className="w-4 h-4 text-muted-foreground hover:text-primary" />
                        </Button>
                    </RoleGuard>
                    <RoleGuard permissions={['ROLE_PLATFORM_TABLE_DELETE']}>
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
                            Tables
                        </h1>
                        {isFetching && <RefreshCw className="w-4 h-4 animate-spin text-primary" />}
                    </div>
                    <p className="text-muted-foreground text-sm font-medium mt-4">
                        Gérez la disposition et l'occupation de vos salles ({total} tables)
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <RoleGuard permissions={['ROLE_PLATFORM_TABLE_CREATE']}>
                        <Button
                            onClick={() => {
                                setSelectedTable(null);
                                setIsSheetOpen(true);
                            }}
                            className="h-11 gap-2 rounded-xl font-black uppercase tracking-wider shadow-md bg-primary hover:bg-primary/90 transition-all active:scale-95"
                        >
                            <Plus className="w-5 h-5 stroke-[3]" />
                            Nouvelle table
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
                    label="Tables affichées"
                    value={String(tables.length)}
                    sub={`sur ${total} au total`}
                    icon={Hash}
                    iconBg="bg-primary/15"
                    iconColor="text-primary"
                    valueCls="text-primary"
                />
                <KpiCard
                    label="Tables Libres"
                    value={String(kpis.available)}
                    sub="Prêtes"
                    icon={CheckCircle2}
                    iconBg="bg-emerald-500/15"
                    iconColor="text-emerald-600 dark:text-emerald-400"
                    valueCls="text-emerald-600 dark:text-emerald-400"
                />
                <KpiCard
                    label="Occupées"
                    value={String(kpis.occupied)}
                    sub="En service"
                    icon={Clock}
                    iconBg="bg-orange-500/15"
                    iconColor="text-orange-600 dark:text-orange-400"
                    valueCls="text-orange-600 dark:text-orange-400"
                />
                <KpiCard
                    label="Opérationnelles"
                    value={String(kpis.active)}
                    sub="Active dans le système"
                    icon={Activity}
                    iconBg="bg-blue-500/15"
                    iconColor="text-blue-600 dark:text-blue-400"
                    valueCls="text-blue-600 dark:text-blue-400"
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
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px] h-12 bg-background/50 rounded-xl border-border/50 font-bold focus:ring-primary/20">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-primary" />
                                <SelectValue placeholder="Disponibilité" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                            <SelectItem value="all" className="font-bold">Toutes les tables</SelectItem>
                            <SelectItem value="available" className="font-bold text-blue-600 py-3">Libres</SelectItem>
                            <SelectItem value="occupied" className="font-bold text-orange-600 py-3">Occupées</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={activeFilter} onValueChange={setActiveFilter}>
                        <SelectTrigger className="w-[160px] h-12 bg-background/50 rounded-xl border-border/50 font-bold focus:ring-primary/20">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-primary" />
                                <SelectValue placeholder="Statut" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                            <SelectItem value="all" className="font-bold">Tous statuts</SelectItem>
                            <SelectItem value="true" className="font-bold text-emerald-600 py-3">Opérationnel</SelectItem>
                            <SelectItem value="false" className="font-bold text-muted-foreground py-3">Inactif</SelectItem>
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
                    emptyMessage="Aucune table trouvée"
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
                title="Supprimer la table"
                description="Êtes-vous sûr de vouloir supprimer cette table ? Cette action est irréversible."
                confirmText="Supprimer"
                cancelText="Annuler"
                variant="destructive"
                onConfirm={handleDelete}
                isLoading={deleteMutation.isPending}
            />

            {/* Platform Table Form Sheet */}
            <PlatformTableFormSheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                table={selectedTable}
            />
        </div>
    );
}
