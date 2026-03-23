import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProductStatusBadgeProps {
    isAvailable: boolean;
    className?: string;
}

export function ProductStatusBadge({ isAvailable, className }: ProductStatusBadgeProps) {
    return (
        <Badge
            variant={isAvailable ? 'default' : 'destructive'}
            className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none',
                isAvailable
                    ? 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30'
                    : 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30',
                className
            )}
        >
            {isAvailable ? 'Disponible' : 'Indisponible'}
        </Badge>
    );
}
