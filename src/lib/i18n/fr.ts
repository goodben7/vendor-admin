// French localization constants for the application
// All user-facing strings are centralized here for easy translation

export const FR = {
    // Common
    common: {
        save: 'Enregistrer',
        cancel: 'Annuler',
        delete: 'Supprimer',
        edit: 'Modifier',
        create: 'Créer',
        update: 'Mettre à jour',
        search: 'Rechercher',
        filter: 'Filtrer',
        loading: 'Chargement...',
        noData: 'Aucune donnée disponible',
        confirm: 'Confirmer',
        back: 'Retour',
        next: 'Suivant',
        previous: 'Précédent',
        yes: 'Oui',
        no: 'Non',
        optional: 'Optionnel',
        required: 'Obligatoire',
    },

    // Navigation
    nav: {
        dashboard: 'Tableau de bord',
        orders: 'Commandes',
        payments: 'Paiements',
        products: 'Produits',
        categories: 'Catégories',
        optionGroups: 'Groupes d\'options',
        optionItems: 'Options',
        platforms: 'Plateformes',
        tables: 'Tables',
        tablets: 'Tablettes',
        users: 'Utilisateurs',
        profiles: 'Profils',
        settings: 'Paramètres',
    },

    // Order statuses
    orderStatus: {
        D: 'Brouillon',
        K: 'En cuisine',
        R: 'Prêt',
        S: 'Servi',
        P: 'Payé',
        C: 'Annulé',
    },

    // Payment methods
    paymentMethod: {
        CARD: 'Carte bancaire',
        CASH: 'Espèces',
        MOBILE_MONEY: 'Mobile Money',
    },

    // Payment statuses
    paymentStatus: {
        P: 'En attente',
        S: 'Réussi',
        F: 'Échoué',
    },

    // Dashboard
    dashboard: {
        title: 'Tableau de bord',
        subtitle: 'Vue d\'ensemble de votre activité',
        totalOrders: 'Total Commandes',
        pendingOrders: 'Commandes en cours',
        revenue: 'Revenus',
        completionRate: 'Taux de complétion',
        ordersByStatus: 'Commandes par statut',
        paymentsByMethod: 'Paiements par méthode',
        recentOrders: 'Commandes récentes',
        topProducts: 'Top Produits',
        completed: 'complétées',
        toProcess: 'À traiter',
        payments: 'paiements',
        ordersServed: 'Commandes servies',
        noRecentOrders: 'Aucune commande récente',
        noProductsSold: 'Aucun produit vendu',
        sold: 'vendus',
        revenueLabel: 'de revenus',
    },

    // Forms
    form: {
        name: 'Nom',
        description: 'Description',
        price: 'Prix ($)',
        category: 'Catégorie',
        available: 'Disponible',
        email: 'Email',
        phone: 'Téléphone',
        address: 'Adresse',
        username: 'Nom d\'utilisateur',
        displayName: 'Nom d\'affichage',
        password: 'Mot de passe',
        profile: 'Profil',
        active: 'Actif',
        tableNumber: 'Numéro de table',
        capacity: 'Capacité (personnes)',
        platform: 'Plateforme',
        amount: 'Montant',
        method: 'Méthode de paiement',
        order: 'Commande',
    },

    // Validation messages
    validation: {
        required: 'Ce champ est requis',
        emailInvalid: 'Email invalide',
        minLength: 'Doit contenir au moins {min} caractères',
        maxLength: 'Ne peut pas dépasser {max} caractères',
        positive: 'Doit être positif',
        integer: 'Doit être un nombre entier',
    },

    // Success messages
    success: {
        created: '{entity} créé(e) avec succès',
        updated: '{entity} mis(e) à jour avec succès',
        deleted: '{entity} supprimé(e) avec succès',
        saved: 'Enregistré avec succès',
    },

    // Error messages
    error: {
        generic: 'Une erreur est survenue',
        notFound: '{entity} non trouvé(e)',
        unauthorized: 'Non autorisé',
        serverError: 'Erreur serveur',
        networkError: 'Erreur réseau',
    },

    // Confirmation messages
    confirm: {
        delete: 'Êtes-vous sûr de vouloir supprimer {entity} ?',
        cancel: 'Êtes-vous sûr de vouloir annuler ?',
        irreversible: 'Cette action est irréversible.',
    },

    // Accessibility
    aria: {
        backToList: 'Retour à la liste',
        openMenu: 'Ouvrir le menu',
        closeMenu: 'Fermer le menu',
        toggleDarkMode: 'Basculer le mode sombre',
        logout: 'Se déconnecter',
        search: 'Rechercher',
        filter: 'Filtrer',
        sort: 'Trier',
        pagination: 'Pagination',
        nextPage: 'Page suivante',
        previousPage: 'Page précédente',
        selectAll: 'Tout sélectionner',
        deselectAll: 'Tout désélectionner',
    },
};

export default FR;
