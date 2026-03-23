import { useState, useMemo } from 'react';
import { ColumnDef, CellContext } from '@tanstack/react-table';
import {
    Edit, Plus, Smartphone, Monitor, Trash2, Search, Filter,
    RefreshCw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    Wifi, WifiOff, ShieldCheck, ShieldAlert, Hash, Activity,
    Layout, KeyRound, UserCircle
} from 'lucide-react';
import { useTablets, useDeleteTablet } from '@/hooks/usePlatforms';
import { useCreateTabletAccess, useProfiles } from '@/hooks/useUsers';
import DataTable from '@/components/shared/DataTable';
import { Tablet } from '@/types/entities';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import RoleGuard from '@/components/shared/RoleGuard';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from "@/components/ui/dialog";
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import TabletFormSheet from './TabletFormSheet';
import { cn } from '@/lib/utils';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// ── Validation Schema for Access ───────────────────────────────
const accessFormSchema = z.object({
    email: z.string().optional(),
    plainPassword: z.string().min(4, "Le mot de passe doit faire au moins 4 caractères"),
    profile: z.string().min(1, "Profil requis"),
    phone: z.string().min(1, "Identifiant requis"),
    displayName: z.string().min(1, "Nom d'affichage requis"),
    platformId: z.string().min(1, "ID Plateforme requis"),
    holderId: z.string().min(1, "ID Holder requis"),
    holderType: z.string(),
});

type AccessFormValues = z.infer<typeof accessFormSchema>;

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

