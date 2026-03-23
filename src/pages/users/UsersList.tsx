import { useState } from 'react';
import { ColumnDef, Row } from '@tanstack/react-table';
import {
    Eye,
    Edit,
    Trash2,
    Plus,
    Search,
    Users as UsersIcon,
    Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useUsers, useDeleteUser, useProfiles } from '@/hooks/useUsers';
import { User, Profile } from '@/types/entities';
import DataTable from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import RoleGuard from '@/components/shared/RoleGuard';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import UserFormSheet from './UserFormSheet';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { useDebounce } from '@/hooks/useDebounce';
import { useEffect } from 'react';

export default function UsersList() {
    const navigate = useNavigate();
    const [page, setPage] = useState(0);
    const [pageSize] = useState(10);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);
    const [lockedFilter, setLockedFilter] = useState<string>('all');
    const [confirmedFilter, setConfirmedFilter] = useState<string>('all');
    const [profileFilter, setProfileFilter] = useState<string>('all');
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    // Reset pagination on filter change
    useEffect(() => {
        setPage(0);
    }, [debouncedSearch, lockedFilter, confirmedFilter, profileFilter]);

    const { data: profiles } = useProfiles();

    const { data, isLoading } = useUsers({
        page,
        pageSize,
        displayName: (debouncedSearch && !debouncedSearch.includes('@')) ? debouncedSearch : undefined,
        email: (debouncedSearch && debouncedSearch.includes('@')) ? debouncedSearch : undefined,
        locked: lockedFilter === 'all' ? undefined : (lockedFilter === 'locked' ? '1' : '0'),
        isConfirmed: confirmedFilter === 'all' ? undefined : (confirmedFilter === 'confirmed' ? '1' : '0'),
        profile: profileFilter === 'all' ? undefined : profileFilter
    });

    const deleteMutation = useDeleteUser();

    const handleCreate = () => {
        setSelectedUser(null);
        setIsSheetOpen(true);
    };

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setIsSheetOpen(true);
    };


    const columns: ColumnDef<User>[] = [
        {
            accessorKey: 'displayName',
            header: 'Utilisateur',
            cell: ({ row }: { row: Row<User> }) => {
                const user = row.original;
                const base = user.displayName || user.email || 'UU';
                const initials = base
                    .split(' ')
                    .filter(Boolean)
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                return (
                    <div className="flex items-center gap-3 py-1">
                        <div className="relative group">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xs font-black text-primary border border-primary/20 shadow-sm transition-transform group-hover:scale-105">
                                {initials}
                            </div>
                            <div className={cn(
                                "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background shadow-sm",
                                !user.locked && user.confirmed ? "bg-emerald-500" : "bg-destructive"
                            )} />
                        </div>
                        <div>
                            <p className="font-bold tracking-tight text-sm leading-tight">{user.displayName || 'Sans nom'}</p>
                            <p className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-widest leading-tight mt-1">{user.email}</p>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'profile',
            header: 'Accréditation',
            cell: ({ row }: { row: Row<User> }) => {
                const profile = row.original.profile;
                const label = (profile && typeof profile === 'object') ? (profile as Profile).label : 'N/A';
                return (
                    <Badge variant="secondary" className="bg-muted px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight border-none">
                        {label}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'status',
            header: 'Statut',
            cell: ({ row }: { row: Row<User> }) => {
                const user = row.original;
                return (
                    <div className="flex items-center gap-2">
                        {user.confirmed ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-none rounded-lg text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5">
                                Vérifié
                            </Badge>
                        ) : (
                            <Badge className="bg-yellow-500/10 text-yellow-600 border-none rounded-lg text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5">
                                Attente
                            </Badge>
                        )}
                        {user.locked && (
                            <Badge className="bg-destructive/10 text-destructive border-none rounded-lg text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5">
                                Verrouillé
                            </Badge>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'createdAt',
            header: 'Enregistrement',
            cell: ({ row }: { row: Row<User> }) => (
                <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold tracking-tight">
                        {format(new Date(row.original.createdAt), 'dd MMM yyyy', { locale: fr })}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                        {format(new Date(row.original.createdAt), 'HH:mm', { locale: fr })}
                    </span>
                </div>
            ),
        },
        {
            id: 'actions',
            header: '',
            cell: ({ row }: { row: Row<User> }) => (
                <div className="flex items-center justify-end gap-1.5">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg hover:bg-primary/5 hover:text-primary transition-all duration-200"
                        onClick={() => navigate(`/users/${row.original.id}`)}
                    >
                        <Eye className="w-4 h-4" />
                    </Button>
                    <RoleGuard permissions={['ROLE_USER_EDIT']}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-amber-500/5 hover:text-amber-600 transition-all duration-200"
                            onClick={() => handleEdit(row.original)}
                        >
                            <Edit className="w-4 h-4" />
                        </Button>
                    </RoleGuard>
                    <RoleGuard permissions={['ROLE_USER_DELETE']}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-destructive/5 hover:text-destructive transition-all duration-200"
                            onClick={() => setUserToDelete(row.original)}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </RoleGuard>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 1. Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                            <UsersIcon className="w-5 h-5" />
                        </div>
                        <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Utilisateurs</h1>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground max-w-md">
                        Gérez les accès, les rôles et le cycle de vie des utilisateurs de votre plateforme.
                    </p>
                </div>

                <RoleGuard permissions={['ROLE_USER_CREATE']}>
                    <Button
                        onClick={handleCreate}
                        className="h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest shadow-lg shadow-primary/20 px-6 transition-all hover:scale-[1.02]"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nouveau
                    </Button>
                </RoleGuard>
            </div>

            {/* 2. Filters Section */}
            <div className="bg-card/40 backdrop-blur-md rounded-3xl p-4 shadow-xl shadow-black/5 border border-border/40 flex flex-wrap gap-4 items-center">
                <div className="relative group flex-1 min-w-[240px]">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 transition-colors group-focus-within:text-primary" />
                    <Input
                        placeholder="Rechercher par nom ou email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 h-10 rounded-xl bg-muted/40 border-none focus-visible:ring-primary/20 transition-all font-medium text-sm"
                    />
                </div>

                <Select value={lockedFilter} onValueChange={setLockedFilter}>
                    <SelectTrigger className="w-[150px] h-10 rounded-xl bg-muted/40 border-none focus:ring-primary/20 font-bold text-xs uppercase tracking-wider">
                        <SelectValue placeholder="Verrouillage" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                        <SelectItem value="all" className="font-bold">Tous (Verr.)</SelectItem>
                        <SelectItem value="locked">Verrouillés</SelectItem>
                        <SelectItem value="unlocked">Déverrouillés</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={confirmedFilter} onValueChange={setConfirmedFilter}>
                    <SelectTrigger className="w-[150px] h-10 rounded-xl bg-muted/40 border-none focus:ring-primary/20 font-bold text-xs uppercase tracking-wider">
                        <SelectValue placeholder="Vérification" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                        <SelectItem value="all" className="font-bold">Tous (Vérif.)</SelectItem>
                        <SelectItem value="confirmed">Confirmés</SelectItem>
                        <SelectItem value="unconfirmed">Non confirmés</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={profileFilter} onValueChange={setProfileFilter}>
                    <SelectTrigger className="w-[180px] h-10 rounded-xl bg-muted/40 border-none focus:ring-primary/20 font-bold text-xs uppercase tracking-wider">
                        <SelectValue placeholder="Accréditation" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                        <SelectItem value="all" className="font-bold">Tous les profils</SelectItem>
                        {profiles?.map((p) => (
                            <SelectItem key={p.id} value={(p as any)['@id'] || `/api/profiles/${p.id}`} className="font-medium">
                                {p.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* 3. Table Section */}
            <div className="bg-card/40 backdrop-blur-md rounded-[2.5rem] p-4 shadow-xl shadow-black/5 border border-border/40 overflow-hidden">
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
                    emptyMessage={
                        <div className="flex flex-col items-center justify-center py-20 opacity-40">
                            <Filter className="w-12 h-12 mb-4" />
                            <p className="text-lg font-bold">Aucun utilisateur trouvé</p>
                        </div>
                    }
                />
            </div>

            {/* 4. Modals & Dialogs */}
            <UserFormSheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                user={selectedUser}
            />

            <ConfirmDialog
                open={!!userToDelete}
                onOpenChange={(open) => !open && setUserToDelete(null)}
                title="Supprimer l'utilisateur ?"
                description={
                    <div className="space-y-2">
                        <p>Cette action est irréversible. L'utilisateur <span className="font-bold text-foreground italic">{userToDelete?.displayName}</span> perdra tout accès.</p>
                        <div className="p-3 bg-destructive/5 rounded-xl border border-destructive/10 text-[11px] text-destructive leading-relaxed">
                            <strong>Attention :</strong> Toutes les données associées à ce compte seront archivées ou supprimées selon la politique de rétention.
                        </div>
                    </div>
                }
                confirmText="Supprimer définitivement"
                variant="destructive"
                onConfirm={async () => {
                    if (userToDelete) {
                        await deleteMutation.mutateAsync(userToDelete.id);
                        setUserToDelete(null);
                    }
                }}
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}
