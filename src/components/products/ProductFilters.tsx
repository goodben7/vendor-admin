import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useAllCategories } from '@/hooks/useProducts';


interface ProductFiltersProps {
    category: string;
    onCategoryChange: (value: string) => void;
    availability: string;
    onAvailabilityChange: (value: string) => void;
    sort: string;
    onSortChange: (value: string) => void;
}

export function ProductFilters({
    category,
    onCategoryChange,
    availability,
    onAvailabilityChange,
    sort,
    onSortChange,
}: ProductFiltersProps) {
    const { data: categories } = useAllCategories();
    const hasActiveFilters = category !== 'all' || availability !== 'all' || sort !== 'newest';

    const clearFilters = () => {
        onCategoryChange('all');
        onAvailabilityChange('all');
        onSortChange('newest');
    };

    return (
        <div className="flex flex-wrap items-center gap-3">
            {/* Filter Icon / Label (Optional) */}
            <div className="flex items-center text-sm font-medium text-muted-foreground mr-2">
                <Filter className="w-4 h-4 mr-2" />
                Filtres
            </div>

            <Select value={category} onValueChange={onCategoryChange}>
                <SelectTrigger className="w-[180px] h-10 bg-background border-border text-sm">
                    <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={(cat as any)['@id'] || cat.id}>
                            {cat.label || cat.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={availability} onValueChange={onAvailabilityChange}>
                <SelectTrigger className={`w-[160px] h-10 border-border text-sm ${availability !== 'all' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-background'}`}>
                    <SelectValue placeholder="Disponibilité" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="available">Disponibles</SelectItem>
                    <SelectItem value="unavailable">Indisponibles</SelectItem>
                </SelectContent>
            </Select>

            <Select value={sort} onValueChange={onSortChange}>
                <SelectTrigger className="w-[160px] h-10 bg-background border-border text-sm">
                    <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="newest">Plus récent</SelectItem>
                    <SelectItem value="price_asc">Prix croissant</SelectItem>
                    <SelectItem value="price_desc">Prix décroissant</SelectItem>
                    <SelectItem value="name_asc">Nom A-Z</SelectItem>
                </SelectContent>
            </Select>

            {hasActiveFilters && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-10 px-3 text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                    <X className="w-4 h-4 mr-2" />
                    Réinitialiser
                </Button>
            )}
        </div>
    );
}
