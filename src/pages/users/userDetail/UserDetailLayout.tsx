import { Link, Outlet, useLocation, useParams, useNavigate } from 'react-router-dom';
import { User as UserIcon, Shield, Lock, ChevronRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/useUsers';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';

export default function UserDetailLayout() {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const { data: user, isLoading } = useUser(id!);

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

    const sidebarItems = [
        {
            label: 'Aperçu',
            icon: UserIcon,
            path: `/users/${id}`,
            end: true,
        },
        {
            label: 'Profil',
            icon: UserIcon,
            path: `/users/${id}/profile`,
        },
        {
            label: 'Permissions',
            icon: Shield,
            path: `/users/${id}/permissions`,
        },
        {
            label: 'Sécurité',
            icon: Lock,
            path: `/users/${id}/security`,
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header / Navigation */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl bg-background border shadow-sm hover:scale-105 transition-transform"
                    onClick={() => navigate('/users')}
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/60 leading-none mb-1">Administration</h1>
                    <p className="text-xl font-black tracking-tight italic uppercase">Gestion Utilisateur</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 max-w-7xl mx-auto">
                {/* Sidebar Secondary */}
                <aside className="w-full md:w-64 flex-shrink-0">
                    <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm sticky top-24">
                        <div className="p-6 border-b border-border/50 bg-gradient-to-br from-card to-muted/30">
                            <h2 className="font-black text-lg tracking-tight truncate">{user.displayName || user.email}</h2>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">ID: {user.id.slice(0, 8)}...</p>
                        </div>
                        <nav className="p-2">
                            {sidebarItems.map((item) => {
                                const isActive = item.end
                                    ? location.pathname === item.path
                                    : location.pathname.startsWith(item.path);

                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={cn(
                                            "flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group",
                                            isActive
                                                ? "bg-primary text-primary-foreground shadow-md font-bold"
                                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className={cn("w-4 h-4", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                                            <span className="text-sm">{item.label}</span>
                                        </div>
                                        {isActive && <ChevronRight className="w-3 h-3 text-primary-foreground/50" />}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </aside>

                {/* Content Area */}
                <main className="flex-1 min-w-0">
                    <Outlet context={{ user }} />
                </main>
            </div>
        </div>
    );
}
