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
- **Statuts** : Pending, Confirmed, Assigned, Cancelled
- **Génération de bordereaux PDF** individuels
- **Génération de reçus PDF** en format ticket (80mm) pour les clients
- **Statistiques** :
  - Total d'expéditions
  - Revenu total (masqué pour STAFF)
  - Poids total
  - Statistiques du jour et du mois
  - Répartition par statut
  - Répartition par nature (si non filtré)

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
   - Filtrage par catégorie et date (plage de dates)
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
  - Expéditions aujourd'hui
  - Expéditions ce mois
  - Revenu total (masqué pour STAFF)
  - Total des départs
- **Tableau des expéditions récentes**
- **Navigation rapide** vers les différentes sections

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
- **`ShipmentStats`** : Composant de statistiques avec cartes et graphiques
  - Masque les revenus pour les utilisateurs STAFF

### Composants de Départs

- **`DepartureStatusBadge`** : Badge coloré pour les statuts de départ

### Composants de Dépenses

- **`ExpenseStats`** : Composant de statistiques avec cartes
  - Masque les montants pour les utilisateurs STAFF
  - Affiche les statistiques adaptées selon le rôle

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

### `expense.service.ts`
- `list()` : Liste des dépenses avec filtres
- `getOne()` : Détails d'une dépense
- `create()` : Création de dépense
- `update()` : Mise à jour de dépense
- `delete()` : Suppression de dépense
- `getStatistics()` : Statistiques des dépenses

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
- `useShipmentStatistics()` : Statistiques des expéditions

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

### `use-expenses.ts`
- `useExpenses()` : Liste des dépenses
- `useExpense()` : Détails d'une dépense
- `useCreateExpense()` : Création de dépense
- `useUpdateExpense()` : Mise à jour de dépense
- `useDeleteExpense()` : Suppression de dépense
- `useExpenseStatistics()` : Statistiques des dépenses

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
- Les **SUPERVISOR** ne peuvent pas créer, modifier ou supprimer les comptes **ADMIN**
- Les expéditions sont créées avec le statut **CONFIRMED** par défaut
- Les statistiques sont filtrées selon la nature si on est sur `/shipments/colis` ou `/shipments/courrier`
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
