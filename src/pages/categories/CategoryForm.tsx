import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { useCategory, useCreateCategory, useUpdateCategory } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FormBuilder, { FormField } from '@/components/shared/FormBuilder';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';

const categorySchema = z.object({
    name: z.string().min(1, 'Le nom est requis'),
    description: z.string().optional(),
});

export default function CategoryForm() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;

    const { data: category, isLoading } = useCategory(id!);
    const createMutation = useCreateCategory();
    const updateMutation = useUpdateCategory();

    const fields: FormField[] = [
        {
            name: 'name',
            label: 'Nom',
            type: 'text',
            placeholder: 'Ex: Entrées, Plats, Desserts',
            required: true,
        },
        {
            name: 'description',
            label: 'Description',
            type: 'textarea',
            placeholder: 'Description de la catégorie',
        },
    ];

    const handleSubmit = async (data: any) => {
        if (isEdit) {
            await updateMutation.mutateAsync({ id: id!, data });
        } else {
            await createMutation.mutateAsync(data);
        }
        navigate('/categories');
    };

    if (isEdit && isLoading) {
        return <LoadingSkeleton />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/categories')}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-black italic tracking-tighter uppercase underline decoration-primary/30 underline-offset-8">
                        {isEdit ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {isEdit ? 'Modifiez les informations de la catégorie' : 'Créez une nouvelle catégorie'}
                    </p>
                </div>
            </div>

            {/* Form */}
            <div className="max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle>Informations de la catégorie</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FormBuilder
                            fields={fields}
                            schema={categorySchema}
                            onSubmit={handleSubmit}
                            submitLabel={isEdit ? 'Mettre à jour' : 'Créer'}
                            isLoading={createMutation.isPending || updateMutation.isPending}
                            defaultValues={category || {}}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
