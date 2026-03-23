import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, UserCog } from 'lucide-react';
import { usePlatform } from '@/hooks/usePlatforms';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import RoleGuard from '@/components/shared/RoleGuard';
import PlatformFormSheet from './PlatformFormSheet';
import AdminAccessDialog from './AdminAccessDialog';
import { useState } from 'react';
import axiosInstance from '@/services/axios';
import { toast } from 'sonner';

export default function PlatformDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: platform, isLoading } = usePlatform(id!);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isAccessDialogOpen, setIsAccessDialogOpen] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);

    const handleAdminAction = async () => {
        if (!platform) return;

        if (!platform.adminAccountCreated) {
            setIsAccessDialogOpen(true);
            return;
        }

        // Navigate to the user details
        setIsNavigating(true);
        try {
            // Tentative de recherche de l'utilisateur admin via son email ou platformId
            const params = platform.email ? { email: platform.email } : {};
            const response = await axiosInstance.get('/users', { params });
            const users = response.data['hydra:member'] || response.data['member'] || [];

            if (users.length > 0) {
                navigate(`/users/${users[0].id}`);
            } else {
                toast.warning("Impossible de trouver l'utilisateur exact, redirection vers la liste.");
                navigate('/users');
            }
        } catch (error) {
            toast.error("Erreur temporelle lors de la recherche de l'admin.");
            navigate('/users');
        } finally {
            setIsNavigating(false);
        }
    };

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    if (!platform) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Plateforme non trouvée</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/platforms')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-3xl font-black italic tracking-tighter uppercase underline decoration-primary/30 underline-offset-8">Détails de la plateforme</h1>
                </div>
                <div className="flex items-center gap-3">
                    <RoleGuard permissions={['PLATFORMS_CREATE']}>
                        <Button
                            variant={platform.adminAccountCreated ? "secondary" : "default"}
                            onClick={handleAdminAction}
                            disabled={isNavigating}
                            className={!platform.adminAccountCreated ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}
                        >
                            {platform.adminAccountCreated ? (
                                <><UserCog className="w-4 h-4 mr-2" /> Voir l'Admin</>
                            ) : (
                                <><UserPlus className="w-4 h-4 mr-2" /> Créer l'accès Admin</>
                            )}
                        </Button>
                    </RoleGuard>
                    <RoleGuard permissions={['PLATFORMS_EDIT']}>
                        <Button onClick={() => setIsSheetOpen(true)}>
                            Modifier
                        </Button>
                    </RoleGuard>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Informations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">ID</p>
                            <p className="font-mono text-sm">{platform.id}</p>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Nom</p>
                            <p className="text-base">{platform.name}</p>
                        </div>

                        <div className="md:col-span-2">
                            <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                            <p className="text-base">{platform.description || '-'}</p>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Adresse</p>
                            <p className="text-base">{platform.address || '-'}</p>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Téléphone</p>
                            <p className="text-base">{platform.phone || '-'}</p>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Email</p>
                            <p className="text-base">{platform.email || '-'}</p>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Devise</p>
                            {!platform.currency ? (
                                <p className="text-base">-</p>
                            ) : typeof platform.currency === 'string' ? (
                                <p className="text-base font-semibold">{platform.currency}</p>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-black">{platform.currency.symbol}</span>
                                    <div>
                                        <p className="font-bold text-sm">{platform.currency.code}</p>
                                        <p className="text-xs text-muted-foreground">{platform.currency.label}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Configuration de paiement</p>
                            <div className="flex flex-wrap gap-2">
                                {platform.paymentConfigJson && platform.paymentConfigJson.length > 0 ? (
                                    platform.paymentConfigJson.map((config, index) => (
                                        <span key={index} className="px-2 py-1 bg-muted rounded text-sm">
                                            {config}
                                        </span>
                                    ))
                                ) : (
                                    <span>-</span>
                                )}
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <p className="text-sm font-medium text-muted-foreground mb-2">Modules Activés</p>
                            <div className="flex flex-wrap gap-2">
                                {platform.allowTableManagement && (
                                    <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 text-xs font-bold uppercase tracking-wider border border-blue-500/20">Gestion des tables</span>
                                )}
                                {platform.allowOnlineOrder && (
                                    <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 text-xs font-bold uppercase tracking-wider border border-orange-500/20">Commande en ligne</span>
                                )}
                                {!platform.allowTableManagement && !platform.allowOnlineOrder && (
                                    <span className="text-sm text-muted-foreground italic">Aucun module activé</span>
                                )}
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Actif</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${platform.active
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                {platform.active ? 'Oui' : 'Non'}
                            </span>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Créé le</p>
                            <p className="text-base">{new Date(platform.createdAt).toLocaleString()}</p>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Mis à jour le</p>
                            <p className="text-base">{new Date(platform.updatedAt).toLocaleString()}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <PlatformFormSheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                platform={platform}
            />

            {platform && (
                <AdminAccessDialog
                    open={isAccessDialogOpen}
                    onOpenChange={setIsAccessDialogOpen}
                    platform={platform}
                />
            )}
        </div>
    );
}
