import { useAboutMe } from '@/hooks/useUsers';
import {
    Mail,
    Phone,
    Calendar,
    ShieldCheck,
    Edit,
    Key,
    Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { PermissionsModal } from '@/components/account/PermissionsModal';

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

export default function AccountOverview() {
    const { data: user, isLoading } = useAboutMe();
    const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);

    if (isLoading) {
        return <div className="animate-pulse space-y-4">
            <div className="h-48 bg-muted rounded-2xl" />
            <div className="h-48 bg-muted rounded-2xl" />
        </div>;
    }

    if (!user) return null;

    const cleanedName = user.displayName?.replace(/\s*\([^)]*\)$/, '') || '';
    const initials = (cleanedName || user.username || user.email || 'UU')
        .split(' ')
        .filter(Boolean)
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const buttonVariants = {
        outline: 'border border-border/50 bg-card/50 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-primary/10 text-primary hover:bg-primary/20',
        base: 'inline-flex items-center justify-center rounded-xl text-sm font-bold transition-all duration-200 px-4 py-2'
    };

    const roles = user.roles || [];
    const displayRoles = roles.slice(0, 2);
    const extraRolesCount = roles.length > 2 ? roles.length - 2 : 0;

    const personTypeLabel = user.personType ? (PERSON_TYPE_LABELS[user.personType] || user.personType) : ((user.profile as any)?.label || 'Membre');

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 1. Informations Générales */}
            <Card className="border-none shadow-xl shadow-black/5 overflow-hidden rounded-2xl bg-gradient-to-br from-card to-muted/20">
                <CardHeader className="relative pb-0">
                    <div className="absolute top-6 right-6 flex gap-2">
                        <Link
                            to="/account/profile"
                            className={cn(buttonVariants.base, buttonVariants.outline, "flex items-center gap-2")}
                        >
                            <Edit className="w-4 h-4" />
                            Modifier mon profil
                        </Link>
                    </div>
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center text-3xl font-black text-primary border-4 border-background shadow-2xl transition-transform group-hover:scale-105 duration-300">
                                {initials}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-background shadow-lg" />
                        </div>
                        <div className="text-center md:text-left pt-2">
                            <h1 className="text-3xl font-black tracking-tight">{user.displayName?.replace(/\s*\([^)]*\)$/, '')}</h1>
                            <p className="text-muted-foreground font-medium flex items-center justify-center md:justify-start gap-2 mt-1">
                                <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest leading-none">
                                    {personTypeLabel}
                                </span>
                                • {user.email}
                            </p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 group">
                                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none mb-1">Email</p>
                                    <p className="font-bold text-sm tracking-tight">{user.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 group">
                                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none mb-1">Téléphone</p>
                                    <p className="font-bold text-sm tracking-tight">{user.phone || 'Non renseigné'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4 group">
                                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none mb-1">Membre depuis</p>
                                    <p className="font-bold text-sm tracking-tight">
                                        {user.createdAt ? format(new Date(user.createdAt), 'dd MMMM yyyy', { locale: fr }) : 'Inconnu'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 group">
                                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none mb-1">Rôles / Permissions</p>
                                    <div className="flex flex-wrap gap-1.5 mt-1 items-center">
                                        {displayRoles.map(role => (
                                            <Badge key={role} variant="secondary" className="bg-primary/5 text-primary border-none text-[10px] font-black tracking-tight rounded-full px-2.5">
                                                {role.replace('ROLE_', '')}
                                            </Badge>
                                        ))}
                                        {extraRolesCount > 0 && (
                                            <button
                                                onClick={() => setIsPermissionsModalOpen(true)}
                                                className="bg-accent/80 hover:bg-primary hover:text-primary-foreground text-foreground px-2 py-0.5 rounded-full text-[10px] font-black transition-all duration-200 border border-border/50 flex items-center gap-1"
                                            >
                                                <Plus className="w-3 h-3" />
                                                {extraRolesCount} plus
                                            </button>
                                        )}
                                        {roles.length === 0 && <p className="text-sm font-bold text-muted-foreground/50">Aucun rôle</p>}
                                    </div>
                                </div>
                            </div>

                            {user.adminAccountCreated !== undefined && (
                                <div className="flex items-center gap-4 group pt-2">
                                    <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-muted-foreground group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors">
                                        <Key className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none mb-1">Espace Admin</p>
                                        <Badge className={cn(
                                            "rounded-lg px-2 py-0.5 border-none text-[9px] font-black uppercase tracking-widest",
                                            user.adminAccountCreated ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-500"
                                        )}>
                                            {user.adminAccountCreated ? 'Initialisé' : 'Non créé'}
                                        </Badge>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <PermissionsModal
                isOpen={isPermissionsModalOpen}
                onClose={() => setIsPermissionsModalOpen(false)}
                userRoles={roles}
            />

            {/* 2. Statut du compte */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-none shadow-lg shadow-black/5 bg-card/50 backdrop-blur-sm rounded-2xl">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={cn("w-2 h-2 rounded-full", user.confirmed ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-yellow-500")} />
                            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Confirmation</span>
                        </div>
                        <Badge className={cn(
                            "rounded-lg px-2 py-0.5 border-none text-[10px] font-black uppercase tracking-widest",
                            user.confirmed ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-yellow-100 text-yellow-700"
                        )}>
                            {user.confirmed ? 'Confirmé' : 'En attente'}
                        </Badge>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg shadow-black/5 bg-card/50 backdrop-blur-sm rounded-2xl">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={cn("w-2 h-2 rounded-full", user.locked ? "bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]")} />
                            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Sécurité</span>
                        </div>
                        <Badge className={cn(
                            "rounded-lg px-2 py-0.5 border-none text-[10px] font-black uppercase tracking-widest",
                            !user.locked ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-destructive/10 text-destructive"
                        )}>
                            {user.locked ? 'Verrouillé' : 'Déverrouillé'}
                        </Badge>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg shadow-black/5 bg-card/50 backdrop-blur-sm rounded-2xl">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={cn("w-2 h-2 rounded-full", user.isActive ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-muted-foreground/30")} />
                            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">État</span>
                        </div>
                        <Badge className={cn(
                            "rounded-lg px-2 py-0.5 border-none text-[10px] font-black uppercase tracking-widest",
                            user.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-muted text-muted-foreground"
                        )}>
                            {user.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions / Bonus UX */}
            <div className="flex flex-wrap gap-4 pt-4">
                <Link
                    to="/account/security"
                    className={cn(buttonVariants.base, buttonVariants.secondary, "flex items-center gap-2")}
                >
                    <Key className="w-4 h-4" />
                    Changer mon mot de passe
                </Link>
            </div>
        </div>
    );
}
