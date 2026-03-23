import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Building2,
    ShoppingCart,
    CreditCard,
    X,
    ChefHat,
    Settings,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    BookOpen,
    LayoutGrid,
    Armchair,
    UserCircle,
    Smartphone,
    Package,
    Layers,
    Settings2,
    ShieldCheck,
    Store,
    Coins,
    TrendingUp,
} from 'lucide-react';
import logo from '@/assets/1.png';
import logoCollapsed from '@/assets/2.png';
import { cn } from '@/lib/utils';
import RoleGuard from '@/components/shared/RoleGuard';
import { usePlatforms } from '@/hooks/usePlatforms';
import { useOrders } from '@/hooks/useOrders';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getCurrentUser } from '@/services/auth.service';


interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
}

interface NavItem {
    label: string;
    icon?: React.ReactNode;
    path: string;
    permissions?: string[];
    children?: NavItem[];
    badge?: boolean;
}

interface NavSection {
    section: string;
    items: NavItem[];
}

const navSections: NavSection[] = [
    {
        section: 'EXPLOITATION',
        items: [
            {
                label: 'Prise de commande',
                icon: <Store className="w-5 h-5" />,
                path: '/orders/create',
                permissions: ['ROLE_ORDER_CREATE'],
            },
            {
                label: 'Dashboard',
                icon: <LayoutDashboard className="w-5 h-5" />,
                path: '/dashboard',
                permissions: ['ROLE_ORDER_LIST'],
            },
            {
                label: 'Commandes',
                icon: <ShoppingCart className="w-5 h-5" />,
                path: '/orders',
                permissions: ['ROLE_ORDER_LIST'],
                badge: true
            },
            {
                label: 'Cuisine',
                icon: <ChefHat className="w-5 h-5" />,
                path: '/kitchen',
                permissions: ['ROLE_ORDER_LIST'],
            },
            {
                label: 'Salle',
                icon: <LayoutGrid className="w-5 h-5" />,
                path: '#salle',
                permissions: ['ROLE_PLATFORM_TABLE_LIST', 'ROLE_TABLET_LIST'],
                children: [
                    {
                        label: 'Tables',
                        icon: <Armchair className="w-4 h-4" />,
                        path: '/platform-tables',
                        permissions: ['ROLE_PLATFORM_TABLE_LIST'],
                    },
                    {
                        label: 'Tablettes',
                        icon: <Smartphone className="w-4 h-4" />,
                        path: '/tablets',
                        permissions: ['ROLE_TABLET_LIST'],
                    },
                ]
            },
            {
                label: 'Paiements',
                icon: <CreditCard className="w-5 h-5" />,
                path: '/payments',
                permissions: ['ROLE_PAYMENT_LIST'],
            },
        ]
    },
    {
        section: 'CATALOGUE',
        items: [
            {
                label: 'Produits',
                icon: <Package className="w-5 h-5" />,
                path: '/products',
                permissions: ['ROLE_PRODUCT_LIST'],
            },
            {
                label: 'Catégories',
                icon: <Layers className="w-5 h-5" />,
                path: '/categories',
                permissions: ['ROLE_CATEGORY_LIST'],
            },
            {
                label: 'Options',
                icon: <Settings2 className="w-5 h-5" />,
                path: '/option-groups',
                permissions: ['ROLE_OPTION_GROUP_LIST'],
            },
            {
                label: 'Menus',
                icon: <BookOpen className="w-5 h-5" />,
                path: '/menus',
                permissions: ['ROLE_MENU_LIST'],
            },
        ]
    },
    {
        section: 'PARAMÈTRES',
        items: [
            {
                label: 'Restaurant',
                icon: <Building2 className="w-5 h-5" />,
                path: '/platforms',
                permissions: ['ROLE_PLATFORM_LIST'],
            },
            {
                label: 'Devises',
                icon: <Coins className="w-5 h-5" />,
                path: '/currencies',
                permissions: ['ROLE_CURRENCY_LIST'],
            },
            {
                label: 'Taux de change',
                icon: <TrendingUp className="w-5 h-5" />,
                path: '/exchange-rates',
                permissions: ['ROLE_EXCHANGE_RATE_READ'],
            },
            {
                label: 'Utilisateurs',
                icon: <Users className="w-5 h-5" />,
                path: '#users',
                permissions: ['ROLE_USER_LIST', 'ROLE_PROFILE_LIST'],
                children: [
                    {
                        label: 'Comptes',
                        icon: <UserCircle className="w-4 h-4" />,
                        path: '/users',
                        permissions: ['ROLE_USER_LIST'],
                    },
                    {
                        label: 'Rôles / Profils',
                        icon: <ShieldCheck className="w-4 h-4" />,
                        path: '/profiles',
                        permissions: ['ROLE_PROFILE_LIST'],
                    },
                ]
            },
            {
                label: 'Configuration',
                icon: <Settings className="w-5 h-5" />,
                path: '/settings',
                permissions: ['ROLE_PLATFORM_UPDATE'],
            },
        ]
    }
];

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
    const location = useLocation();
    const [expandedItems, setExpandedItems] = useState<string[]>(['Salle', 'Utilisateurs']);

    const { data: platformsData } = usePlatforms();
    const { data: ordersData } = useOrders({ status: ['D'] });
    const pendingOrdersCount = ordersData?.total || 0;

    const toggleExpand = (label: string) => {
        setExpandedItems(prev =>
            prev.includes(label)
                ? prev.filter(item => item !== label)
                : [...prev, label]
        );
    };

    const NavLink = ({ item, depth = 0 }: { item: NavItem; depth?: number }) => {
        const isActive = location.pathname === item.path || (item.path !== '#' && item.path !== '' && location.pathname.startsWith(item.path + '/'));
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedItems.includes(item.label);

        const isChildActive = hasChildren && item.children?.some(child => {
            if (getIsActive(child.path)) return true;
            return false;
        });

        function getIsActive(path: string) {
            if (path === '#' || !path) return false;
            return location.pathname === path || location.pathname.startsWith(path + '/');
        }

        const content = (
            <div className="mb-0.5">
                {hasChildren ? (
                    <button
                        onClick={() => isOpen && toggleExpand(item.label)}
                        className={cn(
                            'w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                            isChildActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                            !isOpen && 'justify-center px-1.5',
                            depth > 0 && 'py-2 px-2.5'
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "flex items-center justify-center transition-transform duration-200",
                                isChildActive && "scale-110"
                            )}>
                                {item.icon}
                            </div>
                            {isOpen && <span className={cn("font-semibold text-sm tracking-tight", isChildActive && "font-black")}>{item.label}</span>}
                        </div>
                        {isOpen && (
                            <span className="text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
                                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            </span>
                        )}

                        {/* Custom Tooltip for collapsed state */}
                        {!isOpen && (
                            <div className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 px-3 py-2 bg-card text-foreground text-xs font-black rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border border-border opacity-0 invisible -translate-x-2 group-hover:opacity-100 group-hover:visible group-hover:translate-x-0 transition-all duration-200 z-[100] whitespace-nowrap pointer-events-none ring-1 ring-border/50">
                                {item.label}
                                <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-card border-l border-b border-border rotate-45" />
                            </div>
                        )}
                    </button>
                ) : (
                    <Link
                        to={item.path}
                        className={cn(
                            'block flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                            isActive
                                ? 'bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20'
                                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                            !isOpen && 'justify-center px-1.5',
                            depth > 0 && 'text-sm py-2 px-2.5 ml-2'
                        )}
                    >
                        <div className={cn("flex items-center gap-3")}>
                            <div className={cn(
                                "flex items-center justify-center transition-transform duration-200",
                                isActive && "scale-110"
                            )}>
                                {item.icon || (depth > 0 && <div className={cn("w-1.5 h-1.5 rounded-full bg-current", isActive ? "opacity-100" : "opacity-30")} />)}
                            </div>
                            {isOpen && <span className="font-semibold text-sm tracking-tight">{item.label}</span>}
                        </div>
                        {isOpen && item.badge && pendingOrdersCount > 0 && (
                            <Badge className="bg-destructive text-destructive-foreground px-1.5 py-0 min-w-5 h-5 flex items-center justify-center text-[10px] font-black rounded-full animate-pulse-subtle">
                                {pendingOrdersCount}
                            </Badge>
                        )}

                        {/* Custom Tooltip for collapsed state */}
                        {!isOpen && (
                            <div className="absolute left-full ml-2 px-3 py-2 bg-popover text-popover-foreground text-xs font-black rounded-xl shadow-2xl border border-border opacity-0 invisible -translate-x-2 group-hover:opacity-100 group-hover:visible group-hover:translate-x-0 transition-all duration-200 z-[100] whitespace-nowrap pointer-events-none">
                                {item.label}
                                <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-popover border-l border-b border-border rotate-45" />
                            </div>
                        )}
                    </Link>
                )}

                {/* Submenu */}
                {hasChildren && isOpen && isExpanded && (
                    <div className={cn(
                        "mt-0.5 space-y-0.5",
                        "ml-6 border-l border-border/50 pl-2"
                    )}>
                        {item.children!.map(child => (
                            <RoleGuard key={child.path + child.label} permissions={child.permissions as any}>
                                <NavLink item={child} depth={depth + 1} />
                            </RoleGuard>
                        ))}
                    </div>
                )}
            </div>
        );

        if (item.permissions) {
            return (
                <RoleGuard permissions={item.permissions as any}>
                    {content}
                </RoleGuard>
            );
        }

        return content;
    };

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onToggle}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed top-0 left-0 z-[70] h-screen bg-card border-r border-border transition-all duration-300 flex flex-col',
                    isOpen ? 'w-64' : 'w-20 overflow-visible',
                    !isOpen && 'lg:translate-x-0 -translate-x-full lg:block'
                )}
            >
                {/* Desktop Toggle Button — Floating on the border line */}
                <button
                    onClick={onToggle}
                    className={cn(
                        "hidden lg:flex absolute -right-3 top-8 z-[60] w-6 h-6 items-center justify-center rounded-full bg-card border border-border shadow-sm hover:bg-accent hover:border-primary/30 transition-all duration-300 group ring-4 ring-background"
                    )}
                >
                    {isOpen ? (
                        <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                </button>

                <div className={cn("flex-1 no-scrollbar", isOpen ? "overflow-y-auto" : "overflow-visible")}>
                {/* Header / Logo */}
                <div className="flex flex-col p-4 sticky top-0 bg-card z-10 gap-2 w-full">
                    <div className="flex items-center justify-center h-[72px] -mt-4 -mx-4 border-b border-border/50 mb-0 px-4">
                        <Link to="/dashboard" className={cn("transition-all duration-300 hover:scale-105", !isOpen && "scale-110")}>
                            <img 
                                src={isOpen ? logo : logoCollapsed} 
                                alt="Vendor" 
                                className={cn(isOpen ? "h-12 w-auto" : "h-10 w-auto")} 
                            />
                        </Link>
                        
                        {/* Mobile close button (only visible on small screens) */}
                        <button
                            onClick={onToggle}
                            className="p-1.5 rounded-lg hover:bg-accent lg:hidden absolute right-4 top-4"
                        >
                            <X className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </div>

                    {/* Platform Selector */}
                    {isOpen && platformsData && (
                        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-500">
                            <Select defaultValue={platformsData.data[0]?.id}>
                                <SelectTrigger className="w-full h-12 bg-muted/40 border-none rounded-xl focus:ring-1 focus:ring-primary/30 shadow-inner group">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/30 transition-colors">
                                            <Store className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="flex flex-col items-start min-w-0">
                                            <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60 leading-none mb-1">Restaurant</span>
                                            <SelectValue />
                                        </div>
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-none shadow-2xl">
                                    {platformsData.data.map(platform => (
                                        <SelectItem key={platform.id} value={platform.id} className="font-bold py-2.5">
                                            {platform.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                <Separator className="mx-4 w-auto opacity-50" />

                <nav className="p-4 flex-1">
                    {navSections.map((navSection, idx) => {
                        const currentUser = getCurrentUser();
                        const isAdmin = currentUser?.roles?.includes('ROLE_ADMIN');

                        // Filter items to hide 'Prise de commande' from admins
                        const filteredItems = navSection.items.filter(item => {
                            if (item.label === 'Prise de commande' && isAdmin) return false;
                            return true;
                        });

                        if (filteredItems.length === 0) return null;

                        return (
                            <div key={navSection.section} className={cn("mb-6", idx === navSections.length - 1 && "mb-0")}>
                                {isOpen && (
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mb-3 ml-3">
                                        {navSection.section}
                                    </h3>
                                )}
                                <div className="space-y-1">
                                    {filteredItems.map((item) => (
                                        <NavLink key={item.label} item={item} />
                                    ))}
                                </div>
                                {idx < navSections.length - 1 && isOpen && filteredItems.length > 0 && <div className="mt-6 mb-2 border-t border-border/30 mx-2" />}
                            </div>
                        );
                    })}
                </nav>


                </div>
            </aside>
        </>
    );
}
