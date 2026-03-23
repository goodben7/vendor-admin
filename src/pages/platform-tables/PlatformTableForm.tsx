import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { usePlatformTable, useCreatePlatformTable, useUpdatePlatformTable, usePlatforms, useTablets } from '@/hooks/usePlatforms';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import FormBuilder, { FormField } from '@/components/shared/FormBuilder';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';

const tableSchema = z.object({
    tableNumber: z.number().int().positive('Le numéro de table doit être positif'),
    platform: z.string().min(1, 'La plateforme est requise'),
    capacity: z.number().int().positive('La capacité doit être positive').optional(),
});

export default function PlatformTableForm() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;

    const { data: table, isLoading: tableLoading } = usePlatformTable(id!);
    const { data: platformsData } = usePlatforms({ page: 0, pageSize: 100 });
    const { data: tabletsData } = useTablets({ page: 0, pageSize: 100 });
    const createMutation = useCreatePlatformTable();
    const updateMutation = useUpdatePlatformTable();

    // State for tablet association
    const [selectedTablet, setSelectedTablet] = useState<string>(
        table?.tablet?.id || ''
    );

    const fields: FormField[] = [
        {
            name: 'tableNumber',
            label: 'Numéro de table',
            type: 'number',
            placeholder: '1',
            required: true,
        },
        {
            name: 'platform',
            label: 'Plateforme',
            type: 'select',
            required: true,
            options: platformsData?.data.map((platform) => ({
                value: platform.id,
                label: platform.name,
            })) || [],
        },
        {
            name: 'capacity',
            label: 'Capacité (personnes)',
            type: 'number',
            placeholder: '4',
        },
    ];

    const handleSubmit = async (data: any) => {
        const payload = {
            ...data,
            tablet: selectedTablet || undefined,
        };

        if (isEdit) {
            await updateMutation.mutateAsync({ id: id!, data: payload });
        } else {
            await createMutation.mutateAsync(payload);
        }
        navigate('/platform-tables');
    };

    // Get available tablets (not assigned to other tables)
    const availableTablets = tabletsData?.data.filter(
        (tablet) => !tablet.table || tablet.table.id === id
    ) || [];

    if (isEdit && tableLoading) {
        return <LoadingSkeleton />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/platform-tables')}
                    aria-label="Retour à la liste des tables"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">
                        {isEdit ? 'Modifier la table' : 'Nouvelle table'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {isEdit ? 'Modifiez les informations de la table' : 'Créez une nouvelle table'}
                    </p>
                </div>
            </div>

            {/* Form */}
            <div className="max-w-2xl space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Informations de la table</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FormBuilder
                            fields={fields}
                            schema={tableSchema}
                            onSubmit={handleSubmit}
                            submitLabel={isEdit ? 'Mettre à jour' : 'Créer'}
                            isLoading={createMutation.isPending || updateMutation.isPending}
                            defaultValues={table ? {
                                ...table,
                                platform: table.platform?.id,
                            } : {}}
                        />
                    </CardContent>
                </Card>

                {/* Tablet Association */}
                <Card>
                    <CardHeader>
                        <CardTitle>Association tablette</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Associez une tablette à cette table pour la prise de commande
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="tablet-select">Tablette</Label>
                            <Select
                                value={selectedTablet}
                                onValueChange={setSelectedTablet}
                            >
                                <SelectTrigger id="tablet-select" aria-label="Sélectionner une tablette">
                                    <SelectValue placeholder="Aucune tablette" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Aucune tablette</SelectItem>
                                    {availableTablets.map((tablet) => (
                                        <SelectItem key={tablet.id} value={tablet.id}>
                                            {tablet.serialNumber} - {tablet.isOnline ? '🟢 En ligne' : '🔴 Hors ligne'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {availableTablets.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    Aucune tablette disponible. Toutes les tablettes sont déjà assignées.
                                </p>
                            )}
                        </div>

                        {selectedTablet && (
                            <div className="p-3 bg-muted rounded-lg">
                                <p className="text-sm font-medium">
                                    ✓ Tablette sélectionnée
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    La tablette sera associée à cette table lors de la sauvegarde
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