export default function TabletsList() {
    const [page, setPage] = useState(0);
    const [pageSize] = useState(10);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 500);
    const [modeFilter, setModeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [activeFilter, setActiveFilter] = useState('all');

    const queryFilters: any = { page, pageSize };
    if (debouncedSearch) queryFilters.label = debouncedSearch;
    if (modeFilter !== 'all') queryFilters.mode = modeFilter;
    if (statusFilter !== 'all') queryFilters.status = statusFilter;
    if (activeFilter !== 'all') queryFilters.active = activeFilter === 'true' ? '1' : '0';

    const { data, isLoading, isFetching, refetch } = useTablets(queryFilters);
    const deleteMutation = useDeleteTablet();

    const tablets = data?.data || [];
    const total = data?.total || 0;

    // KPIs based on current view
    const kpis = useMemo(() => {
        const online = tablets.filter(t => (t as any).status === 'online').length;
        const authorized = tablets.filter(t => t.active).length;
        const offline = tablets.length - online;
        return { online, offline, authorized };
    }, [tablets]);

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedTablet, setSelectedTablet] = useState<Tablet | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Tablet Access State
    const [isAccessDialogOpen, setIsAccessDialogOpen] = useState(false);
    const [accessTablet, setAccessTablet] = useState<Tablet | null>(null);

    const createAccessMutation = useCreateTabletAccess();
    const { data: profiles } = useProfiles();

    const accessForm = useForm<AccessFormValues>({
        resolver: zodResolver(accessFormSchema),
        defaultValues: {
            email: '',
            plainPassword: '',
            profile: '',
            phone: '',
            displayName: '',
            platformId: '',
            holderId: '',
            holderType: 'tablet',
        }
    });

    const handleCreateAccess = (tablet: Tablet) => {
        setAccessTablet(tablet);
        createAccessMutation.reset();

        // Try to find platformId from multiple sources
        let platformId = (tablet as any).platformId || '';

        if (!platformId && tablet.platformTable) {
            if (typeof tablet.platformTable === 'object') {
                const table = tablet.platformTable as any;
                if (table.platform) {
                    platformId = typeof table.platform === 'object' ? table.platform.id : table.platform.split('/').pop() || '';
                }
            } else if (typeof tablet.platformTable === 'string') {
                // If the entire platformTable is a string/IRI, we can't get platformId directly
                // but usually the tablet itself has it in its parent context or the user has one selected.
            }
        }

        // Final fallback: if NO platformId is found, the backend won't accept either way.
        // We warn the user instead of letting validation fail silently
        if (!platformId) {
            toast.warning("L'ID Plateforme n'a pas pu être détecté. Assurez-vous que la tablette est assignée.");
        }

        accessForm.reset({
            email: undefined,
            plainPassword: '',
            profile: profiles && profiles.length > 0 ? `/api/profiles/${profiles[0].id}` : '',
            phone: tablet.deviceId,
            displayName: tablet.label || tablet.deviceId,
            platformId: platformId,
            holderId: tablet.id,
            holderType: 'TABLET',
        });
        setIsAccessDialogOpen(true);
    };

    const onSubmitAccess: SubmitHandler<AccessFormValues> = (values) => {
        createAccessMutation.mutate(values, {
            onSuccess: () => {
                setIsAccessDialogOpen(false);
            }
        });
    };

    const onInvalidAccess = (errors: any) => {
        console.error('Validation Errors:', errors);
        const firstError = Object.values(errors)[0] as any;
        toast.error(firstError?.message || "Veuillez remplir tous les champs obligatoires");
    };

    const handleCreate = () => {
        setSelectedTablet(null);
        setIsSheetOpen(true);
    };

    const handleDelete = async () => {
        if (deleteId) {
            await deleteMutation.mutateAsync(deleteId);
            setDeleteId(null);
        }
    };

    const handleEdit = (tablet: Tablet) => {
        setSelectedTablet(tablet);
        setIsSheetOpen(true);
    };

    const columns: ColumnDef<Tablet>[] = [
        {
            accessorKey: 'label',
            header: 'Appareil & Nom',
            cell: ({ row }: CellContext<Tablet, unknown>) => {
                const label = row.original.label || 'Sans nom';
                const model = (row.original as any).deviceModel || 'Modèle inconnu';
                const isKiosk = (row.original as any).mode === 'cashier' || (row.original as any).mode === 'self_order';

                return (
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
                            {isKiosk ? <Monitor className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-sm">{label}</span>
                            <span className="text-xs text-muted-foreground font-medium">{model}</span>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'deviceId',
            header: 'ID Device',
            cell: ({ row }: CellContext<Tablet, unknown>) => (
                <div className="flex items-center gap-2">
                    <code className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded border border-border/50 text-muted-foreground">
                        {row.original.deviceId}
                    </code>
                </div>
            ),
        },
        {
            accessorKey: 'mode',
            header: "Mode d'utilisation",
            cell: ({ row }: CellContext<Tablet, unknown>) => {
                const mode = (row.original as any).mode;
                let badgeClass = "bg-muted text-muted-foreground border-border";
                let modeText = mode || 'N/A';

                if (mode === 'cashier') {
                    badgeClass = "bg-purple-500/10 text-purple-600 border-purple-500/20";
                    modeText = "Caisse";
                } else if (mode === 'self_order') {
                    badgeClass = "bg-blue-500/10 text-blue-600 border-blue-500/20";
                    modeText = "Borne Client";
                } else if (mode === 'waiter') {
                    badgeClass = "bg-amber-500/10 text-amber-600 border-amber-500/20";
                    modeText = "Serveur Mobile";
                } else if (mode === 'kitchen') {
                    badgeClass = "bg-orange-500/10 text-orange-600 border-orange-500/20";
                    modeText = "Cuisine";
                }

                return (
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badgeClass}`}>
                        {modeText}
                    </span>
                );
            },
        },
        {
            accessorKey: 'status',
            header: 'Connexion',
            cell: ({ row }: CellContext<Tablet, unknown>) => {
                const status = (row.original as any).status;
                const isOnline = status === 'online';
                const lastHeartbeat = (row.original as any).lastHeartbeat;
                let timeAgo = '';

                if (lastHeartbeat) {
                    try {
                        timeAgo = formatDistanceToNow(new Date(lastHeartbeat), { addSuffix: true, locale: fr });
                    } catch (e) {
                        timeAgo = '';
                    }
                }

                return (
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-destructive'}`}></span>
                            <span className={`text-xs font-bold ${isOnline ? 'text-emerald-600' : 'text-destructive'}`}>
                                {isOnline ? 'En ligne' : 'Hors-ligne'}
                            </span>
                        </div>
                        {timeAgo && (
                            <span className="text-[10px] text-muted-foreground font-medium">Vu {timeAgo}</span>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'platformTable',
            header: 'Assignation',
            cell: ({ row }: CellContext<Tablet, unknown>) => {
                const platformTable = row.original.platformTable;
                let displayValue = 'Aucune table';

                if (typeof platformTable === 'object' && platformTable !== null && 'label' in platformTable) {
                    displayValue = (platformTable as any).label || 'Table assignée';
                }

                return (
                    <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                        {displayValue}
                    </span>
                );
            },
        },
        {
            accessorKey: 'active',
            header: 'Autorisation',
            cell: ({ row }: CellContext<Tablet, unknown>) => {
                const isActive = row.original.active;
                return (
                    <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition-colors",
                        isActive
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-muted text-muted-foreground border-border"
                    )}>
                        {isActive ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                        {isActive ? 'Autorisé' : 'Bloqué'}
                    </span>
                );
            },
        },
        {
            id: 'actions',
            header: () => <div className="text-right px-4">Actions</div>,
            cell: ({ row }) => (
                <div className="flex justify-end gap-2">
                    <RoleGuard permissions={['ROLE_TABLET_ACCESS_CREATE']}>
                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={row.original.tabletAccountCreated}
                            className={cn(
                                "h-8 w-8 rounded-lg transition-colors",
                                row.original.tabletAccountCreated
                                    ? "text-emerald-500 bg-emerald-500/5 opacity-100"
                                    : "text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10"
                            )}
                            onClick={() => handleCreateAccess(row.original)}
                            title={row.original.tabletAccountCreated ? "Accès déjà configuré" : "Créer accès tablette"}
                        >
                            <ShieldCheck className={cn("w-4 h-4", row.original.tabletAccountCreated && "fill-emerald-500/20")} />
                        </Button>
                    </RoleGuard>
                    <RoleGuard permissions={['ROLE_TABLET_UPDATE']}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            onClick={() => handleEdit(row.original)}
                            title="Modifier"
                        >
                            <Edit className="w-4 h-4" />
                        </Button>
                    </RoleGuard>
                    <RoleGuard permissions={['ROLE_TABLET_DELETE']}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                            onClick={() => setDeleteId(row.original.id)}
                            title="Supprimer"
                        >
                            <Trash2 className="w-4 h-4" />
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
                            Tablettes
                        </h1>
                        {isFetching && <RefreshCw className="w-4 h-4 animate-spin text-primary" />}
                    </div>
                    <p className="text-muted-foreground text-sm font-medium mt-4">
                        Gérez les terminaux et leur statut de connexion ({total} tablettes)
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <RoleGuard permissions={['ROLE_TABLET_CREATE']}>
                        <Button
                            onClick={handleCreate}
                            className="h-11 gap-2 rounded-xl font-black uppercase tracking-wider shadow-md bg-primary hover:bg-primary/90 transition-all active:scale-95"
                        >
                            <Plus className="w-5 h-5 stroke-[3]" />
                            Nouvelle tablette
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
                    label="Terminaux affichés"
                    value={String(tablets.length)}
                    sub={`sur ${total} au total`}
                    icon={Hash}
                    iconBg="bg-primary/15"
                    iconColor="text-primary"
                    valueCls="text-primary"
                />
                <KpiCard
                    label="En Ligne"
                    value={String(kpis.online)}
                    sub="Prêt au service"
                    icon={Wifi}
                    iconBg="bg-emerald-500/15"
                    iconColor="text-emerald-600 dark:text-emerald-400"
                    valueCls="text-emerald-600 dark:text-emerald-400"
                />
                <KpiCard
                    label="Hors-Ligne"
                    value={String(kpis.offline)}
                    sub="Hors service"
                    icon={WifiOff}
                    iconBg="bg-amber-500/15"
                    iconColor="text-amber-600 dark:text-amber-400"
                    valueCls="text-amber-600 dark:text-amber-400"
                />
                <KpiCard
                    label="Autorisés"
                    value={String(kpis.authorized)}
                    sub="Accès validé"
                    icon={ShieldCheck}
                    iconBg="bg-blue-500/15"
                    iconColor="text-blue-600 dark:text-blue-400"
                    valueCls="text-blue-600 dark:text-blue-400"
                />
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors w-4 h-4" />
                    <Input
                        placeholder="Rechercher par nom..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-12 pl-10 bg-background/50 border-border/50 rounded-xl font-bold focus:border-primary/50 focus:ring-primary/20"
                    />
                </div>
                <div className="flex flex-wrap gap-4">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px] h-12 bg-background/50 rounded-xl border-border/50 font-bold focus:ring-primary/20">
                            <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-primary" />
                                <SelectValue placeholder="Connexion" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                            <SelectItem value="all" className="font-bold">Tous (Connexion)</SelectItem>
                            <SelectItem value="online" className="font-bold text-emerald-600 py-3">⚡ En ligne</SelectItem>
                            <SelectItem value="offline" className="font-bold text-destructive py-3">⚪ Hors-ligne</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={modeFilter} onValueChange={setModeFilter}>
                        <SelectTrigger className="w-[180px] h-12 bg-background/50 rounded-xl border-border/50 font-bold focus:ring-primary/20">
                            <div className="flex items-center gap-2">
                                <Layout className="w-4 h-4 text-primary" />
                                <SelectValue placeholder="Mode" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                            <SelectItem value="all" className="font-bold">Tous (Modes)</SelectItem>
                            <SelectItem value="cashier" className="font-bold py-3 text-purple-600">Caisse</SelectItem>
                            <SelectItem value="self_order" className="font-bold py-3 text-blue-600">Borne Client</SelectItem>
                            <SelectItem value="waiter" className="font-bold py-3 text-amber-600">Serveur Mobile</SelectItem>
                            <SelectItem value="kitchen" className="font-bold py-3 text-orange-600">Cuisine</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={activeFilter} onValueChange={setActiveFilter}>
                        <SelectTrigger className="w-[160px] h-12 bg-background/50 rounded-xl border-border/50 font-bold focus:ring-primary/20">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-primary" />
                                <SelectValue placeholder="Autorisation" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                            <SelectItem value="all" className="font-bold">Toute autorisation</SelectItem>
                            <SelectItem value="true" className="font-bold text-emerald-600 py-3">Autorisé</SelectItem>
                            <SelectItem value="false" className="font-bold text-destructive py-3">Bloqué</SelectItem>
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
                    emptyMessage="Aucune tablette trouvée"
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

            <TabletFormSheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                tablet={selectedTablet}
            />

            {/* Access Dialog */}
            <Dialog open={isAccessDialogOpen} onOpenChange={setIsAccessDialogOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-[2rem] gap-0 p-0 overflow-hidden border-none shadow-2xl">
                    <div className="bg-primary/5 p-8 pb-6 border-b border-primary/10">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20">
                                <KeyRound className="w-6 h-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase leading-none">
                                    Accès Tablette
                                </DialogTitle>
                                <DialogDescription className="text-sm font-medium mt-1">
                                    Configurez les identifiants pour {accessTablet?.label || 'cette tablette'}
                                </DialogDescription>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={accessForm.handleSubmit(onSubmitAccess, onInvalidAccess)} className="p-8 space-y-6">
                        {createAccessMutation.isError && (
                            <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                <ShieldAlert className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-sm font-black text-destructive uppercase tracking-tight leading-none">Erreur de configuration</p>
                                    <p className="text-xs font-bold text-destructive/80 leading-relaxed">
                                        {(createAccessMutation.error as any)?.response?.data?.message ||
                                            (createAccessMutation.error as any)?.response?.data?.['hydra:description'] ||
                                            (createAccessMutation.error as any)?.response?.data?.detail ||
                                            "Une erreur est survenue lors de la création des accès."}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="displayName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nom d'affichage</Label>
                                <div className="relative group">
                                    <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                                    <Input
                                        id="displayName"
                                        placeholder="Ex: Caisse 1"
                                        className="h-11 pl-10 rounded-xl bg-muted/30 border-none font-bold focus:ring-primary/20"
                                        {...accessForm.register('displayName')}
                                    />
                                </div>
                                {accessForm.formState.errors.displayName && (
                                    <p className="text-[10px] text-destructive font-bold uppercase tracking-wider ml-1 mt-1">{accessForm.formState.errors.displayName.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Identifiant</Label>
                                <Input
                                    id="phone"
                                    className="h-11 rounded-xl bg-muted/30 border-none font-bold focus:ring-primary/20"
                                    {...accessForm.register('phone')}
                                />
                                {accessForm.formState.errors.phone && (
                                    <p className="text-[10px] text-destructive font-bold uppercase tracking-wider ml-1 mt-1">{accessForm.formState.errors.phone.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="plainPassword" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Mot de passe</Label>
                                <Input
                                    id="plainPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    className="h-11 rounded-xl bg-muted/30 border-none font-bold focus:ring-primary/20"
                                    {...accessForm.register('plainPassword')}
                                />
                                {accessForm.formState.errors.plainPassword && (
                                    <p className="text-[10px] text-destructive font-bold uppercase tracking-wider ml-1 mt-1">{accessForm.formState.errors.plainPassword.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="profile" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Profil (Permissions)</Label>
                                <Select onValueChange={(v) => accessForm.setValue('profile', v)} value={accessForm.watch('profile')}>
                                    <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-none font-bold focus:ring-primary/20">
                                        <SelectValue placeholder="Choisir un profil" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                                        {profiles?.map((p) => (
                                            <SelectItem key={p.id} value={`/api/profiles/${p.id}`} className="font-bold py-3 capitalize">
                                                {p.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {accessForm.formState.errors.profile && (
                                    <p className="text-[10px] text-destructive font-bold uppercase tracking-wider ml-1 mt-1">{accessForm.formState.errors.profile.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Hidden Background Data */}
                        <div className="hidden">
                            <input {...accessForm.register('email')} />
                            <input {...accessForm.register('platformId')} />
                            <input {...accessForm.register('holderId')} />
                            <input {...accessForm.register('holderType')} />
                        </div>

                        <DialogFooter className="pt-4">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsAccessDialogOpen(false)}
                                className="rounded-xl font-bold uppercase tracking-widest"
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                disabled={createAccessMutation.isPending}
                                className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                            >
                                {createAccessMutation.isPending ? "Création..." : "Générer les accès"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
                title="Supprimer la tablette"
                description="Êtes-vous sûr de vouloir supprimer cette tablette ? Cette action déconnectera cet appareil et est irréversible."
                confirmText="Supprimer"
                cancelText="Annuler"
                variant="destructive"
                onConfirm={handleDelete}
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}
