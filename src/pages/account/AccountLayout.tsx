import { Link, Outlet, useLocation } from 'react-router-dom';
import { User, Shield, Lock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const sidebarItems = [
    {
        label: 'Aperçu',
        icon: User,
        path: '/account',
        end: true,
    },
    {
        label: 'Mon Profil',
        icon: Shield,
        path: '/account/profile',
    },
    {
        label: 'Sécurité',
        icon: Lock,
        path: '/account/security',
    },
];

export default function AccountLayout() {
    const location = useLocation();

    return (
        <div className="flex flex-col md:flex-row gap-8 max-w-7xl mx-auto">
            {/* Sidebar Secondary */}
            <aside className="w-full md:w-64 flex-shrink-0">
                <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm sticky top-24">
                    <div className="p-6 border-b border-border/50">
                        <h2 className="font-black text-lg tracking-tight">Paramètres</h2>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Compte personnel</p>
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
                <Outlet />
            </main>
        </div>
    );
}
