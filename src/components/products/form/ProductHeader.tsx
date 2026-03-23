import { ArrowLeft, Package, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

interface ProductHeaderProps {
    isEdit: boolean;
    title: string;
    isDirty: boolean;
    onDelete?: () => void;
}

export function ProductHeader({ isEdit, title, isDirty, onDelete }: ProductHeaderProps) {
    const navigate = useNavigate();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    return (
        <div className="bg-card border-b border-border">
            <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        type="button"
                        className="rounded-full w-10 h-10 border-border hover:bg-muted"
                        onClick={() => navigate('/products')}
                    >
                        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-0.5">
                            <Package className="w-3.5 h-3.5" />
                            <span>Produits</span>
                            <span>/</span>
                            <span>{isEdit ? 'Édition' : 'Nouveau'}</span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground">
                            {title || (isEdit ? 'Modifier le produit' : 'Créer un produit')}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div
                        className="hidden md:flex items-center gap-2 mr-4 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full opacity-0 transition-opacity data-[visible=true]:opacity-100"
                        data-visible={isDirty}
                    >
                        <AlertCircle className="w-4 h-4" />
                        <span>Modifications non enregistrées</span>
                    </div>

                    {isEdit && onDelete && (
                        <>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={() => setIsDeleteDialogOpen(true)}
                            >
                                <Trash2 className="w-5 h-5" />
                            </Button>

                            <ConfirmDialog
                                open={isDeleteDialogOpen}
                                onOpenChange={setIsDeleteDialogOpen}
                                title="Supprimer définitivement ?"
                                description="Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible."
                                confirmText="Supprimer"
                                cancelText="Annuler"
                                variant="destructive"
                                onConfirm={onDelete}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
