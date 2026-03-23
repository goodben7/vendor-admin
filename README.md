# Vendor Tablet Admin Dashboard

Application d'administration professionnelle pour Vendor Tablet, une plateforme SaaS de gestion opérationnelle de restaurants.

## 🚀 Technologies

- **React 18** + **TypeScript**
- **Vite** - Build tool moderne et rapide
- **React Router v6** - Routing
- **TanStack Query** - Gestion d'état serveur
- **Axios** - Client HTTP
- **Shadcn/UI** + **Tailwind CSS** - Interface utilisateur
- **Zod** + **React Hook Form** - Validation de formulaires
- **Sonner** - Notifications toast
- **Lucide React** - Icônes
- **Recharts** - Graphiques (à venir)

## 📋 Fonctionnalités

### ✅ Implémenté

- **Authentification JWT**
  - Page de connexion avec validation
  - Stockage sécurisé du token
  - Auto-déconnexion sur 401
  - Routes protégées

- **Layout & Navigation**
  - AppShell responsive
  - Sidebar avec navigation basée sur les permissions (RBAC)
  - Topbar avec mode sombre et menu utilisateur
  - Breadcrumbs auto-générés

- **RBAC (Role-Based Access Control)**
  - Système de permissions complet
  - RoleGuard pour masquer les éléments UI
  - Protection des routes

- **Composants UI génériques**
  - Button, Input, Card, Label
  - StatusBadge (commandes, paiements)
  - LoadingSkeleton
  - EmptyState
  - Toast notifications

- **API Integration**
  - Axios avec intercepteurs JWT
  - React Query hooks pour:
    - Commandes (CRUD + transitions de statut)
    - Paiements (CRUD)
    - Produits, Catégories, Groupes d'options (CRUD)

### 🚧 En cours de développement

- Dashboard avec KPIs et graphiques
- Pages de gestion:
  - Utilisateurs & Profils
  - Plateformes, Tables, Tablettes
  - Menus, Catégories, Produits, Options
  - Commandes (liste, détail, transitions)
  - Paiements (création, liste)
  - Documents (upload, gestion)

## 🛠️ Installation

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Build pour la production
npm run build

# Preview du build de production
npm run preview
```

## ⚙️ Configuration

### Backend API

Le projet est configuré pour se connecter à un backend Symfony via un proxy Vite.

Modifier `vite.config.ts` pour ajuster l'URL du backend:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000', // URL de votre backend Symfony
      changeOrigin: true,
      secure: false,
    },
  },
}
```

### Variables d'environnement

Créer un fichier `.env` à la racine:

```env
VITE_API_URL=http://localhost:8000
```

## 📁 Structure du projet

```
src/
├── components/
│   ├── layout/          # AppShell, Sidebar, Topbar, Breadcrumbs
│   ├── ui/              # Composants UI de base (Button, Input, Card...)
│   ├── shared/          # Composants partagés (RoleGuard, StatusBadge...)
│   └── features/        # Composants spécifiques aux fonctionnalités
├── pages/               # Pages de l'application
│   ├── dashboard/
│   ├── orders/
│   ├── payments/
│   └── ...
├── hooks/               # React Query hooks
│   ├── useOrders.ts
│   ├── usePayments.ts
│   └── useProducts.ts
├── services/            # Services (API, auth)
│   ├── axios.ts
│   └── auth.service.ts
├── types/               # Types TypeScript
│   └── entities.ts
├── lib/                 # Utilitaires
│   ├── utils.ts
│   └── permissions.ts
├── styles/              # Styles globaux
│   └── globals.css
├── App.tsx              # Composant racine
└── main.tsx             # Point d'entrée
```

## 🔐 Authentification

L'application utilise JWT pour l'authentification:

1. L'utilisateur se connecte via `/login`
2. Le token JWT est stocké dans `localStorage`
3. Toutes les requêtes API incluent le token dans le header `Authorization`
4. En cas de 401, l'utilisateur est automatiquement déconnecté

**⚠️ Important**: Le token n'est jamais loggué ou affiché pour des raisons de sécurité.

## 🛡️ RBAC - Permissions

Le système de permissions supporte:

- `USERS_*`, `PROFILES_*`, `ACTIVITIES_*`
- `PLATFORMS_*`, `PLATFORM_TABLES_*`, `TABLETS_*`
- `MENUS_*`, `CATEGORIES_*`, `PRODUCTS_*`
- `OPTION_GROUPS_*`, `OPTION_ITEMS_*`
- `ORDERS_*`, `PAYMENTS_*`, `DOCUMENTS_*`

Chaque permission a 4 actions: `VIEW`, `CREATE`, `EDIT`, `DELETE`

Utilisation:

```tsx
import RoleGuard from '@/components/shared/RoleGuard';

<RoleGuard permissions={['ORDERS_VIEW', 'ORDERS_EDIT']}>
  <Button>Modifier la commande</Button>
</RoleGuard>
```

## 🎨 Thème

L'application supporte le mode sombre via Tailwind CSS.

Le thème peut être basculé via le bouton dans la Topbar.

Les couleurs sont définies dans `src/styles/globals.css` via des variables CSS.

## 📱 Responsive

L'application est optimisée pour:

- Desktop (1024px+)
- Tablette (768px - 1023px)
- Mobile (support basique)

## 🧪 Développement

### Ajouter une nouvelle page

1. Créer le composant dans `src/pages/`
2. Ajouter la route dans `src/App.tsx`
3. Ajouter l'item dans la Sidebar (`src/components/layout/Sidebar.tsx`)
4. Ajouter le label dans Breadcrumbs (`src/components/layout/Breadcrumbs.tsx`)

### Ajouter un nouveau hook React Query

1. Créer le fichier dans `src/hooks/`
2. Définir les types dans `src/types/entities.ts`
3. Implémenter les hooks avec `useQuery` et `useMutation`
4. Gérer les notifications avec `toast`

## 📝 Conventions de code

- **TypeScript strict mode** activé
- **ESLint** pour le linting
- **Prettier** pour le formatage (recommandé)
- Nommage:
  - Composants: PascalCase
  - Hooks: camelCase avec préfixe `use`
  - Fichiers: kebab-case ou PascalCase selon le contenu

## 🚀 Déploiement

```bash
# Build de production
npm run build

# Les fichiers sont générés dans le dossier `dist/`
# Déployer le contenu de `dist/` sur votre serveur
```

## 📄 Licence

Propriétaire - Vendor Tablet

---

**Développé avec ❤️ pour Vendor Tablet**
