import { useState } from 'react';
import { ColumnDef, CellContext } from '@tanstack/react-table';
import { Eye, Edit, UserPlus, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePlatforms } from '@/hooks/usePlatforms';
import { Platform } from '@/types/entities';
import DataTable from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import RoleGuard from '@/components/shared/RoleGuard';
import PlatformFormSheet from './PlatformFormSheet';
import AdminAccessDialog from './AdminAccessDialog';

export default function PlatformsList() {
    const navigate = useNavigate();
    const [page, setPage] = useState(0);
    const [pageSize] = useState(10);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);

    const [isAccessDialogOpen, setIsAccessDialogOpen] = useState(false);
    const [selectedPlatformForAccess, setSelectedPlatformForAccess] = useState<Platform | null>(null);

    const { data, isLoading } = usePlatforms({ page, pageSize });

    const columns: ColumnDef<Platform>[] = [
        {
            accessorKey: 'name',
            header: 'Nom de la Plateforme',
            cell: ({ row }: CellContext<Platform, unknown>) => (
                <div className="flex flex-col">
                    <span className="font-bold text-base">{row.original.name || 'N/A'}</span>
                    <span className="text-xs text-muted-foreground">{row.original.address || 'Aucune adresse'}</span>
                </div>
            )
        },
        {
            id: 'contact',
            header: 'Contact',
            cell: ({ row }: CellContext<Platform, unknown>) => (
                <div className="flex flex-col text-sm">
                    {row.original.phone && <span className="font-medium">{row.original.phone}</span>}
                    {row.original.email && <span className="text-muted-foreground text-xs">{row.original.email}</span>}
                    {!row.original.phone && !row.original.email && <span className="text-muted-foreground italic text-xs">Non renseigné</span>}
                </div>
            )
        },
        {
            accessorKey: 'currency',
            header: 'Devise',
            cell: ({ row }: CellContext<Platform, unknown>) => {
                const cur = row.original.currency;
                if (!cur) return <span className="text-muted-foreground text-xs italic">N/A</span>;
                if (typeof cur === 'string') {
                    return <span className="font-semibold text-sm bg-muted/60 px-2.5 py-1 rounded-md">{cur}</span>;
                }
                return (
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-black">{cur.symbol}</span>
                        <span className="font-semibold text-sm bg-muted/60 px-2.5 py-1 rounded-md">{cur.code}</span>
                    </div>
                );
            }
        },
        {
            accessorKey: 'active',
            header: 'Statut',
            cell: ({ row }: CellContext<Platform, unknown>) => (
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${row.original.active
                    ? 'bg-emerald-500/10 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-900/50'
                    : 'bg-muted text-muted-foreground border border-border'}`}>
                    {row.original.active ? 'Opérationnel' : 'Inactif'}
                </span>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }: CellContext<Platform, unknown>) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/platforms/${row.original.id}`)}
                    >
                        <Eye className="w-4 h-4" />
                    </Button>
                    <RoleGuard permissions={['ROLE_PLATFORM_UPDATE']}>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSelectedPlatform(row.original);
                                setIsSheetOpen(true);
                            }}
                        >
                            <Edit className="w-4 h-4" />
                        </Button>
                    </RoleGuard>
                    <RoleGuard permissions={['ROLE_ADMIN_ACCESS_CREATE']}>
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={row.original.adminAccountCreated === true}
                            onClick={() => {
                                setSelectedPlatformForAccess(row.original);
                                setIsAccessDialogOpen(true);
                            }}
                            title={row.original.adminAccountCreated ? "Accès administrateur déjà créé" : "Créer un accès administrateur"}
                        >
                            <UserPlus className={`w-4 h-4 ${row.original.adminAccountCreated ? 'text-muted-foreground' : 'text-primary'}`} />
                        </Button>
                    </RoleGuard>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black italic tracking-tighter uppercase underline decoration-primary/30 underline-offset-8">Plateformes</h1>
                    <p className="text-muted-foreground mt-2">
                        Gérez vos restaurants et points de vente
                    </p>
                </div>
                <RoleGuard permissions={['ROLE_PLATFORM_CREATE']}>
                    <Button onClick={() => {
                        setSelectedPlatform(null);
                        setIsSheetOpen(true);
                    }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nouvelle plateforme
                    </Button>
                </RoleGuard>
            </div>

            {/* Table */}
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
                emptyMessage="Aucune plateforme trouvée"
            />

            <AdminAccessDialog
                open={isAccessDialogOpen}
                onOpenChange={setIsAccessDialogOpen}
                platform={selectedPlatformForAccess}
            />

            {/* Platform Form Sheet */}
            <PlatformFormSheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                platform={selectedPlatform}
            />
        </div>
    );
}
