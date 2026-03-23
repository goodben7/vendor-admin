import { Package, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ProductStatsProps {
    totalProducts: number;
    activeProducts: number;
    outOfStockProducts: number; // or inactive
    isLoading?: boolean;
}

export function ProductStats({
    totalProducts,
    activeProducts,
    outOfStockProducts,
    isLoading
}: ProductStatsProps) {

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
                ))}
            </div>
        );
    }

    const stats = [
        {
            label: 'Total Produits',
            value: totalProducts,
            icon: Package,
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-100 dark:border-blue-900/30'
        },
        {
            label: 'Disponibles',
            value: activeProducts,
            icon: CheckCircle2,
            color: 'text-green-600 dark:text-green-400',
            bg: 'bg-green-50 dark:bg-green-900/20',
            border: 'border-green-100 dark:border-green-900/30'
        },
        {
            label: 'Indisponibles',
            value: outOfStockProducts,
            icon: XCircle,
            color: 'text-red-600 dark:text-red-400',
            bg: 'bg-red-50 dark:bg-red-900/20',
            border: 'border-red-100 dark:border-red-900/30'
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {stats.map((stat, index) => (
                <Card key={index} className={`shadow-sm border ${stat.border} hover:shadow-md transition-shadow duration-200 bg-card`}>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                            <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                        </div>
                        <div className={`p-2 rounded-lg ${stat.bg}`}>
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
