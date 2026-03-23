import { Badge } from "@/components/ui/badge";
import { Separator } from '@/components/ui/separator';
import { ProductOptionGroupConfig } from './ProductOptionGroups';
// import { Circle, Square } from 'lucide-react'; // Removing unused import

interface ProductPreviewProps {
    name: string;
    price: number | string;
    description?: string;
    imageUrl?: string;
    contentUrl?: string;
    optionGroups?: ProductOptionGroupConfig[];
    categoryName?: string;
    isAvailable?: boolean;
    currSymbol?: string;
}

export function ProductPreview({
    name,
    price,
    description,
    imageUrl,
    contentUrl,
    optionGroups = [],
    categoryName,
    isAvailable = true,
    currSymbol = '$',
}: ProductPreviewProps) {
    const formattedPrice = typeof price === 'number' ? price.toFixed(2) : (parseFloat(price as string) || 0).toFixed(2);

    return (
        <div className="bg-background h-full overflow-y-auto hide-scrollbar flex flex-col relative">
            {/* Image Header */}
            <div className="w-full aspect-[4/3] bg-muted mb-0 relative group flex-shrink-0">
                {(contentUrl || imageUrl) ? (
                    <img src={contentUrl || imageUrl} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted/50">
                        <span className="text-muted-foreground text-sm font-medium">Image produit</span>
                    </div>
                )}

                {categoryName && (
                    <Badge className="absolute top-4 left-4 bg-black/50 backdrop-blur-md border-0 text-white font-medium px-3 py-1">
                        {categoryName}
                    </Badge>
                )}

                {!isAvailable && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                        <Badge variant="destructive" className="text-lg px-4 py-1 shadow-lg">Indisponible</Badge>
                    </div>
                )}
            </div>

            <div className="p-6 space-y-6 flex-grow">
                {/* Title & Price */}
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold leading-tight text-foreground break-words tracking-tight">{name || "Nom du produit"}</h2>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-foreground">{formattedPrice} {currSymbol}</span>
                        <span className="text-sm text-muted-foreground font-normal">TTC</span>
                    </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                    {description || "Ajoutez une description pour donner envie à vos clients..."}
                </p>

                <Separator className="bg-gray-100" />

                {/* Customization Section */}
                <div className="space-y-6">
                    <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">Personnalisation</h4>

                    {optionGroups && optionGroups.length > 0 ? (
                        <div className="space-y-6">
                            {optionGroups.filter(g => g.isAvailable).map((group, sectionIndex) => (
                                <div key={sectionIndex} className="space-y-3 border-b border-border/50 pb-6 last:border-0 last:pb-0">
                                    <div className="flex items-center justify-between">
                                        <h5 className="font-bold text-foreground text-sm uppercase tracking-tight">
                                            {group.label}
                                        </h5>
                                        {group.isRequired && (
                                            <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded tracking-wider border border-amber-200 dark:border-amber-900/50">Obligatoire</span>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        {group.items && group.items.length > 0 ? (
                                            group.items.filter(item => item.isAvailable).map((item, i) => (
                                                <div key={item.id || i} className="flex items-center gap-3 text-sm text-muted-foreground group cursor-pointer hover:text-foreground transition-all">
                                                    {group.maxChoices === 1 ? (
                                                        <div className={`w-4 h-4 rounded-full border border-border flex items-center justify-center ${i === 0 && group.isRequired ? 'border-primary' : ''}`}>
                                                            {i === 0 && group.isRequired && <div className="w-2 h-2 rounded-full bg-primary" />}
                                                        </div>
                                                    ) : (
                                                        <div className="w-4 h-4 rounded border border-border" />
                                                    )}
                                                    <span className="font-medium">{item.name}</span>
                                                    {item.price > 0 && (
                                                        <span className="text-xs text-muted-foreground/60 ml-auto font-bold">+{item.price.toFixed(2)}{currSymbol}</span>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-muted-foreground italic pl-1">Aucune option définie</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 border border-dashed border-border rounded-xl bg-muted/20">
                            <p className="text-sm text-muted-foreground italic">Aucune option visible</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom spacer for scroll */}
            <div className="h-4 w-full"></div>
        </div>
    );
}
