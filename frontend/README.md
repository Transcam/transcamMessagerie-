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
   - Actions : Voir, Modifier, Imprimer bordereau, Annuler
   - **Filtrage par nature** : `/shipments/colis` et `/shipments/courrier`

2. **Détails d'Expédition** (`/shipments/:id`)
   - Informations complètes de l'expédition
   - Historique et audit trail
   - Actions : Modifier, Imprimer bordereau, Annuler

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

3. **Création de Départ** (`/departures/new`)
   - Formulaire de création
   - Sélection de route, véhicule, chauffeur

#### Fonctionnalités

- **Statuts** : Open, Sealed, Closed
- **Assignation d'expéditions** à un départ
- **Scellement** : Génération du numéro de bordereau général (BG-YYYY-NNNN)
- **Génération de bordereau général PDF** avec toutes les expéditions
- **Téléchargement de bordereaux individuels** pour toutes les expéditions

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
  - Affichage conditionnel basé sur les permissions
  - Basculement de langue
  - Informations utilisateur

### Composants d'Expéditions

- **`ShipmentStatusBadge`** : Badge coloré pour les statuts
- **`ShipmentStats`** : Composant de statistiques avec cartes et graphiques
  - Masque les revenus pour les utilisateurs STAFF

### Composants de Départs

- **`DepartureStatusBadge`** : Badge coloré pour les statuts de départ

## 🔧 Services API

### `shipment.service.ts`
- `list()` : Liste des expéditions avec filtres
- `getOne()` : Détails d'une expédition
- `create()` : Création d'expédition
- `update()` : Mise à jour d'expédition
- `cancel()` : Annulation d'expédition
- `downloadWaybill()` : Téléchargement du bordereau PDF
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
- `useShipmentStatistics()` : Statistiques des expéditions

### `use-departures.ts`
- `useDepartures()` : Liste des départs
- `useDeparture()` : Détails d'un départ
- `useCreateDeparture()` : Création de départ
- `useUpdateDeparture()` : Mise à jour de départ
- `useAssignShipments()` : Assignation d'expéditions
- `useSealDeparture()` : Scellement de départ
- `useCloseDeparture()` : Fermeture de départ

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

- Les utilisateurs **STAFF** ne peuvent pas voir les montants (prix) des expéditions
- Les **SUPERVISOR** ne peuvent pas créer, modifier ou supprimer les comptes **ADMIN**
- Les expéditions sont créées avec le statut **CONFIRMED** par défaut
- Les statistiques sont filtrées selon la nature si on est sur `/shipments/colis` ou `/shipments/courrier`
- Les bordereaux PDF sont générés côté backend et téléchargés via le frontend

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
