import { useFormContext, Controller } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ImageUploader } from './ImageUploader';
import { useAllCategories } from '@/hooks/useProducts';

import { useMemo } from 'react';
import { usePlatformCurrency } from '@/hooks/usePlatformCurrency';

interface ProductGeneralInfoProps {
    initialCategory?: any; // Category object from product
    categoryId?: string; // Explicit ID passed from parent
}

export function ProductGeneralInfo({ initialCategory, categoryId }: ProductGeneralInfoProps) {
    const { register, control, setValue, formState: { errors } } = useFormContext();
    const { data: fetchedCategories } = useAllCategories();
    const { symbol: currSymbol } = usePlatformCurrency();

    const categoriesData = useMemo(() => {
        const result = [];
        const seenIds = new Set<string>();

        // 0. Récupérer l'ID cible (soit via prop explicite, soit via l'objet initial)
        const targetId = categoryId || (initialCategory && typeof initialCategory === 'object' ? String(initialCategory.id || initialCategory['@id']?.split('/').pop() || '') : '');

        // 1. Priorité Absolue: Ajouter l'option pour la catégorie cible si on a son ID
        // Si on a l'objet complet, on utilise son label. Sinon, on met un placeholder temporaire.
        if (targetId) {
            const label = (initialCategory && typeof initialCategory === 'object')
                ? (initialCategory.label || initialCategory.name)
                : 'Catégorie actuelle'; // Fallback si on a que l'ID

            result.push({
                id: targetId,
                label: label || 'Catégorie actuelle',
                name: label || 'Catégorie actuelle',
            });
            seenIds.add(targetId);
        }

        // 2. Ajouter les catégories chargées depuis l'API
        if (fetchedCategories) {
            fetchedCategories.forEach((cat: any) => {
                const catId = String(cat.id || cat['@id']?.split('/').pop() || '');
                if (catId && !seenIds.has(catId)) {
                    result.push({
                        id: catId,
                        label: cat.label || cat.name || 'Sans nom',
                        name: cat.name || cat.label,
                    });
                    seenIds.add(catId);
                }
            });
        }

        // 3. On trie par nom pour que ce soit propre
        return result.sort((a, b) => a.label.localeCompare(b.label));
    }, [fetchedCategories, initialCategory, categoryId]);

    return (
        <div className="space-y-8">
            <Card className="border-none shadow-sm rounded-2xl bg-card overflow-hidden">
                <CardHeader className="bg-card px-8 pt-8 pb-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-lg font-semibold text-foreground">Informations générales</CardTitle>
                            <CardDescription>Détails principaux et présentation</CardDescription>
                        </div>

                        {/* Availability Toggle - Top Right */}
                        <Controller
                            control={control}
                            name="isAvailable"
                            render={({ field }) => (
                                <div className="flex items-center gap-3 bg-muted/50 dark:bg-muted/10 px-4 py-2 rounded-full border border-border">
                                    <span className={`text-sm font-medium ${field.value ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                                        {field.value ? 'Disponible' : 'Indisponible'}
                                    </span>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        className="data-[state=checked]:bg-green-500 scale-75"
                                    />
                                </div>
                            )}
                        />
                    </div>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left Column: Form Fields */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-foreground font-medium">Nom du produit <span className="text-destructive">*</span></Label>
                                <Input
                                    id="name"
                                    placeholder="Ex: Burger Signature"
                                    className="h-12 text-lg border-border bg-background focus:border-primary focus:ring-primary/20 rounded-xl"
                                    {...register('name')}
                                />
                                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name?.message as string}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="category" className="text-foreground font-medium">Catégorie <span className="text-destructive">*</span></Label>
                                    <Controller
                                        control={control}
                                        name="category"
                                        defaultValue={categoryId || ''} // Force default value if prop present
                                        render={({ field }) => (
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value ? String(field.value) : (categoryId || '')} // Fallback to prop if field empty
                                            >
                                                <SelectTrigger id="category" className="h-12 border-border rounded-xl bg-muted/30">
                                                    <SelectValue placeholder="Choisir une catégorie" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categoriesData?.map((cat) => (
                                                        <SelectItem key={String(cat.id || Math.random())} value={String(cat.id)}>
                                                            {cat.label || cat.name || 'Sans nom'}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.category && <p className="text-sm text-destructive mt-1">{errors.category?.message as string}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="price" className="text-foreground font-medium">Prix de base <span className="text-destructive">*</span></Label>
                                    <div className="relative group">
                                        <Input
                                            id="price"
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            className="pr-12 h-12 font-semibold border-border bg-background focus:border-primary focus:ring-primary/20 rounded-xl"
                                            {...register('price')}
                                        />
                                        <div className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-muted-foreground font-medium bg-muted/50 rounded-r-xl border-l border-border">
                                            {currSymbol}
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Prix sans les options</p>
                                    {errors.price && <p className="text-sm text-destructive mt-1">{errors.price?.message as string}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-foreground font-medium">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Une description alléchante pour vos clients..."
                                    className="resize-none min-h-[120px] border-border bg-muted/30 rounded-xl p-4 leading-relaxed"
                                    {...register('description')}
                                />
                            </div>
                        </div>

                        {/* Right Column: Image */}
                        <div className="lg:col-span-4">
                            <div className="space-y-2">
                                <Label className="text-foreground font-medium">Image produit</Label>
                                <Controller
                                    control={control}
                                    name="imageUrl"
                                    render={({ field }) => (
                                        <ImageUploader
                                            value={field.value}
                                            onChange={field.onChange}
                                            onFileSelect={(file) => {
                                                setValue('logoFile', file, { shouldDirty: true });
                                            }}
                                        />
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
