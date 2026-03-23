import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Platform } from '@/types/entities';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/services/axios';
import { toast } from 'sonner';

interface AdminAccessDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    platform: Platform | null;
}

export default function AdminAccessDialog({ open, onOpenChange, platform }: AdminAccessDialogProps) {
    const queryClient = useQueryClient();

    // Fetch available profiles
    const { data: profiles } = useQuery({
        queryKey: ['profiles-list'],
        queryFn: async () => {
            const response = await axiosInstance.get('/profiles');
            return response.data['hydra:member'] || response.data['member'] || [];
        }
    });

    const [formData, setFormData] = useState({
        email: '',
        plainPassword: '',
        phone: '',
        displayName: '',
        profile: '/api/profiles/admin', // default profile IRI if any
    });

    const [apiError, setApiError] = useState<string | null>(null);

    useEffect(() => {
        if (platform && open) {
            setFormData(prev => ({
                ...prev,
                email: platform.email || '',
                phone: platform.phone || '',
                displayName: `Admin ${platform.name}`,
                plainPassword: '',
                profile: '/api/profiles/admin', // User needs to ensure this is correct
            }));
            setApiError(null);
        }
    }, [platform, open]);

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            // "un post sur : {{BASE_URL}}/api/users/{{USER_ID}}/admin_access"
            // We use /users/admin_access instead, as discussed, or directly the path provided.
            // If the user literally meant it creates the user, we send it to /users/admin_access
            const response = await axiosInstance.post(`/users/${platform?.id}/admin_access`, {
                email: data.email,
                plainPassword: data.plainPassword,
                profile: data.profile,
                phone: data.phone,
                displayName: data.displayName,
                platformId: platform?.id
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platforms'] });
            toast.success('Accès administrateur créé avec succès');
            setApiError(null);
            onOpenChange(false);
        },
        onError: (error: any) => {
            const data = error.response?.data;
            let errorMessage = "Erreur lors de la création de l'accès admin";

            if (data) {
                if (data.violations && Array.isArray(data.violations)) {
                    errorMessage = data.violations.map((v: any) => `${v.propertyPath ? v.propertyPath + ': ' : ''}${v.message}`).join(', ');
                } else if (data.detail) {
                    errorMessage = data.detail;
                } else if (data.message) {
                    errorMessage = data.message;
                }
            }

            setApiError(errorMessage);
            toast.error("Échec de la création");
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!platform) return;
        await mutation.mutateAsync(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Créer un accès administrateur</DialogTitle>
                    <DialogDescription>
                        Créez un compte administrateur pour la plateforme <span className="font-semibold text-foreground">{platform?.name}</span>.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {apiError && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-md text-sm font-medium">
                                {apiError}
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label htmlFor="displayName">Nom d'affichage</Label>
                            <Input
                                id="displayName"
                                value={formData.displayName}
                                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Téléphone</Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="profile">Profil</Label>
                            <Select
                                value={formData.profile}
                                onValueChange={(value) => setFormData({ ...formData, profile: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionnez un profil" />
                                </SelectTrigger>
                                <SelectContent>
                                    {profiles && profiles.length > 0 ? (
                                        profiles.map((p: any) => (
                                            <SelectItem key={p.id} value={`/api/profiles/${p.id}`}>
                                                {p.label}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="/api/profiles/admin">Admin</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="plainPassword">Mot de passe</Label>
                            <Input
                                id="plainPassword"
                                type="password"
                                value={formData.plainPassword}
                                onChange={(e) => setFormData({ ...formData, plainPassword: e.target.value })}
                                required
                                placeholder="Mot de passe sécurisé"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? 'Création...' : 'Créer l\'accès'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
