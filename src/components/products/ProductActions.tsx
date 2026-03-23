import { useState } from 'react';
import { MoreHorizontal, Edit, Trash2, Package, Power } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteProduct, useUpdateProduct } from '@/hooks/useProducts';
import { Product } from '@/types/entities';

interface ProductActionsProps {
    product: Product;
}

export function ProductActions({ product }: ProductActionsProps) {
    const navigate = useNavigate();
    const deleteMutation = useDeleteProduct();
    const updateMutation = useUpdateProduct();

    const [isOpen, setIsOpen] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);



    const handleToggleStatus = () => {
        updateMutation.mutate({ id: product.id, data: { isAvailable: !product.isAvailable } });
        setIsOpen(false);
    };

    const handleDelete = () => {
        deleteMutation.mutate(product.id);
        setShowDeleteDialog(false);
        setIsOpen(false);
    };

    return (
        <>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[200px] p-0">
                    <div className="grid gap-1 p-1">
                        <Button
                            variant="ghost"
                            className="w-full justify-start h-8 px-2 text-sm font-normal"
                            onClick={() => {
                                navigate(`/products/${product.id}/edit`);
                                setIsOpen(false);
                            }}
                        >
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full justify-start h-8 px-2 text-sm font-normal"
                            onClick={() => {
                                // Navigate to options tab or modal? For now just edit page, maybe anchor?
                                navigate(`/products/${product.id}/edit`);
                                setIsOpen(false);
                            }}
                        >
                            <Package className="mr-2 h-4 w-4" />
                            Gérer les options
                        </Button>

                        <Button
                            variant="ghost"
                            className="w-full justify-start h-8 px-2 text-sm font-normal"
                            onClick={handleToggleStatus}
                        >
                            <Power className="mr-2 h-4 w-4" />
                            {product.isAvailable ? 'Désactiver' : 'Activer'}
                        </Button>
                        <div className="h-px bg-muted my-1" />
                        <Button
                            variant="ghost"
                            className="w-full justify-start h-8 px-2 text-sm font-normal text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                                setShowDeleteDialog(true);
                                setIsOpen(false);
                            }}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. Cela supprimera définitivement le produit "{product.name}".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
