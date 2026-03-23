import { useState, useMemo, useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Plus, Trash2, Search, ShoppingCart, Check, Minus, X,
    Smartphone, Armchair, Send, Copy, RefreshCw,
    Maximize2, Minimize2, AlertCircle
} from 'lucide-react';
import { useProducts, useAllCategories, useProduct } from '@/hooks/useProducts';
import { usePlatformTables, useTablets } from '@/hooks/usePlatforms';
import { useCreateOrder } from '@/hooks/useOrders';
import { Product, OptionGroup, OptionItem } from '@/types/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription
} from '@/components/ui/sheet';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { usePlatformCurrency } from '@/hooks/usePlatformCurrency';
import { getCurrentUser } from '@/services/auth.service';

// --- SCHEMAS ---

const orderItemOptionSchema = z.object({
    optionItem: z.string(), // IRI
    name: z.string(),
    price: z.number(),
});

const orderItemSchema = z.object({
    product: z.string(), // IRI
    name: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number(),
    orderItemOptions: z.array(orderItemOptionSchema),
    note: z.string().optional(),
});

const orderSchema = z.object({
    platformTable: z.string().min(1, 'La table est requise'),
    tablet: z.string().min(1, 'La tablette / source est requise'),
    orderItems: z.array(orderItemSchema).min(1, 'Au moins un article est requis'),
});

type OrderFormValues = z.infer<typeof orderSchema>;

// --- HELPERS ---

/** Normalise an OptionGroup coming from the API:
 *  - group.label      → group.name
 *  - group.optionItems → group.items
 *  - item.label       → item.name
 *  - item.priceDelta  → item.price (float)
 */
function normalizeGroup(g: any): OptionGroup {
    const items: OptionItem[] = (g.optionItems || g.items || []).map((i: any) => ({
        ...i,
        name: i.label || i.name || '',
        price: i.priceDelta !== undefined ? parseFloat(i.priceDelta) : (i.price ?? 0),
        isAvailable: i.isAvailable ?? true,
    }));
    return {
        ...g,
        name: g.label || g.name || '',
        items,
    };
}

// --- COMPONENTS ---

