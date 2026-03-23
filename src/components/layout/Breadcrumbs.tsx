import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeLabels: Record<string, string> = {
    dashboard: 'Tableau de bord',
    users: 'Utilisateurs',
    profiles: 'Profils',
    platforms: 'Plateformes',
    'platform-tables': 'Tables',
    tablets: 'Tablettes',
    menus: 'Menus',
    categories: 'Catégories',
    products: 'Produits',
    'option-groups': 'Options du produit',
    'option-items': 'Variantes',
    orders: 'Commandes',
    payments: 'Paiements',
    create: 'Créer',
    edit: 'Modifier',
};

export default function Breadcrumbs() {
    const location = useLocation();
    const pathSegments = location.pathname.split('/').filter(Boolean);

    if (pathSegments.length === 0 || pathSegments[0] === 'dashboard') {
        return null;
    }

    const breadcrumbs = pathSegments.map((segment, index) => {
        const path = '/' + pathSegments.slice(0, index + 1).join('/');
        const label = routeLabels[segment] || segment;
        const isLast = index === pathSegments.length - 1;

        return {
            label,
            path,
            isLast,
        };
    });

    return (
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Link
                to="/dashboard"
                className="flex items-center hover:text-foreground transition-colors"
            >
                <Home className="w-4 h-4" />
            </Link>

            {breadcrumbs.map((crumb) => (
                <div key={crumb.path} className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" />
                    {crumb.isLast ? (
                        <span className="font-medium text-foreground">{crumb.label}</span>
                    ) : (
                        <Link
                            to={crumb.path}
                            className="hover:text-foreground transition-colors"
                        >
                            {crumb.label}
                        </Link>
                    )}
                </div>
            ))}
        </nav>
    );
}
