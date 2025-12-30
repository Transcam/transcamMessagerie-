# Frontend - Transcam Messagerie

Application frontend de gestion de messagerie et d'expéditions pour Transcam, construite avec React, TypeScript et Vite.

## 🚀 Technologies

- **React 18** - Bibliothèque UI
- **TypeScript** - Typage statique
- **Vite** - Build tool et serveur de développement
- **React Router** - Navigation et routage
- **React Query (TanStack Query)** - Gestion d'état serveur et cache
- **shadcn/ui** - Composants UI
- **Tailwind CSS** - Framework CSS utilitaire
- **Lucide React** - Icônes
- **Zod** - Validation de schémas
- **React Hook Form** - Gestion de formulaires
- **date-fns** - Manipulation et formatage de dates

## 📁 Structure du Projet

```
frontend/
├── src/
│   ├── components/          # Composants réutilisables
│   │   ├── departures/     # Composants spécifiques aux départs
│   │   ├── expenses/       # Composants spécifiques aux dépenses
│   │   ├── layout/          # Composants de mise en page
│   │   ├── shipments/       # Composants spécifiques aux expéditions
│   │   └── ui/             # Composants UI de base (shadcn/ui)
│   ├── contexts/           # Contextes React (Auth, Language)
│   ├── hooks/              # Hooks personnalisés
│   ├── pages/              # Pages de l'application
│   ├── services/           # Services API
│   ├── types/              # Types TypeScript
│   └── lib/                # Utilitaires
│       └── date-utils.ts   # Fonctions utilitaires pour les dates (formatage, presets, etc.)
```

## ✨ Fonctionnalités Implémentées

### 🔐 Authentification et Autorisation

- **Système de connexion** avec JWT
- **Gestion des rôles** : ADMIN, STAFF, SUPERVISOR, OPERATIONAL_ACCOUNTANT
- **Contrôle d'accès basé sur les permissions** :
  - Les utilisateurs STAFF ne peuvent pas voir les montants (prix) des expéditions
  - Les utilisateurs STAFF ne voient que leurs propres dépenses (montants masqués)
  - Les utilisateurs STAFF ne peuvent pas modifier ou supprimer les dépenses
  - Les SUPERVISOR ne peuvent pas créer/modifier/supprimer les comptes ADMIN
  - Permissions granulaires pour chaque action

### 🌐 Internationalisation

- **Support multilingue** : Français (FR) et Anglais (EN)
- **Basculement de langue** en temps réel
- **Traductions complètes** de l'interface utilisateur

### 📦 Gestion des Expéditions

#### Pages Disponibles

1. **Liste des Expéditions** (`/shipments`)
   - Affichage de toutes les expéditions
   - Filtrage par statut, route, nature (colis/courrier), numéro de bordereau
   - Pagination
   - Actions : Voir, Modifier, Imprimer reçu, Annuler
   - **Filtrage par nature** : `/shipments/colis` et `/shipments/courrier`

2. **Détails d'Expédition** (`/shipments/:id`)
   - Informations complètes de l'expédition
   - Historique et audit trail
   - Actions : Modifier, Imprimer reçu, Annuler

3. **Création d'Expédition** (`/shipments/new`)
   - Formulaire complet avec validation
   - Sélection de la nature (colis/courrier)
   - Génération automatique du numéro de bordereau

4. **Modification d'Expédition** (`/shipments/:id/edit`)
   - Édition des informations d'expédition
   - Validation en temps réel

#### Fonctionnalités

- **Nature des expéditions** : Colis ou Courrier
- **Type d'expéditions** : Express ou Standard (sélection via dropdown)
- **Statuts** : Pending, Confirmed, Assigned, Cancelled
- **Génération de bordereaux PDF** individuels
- **Génération de reçus PDF** en format ticket (80mm) pour les clients
- **Statistiques** :
  - Total d'expéditions
  - Revenu total (masqué pour STAFF)
  - Poids total
  - Expéditions aujourd'hui
  - **Filtrage par date** : Toutes les statistiques sont liées au sélecteur de plage de dates
  - Répartition par nature (affichée uniquement sur la page générale, pas sur les pages dédiées)