export function OrderForm() {
    const navigate = useNavigate();
    const { symbol: currSymbol } = usePlatformCurrency();

    // UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
    const [configProductId, setConfigProductId] = useState<string | null>(null); // triggers useProduct fetch
    const [currentOptions, setCurrentOptions] = useState<Record<string, string[]>>({}); // groupId -> IRIs
    const [isFullScreen, setIsFullScreen] = useState(false);
    const addingRef = useRef(false);   // guard: prevent double-add
    const closingRef = useRef(false);  // guard: prevent click-through after sheet close
    const hasAutoSelectedRef = useRef(false); // guard: prevent infinite loop during auto-selection

    // Debounce search term
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Sync with browser fullscreen state
    useEffect(() => {
        const onFullscreenChange = () => {
            if (!document.fullscreenElement && isFullScreen) {
                setIsFullScreen(false);
            }
        };
        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, [isFullScreen]);

    const handleFullScreenToggle = async () => {
        const nextMode = !isFullScreen;
        if (nextMode) {
            try {
                await document.documentElement.requestFullscreen();
                setIsFullScreen(true);
            } catch (err) {
                console.error("Error enabling fullscreen:", err);
                setIsFullScreen(true);
            }
        } else {
            if (document.fullscreenElement) {
                await document.exitFullscreen().catch(() => {});
            }
            setIsFullScreen(false);
        }
    };

    // Body scroll lock for full screen POS
    useEffect(() => {
        if (isFullScreen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isFullScreen]);

    // API Data
    const { data: categoriesRaw } = useAllCategories();
    const { data: productsData, isLoading: isLoadingProducts } = useProducts({
        pageSize: 100,
        label: debouncedSearch || undefined,
        // selectedCategoryId already holds the full IRI (or 'all')
        category: selectedCategoryId === 'all' ? undefined : selectedCategoryId,
    });
    const { data: tablesData } = usePlatformTables({ pageSize: 100 });
    const { data: tabletsData } = useTablets({ pageSize: 100 });
    const createOrderMutation = useCreateOrder();
    // Fetch the FULL product (with populated optionGroups + items) when the sheet opens
    // isFetching covers BOTH initial load AND background re-fetches (stale cache scenario)
    const { data: configProduct, isLoading: isLoadingConfig, isFetching: isFetchingConfig } = useProduct(configProductId || '');

    // Form
    const { control, handleSubmit, watch, setValue } = useForm<OrderFormValues>({
        resolver: zodResolver(orderSchema),
        defaultValues: {
            orderItems: [],
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'orderItems',
    });

    const orderItems = watch('orderItems');
    const selectedTableId = watch('platformTable');
    const selectedTabletId = watch('tablet');
    const currentUser = useMemo(() => getCurrentUser(), []);

    // Auto-select Table & Tablet for dedicated tablet/borne users ONCE
    useEffect(() => {
        // Only run if we haven't successfully auto-selected yet
        if (hasAutoSelectedRef.current) return;

        const user = getCurrentUser();
        
        // Wait for the data to be fully loaded to ensure the Select component can show the labels
        const availableTables = tablesData?.data || [];
        const availableTablets = tabletsData?.data || [];

        if (user && availableTables.length > 0 && availableTablets.length > 0) {
            // Broad role detection (inc. personType SFO used for Kiosks)
            const isTabletToken = user.holderType === 'TABLET' || 
                                 user.holderType === 'BORNE' || 
                                 user.personType === 'SFO';

            if (isTabletToken) {
                // The profile provided by the user in step 1469 has holderId: "TBRRVC..."
                const targetTabletId = user.holderId;
                
                // We find the full tablet object in the loaded list to see its platformTable
                const tabletInstance = availableTablets.find(t => 
                    t.id === targetTabletId || 
                    (t as any)['@id'] === targetTabletId || 
                    t.deviceId === user.phone // User phone matches tablet deviceId in the JSON
                );

                // Now we pick the IDs for the form
                const tabletId = tabletInstance?.id;
                // tabletInstance.platformTable can be an object with .id or a simple IRI/ID
                const rawTable = tabletInstance?.platformTable;
                const tableId = typeof rawTable === 'object' ? rawTable?.id : rawTable;

                if (tabletId) setValue('tablet', tabletId);
                if (tableId) setValue('platformTable', tableId);

                if (tabletId || tableId) {
                    hasAutoSelectedRef.current = true;
                    console.log('🎯 POS Auto-selection matching SUCCESS:', { tabletId, tableId });
                }
            }
        }
    }, [currentUser, tablesData, tabletsData, setValue]);

    // Calculations
    const totalAmount = useMemo(() => {
        return orderItems.reduce((acc, item) => {
            const optionsTotal = item.orderItemOptions.reduce((sum, opt) => sum + opt.price, 0);
            return acc + (item.unitPrice + optionsTotal) * item.quantity;
        }, 0);
    }, [orderItems]);

    // Live total for the options configuration sheet
    const liveOptionTotal = useMemo(() => {
        if (!configProduct) return 0;
        const allItems = ((configProduct.optionGroups as any[]) || [])
            .map(normalizeGroup)
            .flatMap(g => g.items || []);
        const optionsExtra = Object.values(currentOptions)
            .flat()
            .reduce((sum, iri) => {
                const item = allItems.find((i: OptionItem) => `/api/option_items/${i.id}` === iri);
                return sum + (item?.price || 0);
            }, 0);
        return configProduct.price + optionsExtra;
    }, [configProduct, currentOptions]);


    // Handlers
    const handleProductClick = (product: Product) => {
        // Block: sheet is open OR it just closed (click-through protection)
        if (configProductId || closingRef.current) return;
        // ALWAYS open the sheet to fetch full product detail.
        // The list endpoint may return optionGroups: [] even for products with options.
        // We rely on useProduct (detail endpoint) to get the real option data.
        setConfigProductId(product.id);
        setCurrentOptions({});
    };

    const addToCart = (product: Product, options: any[]) => {
        // Guard: prevent double-add (e.g. event bubbling or strict mode)
        if (addingRef.current) return;
        addingRef.current = true;
        setTimeout(() => { addingRef.current = false; }, 400);

        const existingIndex = orderItems.findIndex(item =>
            item.product === `/api/products/${product.id}` &&
            JSON.stringify(item.orderItemOptions) === JSON.stringify(options)
        );

        if (existingIndex > -1) {
            const currentQty = orderItems[existingIndex].quantity;
            setValue(`orderItems.${existingIndex}.quantity`, currentQty + 1);
        } else {
            append({
                product: `/api/products/${product.id}`,
                name: product.name,
                quantity: 1,
                unitPrice: product.price,
                orderItemOptions: options,
            });
        }
        toast.success(`${product.name} ajouté`, { duration: 800 });
    };

    const toggleOption = (groupId: string, option: OptionItem, maxChoices: number) => {
        const optionIri = `/api/option_items/${option.id}`;
        const isSingle = maxChoices === 1 || !maxChoices;

        setCurrentOptions(prev => {
            const current = prev[groupId] || [];

            if (isSingle) {
                if (current.includes(optionIri)) return { ...prev, [groupId]: [] };
                return { ...prev, [groupId]: [optionIri] };
            }

            if (current.includes(optionIri)) {
                return { ...prev, [groupId]: current.filter(id => id !== optionIri) };
            }

            if (current.length < (maxChoices || 999)) {
                return { ...prev, [groupId]: [...current, optionIri] };
            }

            return prev;
        });
    };

    const confirmAddWithSelection = () => {
        if (!configProduct || closingRef.current) return;

        const rawGroups = (configProduct.optionGroups as any[]) || [];
        const productOptions = rawGroups.map(normalizeGroup);
        const selectedOptionsList: any[] = [];

        for (const group of productOptions) {
            const selectedIds = currentOptions[group.id] || [];
            if (group.isRequired && selectedIds.length === 0) {
                toast.error(`"${group.name}" est obligatoire`);
                return;
            }

            selectedIds.forEach(iri => {
                const opt = (group.items || []).find((i: OptionItem) => `/api/option_items/${i.id}` === iri);
                if (opt) {
                    selectedOptionsList.push({
                        optionItem: iri,
                        name: opt.name,
                        price: opt.price,
                    });
                }
            });
        }

        const productSnapshot = configProduct;
        const optionsSnapshot = [...selectedOptionsList];

        // Close sheet and block new clicks for animation duration
        closingRef.current = true;
        setConfigProductId(null);
        setCurrentOptions({});

        // Call addToCart synchronously then release the close guard
        addToCart(productSnapshot, optionsSnapshot);
        setTimeout(() => { closingRef.current = false; }, 600);
    };

    const onSubmit = (values: OrderFormValues) => {
        const payload = {
            platformTable: `/api/platform_tables/${values.platformTable}`,
            tablet: `/api/tablets/${values.tablet}`,
            orderItems: values.orderItems.map(item => ({
                product: item.product,
                quantity: item.quantity,
                note: item.note || undefined,
                orderItemOptions: item.orderItemOptions.map(opt => ({
                    optionItem: opt.optionItem,
                })),
            })),
        };

        console.log('[OrderForm] submitting payload:', JSON.stringify(payload, null, 2));

        createOrderMutation.mutate(payload, {
            onSuccess: () => navigate('/orders'),
        });
    };

    const onInvalidSubmit = (errs: any) => {
        console.warn('[OrderForm] validation errors:', errs);
        if (errs.platformTable) toast.error('Veuillez sélectionner une table.');
        if (errs.tablet) toast.error('Veuillez sélectionner une tablette / source.');
        if (errs.orderItems) toast.error('Veuillez ajouter au moins un article.');
    };

    const duplicateItem = (index: number) => {
        const item = orderItems[index];
        append({ ...item });
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit, onInvalidSubmit)}
            className={cn(
                "flex flex-col h-[calc(100vh-140px)] -mt-2 transition-all duration-500",
                isFullScreen && "fixed inset-0 z-[100] bg-background p-6 h-screen mt-0 overflow-auto"
            )}
        >
            {/* TOP BAR: CONTEXT */}
            <div className="bg-background/95 backdrop-blur-md border border-muted-foreground/10 rounded-2xl p-3 mb-6 flex flex-wrap items-center gap-6 shadow-sm">
                {isFullScreen && (
                    <div className="bg-primary/10 px-4 py-2 rounded-xl flex items-center gap-2 border border-primary/20">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        <span className="font-black italic uppercase tracking-tighter text-sm">MODE POS PLEIN ÉCRAN</span>
                    </div>
                )}

                <div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-[18px] border border-muted-foreground/5 shadow-inner">
                    <div className="flex items-center gap-2.5 pl-3 pr-5 border-r border-muted-foreground/10 h-10">
                        <div className="bg-primary/20 p-1.5 rounded-lg">
                            <Armchair className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="flex flex-col -space-y-0.5">
                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Table</span>
                            <Select
                                onValueChange={(val) => {
                                    setValue('platformTable', val);
                                    const table = tablesData?.data.find(t => t.id === val);
                                    if (table?.tablet) {
                                        const tabletId = typeof table.tablet === 'object' ? table.tablet.id : table.tablet;
                                        setValue('tablet', tabletId);
                                    }
                                }}
                                value={selectedTableId}
                            >
                                <SelectTrigger className="h-auto border-none bg-transparent hover:bg-muted/50 font-black italic tracking-tighter text-sm p-0 focus:ring-0">
                                    <SelectValue placeholder="Choisir..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-none shadow-2xl">
                                    {tablesData?.data.map((table) => (
                                        <SelectItem key={table.id} value={table.id} className="font-bold text-xs uppercase italic">
                                            {(table as any).label || `Table ${table.tableNumber}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 px-3 h-10">
                        <div className="bg-accent/10 p-1.5 rounded-lg">
                            <Smartphone className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col -space-y-0.5">
                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Source</span>
                            <Select onValueChange={(val) => setValue('tablet', val)} value={watch('tablet')}>
                                <SelectTrigger className="h-auto border-none bg-transparent hover:bg-muted/50 font-bold text-[11px] p-0 focus:ring-0">
                                    <SelectValue placeholder="Choisir..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-none shadow-2xl">
                                    {tabletsData?.data.map((tablet) => (
                                        <SelectItem key={tablet.id} value={tablet.id} className="text-xs">{tablet.label || tablet.deviceId}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="flex-1" />

                <Separator orientation="vertical" className="h-8 bg-muted-foreground/10" />

                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn("h-11 w-11 rounded-xl shadow-sm transition-all", isFullScreen ? "bg-primary text-primary-foreground" : "hover:bg-primary/5")}
                    onClick={handleFullScreenToggle}
                    title={isFullScreen ? "Quitter Plein Écran" : "Mode Plein Écran POS"}
                >
                    {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </Button>
            </div>

            <div className="flex flex-1 overflow-hidden gap-6">
                {/* 🟩 CATALOGUE */}
                <div className="flex-1 flex flex-col bg-card rounded-[24px] border border-muted-foreground/5 overflow-hidden shadow-inner bg-muted/10">
                    <div className="p-5 space-y-4">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary group-focus-within:scale-110 transition-transform duration-300" />
                            <Input
                                placeholder="Rechercher un produit..."
                                className="h-16 pl-12 pr-12 rounded-[24px] border-none bg-background shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] focus-visible:ring-2 focus-visible:ring-primary/20 font-bold text-lg placeholder:text-muted-foreground/30 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        {/* Category filter pills */}
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            <Button
                                type="button"
                                variant={selectedCategoryId === 'all' ? 'default' : 'outline'}
                                className={cn("h-10 rounded-xl px-6 font-black uppercase italic tracking-widest text-xs shrink-0", selectedCategoryId === 'all' && "shadow-lg shadow-primary/20 scale-105")}
                                onClick={() => setSelectedCategoryId('all')}
                            >
                                Tout
                            </Button>
                            {categoriesRaw?.map((cat: any) => {
                                const iri = cat['@id'] || `/api/categories/${cat.id}`;
                                const isActive = selectedCategoryId === iri;
                                return (
                                    <Button
                                        key={cat.id}
                                        type="button"
                                        variant={isActive ? 'default' : 'outline'}
                                        className={cn("h-10 rounded-xl px-6 font-black uppercase italic tracking-widest text-xs shrink-0", isActive && "shadow-lg shadow-primary/20 scale-105")}
                                        onClick={() => setSelectedCategoryId(iri)}
                                    >
                                        {cat.label || cat.name}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex-1 px-5 overflow-y-auto">
                        {isLoadingProducts ? (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-1">
                                {[...Array(8)].map((_, i) => <div key={i} className="aspect-square bg-muted/50 rounded-2xl animate-pulse" />)}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-10 p-1">
                                {productsData?.data?.map((product) => (
                                    <Card key={product.id} className="group relative rounded-2xl border-none shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer overflow-hidden bg-background" onClick={() => handleProductClick(product)}>
                                        <CardContent className="p-0">
                                            <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                                                {(product.imageUrl || (product as any).contentUrl) ? (
                                                    <img
                                                        src={product.imageUrl || (product as any).contentUrl}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-primary/5">
                                                        <span className="text-4xl font-black italic text-primary/10 uppercase">
                                                            {product.name.substring(0, 2)}
                                                        </span>
                                                    </div>
                                                )}
                                                <Badge className="absolute top-2 right-2 bg-primary/90 text-primary-foreground font-black italic rounded-lg">
                                                    {product.price.toFixed(2)} {currSymbol}
                                                </Badge>
                                            </div>
                                            <div className="p-4 bg-background">
                                                <h3 className="font-black italic uppercase text-sm leading-none mb-1">{product.name}</h3>
                                                <p className="text-[10px] text-muted-foreground font-bold line-clamp-1 opacity-60">{product.description || 'N/A'}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 🛒 PANIER */}
                <div className="w-[400px] flex flex-col bg-card rounded-[24px] border border-muted-foreground/10 overflow-hidden shadow-2xl relative">
                    <div className="p-6 bg-muted/30 border-b flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary p-2 rounded-xl text-primary-foreground shadow-lg"><ShoppingCart className="w-5 h-5" /></div>
                            <h2 className="font-black italic uppercase tracking-tighter text-xl">Votre Panier</h2>
                        </div>
                        <Badge variant="secondary" className="h-6 px-2 font-black italic rounded-lg border-primary/20 text-primary">{orderItems.reduce((acc, i) => acc + i.quantity, 0)}</Badge>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {fields.length === 0 ? (
                            <div className="text-center py-20 opacity-30 flex flex-col items-center">
                                <ShoppingCart className="w-20 h-20 mb-4" />
                                <p className="font-black italic uppercase tracking-widest">Panier Vide</p>
                            </div>
                        ) : (
                            fields.map((field, index) => (
                                <div key={field.id} className="group relative bg-muted/10 rounded-2xl p-4 border border-transparent hover:border-primary/20 hover:bg-muted/5 transition-all">
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex-1">
                                            <h4 className="font-black italic uppercase text-sm leading-tight">{field.name}</h4>
                                            <div className="flex items-center gap-2 mt-3">
                                                <div className="bg-background p-1 rounded-xl flex items-center border h-8">
                                                    <button type="button" className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-muted" onClick={() => { const q = watch(`orderItems.${index}.quantity`); if (q > 1) setValue(`orderItems.${index}.quantity`, q - 1); }}><Minus className="w-3 h-3" /></button>
                                                    <span className="px-3 font-black text-xs">{watch(`orderItems.${index}.quantity`)}</span>
                                                    <button type="button" className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-muted" onClick={() => setValue(`orderItems.${index}.quantity`, watch(`orderItems.${index}.quantity`) + 1)}><Plus className="w-3 h-3" /></button>
                                                </div>
                                                <span className="text-[10px] font-black uppercase opacity-40 italic">{(field.unitPrice + field.orderItemOptions.reduce((s, o) => s + o.price, 0)).toFixed(2)}{currSymbol}/u</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-black text-lg italic text-primary leading-none">{((field.unitPrice + field.orderItemOptions.reduce((s, o) => s + o.price, 0)) * watch(`orderItems.${index}.quantity`)).toFixed(2)} {currSymbol}</span>
                                            <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => duplicateItem(index)}><Copy className="w-3.5 h-3.5" /></Button>
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(index)}><Trash2 className="w-3.5 h-3.5" /></Button>
                                            </div>
                                        </div>
                                    </div>
                                    {field.orderItemOptions.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-1 pt-3 border-t border-muted/50">
                                            {field.orderItemOptions.map((opt, i) => <Badge key={i} variant="outline" className="text-[8px] font-black uppercase italic tracking-widest border-none p-0 h-4 mr-2">{opt.name}</Badge>)}
                                        </div>
                                    )}

                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-6 bg-background border-t-2 rounded-t-[32px] shadow-2xl">
                        <div className="flex justify-between items-end mb-4">
                            <div className="flex flex-col">
                                <span className="font-black italic uppercase text-primary text-[10px] tracking-widest leading-none mb-2">Total à Payer</span>
                                <span className="text-4xl font-black italic tracking-tighter text-primary">{totalAmount.toFixed(2)} {currSymbol}</span>
                            </div>
                        </div>
                        {fields.length === 0 && (
                            <p className="text-[10px] text-muted-foreground italic font-bold text-center mb-3 opacity-60">Ajoutez un article pour continuer</p>
                        )}
                        {fields.length > 0 && !selectedTableId && (
                            <p className="text-[10px] text-destructive italic font-bold text-center mb-3">⚠️ Sélectionnez une table pour envoyer</p>
                        )}
                        {fields.length > 0 && selectedTableId && !selectedTabletId && (
                            <p className="text-[10px] text-destructive italic font-bold text-center mb-3">⚠️ Sélectionnez une tablette / source</p>
                        )}
                        <Button type="submit" className="w-full h-14 rounded-2xl bg-primary shadow-2xl font-black uppercase italic tracking-widest text-sm gap-3 transition-all hover:scale-[1.02] active:scale-95 disabled:scale-100 disabled:opacity-50" disabled={fields.length === 0 || !selectedTableId || !selectedTabletId || createOrderMutation.isPending}>
                            {createOrderMutation.isPending ? 'Envoi...' : <><Send className="w-5 h-5" /> Envoyer en Cuisine</>}
                        </Button>
                    </div>
                </div>
            </div>

            <Sheet open={!!configProductId} onOpenChange={(open) => !open && setConfigProductId(null)}>
                <SheetContent className="flex flex-col p-8 sm:max-w-xl border-l-0 shadow-2xl rounded-l-[40px] bg-background">
                    {(isLoadingConfig || isFetchingConfig) && (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4 text-muted-foreground">
                                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                                <p className="font-bold text-sm">Chargement des options...</p>
                            </div>
                        </div>
                    )}
                    {!isLoadingConfig && !isFetchingConfig && configProduct && (
                        <>
                            <SheetHeader className="mb-8">
                                <SheetTitle className="text-3xl font-black italic uppercase tracking-tighter text-primary">{configProduct.name}</SheetTitle>
                                <SheetDescription className="font-bold italic text-muted-foreground opacity-70">Personnalisez votre plat</SheetDescription>
                            </SheetHeader>
                            <div className="flex-1 overflow-y-auto space-y-10 pr-4">
                                {((configProduct.optionGroups as any[]) || []).map((rawGroup) => {
                                    const group = normalizeGroup(rawGroup);
                                    const selectedCount = (currentOptions[group.id] || []).length;
                                    const max = group.maxChoices || 1;
                                    const isFull = selectedCount >= max;
                                    return (
                                        <div key={group.id} className="space-y-5">
                                            <div className="flex justify-between items-center">
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-black italic uppercase text-lg">{group.name}</h4>
                                                        {group.isRequired && (
                                                            <Badge className="bg-destructive/10 text-destructive border-none text-[8px] font-black uppercase px-1.5 h-4 flex items-center gap-1">
                                                                <AlertCircle className="w-2.5 h-2.5" /> Obligatoire
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] font-bold text-muted-foreground/60 italic">
                                                        {max === 1 ? 'Choisissez une seule option' : `Choisissez jusqu'à ${max} options`}
                                                    </p>
                                                </div>
                                                <div className={cn(
                                                    "flex flex-col items-end gap-1 px-3 py-1.5 rounded-xl border transition-all duration-300",
                                                    selectedCount > 0 ? "bg-primary/5 border-primary/20" : "bg-background border-muted/50"
                                                )}>
                                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Sélection</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={cn("text-xs font-black italic", selectedCount > 0 ? "text-primary" : "text-muted-foreground")}>{selectedCount}</span>
                                                        <span className="text-[10px] opacity-20">/</span>
                                                        <span className="text-[10px] font-black italic opacity-40">{max}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {(group.items || []).map((option: OptionItem) => {
                                                    const optionIri = `/api/option_items/${option.id}`;
                                                    const isSelected = (currentOptions[group.id] || []).includes(optionIri);
                                                    const isDisabled = isFull && !isSelected;
                                                    return (
                                                        <Card
                                                            key={option.id}
                                                            className={cn(
                                                                "cursor-pointer border-2 rounded-2xl transition-all duration-200 select-none",
                                                                isSelected
                                                                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10 -translate-y-1"
                                                                    : "border-muted shadow-none hover:bg-muted/30 hover:border-muted-foreground/20",
                                                                isDisabled && "opacity-40 pointer-events-none"
                                                            )}
                                                            onClick={() => toggleOption(group.id, option, max)}
                                                        >
                                                            <CardContent className="p-4 flex items-center justify-between gap-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={cn(
                                                                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200",
                                                                        isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
                                                                    )}>
                                                                        {isSelected && <Check className="w-4 h-4 text-primary-foreground stroke-[4]" />}
                                                                    </div>
                                                                    <span className={cn("font-bold text-sm", isSelected ? "text-primary" : "text-muted-foreground")}>
                                                                        {option.name}
                                                                    </span>
                                                                </div>
                                                                {option.price > 0 && (
                                                                    <Badge variant="outline" className={cn(
                                                                        "font-black italic text-[10px] border-none px-2 rounded-lg transition-colors",
                                                                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                                                    )}>
                                                                        +{option.price.toFixed(2)}{currSymbol}
                                                                    </Badge>
                                                                )}
                                                            </CardContent>
                                                        </Card>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <SheetFooter className="mt-8 pt-8 border-t flex items-center justify-between gap-4 sm:justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase italic text-muted-foreground opacity-60">Total article</p>
                                    <p className="text-3xl font-black italic tracking-tighter text-primary">
                                        {liveOptionTotal.toFixed(2)} {currSymbol}
                                    </p>
                                    {liveOptionTotal > configProduct.price && (
                                        <p className="text-[11px] text-muted-foreground font-semibold">
                                            {configProduct.price.toFixed(2)} + {(liveOptionTotal - configProduct.price).toFixed(2)} options
                                        </p>
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    className="h-16 px-10 rounded-2xl bg-primary text-primary-foreground font-black italic uppercase tracking-widest text-lg shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95"
                                    onClick={confirmAddWithSelection}
                                >
                                    {Object.keys(currentOptions).flat().length > 0 ? 'Valider' : 'Ajouter au panier'} <Plus className="ml-3 w-5 h-5" />
                                </Button>
                            </SheetFooter>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </form>
    );
}
