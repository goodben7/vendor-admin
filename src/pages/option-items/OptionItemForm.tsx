import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { useOptionItem, useCreateOptionItem, useUpdateOptionItem } from '@/hooks/useProducts';
import { useOptionGroups } from '@/hooks/useProducts';
import { usePlatformCurrency } from '@/hooks/usePlatformCurrency';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FormBuilder, { FormField } from '@/components/shared/FormBuilder';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';

const optionItemSchema = z.object({
    name: z.string().min(1, 'Le nom est requis'),
    price: z.number().min(0, 'Le prix doit être positif ou nul'),
    optionGroup: z.string().min(1, 'Le groupe d\'options est requis'),
    isAvailable: z.boolean().optional(),
});

export default function OptionItemForm() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { symbol } = usePlatformCurrency();
    const isEdit = !!id;

    const { data: optionItem, isLoading: itemLoading } = useOptionItem(id!);
    const { data: groupsData } = useOptionGroups();
    const createMutation = useCreateOptionItem();
    const updateMutation = useUpdateOptionItem();

    const fields: FormField[] = [
        {
            name: 'name',
            label: 'Nom',
            type: 'text',
            placeholder: 'Ex: Fromage supplémentaire',
            required: true,
        },
        {
            name: 'price',
            label: `Prix (${symbol})`,
            type: 'number',
            placeholder: '0.00',
            required: true,
        },
        {
            name: 'optionGroup',
            label: 'Groupe d\'options',
            type: 'select',
            required: true,
            options: groupsData?.data?.map((group: any) => ({
                value: group.id,
                label: group.label || group.name,
            })) || [],
        },
        {
            name: 'isAvailable',
            label: 'Disponible',
            type: 'switch',
        },
    ];

    const handleSubmit = async (data: any) => {
        if (isEdit) {
            await updateMutation.mutateAsync({ id: id!, data });
        } else {
            await createMutation.mutateAsync(data);
        }
        navigate('/option-items');
    };

    if (isEdit && itemLoading) {
        return <LoadingSkeleton />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/option-items')}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">
                        {isEdit ? 'Modifier l\'option' : 'Nouvelle option'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {isEdit ? 'Modifiez les informations de l\'option' : 'Créez une nouvelle option'}
                    </p>
                </div>
            </div>

            {/* Form */}
            <div className="max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle>Informations de l'option</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FormBuilder
                            fields={fields}
                            schema={optionItemSchema}
                            onSubmit={handleSubmit}
                            submitLabel={isEdit ? 'Mettre à jour' : 'Créer'}
                            isLoading={createMutation.isPending || updateMutation.isPending}
                            defaultValues={optionItem ? {
                                ...optionItem,
                                optionGroup: optionItem.optionGroup?.id,
                            } : { isAvailable: true }}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
