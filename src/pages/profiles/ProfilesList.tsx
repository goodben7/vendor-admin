import { useState } from 'react';
import { ColumnDef, Row } from '@tanstack/react-table';
import { Edit, Shield, Plus, Lock, UserCheck } from 'lucide-react';
import { useProfiles } from '@/hooks/useUsers';
import { Profile } from '@/types/entities';
import DataTable from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import RoleGuard from '@/components/shared/RoleGuard';
import ProfileFormSheet from '@/components/profiles/ProfileFormSheet';
import { PERSON_TYPE_LABELS } from '@/constants/personTypes';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function ProfilesList() {
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

    const { data: profilesData, isLoading } = useProfiles();

    const handleCreate = () => {
        setSelectedProfile(null);
        setIsSheetOpen(true);
    };

    const handleEdit = (profile: Profile) => {
        setSelectedProfile(profile);
        setIsSheetOpen(true);
    };

    const columns: ColumnDef<Profile>[] = [
        {
            accessorKey: 'label',
            header: 'Nom du profil',
            cell: ({ row }: { row: Row<Profile> }) => (
                <div className="flex items-center gap-3 py-1">
                    <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary/60 border border-primary/10">
                        <Shield className="w-4 h-4" />
                    </div>
                    <span className="font-bold tracking-tight text-sm">{row.original.label}</span>
                </div>
            ),
        },
        {
            accessorKey: 'personType',
            header: 'Type de personne',
            cell: ({ row }: { row: Row<Profile> }) => (
                <div className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-muted-foreground/40" />
                    <span className="text-sm font-medium text-muted-foreground">
                        {row.original.personType ? PERSON_TYPE_LABELS[row.original.personType] || row.original.personType : '-'}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: 'permission',
            header: 'Droit d\'accès',
            cell: ({ row }: { row: Row<Profile> }) => (
                <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-primary/40" />
                    <Badge variant="secondary" className="bg-primary/5 text-primary/70 border-primary/10 font-bold text-[10px] uppercase tracking-wider px-2 h-5">
                        {row.original.permission?.length || 0} permission(s)
                    </Badge>
                </div>
            ),
        },
        {
            accessorKey: 'active',
            header: 'État',
            cell: ({ row }: { row: Row<Profile> }) => (
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "w-2 h-2 rounded-full",
                        row.original.active ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-destructive/40"
                    )} />
                    <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        row.original.active ? "text-emerald-600" : "text-destructive/60"
                    )}>
                        {row.original.active ? 'Actif' : 'Désactivé'}
                    </span>
                </div>
            ),
        },
        {
            id: 'actions',
            header: '',
            cell: ({ row }: { row: Row<Profile> }) => (
                <div className="flex items-center justify-end gap-2 px-2">
                    <RoleGuard permissions={['ROLE_PROFILE_UPDATE']}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-xl hover:bg-primary/5 hover:text-primary transition-all duration-200"
                            onClick={() => handleEdit(row.original)}
                        >
                            <Edit className="w-4 h-4" />
                        </Button>
                    </RoleGuard>
                </div>
            ),
        },
    ];

    // Convert array to paginated format for DataTable
    const paginatedData = {
        data: profilesData || [],
        total: profilesData?.length || 0,
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-muted/40 flex items-center justify-center text-muted-foreground border border-border/40">
                            <Shield className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Sécurité & Accès</span>
                            <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none mt-0.5">Profils Utilisateurs</h1>
                        </div>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground max-w-md ml-[52px]">
                        Gérez les types de comptes et leurs droits d'accès à la plateforme.
                    </p>
                </div>

                <RoleGuard permissions={['ROLE_PROFILE_CREATE']}>
                    <Button
                        onClick={handleCreate}
                        className="h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest shadow-lg shadow-primary/20 px-6 transition-all hover:scale-[1.02]"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nouveau profil
                    </Button>
                </RoleGuard>
            </div>

            {/* Table */}
            <div className="bg-card/40 backdrop-blur-md rounded-[2.5rem] p-4 shadow-xl shadow-black/5 border border-border/40 overflow-hidden">
                <DataTable
                    columns={columns}
                    data={paginatedData.data}
                    isLoading={isLoading}
                    emptyMessage={
                        <div className="flex flex-col items-center justify-center py-20 opacity-40">
                            <Shield className="w-12 h-12 mb-4" />
                            <p className="text-lg font-bold italic uppercase tracking-tighter">Aucun profil trouvé</p>
                        </div>
                    }
                />
            </div>

            {/* Create/Edit Profile Sheet */}
            <ProfileFormSheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                profile={selectedProfile}
            />
        </div>
    );
}
