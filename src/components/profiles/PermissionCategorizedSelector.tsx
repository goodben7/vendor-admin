import { useState, useMemo } from 'react';
import { Search, Shield, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Permission {
    role: string;
    label: string;
}

interface PermissionCategorizedSelectorProps {
    permissions: Permission[];
    selected: string[];
    onChange: (selected: string[]) => void;
    isLoading?: boolean;
}

export function PermissionCategorizedSelector({
    permissions,
    selected,
    onChange,
    isLoading = false
}: PermissionCategorizedSelectorProps) {
    const [search, setSearch] = useState('');

    // Grouping and Filtering logic
    const groupedPermissions = useMemo(() => {
        const filtered = permissions.filter(p =>
            p.label.toLowerCase().includes(search.toLowerCase()) ||
            p.role.toLowerCase().includes(search.toLowerCase())
        );

        return filtered.reduce((acc, p) => {
            const domain = p.role.split('_')[0] === 'ROLE' ? p.role.split('_')[1] : p.role.split('_')[0];
            if (!acc[domain]) acc[domain] = [];
            acc[domain].push(p);
            return acc;
        }, {} as Record<string, Permission[]>);
    }, [permissions, search]);

    const handleTogglePermission = (role: string) => {
        const newSelected = selected.includes(role)
            ? selected.filter(r => r !== role)
            : [...selected, role];
        onChange(newSelected);
    };

    const handleToggleDomain = (_domain: string, perms: Permission[]) => {
        const domainRoles = perms.map(p => p.role);
        const allSelected = domainRoles.every(role => selected.includes(role));

        if (allSelected) {
            // Unselect all in this domain
            onChange(selected.filter(role => !domainRoles.includes(role)));
        } else {
            // Select all in this domain (avoiding duplicates)
            const otherRoles = selected.filter(role => !domainRoles.includes(role));
            onChange([...otherRoles, ...domainRoles]);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="h-10 bg-accent/30 animate-pulse rounded-xl" />
                <div className="grid grid-cols-1 gap-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-accent/20 animate-pulse rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                    placeholder="Chercher une permission..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-11 bg-background/50 border-border/50 rounded-xl focus-visible:ring-primary/20 font-bold text-sm"
                />
                {search && (
                    <button
                        onClick={() => setSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded-full transition-colors"
                    >
                        <X className="w-3 h-3 text-muted-foreground" />
                    </button>
                )}
            </div>

            {/* Selected Summary */}
            {selected.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-primary/5 rounded-xl border border-primary/10">
                    <Badge variant="outline" className="bg-primary text-primary-foreground border-none text-[10px] font-black uppercase tracking-wider h-6 px-2">
                        {selected.length} sélectionnée(s)
                    </Badge>
                </div>
            )}

            {/* Grouped Permissions */}
            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {Object.entries(groupedPermissions).map(([domain, perms]) => {
                    const domainRoles = perms.map(p => p.role);
                    const allSelected = domainRoles.every(role => selected.includes(role));
                    const someSelected = domainRoles.some(role => selected.includes(role));

                    return (
                        <div key={domain} className="space-y-3">
                            {/* Domain Header */}
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        "w-1.5 h-1.5 rounded-full transition-all duration-300",
                                        allSelected ? "bg-primary scale-125" : someSelected ? "bg-primary/50" : "bg-muted-foreground/30"
                                    )} />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                        {domain}
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleToggleDomain(domain, perms)}
                                    className={cn(
                                        "text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md transition-all",
                                        allSelected
                                            ? "text-primary hover:bg-primary/10"
                                            : "text-muted-foreground/60 hover:text-primary hover:bg-primary/5"
                                    )}
                                >
                                    {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                                </button>
                            </div>

                            {/* Permissions Grid */}
                            <div className="grid grid-cols-1 gap-2">
                                {perms.map(p => {
                                    const isSelected = selected.includes(p.role);
                                    return (
                                        <div
                                            key={p.role}
                                            onClick={() => handleTogglePermission(p.role)}
                                            className={cn(
                                                "group flex items-center justify-between p-3 rounded-xl border transition-all duration-200 cursor-pointer select-none",
                                                isSelected
                                                    ? "bg-primary/5 border-primary/20 shadow-sm"
                                                    : "bg-background/40 border-border/40 hover:border-border hover:bg-accent/40"
                                            )}
                                        >
                                            <div className="flex flex-col gap-0.5">
                                                <span className={cn(
                                                    "text-sm font-bold tracking-tight transition-colors",
                                                    isSelected ? "text-primary" : "text-foreground"
                                                )}>
                                                    {p.label}
                                                </span>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 font-mono">
                                                    {p.role}
                                                </span>
                                            </div>
                                            <div className={cn(
                                                "w-5 h-5 rounded-lg border flex items-center justify-center transition-all duration-200",
                                                isSelected
                                                    ? "bg-primary border-primary text-primary-foreground scale-110 shadow-lg shadow-primary/20"
                                                    : "bg-background border-border group-hover:border-muted-foreground/50"
                                            )}>
                                                {isSelected && <Check className="w-3 h-3" strokeWidth={4} />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

                {Object.keys(groupedPermissions).length === 0 && (
                    <div className="py-12 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-3">
                            <Shield className="w-6 h-6 text-muted-foreground/30" />
                        </div>
                        <p className="text-sm font-bold text-muted-foreground">Aucune permission trouvée</p>
                    </div>
                )}
            </div>
        </div>
    );
}
