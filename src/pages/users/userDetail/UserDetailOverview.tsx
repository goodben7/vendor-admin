import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Mail,
    Phone,
    Calendar,
    ShieldCheck,
    Edit,
    Shield,
    User as UserIcon,
    Plus,
    Lock,
    LockOpen,
    Key
} from 'lucide-react';
import { useUser, useToggleUserLock } from '@/hooks/useUsers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import RoleGuard from '@/components/shared/RoleGuard';
import { cn } from '@/lib/utils';
import { PermissionsModal } from '@/components/account/PermissionsModal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

const PERSON_TYPE_LABELS: Record<string, string> = {
    'SPADM': 'Super Administrateur',
    'ADM': 'Administrateur',
    'MGR': 'Manager',
    'STF': 'Staff',
    'KIT': 'Cuisine',
    'WTR': 'Serveur',
    'CSR': 'Caissier',
    'SFO': 'Borne (Self-Order)',
};

export default function UserDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: user, isLoading } = useUser(id!);
    const lockMutation = useToggleUserLock();
    const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
    const [isLockDialogOpen, setIsLockDialogOpen] = useState(false);

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
                <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mb-4">
                    <UserIcon className="w-10 h-10 text-muted-foreground/40" />
                </div>
                <p className="text-xl font-bold text-muted-foreground">Utilisateur non trouvé</p>
                <Button variant="ghost" className="mt-4" onClick={() => navigate('/users')}>
                    Retour à la liste
                </Button>
            </div>
        );
    }

    const initials = (user.displayName || user.email || 'UU')
        .split(' ')
        .filter(Boolean)
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const personTypeLabel = user.personType ? (PERSON_TYPE_LABELS[user.personType] || user.personType) : 'Membre';

    // Roles management - handle both direct roles and profile permissions
    const directRoles = user.roles || [];
    const profilePermissions = (user.profile && typeof user.profile === 'object' && 'permission' in user.profile)
        ? (user.profile as any).permission
        : [];

    // Combine for display in the modal
    const allPermissions = Array.from(new Set([...directRoles, ...profilePermissions]));
    const displayRoles = allPermissions.slice(0, 3);
    const extraCount = allPermissions.length > 3 ? allPermissions.length - 3 : 0;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 1. Informations Générales */}
            <Card className="border-none shadow-xl shadow-black/5 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-card to-muted/20">
                <CardHeader className="relative p-8 pb-0">
                    <div className="absolute top-8 right-8">
                        <RoleGuard permissions={['ROLE_USER_EDIT']}>
                            <Button
                                onClick={() => navigate(`/users/${user.id}/profile`)}
                                className="rounded-xl font-bold flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                            >
                                <Edit className="w-4 h-4" />
                                Modifier
                            </Button>
                        </RoleGuard>
                    </div>

                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                        <div className="relative group">
                            <div className="w-28 h-28 rounded-[2rem] bg-primary/10 flex items-center justify-center text-4xl font-black text-primary border-4 border-background shadow-2xl transition-transform group-hover:scale-105 duration-300">
                                {initials}
                            </div>
                            <div className={cn(
                                "absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-4 border-background shadow-lg",
                                !user.locked && !user.deleted ? "bg-emerald-500" : "bg-destructive"
                            )} />
                        </div>

                        <div className="text-center md:text-left pt-2">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                                <h1 className="text-3xl font-black tracking-tighter uppercase italic">{user.displayName || user.email}</h1>
                                <Badge className="bg-primary/20 text-primary border-none text-[10px] font-black uppercase tracking-widest px-2.5 py-1">
                                    {personTypeLabel}
                                </Badge>
                            </div>
                            <p className="text-muted-foreground font-medium flex items-center justify-center md:justify-start gap-2">
                                <span className="opacity-60">ID:</span>
                                <code className="bg-muted px-2 py-0.5 rounded text-[10px] font-mono">{user.id}</code>
                            </p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-8 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Contact Info */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none mb-1.5">Adresse Email</p>
                                    <p className="font-bold text-sm tracking-tight">{user.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none mb-1.5">Téléphone</p>
                                    <p className="font-bold text-sm tracking-tight">{user.phone || 'Non renseigné'}</p>
                                </div>
                            </div>
                        </div>

                        {/* History Info */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none mb-1.5">Inscrit le</p>
                                    <p className="font-bold text-sm tracking-tight">
                                        {format(new Date(user.createdAt), 'dd MMMM yyyy', { locale: fr })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none mb-1.5">Dernière mise à jour</p>
                                    <p className="font-bold text-sm tracking-tight">
                                        {user.updatedAt ? format(new Date(user.updatedAt), 'dd MMM yyyy · HH:mm', { locale: fr }) : '-'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Roles & Permissions */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none mb-1.5">Rôles / Permissions</p>
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                        {displayRoles.map(role => (
                                            <Badge key={role} variant="secondary" className="bg-primary/5 text-primary border-none text-[9px] font-black tracking-tight rounded-full px-2">
                                                {role.replace('ROLE_', '')}
                                            </Badge>
                                        ))}
                                        {extraCount > 0 && (
                                            <button
                                                onClick={() => setIsPermissionsModalOpen(true)}
                                                className="bg-accent/80 hover:bg-primary hover:text-primary-foreground text-foreground px-2 py-0.5 rounded-full text-[9px] font-black transition-all duration-200 border border-border/50 flex items-center gap-1"
                                            >
                                                <Plus className="w-3 h-3" />
                                                {extraCount} plus
                                            </button>
                                        )}
                                        {allPermissions.length === 0 && <p className="text-sm font-bold text-muted-foreground/50 italic">Aucun rôle</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Statut du compte (Design Dashboard Premium) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Identification */}
                <Card className="border-none shadow-xl shadow-black/5 bg-gradient-to-br from-card to-muted/30 rounded-[2rem] overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                                user.confirmed ? "bg-emerald-500/10 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]" : "bg-yellow-500/10 text-yellow-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]"
                            )}>
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div className={cn(
                                "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg",
                                user.confirmed ? "bg-emerald-500/10 text-emerald-600" : "bg-yellow-500/10 text-yellow-600"
                            )}>
                                {user.confirmed ? 'Vérifié' : 'À Confirmer'}
                            </div>
                        </div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">Identification</h3>
                        <p className="text-sm font-bold tracking-tight">
                            {user.confirmed ? 'Identité confirmée' : 'Validation en attente'}
                        </p>
                    </CardContent>
                </Card>

                {/* Verrouillage / Accès */}
                <Card className="border-none shadow-xl shadow-black/5 bg-gradient-to-br from-card to-muted/30 rounded-[2rem] overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                                !user.locked ? "bg-emerald-500/10 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]" : "bg-destructive/10 text-destructive shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                            )}>
                                {!user.locked ? <LockOpen className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                            </div>
                            <RoleGuard permissions={['ROLE_USER_EDIT']}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "h-8 w-8 rounded-xl transition-all border border-border/50",
                                        user.locked ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-destructive/5 text-destructive hover:bg-destructive/10"
                                    )}
                                    onClick={() => setIsLockDialogOpen(true)}
                                    disabled={lockMutation.isPending}
                                >
                                    {user.locked ? <LockOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                </Button>
                            </RoleGuard>
                        </div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">Verrouillage</h3>
                        <p className="text-sm font-bold tracking-tight">
                            {user.locked ? 'Accès suspendu' : 'Accès autorisé'}
                        </p>
                    </CardContent>
                </Card>

                {/* État du compte */}
                <Card className="border-none shadow-xl shadow-black/5 bg-gradient-to-br from-card to-muted/30 rounded-[2rem] overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                                !user.deleted && user.isActive ? "bg-primary/10 text-primary shadow-[0_0_20px_rgba(var(--primary),0.1)]" : "bg-muted text-muted-foreground/40"
                            )}>
                                <Shield className="w-6 h-6" />
                            </div>
                            <div className={cn(
                                "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg",
                                !user.deleted && user.isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                            )}>
                                {!user.deleted && user.isActive ? 'Opérationnel' : 'Inactif'}
                            </div>
                        </div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">État du compte</h3>
                        <p className="text-sm font-bold tracking-tight">
                            {!user.deleted && user.isActive ? 'Compte Actif' : (user.deleted ? 'Compte Supprimé' : 'Compte Inactif')}
                        </p>
                    </CardContent>
                </Card>

                {/* Espace Admin (adminAccountCreated) */}
                <Card className="border-none shadow-xl shadow-black/5 bg-gradient-to-br from-card to-muted/30 rounded-[2rem] overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                                user.adminAccountCreated ? "bg-purple-500/10 text-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.1)]" : "bg-muted text-muted-foreground/40"
                            )}>
                                <Key className="w-6 h-6" />
                            </div>
                            <div className={cn(
                                "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg",
                                user.adminAccountCreated ? "bg-purple-500/10 text-purple-600" : "bg-muted text-muted-foreground"
                            )}>
                                {user.adminAccountCreated ? 'Initialisé' : 'Hormis'}
                            </div>
                        </div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">Espace Admin</h3>
                        <p className="text-sm font-bold tracking-tight">
                            {user.adminAccountCreated ? 'Accès admin créé' : 'Non configuré'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Modals & Sheets */}
            <PermissionsModal
                isOpen={isPermissionsModalOpen}
                onClose={() => setIsPermissionsModalOpen(false)}
                userRoles={allPermissions}
            />

            <ConfirmDialog
                open={isLockDialogOpen}
                onOpenChange={setIsLockDialogOpen}
                title={user.locked ? "Déverrouiller l'accès ?" : "Verrouiller l'accès ?"}
                description={
                    user.locked
                        ? "L'utilisateur pourra de nouveau se connecter à la plateforme."
                        : "L'accès de cet utilisateur sera immédiatement suspendu. Il ne pourra plus se connecter."
                }
                confirmText={user.locked ? "Déverrouiller" : "Verrouiller"}
                variant={user.locked ? "default" : "destructive"}
                onConfirm={async () => {
                    await lockMutation.mutateAsync(user.id);
                }}
                isLoading={lockMutation.isPending}
            />

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-4 pt-6 mt-6 border-t border-border/40">
                <RoleGuard permissions={['ROLE_USER_EDIT']}>
                    <Button
                        variant="secondary"
                        className="rounded-xl font-black flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary/20 transition-all h-11 px-6 border border-primary/20 shadow-sm"
                        onClick={() => navigate(`/users/${user.id}/security`)}
                    >
                        <Key className="w-4 h-4" />
                        Changer le mot de passe
                    </Button>
                </RoleGuard>
            </div>
        </div>
    );
}
