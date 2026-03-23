import { Product } from '@/types/entities';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ProductStatusBadge } from './ProductStatusBadge';
import { ProductActions } from './ProductActions';
import { ImageIcon } from 'lucide-react';
import { usePlatformCurrency } from '@/hooks/usePlatformCurrency';

interface ProductGridItemProps {
    product: Product;
}

export function ProductGridItem({ product }: ProductGridItemProps) {
    const { symbol: currSymbol } = usePlatformCurrency();
    return (
        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 group flex flex-col h-full">
            <div className="aspect-[4/3] relative bg-muted/30 flex items-center justify-center overflow-hidden">
                {(product.contentUrl || product.imageUrl) ? (
                    <img
                        src={product.contentUrl || product.imageUrl}
                        alt={product.name}
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
                )}
                <div className="absolute top-2 right-2">
                    <ProductStatusBadge isAvailable={product.isAvailable} />
                </div>
            </div>
            <CardContent className="p-4 flex-1">
                <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg leading-tight line-clamp-1" title={product.name}>
                            {product.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            {(typeof product.category === 'object' && product.category) ? (product.category.label || product.category.name || 'Sans catégorie') : 'Sans catégorie'}
                        </p>
                    </div>
                    <span className="font-bold text-lg whitespace-nowrap">
                        {product.price.toFixed(2)} {currSymbol}
                    </span>
                </div>

            </CardContent>
            <CardFooter className="p-4 py-3 flex justify-between items-center border-t bg-muted/10 mt-auto">
                <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                    Créé le {new Date(product.createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center">
                    <ProductActions product={product} />
                </div>
            </CardFooter>
        </Card>
    );
}
