import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axiosInstance from '@/services/axios';
import { useProduct, useCreateProduct, useUpdateProduct, useDeleteProduct, useAllCategories } from '@/hooks/useProducts';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';

// Modular Components
import { ProductHeader } from '@/components/products/form/ProductHeader';
import { ProductGeneralInfo } from '@/components/products/form/ProductGeneralInfo';
import { ProductOptionGroups, ProductOptionGroupConfig } from '@/components/products/form/ProductOptionGroups';
import { ProductPreview } from '@/components/products/form/ProductPreview';
import { ProductFooterActions } from '@/components/products/form/ProductFooterActions';
import { toast } from 'sonner';
import { usePlatformCurrency } from '@/hooks/usePlatformCurrency';
import { getErrorMessage } from '@/lib/utils';

// Schema Validation
const productSchema = z.object({
    name: z.string().min(1, 'Le nom est requis'),
    description: z.string().optional(),
    price: z.coerce.number().positive('Le prix doit être positif'),
    category: z.string().min(1, 'La catégorie est requise'),
    isAvailable: z.boolean().default(true),
    imageUrl: z.string().optional(),
    // Fields for UI mostly (backend might not support yet)
    sku: z.string().optional(),
    preparationTime: z.string().optional(),
    displayOrder: z.coerce.number().optional(),
    isFeatured: z.boolean().optional(),
    logoFile: z.any().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function ProductForm() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;
    const { symbol: currSymbol } = usePlatformCurrency();

    // Queries & Mutations
    const { data: product, isLoading: productLoading } = useProduct(id!);
    const { data: categoriesData } = useAllCategories();

    const createMutation = useCreateProduct();
    const updateMutation = useUpdateProduct();
    const deleteMutation = useDeleteProduct();

    // Local State for Option Groups
    const [selectedOptionGroups, setSelectedOptionGroups] = useState<ProductOptionGroupConfig[]>([]);

    // Form Setup
    const methods = useForm<ProductFormData>({
        resolver: zodResolver(productSchema) as any,
        defaultValues: {
            isAvailable: true,
            price: 0,
            isFeatured: false,
            displayOrder: 0,
            description: '',
            imageUrl: '',
            category: '',
        }
    });

    const { reset, watch, formState: { isDirty } } = methods;
    const watchedValues = watch();

    // Prevent accidental navigation
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    // Sync data when product is loaded
    // Sync data when product is loaded
    useEffect(() => {
        if (product && !isDirty) {
            // Extract Category ID safely
            let categoryId = '';

            // Priorité absolue : l'ID direct de l'objet category s'il est présent
            if (product.category && typeof product.category === 'object' && product.category.id) {
                categoryId = String(product.category.id);
            } else if (product.category) {
                // Fallback si c'est une string ou un IRI sans .id
                const rawVal = typeof product.category === 'object' ? ((product.category as any)['@id']) : String(product.category);
                if (rawVal) {
                    categoryId = String(rawVal).split('/').pop()?.trim() || '';
                }
            }

            console.log('Category ID Extracted for Form Reset:', categoryId); // Debug logging

            // Map existing option groups to the config structure
            if (product.optionGroups) {
                const groups = product.optionGroups.map((og: any) => {
                    const ogId = typeof og === 'string' ? og.split('/').pop() || '' : (og.id || (og['@id'] ? og['@id'].split('/').pop() : ''));
                    return {
                        id: ogId,
                        optionGroupId: ogId, // This is for internal tracking, might be redundant with 'id'
                        label: og.name || og.label || '',
                        isRequired: og.isRequired ?? false,
                        maxChoices: og.maxSelections ?? og.maxChoices ?? 0,
                        isAvailable: true,
                        items: (og.optionItems || og.items || []).map((item: any) => ({
                            id: typeof item === 'string' ? item.split('/').pop() : (item.id || item['@id']?.split('/').pop()),
                            name: item.label || item.name,
                            price: item.priceDelta ? parseFloat(item.priceDelta) : (item.price || 0),
                            isAvailable: item.isAvailable ?? true
                        }))
                    };
                });
                setSelectedOptionGroups(groups);
            }

            reset({
                name: product.name,
                description: product.description,
                price: product.price,
                isAvailable: product.isAvailable,
                imageUrl: product.contentUrl || product.imageUrl,
                category: categoryId,
                sku: 'SKU-' + product.id.substring(0, 6).toUpperCase(),
                // Pas besoin de passer optionGroups ici car géré par state local, 
                // mais on pourrait si on voulait utiliser useFieldArray plus tard.
            });
        }
    }, [product, reset, isDirty]);

    const onSubmit = async (data: ProductFormData) => {
        // Base payload data
        const categoryIRI = (data.category && data.category.startsWith('/api/'))
            ? data.category
            : `/api/categories/${data.category}`;

        // Base price calculation
        const basePriceStr = Number(data.price).toFixed(2);

        try {
            let savedProduct;

            if (isEdit) {
                const allGroupIRIs: string[] = [];

                for (const group of selectedOptionGroups) {
                    const groupUrlPart = (group.id && group.id.length > 10) ? `/option_groups/${group.id}` : null;
                    const groupIRI = groupUrlPart ? `/api${groupUrlPart}` : null;

                    if (groupUrlPart && groupIRI) {
                        allGroupIRIs.push(groupIRI);

                        // 1. Gérer les variantes du groupe pour obtenir la liste complète des IRIs
                        const currentItemIRIs: string[] = [];
                        if (group.items) {
                            for (const item of group.items) {
                                const isExistingItem = item.id && item.id.length > 10;
                                const itemData = {
                                    label: item.name,
                                    name: item.name,
                                    price: Number(item.price),
                                    priceDelta: String(item.price),
                                    isAvailable: item.isAvailable
                                };

                                if (isExistingItem) {
                                    const itemIRI = `/api/option_items/${item.id}`;
                                    currentItemIRIs.push(itemIRI);
                                    try {
                                        await axiosInstance.patch(`/option_items/${item.id}`, itemData, {
                                            headers: { 'Content-Type': 'application/merge-patch+json' }
                                        });
                                    } catch (e) { console.warn(`Item ${item.id} non trouvé`); }
                                } else if (item.name) {
                                    // Nouvelle variante : on la crée et on récupère son IRI
                                    try {
                                        const itemResp = await axiosInstance.post('/option_items', {
                                            ...itemData,
                                            optionGroup: groupIRI
                                        });
                                        const newItemIRI = itemResp.data['@id'] || `/api/option_items/${itemResp.data.id}`;
                                        currentItemIRIs.push(newItemIRI);
                                    } catch (e) { console.error("Erreur création variante", e); }
                                }
                            }
                        }

                        // 2. Mettre à jour le groupe avec la liste COMPLÈTE de ses variantes
                        try {
                            await axiosInstance.patch(groupUrlPart, {
                                label: group.label,
                                name: group.label,
                                isRequired: group.isRequired,
                                maxChoices: group.maxChoices,
                                isAvailable: group.isAvailable,
                                optionItems: currentItemIRIs // On renvoie toute la liste
                            }, { headers: { 'Content-Type': 'application/merge-patch+json' } });
                        } catch (e) { console.error(`Erreur mise à jour option ${groupUrlPart}`, e); }

                    } else {
                        // 3. CRÉATION D'UN NOUVEAU GROUPE (inchangé)
                        try {
                            const groupPayload = {
                                label: group.label,
                                name: group.label,
                                isRequired: group.isRequired,
                                maxChoices: group.maxChoices,
                                isAvailable: group.isAvailable,
                                product: `/api/products/${id}`
                            };
                            const groupResponse = await axiosInstance.post('/option_groups', groupPayload);
                            const newGroupIRI = groupResponse.data['@id'] || `/api/option_groups/${groupResponse.data.id}`;
                            allGroupIRIs.push(newGroupIRI);

                            if (group.items) {
                                for (const item of group.items) {
                                    await axiosInstance.post('/option_items', {
                                        optionGroup: newGroupIRI,
                                        label: item.name,
                                        name: item.name,
                                        price: Number(item.price),
                                        priceDelta: String(item.price),
                                        isAvailable: item.isAvailable
                                    });
                                }
                            }
                        } catch (e) { console.error("Erreur création option", e); }
                    }
                }

                const updatePayload = {
                    category: categoryIRI,
                    label: data.name,
                    description: data.description,
                    basePrice: basePriceStr,
                    isAvailable: data.isAvailable,
                    optionGroups: allGroupIRIs
                };

                const response = await updateMutation.mutateAsync({ id: id!, data: updatePayload as any });
                savedProduct = response;
                toast.success('Produit mis à jour avec succès');
            } else {
                // CREATE - full payload
                // We send OptionGroups WITHOUT items first to create them
                const createPayload = {
                    label: data.name,
                    description: data.description,
                    basePrice: basePriceStr,
                    price: basePriceStr,
                    isAvailable: data.isAvailable,
                    imageUrl: data.imageUrl,
                    category: categoryIRI,
                    optionGroups: selectedOptionGroups.map(config => ({
                        label: config.label,
                        isRequired: config.isRequired,
                        maxChoices: config.maxChoices,
                        isAvailable: config.isAvailable,
                        // NO ITEMS SENT HERE per user request
                        items: []
                    })),
                };

                const response = await createMutation.mutateAsync(createPayload as any);
                savedProduct = response;

                // Now handle Option Items creation separately
                if (savedProduct.optionGroups && savedProduct.optionGroups.length > 0) {
                    // We need to match the created groups back to our local selectedOptionGroups to know which items to add to which group
                    // This relies on order preserving or label matching.
                    // Let's assume order is preserved.

                    const itemPromises = [];

                    for (let i = 0; i < savedProduct.optionGroups.length; i++) {
                        const createdGroup = savedProduct.optionGroups[i];
                        const localGroupConfig = selectedOptionGroups[i];

                        // Extract Group ID (can be IRI or object with ID)
                        // createdGroup might be "/api/option_groups/123" or { id: "...", ... }
                        let groupId = '';
                        if (typeof createdGroup === 'string') {
                            groupId = createdGroup; // It is likely the IRI
                        } else if (typeof createdGroup === 'object') {
                            groupId = (createdGroup as any)['@id'] || `/api/option_groups/${createdGroup.id}`;
                        }

                        if (groupId && localGroupConfig.items && localGroupConfig.items.length > 0) {
                            for (const item of localGroupConfig.items) {
                                // Create the item linked to this group
                                const itemPayload = {
                                    optionGroup: groupId,
                                    label: item.name,
                                    name: item.name, // Support both if needed
                                    price: Number(item.price).toFixed(2),
                                    priceDelta: Number(item.price).toFixed(2), // Backend variable naming
                                    isAvailable: item.isAvailable
                                };

                                // Direct axios call or use a mutation helper
                                // Since we are in a loop, direct fetch/axios is easier than invoking hooks
                                itemPromises.push(
                                    axiosInstance.post('/option_items', itemPayload)
                                );
                            }
                        }
                    }

                    if (itemPromises.length > 0) {
                        await Promise.all(itemPromises);
                    }
                }

                toast.success('Produit et options créés avec succès');
            }

            // --- IMAGE UPLOAD LOGIC ---
            if (data.logoFile && savedProduct) {
                const productId = savedProduct.id || (savedProduct as any)['@id']?.split('/').pop();
                if (productId) {
                    const formData = new FormData();
                    formData.append('file', data.logoFile);

                    try {
                        await axiosInstance.post(`/products/${productId}/logo`, formData, {
                            headers: {
                                'Content-Type': 'multipart/form-data',
                            },
                        });
                        toast.success('Image téléchargée avec succès');
                    } catch (uploadError) {
                        console.error("Failed to upload logo", uploadError);
                        toast.error("Erreur lors de l'envoi de l'image");
                    }
                }
            }

            navigate('/products');
        } catch (error) {
            console.error("Failed to save product", error);
            toast.error(getErrorMessage(error, "Erreur lors de l'enregistrement"));
        }
    };

    const handleDelete = async () => {
        try {
            await deleteMutation.mutateAsync(id!);
            toast.success('Produit supprimé');
            navigate('/products');
        } catch (error) {
            console.error("Failed to delete product", error);
            toast.error('Erreur lors de la suppression');
        }
    };

    const getCategoryName = (id?: string) => {
        if (!id) return undefined;

        // 1. Try to find in loaded categories
        if (categoriesData) {
            const cat = categoriesData.find(c => c.id === id || (c as any)['@id'] === id || c.id === id.split('/').pop());
            if (cat) return cat.label || cat.name;
        }

        // 2. Fallback to product data if editing and matching
        if (isEdit && product && product.category && typeof product.category === 'object') {
            const pCat = product.category as any;
            const pCatId = pCat.id || pCat['@id']?.split('/').pop();
            // Check if IDs match (handle simple ID vs IRI)
            if (pCatId === id || pCat['@id'] === id || id.endsWith('/' + pCatId)) {
                return pCat.label || pCat.name;
            }
        }

        return undefined;
    };

    if (isEdit && productLoading) return <LoadingSkeleton />;

    return (
        <FormProvider {...methods}>
            <div className="min-h-screen bg-background pb-24">
                {/* Header */}
                <ProductHeader
                    isEdit={isEdit}
                    title={watchedValues.name || ''}
                    isDirty={isDirty}
                    onDelete={handleDelete}
                />

                <form onSubmit={methods.handleSubmit(onSubmit)}>
                    <div className="max-w-[1600px] mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                        {/* LEFT COLUMN: Main Form */}
                        <div className="lg:col-span-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <ProductGeneralInfo
                                initialCategory={product?.category}
                                categoryId={(() => {
                                    if (!product?.category) return undefined;
                                    if (typeof product.category === 'object' && product.category.id) return String(product.category.id);
                                    const rawVal = typeof product.category === 'object' ? ((product.category as any)['@id']) : String(product.category);
                                    return rawVal ? String(rawVal).split('/').pop()?.trim() : undefined;
                                })()}
                            />
                            <ProductOptionGroups
                                groups={selectedOptionGroups}
                                onChange={setSelectedOptionGroups}
                            />
                        </div>

                        {/* RIGHT COLUMN: Preview */}
                        <div className="lg:col-span-4 sticky top-6 space-y-6 animate-in slide-in-from-right-4 duration-700">
                            <div className="bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl border-4 border-gray-800 relative overflow-hidden">
                                {/* Notch */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-xl z-20"></div>

                                {/* Screen */}
                                <div className="bg-background rounded-[2rem] overflow-hidden min-h-[600px] flex flex-col relative h-full">
                                    {/* Status Bar */}
                                    <div className="h-8 bg-background flex justify-between items-center px-6 text-[10px] font-bold text-foreground z-10 sticky top-0">
                                        <span>9:41</span>
                                        <div className="flex gap-1.5">
                                            <div className="w-3 h-3 bg-foreground rounded-full"></div>
                                            <div className="w-3 h-3 bg-foreground rounded-full opacity-20"></div>
                                        </div>
                                    </div>

                                    <ProductPreview
                                        name={watchedValues.name || ''}
                                        price={watchedValues.price || 0}
                                        description={watchedValues.description}
                                        imageUrl={watchedValues.imageUrl}
                                        contentUrl={product?.contentUrl}
                                        categoryName={getCategoryName(watchedValues.category)}
                                        optionGroups={selectedOptionGroups}
                                        isAvailable={watchedValues.isAvailable}
                                        currSymbol={currSymbol}
                                    />

                                    {/* Bottom Action Mock */}
                                    <div className="mt-auto p-4 bg-background border-t border-border z-10">
                                        <div className="w-full bg-primary text-white py-3 rounded-xl font-bold text-center shadow-lg opacity-90">
                                            Ajouter au panier
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center text-sm text-muted-foreground font-medium">
                                Aperçu mobile en temps réel
                            </div>
                        </div>
                    </div>

                    {/* FOOTER ACTIONS */}
                    <ProductFooterActions
                        onCancel={() => navigate('/products')}
                        isSaving={createMutation.isPending || updateMutation.isPending}
                    />
                </form>
            </div>
        </FormProvider>
    );
}
