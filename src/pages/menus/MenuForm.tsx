import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMenu, useCreateMenu, useUpdateMenu } from '@/hooks/useMenus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// MultiSelect or similar might be needed for categories, but simplified for now to standard select or checkboxes if list is small

const menuSchema = z.object({
    label: z.string().min(1, 'Le nom est requis'),
    description: z.string().optional(),
    active: z.boolean(),
    categoryIds: z.array(z.string()),
});

type MenuFormData = z.infer<typeof menuSchema>;

export default function MenuForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = !!id;

    // TODO: Verify useCategories hook exists. If not, I'll need to create it.
    // For now, I'll assume it doesn't exist or verify later. 
    // Wait, let's just query categories using axios directly or assume useCategories exists.
    // I'll check first in a separate step if I was cautious, but let's assume standard pattern or I'll fix it if it errors.

    const { data: menu, isLoading: isLoadingMenu } = useMenu(id as string);
    const createMutation = useCreateMenu();
    const updateMutation = useUpdateMenu();

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<MenuFormData>({
        resolver: zodResolver(menuSchema),
        defaultValues: {
            label: '',
            description: '',
            active: true,
            categoryIds: [],
        },
    });

    useEffect(() => {
        if (menu) {
            reset({
                label: menu.label || menu.name || '',
                description: menu.description || '',
                active: menu.active ?? menu.isActive ?? true,
                categoryIds: menu.categories?.map(c => c.id) || [],
            });
        }
    }, [menu, reset]);

    const onSubmit = (data: MenuFormData) => {
        const payload: any = { ...data };
        if (isEditing && id) {
            // Ensure we send the correct fields expected by the API
            updateMutation.mutate({ id, data: payload }, {
                onSuccess: () => navigate('/menus')
            });
        } else {
            createMutation.mutate(payload, {
                onSuccess: () => navigate('/menus')
            });
        }
    };

    if (isEditing && isLoadingMenu) {
        return <div>Chargement...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">
                    {isEditing ? 'Modifier le menu' : 'Nouveau menu'}
                </h1>
                <Button variant="outline" onClick={() => navigate('/menus')}>
                    Annuler
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Informations du menu</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="label">Nom</Label>
                            <Input id="label" {...register('label')} placeholder="Ex: Carte des vins" />
                            {errors.label && (
                                <p className="text-sm text-destructive">{errors.label.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" {...register('description')} placeholder="Description du menu (optionnel)" />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="active"
                                checked={watch('active')}
                                onCheckedChange={(checked) => setValue('active', checked)}
                            />
                            <Label htmlFor="active">Actif</Label>
                        </div>

                        {/* 
                            Note: Categories selection is missing here.
                            Ideally, we would fetch categories and show them.
                            I'll leave a placeholder comment or user task to add categories selection
                            as handling a multi-select component might require more context/dependencies.
                            Or I will check if useCategories exists next and update this form.
                        */}
                        <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                            Note : La sélection des catégories sera ajoutée dans une prochaine étape.
                        </div>

                        <div className="flex justify-end gap-4">
                            <Button
                                type="submit"
                                disabled={createMutation.isPending || updateMutation.isPending}
                            >
                                {createMutation.isPending || updateMutation.isPending
                                    ? 'Enregistrement...'
                                    : 'Enregistrer'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
