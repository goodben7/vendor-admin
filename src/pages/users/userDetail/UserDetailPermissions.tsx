import { useState, useEffect } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { Shield, Save, AlertCircle, Search, CheckCircle2 } from 'lucide-react';
import { usePermissions, useUpdateUserSideRoles } from '@/hooks/useUsers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { User } from '@/types/entities';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import { cn } from '@/lib/utils';

export default function UserDetailPermissions() {
    const { id } = useParams<{ id: string }>();
    const { user } = useOutletContext<{ user: User }>();
    const { data: allPermissions, isLoading: isLoadingPermissions } = usePermissions();
    const updateSideRolesMutation = useUpdateUserSideRoles();

    const [search, setSearch] = useState('');
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

    // Initialize selected roles from user.roles if available or from what the system returns
    // In our case, the user likely wants to edit "sideRoles" which might be distinct from main roles
    // But since the API returns 'roles' in the user object, we use that as base for selection
    // if sideRoles are part of it.
    useEffect(() => {
        if (user?.roles) {
            setSelectedRoles(user.roles);
        }
    }, [user]);

    if (isLoadingPermissions) return <LoadingSkeleton />;

    const toggleRole = (role: string) => {
        setSelectedRoles(prev =>
            prev.includes(role)
                ? prev.filter(r => r !== role)
                : [...prev, role]
        );
    };

    const onSubmit = async () => {
        try {
            await updateSideRolesMutation.mutateAsync({
                id: id!,
                sideRoles: selectedRoles
            });
        } catch (e) { }
    };

    const filteredPermissions = allPermissions?.filter(perm =>
        perm.label.toLowerCase().includes(search.toLowerCase()) ||
        perm.role.toLowerCase().includes(search.toLowerCase())
    ) || [];

    const categories = Array.from(new Set(filteredPermissions.map(p => p.role.split('_')[1]))).sort();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            <Card className="border-none shadow-xl shadow-black/5 bg-card/40 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
                <CardHeader className="p-8 border-b border-border/50">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-black italic uppercase tracking-tight">Permissions Additionnelles</CardTitle>
                            <CardDescription className="text-sm font-medium">Gérez les rôles secondaires et permissions spécifiques de cet utilisateur.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="relative mb-8">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher une permission (ex: USER, ADMIN, VIEW...)"
                            className="pl-11 h-12 rounded-2xl bg-muted/50 border-none focus-visible:ring-primary/20 transition-all font-medium"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {categories.map(cat => {
                            const catPermissions = filteredPermissions.filter(p => p.role.split('_')[1] === cat);
                            if (catPermissions.length === 0) return null;

                            return (
                                <div key={cat} className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-2 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                        CATÉGORIE: {cat}
                                    </h3>
                                    <div className="space-y-2">
                                        {catPermissions.map(perm => {
                                            const isSelected = selectedRoles.includes(perm.role);
                                            return (
                                                <div
                                                    key={perm.role}
                                                    onClick={() => toggleRole(perm.role)}
                                                    className={cn(
                                                        "group flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 cursor-pointer",
                                                        isSelected
                                                            ? "bg-primary/5 border-primary shadow-sm"
                                                            : "bg-background/50 border-border/40 hover:border-primary/40"
                                                    )}
                                                >
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className={cn(
                                                            "text-[10px] font-black uppercase tracking-widest transition-colors",
                                                            isSelected ? "text-primary" : "text-muted-foreground/60 group-hover:text-primary/60"
                                                        )}>
                                                            {perm.role}
                                                        </span>
                                                        <span className="font-bold text-sm tracking-tight">{perm.label}</span>
                                                    </div>
                                                    <div className={cn(
                                                        "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                                                        isSelected
                                                            ? "bg-primary border-primary text-primary-foreground scale-110"
                                                            : "border-border group-hover:border-primary/40"
                                                    )}>
                                                        {isSelected && <CheckCircle2 className="w-4 h-4" />}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-12 pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3 text-muted-foreground">
                            <AlertCircle className="w-5 h-5 text-primary/60" />
                            <p className="text-xs font-medium max-w-sm">
                                Ces permissions s'ajoutent aux rôles déjà définis par le profil principal de l'utilisateur.
                            </p>
                        </div>
                        <Button
                            className="w-full md:w-auto px-10 h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50"
                            onClick={onSubmit}
                            disabled={updateSideRolesMutation.isPending}
                        >
                            {updateSideRolesMutation.isPending ? 'Enregistrement...' : (
                                <span className="flex items-center gap-3">
                                    <Save className="w-5 h-5" />
                                    Sauvegarder les rôles
                                </span>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
