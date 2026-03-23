import { useState, useEffect } from 'react';
import { useCreateUser, useUpdateUser, useProfiles } from '@/hooks/useUsers';
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
import { Separator } from '@/components/ui/separator';
import { User as UserIcon, Mail, Phone, Shield, Lock, Save, X, Loader2 } from 'lucide-react';
import { User } from '@/types/entities';
import { toast } from 'sonner';

interface UserFormSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user?: User | null;
}

export default function UserFormSheet({ open, onOpenChange, user }: UserFormSheetProps) {
    const { data: profilesData } = useProfiles();
    const createMutation = useCreateUser();
    const updateMutation = useUpdateUser();

    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        phone: '',
        profile: '',
        plainPassword: '',
    });

    const isEdit = !!user;

    useEffect(() => {
        if (user) {
            setFormData({
                displayName: user.displayName || '',
                email: user.email || '',
                phone: user.phone || '',
                profile: user.profile && typeof user.profile === 'object' ? user.profile.id : '',
                plainPassword: '', // Don't pre-fill password
            });
        } else {
            if (open) {
                setFormData({
                    displayName: '',
                    email: '',
                    phone: '',
                    profile: '',
                    plainPassword: '',
                });
            }
        }
    }, [user, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.displayName || !formData.email) {
            toast.error("Veuillez remplir les champs obligatoires");
            return;
        }

        if (!isEdit && (!formData.profile || !formData.plainPassword)) {
            toast.error("Veuillez sélectionner un profil et définir un mot de passe");
            return;
        }

        try {
            const apiData: any = {
                displayName: formData.displayName,
                email: formData.email,
                phone: formData.phone || '',
            };

            if (!isEdit) {
                apiData.profile = `/api/profiles/${formData.profile}`;
                apiData.plainPassword = formData.plainPassword;
                await createMutation.mutateAsync(apiData);
                toast.success("Utilisateur créé avec succès");
            } else {
                // If editing, only send profile if changed or if you want to support changing profile
                if (formData.profile) {
                    apiData.profile = `/api/profiles/${formData.profile}`;
                }
                // Optional password change
                if (formData.plainPassword) {
                    apiData.plainPassword = formData.plainPassword;
                }
                await updateMutation.mutateAsync({ id: user.id, data: apiData });
                toast.success("Utilisateur mis à jour avec succès");
            }
            onOpenChange(false);
        } catch (error: any) {
            const data = error.response?.data;
            const errorMessage = data?.['hydra:description'] || data?.description || data?.detail || data?.message || "Une erreur est survenue";
            toast.error(errorMessage);
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl p-0 border-none rounded-l-[2.5rem] overflow-hidden bg-background">
                <div className="flex flex-col h-full bg-gradient-to-b from-card/50 to-background">
                    {/* Header */}
                    <SheetHeader className="p-8 pb-6 border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                <UserIcon className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <SheetTitle className="text-2xl font-black tracking-tight">
                                    {user ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
                                </SheetTitle>
                                <SheetDescription className="font-bold text-muted-foreground/60 mt-0.5">
                                    {user
                                        ? "Modifiez les informations personnelles de cet utilisateur."
                                        : "Créez un profil pour un nouveau membre de l'équipe."}
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>

                    {/* Content */}
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto no-scrollbar">
                        <div className="p-8 space-y-10 pb-32">

                            {/* ── Informations Personnelles ── */}
                            <section className="space-y-5">
                                <div className="flex items-center gap-2 px-1">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Informations Personnelles</h3>
                                    <div className="h-px bg-gradient-to-r from-primary/20 to-transparent flex-1" />
                                </div>

                                <div className="grid gap-5">
                                    {/* Nom d'affichage */}
                                    <div className="space-y-2">
                                        <Label htmlFor="displayName" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">Nom d'affichage *</Label>
                                        <div className="relative">
                                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                                            <Input
                                                id="displayName"
                                                value={formData.displayName}
                                                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                                placeholder="Ex: John Doe"
                                                className="h-12 rounded-xl bg-background/50 border-border/50 pl-11 font-bold focus-visible:ring-primary/20"
                                            />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">Adresse Email *</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                                            <Input
                                                id="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="john.doe@example.com"
                                                className="h-12 rounded-xl bg-background/50 border-border/50 pl-11 font-bold focus-visible:ring-primary/20"
                                            />
                                        </div>
                                    </div>

                                    {/* Téléphone */}
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">Téléphone</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                                            <Input
                                                id="phone"
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                placeholder="+33 6 12 34 56 78"
                                                className="h-12 rounded-xl bg-background/50 border-border/50 pl-11 font-bold focus-visible:ring-primary/20"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* ── Accès & Sécurité ── Hidden during edit */}
                            {!isEdit && (
                                <>
                                    <Separator className="opacity-50" />
                                    <section className="space-y-5">
                                        <div className="flex items-center gap-2 px-1">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Accès & Sécurité</h3>
                                            <div className="h-px bg-gradient-to-r from-primary/20 to-transparent flex-1" />
                                        </div>

                                        <div className="grid gap-5">
                                            {/* Profil */}
                                            <div className="space-y-2">
                                                <Label htmlFor="profile" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">Profil utilisateur *</Label>
                                                <div className="relative group">
                                                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 z-10" />
                                                    <Select
                                                        value={formData.profile}
                                                        onValueChange={(v) => setFormData({ ...formData, profile: v })}
                                                    >
                                                        <SelectTrigger className="h-12 rounded-xl bg-background/50 border-border/50 pl-11 font-bold focus-visible:ring-primary/20">
                                                            <SelectValue placeholder="Sélectionner un profil" />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl border-none shadow-2xl">
                                                            {profilesData?.map((profile: any) => (
                                                                <SelectItem key={profile.id} value={profile.id} className="font-bold">
                                                                    {profile.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            {/* Mot de passe */}
                                            <div className="space-y-2">
                                                <Label htmlFor="plainPassword" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">
                                                    Mot de passe *
                                                </Label>
                                                <div className="relative">
                                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                                                    <Input
                                                        id="plainPassword"
                                                        type="password"
                                                        value={formData.plainPassword}
                                                        onChange={(e) => setFormData({ ...formData, plainPassword: e.target.value })}
                                                        placeholder="••••••••"
                                                        className="h-12 rounded-xl bg-background/50 border-border/50 pl-11 font-bold focus-visible:ring-primary/20"
                                                    />
                                                </div>
                                                <p className="text-[10px] text-muted-foreground font-medium ml-1 italic">Minimum 6 caractères.</p>
                                            </div>
                                        </div>
                                    </section>
                                </>
                            )}
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="p-8 bg-card/80 backdrop-blur-xl border-t border-border/50 absolute bottom-0 left-0 right-0 z-10">
                        <div className="flex gap-4">
                            <Button
                                type="button"
                                variant="ghost"
                                className="flex-1 h-12 rounded-xl font-bold text-muted-foreground hover:bg-accent"
                                onClick={() => onOpenChange(false)}
                            >
                                <X className="w-4 h-4 mr-2" />
                                Annuler
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={isPending}
                                className="flex-[2] h-12 rounded-xl font-black bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all group"
                            >
                                {isPending ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Enregistrement...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        {user ? 'Mettre à jour' : 'Créer l\'utilisateur'}
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