### 🚌 Gestion des Départs

#### Pages Disponibles

1. **Liste des Départs** (`/departures`)
   - Affichage de tous les départs
   - Filtrage par statut (open, sealed, closed)
   - Informations : Route, Véhicule, Chauffeur, Date de scellement

2. **Détails de Départ** (`/departures/:id`)
   - Informations complètes du départ
   - Liste des expéditions assignées
   - Résumé (nombre de colis, poids total, montant total)
   - Actions selon le statut :
     - **Open** : Assigner des expéditions, Sceller le départ
     - **Sealed** : Télécharger bordereau général, Fermer le départ
     - **Closed** : Télécharger bordereau général
   - **Contrôle d'accès** :
     - **STAFF** : Peut créer, sceller, imprimer et fermer les départs, mais ne voit pas les montants (affichés comme "-")
     - **Autres rôles** : Accès complet avec visualisation des montants

3. **Création de Départ** (`/departures/new`)
   - Formulaire de création
   - Sélection de route, véhicule (dropdown avec véhicules ACTIF), chauffeur (dropdown avec chauffeurs ACTIF)

#### Fonctionnalités

- **Statuts** : Open, Sealed, Closed
- **Assignation d'expéditions** à un départ (les expéditions déjà assignées sont pré-cochées dans le dialog)
- **Scellement** : Génération du numéro de bordereau général (BG-YYYY-NNNN)
- **Génération de bordereau général PDF** avec toutes les expéditions
  - Affichage de l'immatriculation du véhicule et du nom complet du chauffeur depuis la base de données
- **Masquage des montants** pour les utilisateurs STAFF dans les listes et détails

### 🚗 Gestion des Véhicules

#### Pages Disponibles

1. **Liste des Véhicules** (`/vehicles`)
   - Affichage de tous les véhicules
   - Filtrage par statut (ACTIF/INACTIF) et type (Bus/Coaster/Minibus)
   - Recherche par immatriculation ou nom
   - Pagination
   - Actions : Voir, Modifier, Supprimer (selon permissions)

2. **Détails de Véhicule** (`/vehicles/:id`)
   - Informations complètes du véhicule
   - Immatriculation, nom, type, statut
   - Date de création et créateur
   - Actions : Modifier, Supprimer (selon permissions)

3. **Création de Véhicule** (`/vehicles/new`)
   - Formulaire avec validation
   - Champs obligatoires : Immatriculation, Nom/Code, Type, Statut
   - Sélection via dropdowns pour Type et Statut

4. **Modification de Véhicule** (`/vehicles/:id/edit`)
   - Édition des informations de véhicule
   - Validation en temps réel
   - Accessible pour ADMIN, SUPERVISOR et STAFF

#### Fonctionnalités

- **Types** : Bus, Coaster, Minibus
- **Statuts** : ACTIF, INACTIF
- **Intégration avec les départs** :
  - Dropdown de sélection lors de la création d'un départ
  - Affiche uniquement les véhicules ACTIF
  - Format d'affichage : "Nom (Immatriculation)" (ex: "Bus 003 (LT-234-AB)")
- **Contrôle d'accès** :
  - **ADMIN/SUPERVISOR** : Accès complet (view, create, edit, delete)
  - **STAFF** : Peut créer et modifier (view, create, edit)
  - **OPERATIONAL_ACCOUNTANT** : Peut seulement voir (view)

### 💰 Gestion des Dépenses

#### Pages Disponibles

