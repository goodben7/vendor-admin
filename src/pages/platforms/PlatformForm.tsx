import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { usePlatform, useCreatePlatform, useUpdatePlatform } from '@/hooks/usePlatforms';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FormBuilder, { FormField } from '@/components/shared/FormBuilder';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';

const platformSchema = z.object({
    name: z.string().min(1, 'Le nom est requis'),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('Email invalide').optional().or(z.literal('')),
    isActive: z.boolean().optional(),
});

export default function PlatformForm() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;

    const { data: platform, isLoading } = usePlatform(id!);
    const createMutation = useCreatePlatform();
    const updateMutation = useUpdatePlatform();

    const fields: FormField[] = [
        {
            name: 'name',
            label: 'Nom',
            type: 'text',
            placeholder: 'Ex: Restaurant Centre-Ville',
            required: true,
        },
        {
            name: 'address',
            label: 'Adresse',
            type: 'textarea',
            placeholder: '123 Rue de la Paix, 75000 Paris',
        },
        {
            name: 'phone',
            label: 'Téléphone',
            type: 'text',
            placeholder: '+33 1 23 45 67 89',
        },
        {
            name: 'email',
            label: 'Email',
            type: 'email',
            placeholder: 'contact@restaurant.fr',
        },
        {
            name: 'isActive',
            label: 'Actif',
            type: 'switch',
        },
    ];

    const handleSubmit = async (data: any) => {
        if (isEdit) {
            await updateMutation.mutateAsync({ id: id!, data });
        } else {
            await createMutation.mutateAsync(data);
        }
        navigate('/platforms');
    };

    if (isEdit && isLoading) {
        return <LoadingSkeleton />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/platforms')}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">
                        {isEdit ? 'Modifier la plateforme' : 'Nouvelle plateforme'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {isEdit ? 'Modifiez les informations de la plateforme' : 'Créez une nouvelle plateforme'}
                    </p>
                </div>
            </div>

            {/* Form */}
            <div className="max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle>Informations de la plateforme</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FormBuilder
                            fields={fields}
                            schema={platformSchema}
                            onSubmit={handleSubmit}
                            submitLabel={isEdit ? 'Mettre à jour' : 'Créer'}
                            isLoading={createMutation.isPending || updateMutation.isPending}
                            defaultValues={platform || { isActive: true }}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
