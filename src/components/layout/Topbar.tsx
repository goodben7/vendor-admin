import { Menu, Moon, Sun, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser, logout } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { useAboutMe } from '@/hooks/useUsers';
import { cn } from '@/lib/utils';
import { PersonType } from '@/types/entities';

interface TopbarProps {
    onMenuClick: () => void;
}

const PERSON_TYPE_CONFIG: Record<PersonType, { label: string; bg: string; text: string; dot: string; avatarBg: string }> = {
    SPADM: { label: 'Super Admin', bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', dot: 'bg-violet-500', avatarBg: 'bg-violet-500' },
    ADM:   { label: 'Admin',       bg: 'bg-primary/10',    text: 'text-primary',                         dot: 'bg-primary',    avatarBg: 'bg-primary'    },
    MGR:   { label: 'Manager',     bg: 'bg-blue-500/10',   text: 'text-blue-600 dark:text-blue-400',     dot: 'bg-blue-500',   avatarBg: 'bg-blue-500'   },
    STF:   { label: 'Staff',       bg: 'bg-cyan-500/10',   text: 'text-cyan-600 dark:text-cyan-400',     dot: 'bg-cyan-500',   avatarBg: 'bg-cyan-500'   },
    KIT:   { label: 'Cuisine',     bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', dot: 'bg-orange-500', avatarBg: 'bg-orange-500' },
    WTR:   { label: 'Serveur',     bg: 'bg-emerald-500/10',text: 'text-emerald-600 dark:text-emerald-400',dot:'bg-emerald-500',avatarBg: 'bg-emerald-500'},
    CSR:   { label: 'Caissier',    bg: 'bg-amber-500/10',  text: 'text-amber-600 dark:text-amber-400',   dot: 'bg-amber-500',  avatarBg: 'bg-amber-500'  },
    SFO:   { label: 'Borne',       bg: 'bg-zinc-500/10',   text: 'text-zinc-600 dark:text-zinc-400',     dot: 'bg-zinc-500',   avatarBg: 'bg-zinc-500'   },
};

export default function Topbar({ onMenuClick }: TopbarProps) {
    const [darkMode, setDarkMode] = useState(false);
    const localUser = getCurrentUser();
    const { data: remoteUser } = useAboutMe();

    const user = remoteUser || localUser;
    const ptConfig = localUser?.personType ? PERSON_TYPE_CONFIG[localUser.personType] : null;

    const initials = (localUser?.displayName || localUser?.email || 'U')
        .split(' ')
        .filter(Boolean)
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const displayName = (user?.displayName?.replace(/\s*\([^)]*\)$/, '') || user?.email || '').trim();

    useEffect(() => {
        const isDark = localStorage.getItem('theme') === 'dark';
        setDarkMode(isDark);
        if (isDark) document.documentElement.classList.add('dark');
    }, []);

    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        if (newMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    return (
        <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-sm border-b border-border/60">
            <div className="flex items-center justify-between px-6 h-14">

                {/* Left — identity badge */}
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onMenuClick}
                        className="lg:hidden h-9 w-9 rounded-xl"
                    >
                        <Menu className="w-4 h-4" />
                    </Button>

                    {localUser && (
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                'flex items-center gap-3 px-3 py-2 rounded-xl transition-all',
                                ptConfig ? `${ptConfig.bg}` : 'bg-muted/40'
                            )}>
                                {/* Avatar */}
                                <div className={cn(
                                    'w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white flex-shrink-0 shadow-sm',
                                    ptConfig ? ptConfig.avatarBg : 'bg-muted-foreground'
                                )}>
                                    {initials}
                                </div>
                                
                                {/* Info */}
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-medium text-muted-foreground/80 leading-none mb-1">
                                        Vous êtes connecté en tant que
                                    </span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-black text-foreground leading-none">
                                            {localUser.displayName || localUser.email}
                                        </span>
                                        {ptConfig && (
                                            <span className={cn(
                                                'text-[10px] font-black uppercase tracking-[0.1em] px-1.5 py-0.5 rounded-md leading-none',
                                                ptConfig.bg, ptConfig.text
                                            )}>
                                                {ptConfig.label}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right — actions */}
                <div className="flex items-center gap-1">
                    {/* Dark mode toggle */}
                    <button
                        onClick={toggleDarkMode}
                        title={darkMode ? 'Mode clair' : 'Mode sombre'}
                        className="h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                    >
                        {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>

                    {/* Divider */}
                    <div className="w-px h-5 bg-border/60 mx-1" />

                    {/* User pill → account page */}
                    <Link
                        to="/account"
                        title="Mon compte"
                        className="flex items-center gap-2 h-9 pl-2 pr-3 rounded-xl hover:bg-accent transition-all duration-200 group"
                    >
                        <div className={cn(
                            'w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white flex-shrink-0',
                            ptConfig ? ptConfig.avatarBg : 'bg-muted-foreground'
                        )}>
                            {initials}
                        </div>
                        <span className="text-sm font-semibold hidden sm:inline max-w-[150px] truncate">
                            {displayName}
                        </span>
                    </Link>

                    {/* Logout */}
                    <button
                        onClick={logout}
                        title="Déconnexion"
                        className="h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </header>
    );
}