1. **Liste des Dépenses** (`/expenses`)
   - Affichage de toutes les dépenses (ou seulement celles de l'utilisateur STAFF)
   - Filtrage par catégorie et date (sélecteur de plage de dates avec presets)
   - Pagination
   - Actions : Modifier, Supprimer (selon permissions)
   - **Affichage conditionnel** :
     - Les montants sont masqués pour les utilisateurs STAFF (affichés comme "-")
     - Les boutons Modifier/Supprimer sont masqués pour STAFF

2. **Détails de Dépense** (`/expenses/:id`)
   - Affichage des informations complètes de la dépense
   - Description, catégorie, montant (masqué pour STAFF)
   - Dates de création et modification
   - Informations sur les utilisateurs (créé par, modifié par)
   - Actions : Modifier, Supprimer (selon permissions)

3. **Création de Dépense** (`/expenses/new`)
   - Formulaire avec validation
   - Champs : Description (obligatoire), Catégorie (dropdown), Montant (obligatoire)
   - **13 catégories** disponibles via dropdown
   - Date automatique (date de création)

4. **Modification de Dépense** (`/expenses/:id/edit`)
   - Édition des informations de dépense
   - Validation en temps réel
   - **Non accessible pour STAFF** (pas de permission)

#### Fonctionnalités

- **Catégories** : 13 catégories prédéfinies (Dépense du boss, Carburant, Maintenance, etc.)
- **Description obligatoire** : Champ requis pour chaque dépense
- **Montant obligatoire** : Doit être supérieur à 0
- **Statistiques** :
  - Total de dépenses
  - Montant total (masqué pour STAFF)
  - Dépenses aujourd'hui
  - Dépenses ce mois
  - Montant du mois (masqué pour STAFF)
  - Répartition par catégorie (masquée pour STAFF)
  - **Filtrage par date** : Toutes les statistiques sont liées au sélecteur de plage de dates
- **Contrôle d'accès** :
  - **STAFF** : Voit uniquement ses propres dépenses, montants masqués, ne peut pas modifier/supprimer
  - **Autres rôles** : Voient toutes les dépenses, voient les montants, peuvent modifier/supprimer (selon permissions)

### 👥 Gestion des Utilisateurs

#### Page Disponible

1. **Liste des Utilisateurs** (`/users`)
   - Affichage de tous les utilisateurs
   - Création, modification, suppression
   - Gestion des rôles
   - Restrictions pour SUPERVISOR (ne peut pas gérer les ADMIN)

### 📊 Dashboard

- **Statistiques globales** :
  - Expéditions (filtrées par plage de dates)
  - Revenu total (masqué pour STAFF, filtré par plage de dates)
  - Total des départs
- **Sélecteur de plage de dates** : Permet de filtrer toutes les statistiques par période
- **Tableau des expéditions récentes** : Expéditions filtrées par la plage de dates sélectionnée
- **Navigation rapide** vers les différentes sections

### 💰 Gestion des Répartitions

#### Page Disponible

1. **Page Répartitions** (`/distribution`)
   - Vue d'ensemble avec cartes statistiques (Total Chauffeurs, Total Ministère, Total Agence, Expéditions concernées)
   - Sélecteur de vue : Chauffeur ou Ministère
   - **Sélecteur de plage de dates** avec presets (Aujourd'hui, Hier, Cette semaine, etc.)
   - Filtrage automatique de toutes les données selon la plage de dates sélectionnée

#### Vue Chauffeur

- **Liste des chauffeurs** avec leurs répartitions
- Pour chaque chauffeur :
  - Nom complet
  - Montant total (masqué pour STAFF)
  - Nombre d'expéditions
  - Détails par expédition (bordereau, poids, prix, montant chauffeur, date scellement)
- **Règle** : 60% du montant des colis ≤ 40kg

#### Vue Ministère

- **Statistiques** :
  - CA Éligible (masqué pour STAFF)
  - Montant Ministère (masqué pour STAFF)
  - Nombre d'expéditions éligibles
- **Liste des expéditions éligibles** avec détails :
  - Bordereau, nature, type, poids, prix (masqué pour STAFF), date scellement
- **Règle** : 5% du CA des expéditions éligibles (colis ≤ 50kg, courrier standard ≤ 100g, courrier express entre 100g et 2kg)

#### Contrôle d'Accès

- **Permission requise** : `view_distribution`
- **STAFF** : Les montants sont masqués (affichés comme "-")
- **Autres rôles** : Visualisation complète de tous les montants

#### Fonctionnalités

- **Calcul automatique** : Les répartitions sont calculées en temps réel
- **Filtrage par date** : Utilise la date de scellement (`sealed_at`) des départs fermés
- **Mise à jour dynamique** : Les cartes et listes se mettent à jour automatiquement selon la plage de dates sélectionnée

## 🎨 Composants Principaux

### Composants de Layout

- **`DashboardLayout`** : Layout principal avec sidebar et header
- **`AppSidebar`** : Barre latérale de navigation avec :
  - Menu déroulant pour les expéditions (Courrier, Colis)
  - Lien vers la gestion des véhicules
  - Affichage conditionnel basé sur les permissions
  - Basculement de langue
  - Informations utilisateur

### Composants d'Expéditions

- **`ShipmentStatusBadge`** : Badge coloré pour les statuts
- **`ShipmentStats`** : Composant de statistiques avec cartes
  - Masque les revenus pour les utilisateurs STAFF
  - **Filtrage par date** : Accepte les props `dateFrom` et `dateTo` pour filtrer les statistiques
  - Affiche uniquement les cartes principales (Total, Revenu, Poids, Aujourd'hui)
  - Affiche la répartition par nature uniquement sur la page générale (pas sur les pages dédiées)

### Composants de Départs

- **`DepartureStatusBadge`** : Badge coloré pour les statuts de départ

### Composants de Dépenses

- **`ExpenseStats`** : Composant de statistiques avec cartes
  - Masque les montants pour les utilisateurs STAFF
  - Affiche les statistiques adaptées selon le rôle
  - **Filtrage par date** : Accepte les props `dateFrom` et `dateTo` pour filtrer les statistiques

### Composants Utilitaires

- **`DateRangePicker`** : Composant réutilisable pour la sélection de plage de dates
  - **Presets** : Aujourd'hui, Hier, Cette semaine, Semaine dernière, Ce mois, Mois dernier, Cette année, Année dernière, Personnalisé
  - **Mode personnalisé** : Sélection via calendrier avec plage de dates
  - **Auto-détection** : Détecte automatiquement le preset correspondant à la plage sélectionnée
  - **Internationalisé** : Support FR/EN avec formatage de dates adapté
  - **Utilisé sur** : Dashboard, Expéditions, Dépenses, Répartitions

## 🔧 Services API

### `shipment.service.ts`
- `list()` : Liste des expéditions avec filtres
- `getOne()` : Détails d'une expédition
- `create()` : Création d'expédition
- `update()` : Mise à jour d'expédition
- `cancel()` : Annulation d'expédition
- `downloadWaybill()` : Téléchargement du bordereau PDF
- `downloadReceipt()` : Téléchargement du reçu PDF (format ticket)
- `getStatistics()` : Statistiques des expéditions

### `departure.service.ts`
- `list()` : Liste des départs
- `getOne()` : Détails d'un départ
- `create()` : Création de départ
- `update()` : Mise à jour de départ
- `assignShipments()` : Assignation d'expéditions
- `removeShipment()` : Retrait d'expédition
- `seal()` : Scellement du départ
- `close()` : Fermeture du départ
- `downloadGeneralWaybill()` : Téléchargement du bordereau général
- `downloadAllWaybills()` : Téléchargement de tous les bordereaux individuels

### `vehicle.service.ts`
- `list()` : Liste des véhicules avec filtres
- `getAvailable()` : Liste des véhicules ACTIF (pour sélection)
- `getOne()` : Détails d'un véhicule
- `create()` : Création de véhicule
- `update()` : Mise à jour de véhicule
- `delete()` : Suppression de véhicule

### `driver.service.ts`
- `list()` : Liste des chauffeurs avec filtres
- `getAvailable()` : Liste des chauffeurs ACTIF (pour sélection)
- `getOne()` : Détails d'un chauffeur
- `create()` : Création de chauffeur
- `update()` : Mise à jour de chauffeur
- `delete()` : Suppression de chauffeur

### `expense.service.ts`
- `list()` : Liste des dépenses avec filtres
- `getOne()` : Détails d'une dépense
- `create()` : Création de dépense
- `update()` : Mise à jour de dépense
- `delete()` : Suppression de dépense
- `getStatistics()` : Statistiques des dépenses (filtres: dateFrom, dateTo)

### `distribution.service.ts`
- `getDriverDistributions()` : Liste des répartitions par chauffeur (filtres: dateFrom, dateTo, driverId)
- `getMinistryDistribution()` : Répartition ministère (filtres: dateFrom, dateTo)
- `getAgencyDistribution()` : Répartition agence (filtres: dateFrom, dateTo)
- `getDistributionSummary()` : Résumé général des répartitions (filtres: dateFrom, dateTo)

### `user.service.ts`
- `list()` : Liste des utilisateurs
- `getOne()` : Détails d'un utilisateur
- `create()` : Création d'utilisateur
- `update()` : Mise à jour d'utilisateur
- `delete()` : Suppression d'utilisateur

### `auth.service.ts`
- `login()` : Connexion
- `logout()` : Déconnexion

## 🪝 Hooks Personnalisés

### `use-shipments.ts`
- `useShipments()` : Liste des expéditions
- `useShipment()` : Détails d'une expédition
- `useCreateShipment()` : Création d'expédition
- `useUpdateShipment()` : Mise à jour d'expédition
- `useCancelShipment()` : Annulation d'expédition
- `useGenerateReceipt()` : Génération et téléchargement de reçu PDF
- `useShipmentStatistics()` : Statistiques des expéditions (filtres: nature, dateFrom, dateTo)

### `use-departures.ts`
- `useDepartures()` : Liste des départs
- `useDeparture()` : Détails d'un départ
- `useCreateDeparture()` : Création de départ
- `useUpdateDeparture()` : Mise à jour de départ
- `useAssignShipments()` : Assignation d'expéditions
- `useSealDeparture()` : Scellement de départ
- `useCloseDeparture()` : Fermeture de départ

### `use-vehicles.ts`
- `useVehicles()` : Liste des véhicules
- `useVehicle()` : Détails d'un véhicule
- `useAvailableVehicles()` : Liste des véhicules ACTIF
- `useCreateVehicle()` : Création de véhicule
- `useUpdateVehicle()` : Mise à jour de véhicule
- `useDeleteVehicle()` : Suppression de véhicule

### `use-drivers.ts`
- `useDrivers()` : Liste des chauffeurs
- `useDriver()` : Détails d'un chauffeur
- `useAvailableDrivers()` : Liste des chauffeurs ACTIF
- `useCreateDriver()` : Création de chauffeur
- `useUpdateDriver()` : Mise à jour de chauffeur
- `useDeleteDriver()` : Suppression de chauffeur

### `use-expenses.ts`
- `useExpenses()` : Liste des dépenses
- `useExpense()` : Détails d'une dépense
- `useCreateExpense()` : Création de dépense
- `useUpdateExpense()` : Mise à jour de dépense
- `useDeleteExpense()` : Suppression de dépense
- `useExpenseStatistics()` : Statistiques des dépenses (filtres: dateFrom, dateTo)

### `use-distributions.ts`
- `useDriverDistributions()` : Liste des répartitions par chauffeur (filtres: dateFrom, dateTo, driverId)
- `useMinistryDistribution()` : Répartition ministère (filtres: dateFrom, dateTo)
- `useAgencyDistribution()` : Répartition agence (filtres: dateFrom, dateTo)
- `useDistributionSummary()` : Résumé général des répartitions (filtres: dateFrom, dateTo)

### `use-users.ts`
- `useUsers()` : Liste des utilisateurs
- `useUser()` : Détails d'un utilisateur
- `useCreateUser()` : Création d'utilisateur
- `useUpdateUser()` : Mise à jour d'utilisateur
- `useDeleteUser()` : Suppression d'utilisateur

## 📱 Contextes

### `AuthContext.tsx`
- Gestion de l'authentification
- Stockage du token JWT
- Vérification des permissions
- Informations utilisateur

### `LanguageContext.tsx`
- Gestion de la langue (FR/EN)
- Traductions
- Persistance dans localStorage

## 🚀 Installation et Démarrage

### Prérequis

- Node.js 18+ et npm

### Installation

```bash
# Installer les dépendances
npm install
```

### Développement

```bash
# Démarrer le serveur de développement
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

### Build de Production

```bash
# Créer un build de production
npm run build

# Prévisualiser le build
npm run preview
```

## ⚙️ Configuration

### Variables d'Environnement

Créer un fichier `.env` à la racine du frontend :

```env
VITE_API_URL=http://localhost:3000/api
```

### Configuration de l'API

L'URL de l'API est configurée dans `src/services/http-service.ts` et utilise la variable d'environnement `VITE_API_URL`.

## 🔒 Sécurité

- **Tokens JWT** stockés dans localStorage
- **Intercepteurs HTTP** pour ajouter automatiquement le token aux requêtes
- **Gestion des erreurs** d'authentification (redirection vers login)
- **Masquage des données sensibles** selon les rôles (ex: prix pour STAFF)

## 📝 Notes Importantes

- Les utilisateurs **STAFF** :
  - Ne peuvent pas voir les montants (prix) des expéditions
  - Ne voient que **leurs propres dépenses** (filtrage automatique côté backend)
  - Ne peuvent pas voir les montants des dépenses (affichés comme "-")
  - Ne peuvent pas modifier ou supprimer les dépenses
  - Peuvent créer et modifier des véhicules et des chauffeurs, mais ne peuvent pas les supprimer
- Les **SUPERVISOR** ne peuvent pas créer, modifier ou supprimer les comptes **ADMIN**
- Les expéditions sont créées avec le statut **CONFIRMED** par défaut
- Les expéditions ont maintenant un **type** (Express ou Standard) en plus de la nature (Colis/Courrier)
- Les statistiques sont filtrées selon la nature si on est sur `/shipments/colis` ou `/shipments/courrier`
- Toutes les statistiques (Dashboard, Expéditions, Dépenses, Répartitions) sont liées au sélecteur de plage de dates
- Le composant **DateRangePicker** est disponible sur toutes les pages nécessaires avec des presets et une sélection personnalisée
- Les bordereaux et reçus PDF sont générés côté backend et téléchargés via le frontend
- Les reçus sont au format ticket (80mm) pour impression sur imprimantes thermiques
- Les dépenses utilisent la date de création comme date de dépense
- 13 catégories de dépenses sont disponibles via dropdown dans le formulaire de création

## 🛠️ Scripts Disponibles

- `npm run dev` : Démarre le serveur de développement
- `npm run build` : Crée un build de production
- `npm run preview` : Prévisualise le build de production
- `npm run lint` : Exécute le linter (si configuré)

## 📚 Documentation Additionnelle

Pour plus d'informations sur les technologies utilisées :

- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Vite Documentation](https://vitejs.dev/)
- [React Router Documentation](https://reactrouter.com/)
- [TanStack Query Documentation](https://tanstack.com/query)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
