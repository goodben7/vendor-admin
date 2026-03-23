import { useState, useEffect } from 'react';
import { useCreateProfile, useUpdateProfile, usePermissions } from '@/hooks/useUsers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Profile, PersonType } from '@/types/entities';
import { Shield, Save, X, Info } from 'lucide-react';
import { PermissionCategorizedSelector } from './PermissionCategorizedSelector';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { PERSON_TYPE_LABELS } from '@/constants/personTypes';

interface ProfileFormSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    profile?: Profile | null;
}

export default function ProfileFormSheet({ open, onOpenChange, profile }: ProfileFormSheetProps) {
    const createMutation = useCreateProfile();
    const updateMutation = useUpdateProfile();
    const { data: permissionsData, isLoading: isLoadingPermissions } = usePermissions();

    const [formData, setFormData] = useState({
        label: '',
        personType: 'SPADM' as PersonType,
        permission: [] as string[],
        active: true,
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                label: profile.label || '',
                personType: profile.personType || 'SPADM',
                permission: profile.permission || [],
                active: profile.active ?? true,
            });
        } else {
            if (open && !profile) {
                setFormData({
                    label: '',
                    personType: 'SPADM',
                    permission: [],
                    active: true,
                });
            }
        }
    }, [profile, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (profile) {
                await updateMutation.mutateAsync({ id: profile.id, data: formData });
            } else {
                await createMutation.mutateAsync(formData);
                setFormData({
                    label: '',
                    personType: 'SPADM',
                    permission: [],
                    active: true,
                });
            }
            onOpenChange(false);
        } catch (error) {
            // Error is handled by the mutation
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl p-0 border-none rounded-l-[2.5rem] overflow-hidden bg-background">
                <div className="flex flex-col h-full bg-gradient-to-b from-card/50 to-background">
                    {/* Header Premium */}
                    <SheetHeader className="p-8 pb-6 border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-10">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Shield className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <SheetTitle className="text-2xl font-black tracking-tight">
                                    {profile ? 'Modifier le profil' : 'Nouveau profil'}
                                </SheetTitle>
                                <SheetDescription className="font-bold text-muted-foreground/60">
                                    {profile ? 'Ajustez les accès de ce rôle' : 'Définissez un nouveau rôle et ses permissions'}
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>

                    {/* Form Content */}
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto no-scrollbar">
                        <div className="p-8 space-y-10 pb-32">
                            {/* General Info Section */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-2 px-1">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Informations générales</h3>
                                    <div className="h-px bg-gradient-to-r from-primary/20 to-transparent flex-1" />
                                </div>

                                <div className="grid gap-6">
                                    {/* Label */}
                                    <div className="space-y-2">
                                        <Label htmlFor="label" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">Nom du profil *</Label>
                                        <Input
                                            id="label"
                                            value={formData.label}
                                            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                            placeholder="Ex: Administrateur Senior"
                                            required
                                            className="h-12 rounded-xl bg-background/50 border-border/50 focus:ring-primary/20 transition-all font-bold placeholder:font-medium"
                                        />
                                    </div>

                                    {/* Person Type */}
                                    <div className="space-y-2">
                                        <Label htmlFor="personType" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">Type de structure *</Label>
                                        <Select
                                            value={formData.personType}
                                            onValueChange={(value: PersonType) => setFormData({ ...formData, personType: value })}
                                        >
                                            <SelectTrigger className="h-12 rounded-xl bg-background/50 border-border/50 focus:ring-primary/20 font-bold">
                                                <SelectValue placeholder="Sélectionnez un type" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-none shadow-2xl">
                                                {Object.entries(PERSON_TYPE_LABELS).map(([value, label]) => (
                                                    <SelectItem key={value} value={value} className="font-bold py-3">
                                                        {label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </section>

                            <Separator className="opacity-50" />

                            {/* Permissions Section */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-2 px-1">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Permissions d'accès</h3>
                                    <div className="h-px bg-gradient-to-r from-primary/20 to-transparent flex-1" />
                                </div>

                                <div className="bg-primary/5 rounded-2xl p-4 flex gap-3 border border-primary/10 mb-4">
                                    <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                    <p className="text-xs font-bold text-primary/80 leading-relaxed">
                                        Les permissions déterminent les actions que les utilisateurs assignés à ce profil peuvent effectuer.
                                    </p>
                                </div>

                                <PermissionCategorizedSelector
                                    permissions={permissionsData || []}
                                    selected={formData.permission}
                                    onChange={(selected) => setFormData({ ...formData, permission: selected })}
                                    isLoading={isLoadingPermissions}
                                />
                            </section>

                            {/* Status Section */}
                            <section className="space-y-4 pt-4">
                                <div
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group",
                                        formData.active ? "bg-emerald-500/5 border-emerald-500/20" : "bg-muted/40 border-border/40"
                                    )}
                                    onClick={() => setFormData({ ...formData, active: !formData.active })}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            formData.active ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/30"
                                        )} />
                                        <Label htmlFor="active" className="font-black uppercase tracking-widest text-[10px] cursor-pointer">
                                            Profil Actif
                                        </Label>
                                    </div>
                                    <div className={cn(
                                        "w-12 h-6 rounded-full p-1 transition-colors duration-300",
                                        formData.active ? "bg-emerald-500" : "bg-muted-foreground/20"
                                    )}>
                                        <div className={cn(
                                            "w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm",
                                            formData.active ? "translate-x-6" : "translate-x-0"
                                        )} />
                                    </div>
                                </div>
                            </section>
                        </div>
                    </form>

                    {/* Footer Premium */}
                    <div className="p-8 bg-card/80 backdrop-blur-xl border-t border-border/50 absolute bottom-0 left-0 right-0 z-10">
                        <div className="flex gap-4">
                            <Button
                                type="button"
                                variant="ghost"
                                className="flex-1 h-12 rounded-xl font-bold text-muted-foreground hover:bg-accent transition-all"
                                onClick={() => onOpenChange(false)}
                            >
                                <X className="w-4 h-4 mr-2" />
                                Annuler
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={isPending || !formData.label}
                                className="flex-[2] h-12 rounded-xl font-black bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all group"
                            >
                                {isPending ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Enregistrement...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        {profile ? 'Mettre à jour' : 'Créer le profil'}
                                    </span>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

