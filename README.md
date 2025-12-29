# Transcam Messagerie

Système de gestion de messagerie et d'expéditions pour Transcam, permettant la gestion complète du cycle de vie des expéditions, des départs de véhicules et la génération de bordereaux officiels.

## 📋 Table des Matières

- [Vue d'ensemble](#vue-densemble)
- [Architecture](#architecture)
- [Fonctionnalités](#fonctionnalités)
- [Technologies](#technologies)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [Structure du Projet](#structure-du-projet)
- [Documentation](#documentation)

## 🎯 Vue d'ensemble

Transcam Messagerie est une application web complète pour la gestion des expéditions de messagerie. Le système permet de :

- Gérer les expéditions (colis et courrier) avec suivi complet
- Organiser les départs de véhicules
- Assigner des expéditions aux départs
- Gérer les dépenses avec suivi complet et statistiques
- Générer des bordereaux individuels et généraux en PDF
- Suivre les statistiques et les performances
- Gérer les utilisateurs avec contrôle d'accès basé sur les rôles

## 🏗️ Architecture

Le projet est divisé en deux parties principales :

### Backend (API REST)
- **Technologie** : Node.js + Express + TypeScript
- **Base de données** : PostgreSQL avec TypeORM
- **Authentification** : JWT
- **Génération PDF** : PDFKit

### Frontend (Application Web)
- **Technologie** : React + TypeScript + Vite
- **UI** : shadcn/ui + Tailwind CSS
- **State Management** : React Query
- **Routing** : React Router

## ✨ Fonctionnalités Principales

### 📦 Gestion des Expéditions

#### Création et Modification
- **Création d'expéditions** avec formulaire complet et validation
- **Modification d'expéditions** confirmées (selon permissions)
- **Annulation d'expéditions** avec raison obligatoire
- **Statut automatique** : Les expéditions sont créées avec le statut `CONFIRMED` par défaut
- **Génération automatique** de numéros de bordereau séquentiels (`TC-YYYY-NNNN`)

#### Classification et Filtrage
- **Nature des expéditions** : Colis ou Courrier (sélection via dropdown)
- **Statuts** : Pending, Confirmed, Assigned, Cancelled
- **Filtrage avancé** :
  - Par statut (pending, confirmed, assigned, cancelled)
  - Par route (Yaoundé → Douala, Douala → Yaoundé, etc.)
  - Par nature (colis, courrier)
  - Par date (date de création)
  - Par numéro de bordereau (recherche)
- **Pages dédiées** : `/shipments/colis` et `/shipments/courrier` pour filtrer par nature
- **Pagination** : Navigation par pages avec limite configurable

#### Documents et PDF
- **Bordereaux individuels PDF** : Document officiel avec toutes les informations de l'expédition
- **Reçus clients PDF** : Format ticket (80mm) pour impression thermique
  - En-tête de l'entreprise
  - Numéro de reçu (numéro de bordereau)
  - Informations expéditeur et destinataire
  - Détails complets (trajet, nature, poids, valeur déclarée, montant)
  - Date de départ
  - Conditions générales
- **Téléchargement** : Boutons "Imprimer Reçu" dans les listes et pages de détail

#### Statistiques
- **Statistiques globales** :
  - Total d'expéditions
  - Revenu total (masqué pour STAFF)
  - Poids total
  - Expéditions aujourd'hui
  - Expéditions ce mois
  - Revenus du mois (masqué pour STAFF)
- **Répartition** :
  - Par statut (pending, confirmed, assigned, cancelled)
  - Par nature (colis, courrier) - affiché uniquement si non filtré
- **Filtrage par nature** : Les statistiques s'adaptent selon la page (colis/courrier/tous)

### 🚌 Gestion des Départs

#### Création et Gestion
- **Création de départs** avec sélection de route, véhicule et chauffeur
- **Modification de départs** ouverts (avant scellement)
- **Statuts** : Open, Sealed, Closed
- **Un véhicule peut avoir plusieurs départs** (pas de restriction)

#### Assignation d'Expéditions
- **Assignation multiple** : Sélection et assignation de plusieurs expéditions à un départ
- **Retrait d'expéditions** : Possibilité de retirer des expéditions d'un départ ouvert
- **Validation** : Vérification que les expéditions ne sont pas déjà assignées à un autre départ scellé

#### Scellement et Fermeture
- **Scellement de départ** :
  - Génération automatique du numéro de bordereau général (`BG-YYYY-NNNN`)
  - Génération du PDF du bordereau général
  - Blocage des modifications (statut passe à "sealed")
  - Enregistrement de la date de scellement
- **Fermeture de départ** : Finalisation du départ (statut passe à "closed")
- **Permissions** : 
  - **STAFF** : Peut créer, sceller, imprimer et fermer les départs, mais ne voit pas les montants
  - **ADMIN/SUPERVISOR** : Accès complet avec visualisation des montants

#### Documents et PDF
- **Bordereau général PDF** :
  - En-tête officiel de l'entreprise
  - Informations du départ (bureau de départ, bureau destinataire, véhicule, chauffeur, date, heure)
  - Tableau détaillé des expéditions (numéro, expéditeur, destinataire, description, poids)
  - Totaux (nombre de colis, poids total, montant total)
  - Zones de signatures
  - Régénération à chaque téléchargement pour refléter les modifications

### 💰 Gestion des Dépenses

#### Création et Gestion
- **Création de dépenses** avec description, montant et catégorie
- **13 catégories** disponibles : Dépense du boss, Carburant, Maintenance, Fournitures de bureau, Loyer, Salaires, Communication, Assurance, Réparations, Charges, Impôts/Taxes, Marketing, Autre
- **Date automatique** : La date de dépense correspond à la date de création
- **Modification de dépenses** (seulement pour non-STAFF)
- **Suppression de dépenses** (seulement pour ADMIN/SUPERVISOR)

#### Filtrage et Recherche
- **Filtrage par catégorie** : Sélection d'une catégorie spécifique
- **Filtrage par date** : Plage de dates (date de début et date de fin)
- **Pagination** : Navigation par pages avec limite configurable
- **Tri** : Tri par date de création (plus récent en premier)

#### Contrôle d'Accès par Rôle
- **STAFF** :
  - Peut créer des dépenses
  - **Voit uniquement ses propres dépenses** (filtrage automatique)
  - **Montants masqués** (affichés comme "-" ou "N/A")
  - Ne peut pas modifier ou supprimer les dépenses
- **Autres rôles** (ADMIN, SUPERVISOR, OPERATIONAL_ACCOUNTANT) :
  - Peuvent créer des dépenses
  - Voient **toutes les dépenses** de tous les utilisateurs
  - Voient les montants complets
  - Peuvent modifier et supprimer (selon permissions)

#### Statistiques
- **Statistiques globales** :
  - Total de dépenses (nombre)
  - Montant total (masqué pour STAFF)
  - Dépenses aujourd'hui
  - Dépenses ce mois
  - Montant du mois (masqué pour STAFF)
  - Montant moyen (masqué pour STAFF)
- **Répartition par catégorie** : Montant par catégorie (masqué pour STAFF)
- **Filtrage par date** : Statistiques sur une plage de dates

#### Audit et Traçabilité
- **Historique complet** : Enregistrement de toutes les actions (création, modification, suppression)
- **Traçabilité** : Suivi de qui a créé/modifié chaque dépense
- **Date de création** : Utilisée comme date de dépense pour les rapports financiers

### 👥 Gestion des Utilisateurs

#### Système de Rôles
- **ADMIN** : Toutes les permissions, accès complet à toutes les fonctionnalités
- **SUPERVISOR** : 
  - Gestion des utilisateurs (sauf ADMIN)
  - Gestion des expéditions et départs
  - Scellement et fermeture de départs
  - Visualisation des montants
- **STAFF** : 
  - Création et visualisation d'expéditions
  - **Masquage des montants** (prix et valeur déclarée)
  - Pas d'accès aux statistiques financières
- **OPERATIONAL_ACCOUNTANT** : Permissions spécifiques (à définir selon les besoins)

#### Contrôle d'Accès
- **Restrictions pour SUPERVISOR** :
  - Ne peut pas créer des comptes ADMIN
  - Ne peut pas modifier les comptes ADMIN
  - Ne peut pas supprimer les comptes ADMIN
  - Ne peut pas assigner le rôle ADMIN
  - Ne voit pas les comptes ADMIN dans la liste
- **Restrictions pour STAFF** :
  - Ne peut pas voir les montants (prix, valeur déclarée) dans les listes, détails et statistiques
  - Les revenus sont masqués dans les statistiques
- **Auto-protection** : Les utilisateurs ne peuvent pas supprimer leur propre compte

#### CRUD Utilisateurs
- **Création** : Formulaire avec username, password, role
- **Modification** : Mise à jour des informations utilisateur
- **Suppression** : Suppression avec vérifications de sécurité
- **Liste** : Affichage de tous les utilisateurs avec filtrage selon le rôle

### 🔐 Sécurité et Authentification

#### Authentification
- **JWT (JSON Web Tokens)** : Tokens sécurisés avec expiration (1h)
- **Hachage de mots de passe** : bcrypt avec 10 rounds
- **Middleware d'authentification** : Vérification du token sur toutes les routes protégées
- **Gestion de session** : Stockage du token dans localStorage (frontend)

#### Autorisation
- **Contrôle d'accès basé sur les permissions** (RBAC)
- **Middleware d'autorisation** : Vérification des permissions spécifiques pour chaque action
- **Permissions granulaires** :
  - `view_dashboard`, `view_shipments`, `create_shipment`, `edit_shipment`, `delete_shipment`
  - `view_departures`, `create_departure`, `validate_departure`
  - `print_waybill`, `print_receipt`
  - `create_expense`, `view_expenses`, `view_expense_amount`, `edit_expense`, `delete_expense`
  - `manage_users`, `view_finance`, `view_distribution`, `view_reports`, `export_data`

#### Masquage de Données
- **Données sensibles** : Les prix sont masqués pour les utilisateurs STAFF
- **Filtrage automatique** : Les réponses API sont filtrées selon le rôle de l'utilisateur
- **Interface adaptative** : Les colonnes et champs sont masqués dans l'interface selon les permissions

#### Audit et Traçabilité
- **Audit logging** : Enregistrement de toutes les actions importantes
- **Historique complet** : Traçabilité des modifications sur les expéditions et départs
- **Informations d'audit** : Qui, quand, quoi, pourquoi (raison pour les annulations)

### 🌐 Internationalisation

- **Support multilingue** : Français (FR) et Anglais (EN)
- **Basculement de langue** : Changement en temps réel sans rechargement
- **Traductions complètes** : Toute l'interface utilisateur est traduite
- **Persistance** : La langue choisie est sauvegardée dans localStorage
- **Traductions dynamiques** : Utilisation du hook `useLanguage()` dans tous les composants

### 📊 Dashboard et Statistiques

#### Dashboard Principal
- **Statistiques en temps réel** :
  - Expéditions aujourd'hui
  - Expéditions ce mois
  - Revenu total (masqué pour STAFF)
  - Total des départs
- **Tableau des expéditions récentes** : 20 dernières expéditions avec actions rapides
- **Navigation rapide** : Liens vers les différentes sections

#### Statistiques par Nature
- **Page Colis** (`/shipments/colis`) : Statistiques et liste filtrée pour les colis uniquement
- **Page Courrier** (`/shipments/courrier`) : Statistiques et liste filtrée pour le courrier uniquement
- **Page Tous** (`/shipments`) : Statistiques globales avec répartition par nature

### 📄 Génération de Documents PDF

#### Bordereaux Individuels
- **Format** : PDF standard A4
- **Contenu** : Informations complètes de l'expédition
- **Génération** : À la volée (pas de stockage)
- **Téléchargement** : Via bouton "Imprimer Bordereau" (si permission `print_waybill`)

#### Bordereaux Généraux
- **Format** : PDF standard A4
- **Génération** : Uniquement lors du scellement d'un départ
- **Contenu** :
  - En-tête officiel de l'entreprise
  - Informations du départ (bureau, véhicule, chauffeur, date, heure)
  - Tableau détaillé des expéditions
  - Totaux et signatures
- **Régénération** : Le PDF est régénéré à chaque téléchargement pour refléter les modifications
- **Stockage** : Chemin sauvegardé dans la base de données

#### Reçus Clients
- **Format** : Ticket 80mm (226.77 points de largeur)
- **Optimisation** : Pour impression sur imprimantes thermiques
- **Contenu** :
  - En-tête "TRANSCAM COLIS ET COURRIER"
  - Placeholder pour logo (à venir)
  - Informations de l'entreprise (siège social, téléphone, N° contribuable)
  - Numéro de reçu (numéro de bordereau)
  - Informations expéditeur et destinataire
  - Détails de l'expédition (trajet, nature, poids, valeur déclarée, montant)
  - Date de départ (sans heure)
  - Conditions générales
  - Message de remerciement
- **Génération** : À la volée (pas de stockage)
- **Téléchargement** : Via bouton "Imprimer Reçu" (si permission `print_receipt`)

### 🎨 Interface Utilisateur

#### Design et UX
- **Framework UI** : shadcn/ui avec Tailwind CSS
- **Design moderne** : Interface claire et professionnelle
- **Responsive** : Adaptation à tous les écrans (mobile, tablette, desktop)
- **Icônes** : Lucide React pour une cohérence visuelle

#### Navigation
- **Sidebar** : Navigation principale avec menu déroulant pour les expéditions
- **Breadcrumbs** : Indication du chemin de navigation
- **Actions rapides** : Boutons d'action contextuels selon les permissions

#### Composants Réutilisables
- **Badges de statut** : Indicateurs visuels colorés pour les statuts
- **Cartes de statistiques** : Affichage des métriques avec icônes
- **Tableaux** : Affichage paginé avec actions
- **Formulaires** : Validation en temps réel avec React Hook Form et Zod
- **Dialogs** : Modales pour les actions importantes (confirmation, assignation, etc.)

## 🛠️ Technologies

### Backend
- Node.js 18+
- Express.js
- TypeScript
- TypeORM
- PostgreSQL
- JWT
- bcrypt
- PDFKit
- dotenv

### Frontend
- React 18
- TypeScript
- Vite
- React Router
- React Query (TanStack Query)
- shadcn/ui
- Tailwind CSS
- Zod
- React Hook Form
- Lucide React

## 📦 Installation

### Prérequis

- Node.js 18+ et npm
- PostgreSQL 12+
- Git

### Installation Complète

```bash
# 1. Cloner le repository
git clone <repository-url>
cd transcamMessagerie-

# 2. Installer les dépendances du backend
cd backend
npm install

# 3. Installer les dépendances du frontend
cd ../frontend
npm install
```

## ⚙️ Configuration

### Backend

Créer un fichier `.env` dans `backend/` :

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=transcam_messagerie

# JWT
JWT_SECRET=your_secret_key_here

# Server
PORT=3000
NODE_ENV=development
```

### Frontend

Créer un fichier `.env` dans `frontend/` :

```env
VITE_API_URL=http://localhost:3000/api
```

### Base de Données

```bash
# Depuis le dossier backend
cd backend

# Exécuter les migrations
npm run migration:run

# (Optionnel) Insérer des données de test
npm run seed:shipments
npm run seed:expenses
```

## 🚀 Utilisation

### Développement

#### Démarrer le Backend

```bash
cd backend
npm run dev
```

Le serveur API sera accessible sur `http://localhost:3000`

#### Démarrer le Frontend

```bash
cd frontend
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

### Production

#### Build Backend

```bash
cd backend
npm run build
npm start
```

#### Build Frontend

```bash
cd frontend
npm run build
npm run preview
```

## 📁 Structure du Projet

```
transcamMessagerie-/
├── backend/                 # API REST Backend
│   ├── src/
│   │   ├── controllers/    # Contrôleurs HTTP
│   │   ├── entities/       # Modèles de données
│   │   ├── services/       # Logique métier
│   │   ├── routes/         # Routes API
│   │   ├── middlewares/    # Middlewares Express
│   │   ├── migrations/     # Migrations DB
│   │   └── server.ts       # Point d'entrée
│   ├── scripts/            # Scripts utilitaires
│   └── README.md           # Documentation backend
│
├── frontend/               # Application Web Frontend
│   ├── src/
│   │   ├── components/    # Composants React
│   │   ├── pages/         # Pages de l'application
│   │   ├── services/      # Services API
│   │   ├── hooks/         # Hooks React
│   │   ├── contexts/      # Contextes React
│   │   └── App.tsx        # Point d'entrée
│   └── README.md          # Documentation frontend
│
└── README.md              # Ce fichier
```

## 📚 Documentation

### Documentation Détaillée

- **[Frontend README](frontend/README.md)** : Documentation complète du frontend
  - Structure du projet
  - Composants et pages
  - Services et hooks
  - Guide d'installation et d'utilisation

- **[Backend README](backend/README.md)** : Documentation complète du backend
  - Architecture API
  - Endpoints disponibles
  - Services et entités
  - Guide d'installation et de configuration

### API Endpoints

#### Authentification
- `POST /api/users/login` : Connexion

#### Expéditions
- `GET /api/shipments` : Liste des expéditions
- `GET /api/shipments/:id` : Détails d'une expédition
- `POST /api/shipments` : Créer une expédition
- `PATCH /api/shipments/:id` : Modifier une expédition
- `DELETE /api/shipments/:id` : Annuler une expédition
- `GET /api/shipments/:id/waybill` : Télécharger le bordereau PDF
- `GET /api/shipments/:id/receipt` : Télécharger le reçu PDF (format ticket)
- `GET /api/shipments/statistics` : Statistiques des expéditions

#### Départs
- `GET /api/departures` : Liste des départs
- `GET /api/departures/:id` : Détails d'un départ
- `POST /api/departures` : Créer un départ
- `PATCH /api/departures/:id` : Modifier un départ
- `POST /api/departures/:id/assign` : Assigner des expéditions
- `POST /api/departures/:id/seal` : Sceller un départ
- `POST /api/departures/:id/close` : Fermer un départ
- `GET /api/departures/:id/general-waybill` : Télécharger le bordereau général

#### Dépenses
- `GET /api/expenses` : Liste des dépenses
- `GET /api/expenses/:id` : Détails d'une dépense
- `POST /api/expenses` : Créer une dépense
- `PATCH /api/expenses/:id` : Modifier une dépense
- `DELETE /api/expenses/:id` : Supprimer une dépense
- `GET /api/expenses/statistics` : Statistiques des dépenses

#### Utilisateurs
- `GET /api/users` : Liste des utilisateurs
- `GET /api/users/:id` : Détails d'un utilisateur
- `POST /api/users` : Créer un utilisateur
- `PATCH /api/users/:id` : Modifier un utilisateur
- `DELETE /api/users/:id` : Supprimer un utilisateur

## 🔒 Sécurité et Permissions

### Rôles et Permissions

Le système utilise un contrôle d'accès basé sur les rôles (RBAC) :

- **ADMIN** : Accès complet à toutes les fonctionnalités
- **SUPERVISOR** : Gestion des utilisateurs (sauf ADMIN), gestion des expéditions, départs et dépenses
- **STAFF** : 
  - Création et visualisation d'expéditions (les montants sont masqués)
  - Création de dépenses et visualisation de **ses propres dépenses uniquement** (montants masqués)
- **OPERATIONAL_ACCOUNTANT** : Visualisation et gestion des dépenses, visualisation des expéditions

### Restrictions Spécifiques

- Les utilisateurs **STAFF** :
  - Ne peuvent pas voir les montants (prix) des expéditions
  - Ne voient que **leurs propres dépenses** (filtrage automatique)
  - Ne peuvent pas voir les montants des dépenses (masqués)
  - Ne peuvent pas modifier ou supprimer les dépenses
  - Peuvent créer, sceller, imprimer et fermer les départs, mais ne voient pas les montants dans les listes et détails
  - Peuvent créer, sceller, imprimer et fermer les départs, mais ne voient pas les montants dans les listes et détails
- Les **SUPERVISOR** ne peuvent pas créer, modifier ou supprimer les comptes **ADMIN**
- Les utilisateurs ne peuvent pas supprimer leur propre compte

## 📊 Fonctionnalités Avancées

### Génération de PDF

- **Bordereaux individuels** : Un PDF par expédition avec toutes les informations
- **Bordereaux généraux** : Un PDF par départ avec toutes les expéditions assignées
- **Reçus clients** : Format ticket (80mm) pour les clients avec toutes les informations de l'expédition
- **Format officiel** : Conforme aux standards de transport au Cameroun
- **Régénération** : Les PDF sont régénérés à chaque téléchargement pour refléter les modifications

### Statistiques

- Statistiques globales et filtrées par nature (colis/courrier)
- Répartition par statut et par nature
- Statistiques du jour et du mois
- Revenus et poids totaux

### Audit et Traçabilité

- Enregistrement de toutes les actions importantes
- Historique complet des modifications
- Traçabilité des utilisateurs et des actions

## 🛠️ Scripts Utilitaires

### Backend

```bash
# Développement
npm run dev

# Build
npm run build

# Production
npm start

# Migrations
npm run migration:run
npm run migration:generate
npm run migration:revert

# Seed
npm run seed:shipments
npm run seed:expenses
```

### Frontend

```bash
# Développement
npm run dev

# Build
npm run build

# Preview
npm run preview
```

## 📝 Notes Importantes

- Les expéditions sont créées avec le statut **CONFIRMED** par défaut
- Les numéros de bordereau sont générés automatiquement et de manière séquentielle
- Les bordereaux généraux ne peuvent être générés qu'après le scellement d'un départ
- Les PDF sont stockés localement dans `/storage/waybills/`
- Les statistiques sont calculées en temps réel
- Les dépenses sont tracées pour les rapports financiers
- Les utilisateurs **STAFF** ne voient que leurs propres dépenses
- La date de dépense correspond automatiquement à la date de création

## 🤝 Contribution

Pour contribuer au projet :

1. Créer une branche pour votre fonctionnalité
2. Développer et tester vos modifications
3. S'assurer que les tests passent
4. Créer une pull request

## 📄 Licence

[À définir selon les besoins du projet]

## 👥 Équipe

[À compléter avec les informations de l'équipe]

## 📞 Support

Pour toute question ou problème, veuillez contacter l'équipe de développement.

---

**Dernière mise à jour** : Janvier 2025
