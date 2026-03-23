import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { usePermissions } from "@/hooks/useUsers";
import { Search, Shield } from "lucide-react";

interface PermissionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    userRoles: string[];
}

export function PermissionsModal({ isOpen, onClose, userRoles }: PermissionsModalProps) {
    const [search, setSearch] = useState('');
    const { data: allPermissions, isLoading } = usePermissions();

    // Filter permissions that the user has
    // We map userRoles (list of technical codes) to their readable labels using allPermissions
    const userPermissionsData = allPermissions?.filter(p => userRoles.includes(p.role)) || [];

    // If we have roles that are not in the /permissions mapping, we should still show them
    const mappedRoles = new Set(userPermissionsData.map(p => p.role));
    const extraRoles = userRoles.filter(role => !mappedRoles.has(role)).map(role => ({
        role,
        label: role.replace('ROLE_', '').split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')
    }));

    const finalPermissions = [...userPermissionsData, ...extraRoles];

    // Search filter
    const filteredPermissions = finalPermissions.filter(p =>
        p.label.toLowerCase().includes(search.toLowerCase()) ||
        p.role.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => a.label.localeCompare(b.label));

    // Grouping by domain
    const groupedPermissions = filteredPermissions.reduce((acc, p) => {
        const domain = p.role.split('_')[0] === 'ROLE' ? p.role.split('_')[1] : p.role.split('_')[0];
        if (!acc[domain]) acc[domain] = [];
        acc[domain].push(p);
        return acc;
    }, {} as Record<string, typeof filteredPermissions>);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden border-none rounded-[2rem] shadow-2xl gap-0">
                <DialogHeader className="p-8 pb-6 border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-20">
                    <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <span className="leading-tight">Toutes les permissions</span>
                            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground/60">{userRoles.length} au total</span>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="p-8 space-y-6 flex-1 flex flex-col min-h-0">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Rechercher une permission..."
                            className="pl-12 h-14 rounded-2xl bg-accent/40 border-none focus-visible:ring-1 focus-visible:ring-primary/20 shadow-inner text-sm font-bold"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="h-20 bg-accent/30 animate-pulse rounded-2xl" />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-10 pb-8">
                                {Object.entries(groupedPermissions).map(([domain, perms]) => (
                                    <div key={domain} className="space-y-4">
                                        <div className="flex items-center gap-3 px-1">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-primary">
                                                {domain}
                                            </h3>
                                            <div className="h-px bg-gradient-to-r from-primary/20 to-transparent flex-1" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {perms.map(p => (
                                                <div
                                                    key={p.role}
                                                    className="p-5 rounded-2xl bg-card border border-border/40 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group cursor-default"
                                                >
                                                    <p className="font-bold text-sm tracking-tight group-hover:text-primary transition-colors leading-tight">
                                                        {p.label}
                                                    </p>
                                                    <p className="text-[10px] font-mono text-muted-foreground/50 mt-2 uppercase tracking-tighter opacity-70">
                                                        {p.role}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {filteredPermissions.length === 0 && (
                                    <div className="text-center py-20 flex flex-col items-center">
                                        <div className="w-16 h-16 rounded-3xl bg-accent flex items-center justify-center mb-4">
                                            <Search className="w-6 h-6 text-muted-foreground/30" />
                                        </div>
                                        <p className="text-muted-foreground font-bold tracking-tight">Aucune permission trouvée</p>
                                        <p className="text-xs text-muted-foreground/60 mt-1">Essayez un autre terme de recherche.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
