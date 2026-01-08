# Transcam Messagerie

Système de gestion de messagerie et d'envois pour Transcam, permettant la gestion complète du cycle de vie des envois, des départs de véhicules et la génération de bordereaux officiels.

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

Transcam Messagerie est une application web complète pour la gestion des envois de messagerie. Le système permet de :

- Gérer les envois (colis et courrier) avec suivi complet
- Organiser les départs de véhicules
- Gérer la flotte de véhicules (création, modification, suivi)
- Gérer l'équipe de chauffeurs (création, modification, suivi)
- Assigner des envois aux départs
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

### 📦 Gestion des Envois

#### Création et Modification
- **Création d'envois** avec formulaire complet et validation
- **Modification d'envois** confirmés (selon permissions)
- **Annulation d'envois** avec raison obligatoire
- **Statut automatique** : Les envois sont créés avec le statut `CONFIRMED` par défaut
- **Génération automatique** de numéros de bordereau séquentiels (`TC-YYYY-NNNN`)

#### Classification et Filtrage
- **Nature des envois** : Colis ou Courrier (sélection via dropdown)
- **Type d'envois** : Express ou Standard (sélection via dropdown)
- **Statuts** : Pending, Confirmed, Assigned, Cancelled
- **Filtrage avancé** :
  - Par statut (pending, confirmed, assigned, cancelled)
  - Par route (Yaoundé → Douala, Douala → Yaoundé, etc.)
  - Par nature (colis, courrier)
  - Par date (sélecteur de plage de dates avec presets)
  - Par numéro de bordereau (recherche)
- **Pages dédiées** : `/shipments/colis` et `/shipments/courrier` pour filtrer par nature
- **Pagination** : Navigation par pages avec limite configurable

#### Documents et PDF
- **Bordereaux individuels PDF** : Document officiel avec toutes les informations de l'envoi
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
  - Total d'envois
  - Revenu total (masqué pour STAFF)
  - Poids total
  - Envois aujourd'hui
- **Filtrage par date** : Toutes les statistiques sont liées au sélecteur de plage de dates
- **Répartition** :
  - Par nature (colis, courrier) - affiché uniquement sur la page générale (pas sur les pages dédiées)
- **Filtrage par nature** : Les statistiques s'adaptent selon la page (colis/courrier/tous)

### 🚌 Gestion des Départs

#### Création et Gestion
- **Création de départs** avec sélection de route, véhicule (dropdown) et chauffeur (dropdown)
- **Modification de départs** ouverts (avant scellement)
- **Statuts** : Open, Sealed, Closed
- **Un véhicule peut avoir plusieurs départs** (pas de restriction)
- **Sélection de véhicule et chauffeur** : Dropdowns avec valeurs ACTIF uniquement

#### Assignation d'Envois
- **Assignation multiple** : Sélection et assignation de plusieurs envois à un départ
- **Retrait d'envois** : Possibilité de retirer des envois d'un départ ouvert
- **Validation** : Vérification que les envois ne sont pas déjà assignés à un autre départ scellé

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
  - Informations du départ (bureau de départ, bureau destinataire, immatriculation du véhicule, nom du chauffeur, date, heure)
  - Tableau détaillé des envois (numéro, expéditeur, destinataire, description, poids)
  - Totaux (nombre de colis, poids total, montant total)
  - Zones de signatures
  - Régénération à chaque téléchargement pour refléter les modifications
  - **Affichage** : Immatriculation du véhicule et nom complet du chauffeur depuis la base de données

### 🚗 Gestion des Véhicules

#### Création et Gestion
- **Création de véhicules** avec immatriculation, nom/code, type et statut
- **Modification de véhicules** (seulement pour ADMIN/SUPERVISOR/STAFF)
- **Suppression de véhicules** (seulement pour ADMIN/SUPERVISOR)
- **Champs obligatoires** :
  - Immatriculation (unique, format ex: LT-234-AB)
  - Nom/Code du véhicule (ex: Bus 003, Coaster Kribi)
  - Type de véhicule : Bus, Coaster, Minibus
  - Statut : ACTIF ou INACTIF

#### Types de Véhicules
- **Bus** : Bus de transport
- **Coaster** : Coaster
- **Minibus** : Minibus

#### Statuts
- **ACTIF** : Véhicule disponible pour utilisation
- **INACTIF** : Véhicule non disponible

#### Filtrage et Recherche
- **Filtrage par statut** : ACTIF ou INACTIF
- **Filtrage par type** : Bus, Coaster, Minibus
- **Recherche** : Par immatriculation ou nom
- **Pagination** : Navigation par pages

#### Intégration avec les Départs
- **Sélection de véhicule** lors de la création d'un départ
- **Dropdown avec véhicules ACTIF uniquement** lors de la création de départ
- **Affichage** : Nom du véhicule et immatriculation dans les listes et détails de départ

#### Permissions
- **ADMIN** : View, Create, Edit, Delete
- **SUPERVISOR** : View, Create, Edit, Delete
- **STAFF** : View, Create, Edit (pas de delete)
- **OPERATIONAL_ACCOUNTANT** : View uniquement

### 👨‍✈️ Gestion des Chauffeurs

#### Création et Gestion
- **Création de chauffeurs** avec informations complètes
- **Modification de chauffeurs** (seulement pour ADMIN/SUPERVISOR/STAFF)
- **Suppression de chauffeurs** (seulement pour ADMIN/SUPERVISOR)
- **Champs obligatoires** :
  - Prénom (varchar 100)
  - Nom (varchar 100)
  - Téléphone (varchar 20)
  - Numéro de permis (unique, varchar 50)
  - Statut : ACTIF ou INACTIF
- **Champs optionnels** :
  - Email (varchar 255)
  - Adresse (text)

#### Statuts
- **ACTIF** : Chauffeur disponible pour affectation
- **INACTIF** : Chauffeur non disponible

#### Filtrage et Recherche
- **Filtrage par statut** : ACTIF ou INACTIF
- **Recherche** : Par nom, prénom, téléphone ou numéro de permis
- **Pagination** : Navigation par pages

#### Intégration avec les Départs
- **Sélection de chauffeur** lors de la création d'un départ
- **Dropdown avec chauffeurs ACTIF uniquement** lors de la création de départ
- **Affichage** : Nom complet du chauffeur et téléphone dans les listes et détails de départ
- **Affichage dans le PDF** : Nom complet du chauffeur dans le bordereau général

#### Permissions
- **ADMIN** : View, Create, Edit, Delete
- **SUPERVISOR** : View, Create, Edit, Delete
- **STAFF** : View, Create, Edit (pas de delete)
- **OPERATIONAL_ACCOUNTANT** : View uniquement

### 💰 Gestion des Dépenses

#### Création et Gestion
- **Création de dépenses** avec description, montant et catégorie
- **13 catégories** disponibles : Dépense du boss, Carburant, Maintenance, Fournitures de bureau, Loyer, Salaires, Communication, Assurance, Réparations, Charges, Impôts/Taxes, Marketing, Autre
- **Date automatique** : La date de dépense correspond à la date de création
- **Modification de dépenses** (seulement pour non-STAFF)
- **Suppression de dépenses** (seulement pour ADMIN/SUPERVISOR)

#### Filtrage et Recherche
- **Filtrage par catégorie** : Sélection d'une catégorie spécifique
- **Filtrage par date** : Sélecteur de plage de dates avec presets (Aujourd'hui, Hier, Cette semaine, Semaine dernière, Ce mois, Mois dernier, Cette année, Année dernière, Personnalisé)
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
  - Gestion des envois et départs
  - Scellement et fermeture de départs
  - Visualisation des montants
- **STAFF** : 
  - Création et visualisation d'envois
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
- **Historique complet** : Traçabilité des modifications sur les envois et départs
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
  - Envois (filtrés par plage de dates)
  - Revenu total (masqué pour STAFF, filtré par plage de dates)
  - Total des départs
- **Sélecteur de plage de dates** : Permet de filtrer toutes les statistiques par période
- **Tableau des envois récents** : Envois filtrés par la plage de dates sélectionnée
- **Navigation rapide** : Liens vers les différentes sections

#### Statistiques par Nature
- **Page Colis** (`/shipments/colis`) : Statistiques et liste filtrées pour les colis uniquement (avec filtrage par date)
- **Page Courrier** (`/shipments/courrier`) : Statistiques et liste filtrées pour le courrier uniquement (avec filtrage par date)
- **Page Tous** (`/shipments`) : Statistiques globales avec répartition par nature (avec filtrage par date)

### 📄 Génération de Documents PDF

#### Bordereaux Individuels
- **Format** : PDF standard A4
- **Contenu** : Informations complètes de l'envoi
- **Génération** : À la volée (pas de stockage)
- **Téléchargement** : Via bouton "Imprimer Bordereau" (si permission `print_waybill`)

#### Bordereaux Généraux
- **Format** : PDF standard A4
- **Génération** : Uniquement lors du scellement d'un départ
- **Contenu** :
  - En-tête officiel de l'entreprise
  - Informations du départ (bureau, véhicule, chauffeur, date, heure)
  - Tableau détaillé des envois
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
  - Détails de l'envoi (trajet, nature, poids, valeur déclarée, montant)
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
- **Sidebar** : Navigation principale avec menu déroulant pour les envois
- **Breadcrumbs** : Indication du chemin de navigation
- **Actions rapides** : Boutons d'action contextuels selon les permissions

#### Composants Réutilisables
- **Badges de statut** : Indicateurs visuels colorés pour les statuts
- **Cartes de statistiques** : Affichage des métriques avec icônes
- **Tableaux** : Affichage paginé avec actions
- **Formulaires** : Validation en temps réel avec React Hook Form et Zod
- **Dialogs** : Modales pour les actions importantes (confirmation, assignation, etc.)
- **DateRangePicker** : Composant réutilisable pour la sélection de plage de dates avec presets (Aujourd'hui, Hier, Cette semaine, Semaine dernière, Ce mois, Mois dernier, Cette année, Année dernière, Personnalisé)

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
- date-fns (manipulation de dates)

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
npm run seed:vehicles
npm run seed:drivers
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

#### Envois
- `GET /api/shipments` : Liste des envois
- `GET /api/shipments/:id` : Détails d'un envoi
- `POST /api/shipments` : Créer un envoi
- `PATCH /api/shipments/:id` : Modifier un envoi
- `DELETE /api/shipments/:id` : Annuler un envoi
- `GET /api/shipments/:id/waybill` : Télécharger le bordereau PDF
- `GET /api/shipments/:id/receipt` : Télécharger le reçu PDF (format ticket)
- `GET /api/shipments/statistics` : Statistiques des envois

#### Départs
- `GET /api/departures` : Liste des départs
- `GET /api/departures/:id` : Détails d'un départ
- `POST /api/departures` : Créer un départ
- `PATCH /api/departures/:id` : Modifier un départ
- `POST /api/departures/:id/assign` : Assigner des envois
- `POST /api/departures/:id/seal` : Sceller un départ
- `POST /api/departures/:id/close` : Fermer un départ
- `GET /api/departures/:id/general-waybill` : Télécharger le bordereau général

#### Véhicules
- `GET /api/vehicles` : Liste des véhicules
- `GET /api/vehicles/available` : Liste des véhicules ACTIF (pour sélection)
- `GET /api/vehicles/:id` : Détails d'un véhicule
- `POST /api/vehicles` : Créer un véhicule
- `PATCH /api/vehicles/:id` : Modifier un véhicule
- `DELETE /api/vehicles/:id` : Supprimer un véhicule

#### Chauffeurs
- `GET /api/drivers` : Liste des chauffeurs
- `GET /api/drivers/available` : Liste des chauffeurs ACTIF (pour sélection)
- `GET /api/drivers/:id` : Détails d'un chauffeur
- `POST /api/drivers` : Créer un chauffeur
- `PATCH /api/drivers/:id` : Modifier un chauffeur
- `DELETE /api/drivers/:id` : Supprimer un chauffeur

#### Dépenses
- `GET /api/expenses` : Liste des dépenses
- `GET /api/expenses/:id` : Détails d'une dépense
- `POST /api/expenses` : Créer une dépense
- `PATCH /api/expenses/:id` : Modifier une dépense
- `DELETE /api/expenses/:id` : Supprimer une dépense
- `GET /api/expenses/statistics` : Statistiques des dépenses (support des filtres dateFrom/dateTo)

#### Répartitions
- `GET /api/distributions/summary` : Résumé général des répartitions (filtres dateFrom/dateTo)
- `GET /api/distributions/drivers` : Répartitions par chauffeur (filtres dateFrom/dateTo)
- `GET /api/distributions/ministry` : Répartition ministère (filtres dateFrom/dateTo)
- `GET /api/distributions/agency` : Répartition agence (filtres dateFrom/dateTo)

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
- **SUPERVISOR** : Gestion des utilisateurs (sauf ADMIN), gestion des envois, départs et dépenses
- **STAFF** : 
  - Création et visualisation d'envois (les montants sont masqués)
  - Création de dépenses et visualisation de **ses propres dépenses uniquement** (montants masqués)
- **OPERATIONAL_ACCOUNTANT** : Visualisation et gestion des dépenses, visualisation des envois

### Restrictions Spécifiques

- Les utilisateurs **STAFF** :
  - Ne peuvent pas voir les montants (prix) des envois
  - Ne voient que **leurs propres dépenses** (filtrage automatique)
  - Ne peuvent pas voir les montants des dépenses (masqués)
  - Ne peuvent pas modifier ou supprimer les dépenses
  - Peuvent créer, sceller, imprimer et fermer les départs, mais ne voient pas les montants dans les listes et détails
  - Peuvent créer, sceller, imprimer et fermer les départs, mais ne voient pas les montants dans les listes et détails
- Les **SUPERVISOR** ne peuvent pas créer, modifier ou supprimer les comptes **ADMIN**
- Les utilisateurs ne peuvent pas supprimer leur propre compte

## 📊 Fonctionnalités Avancées

### Génération de PDF

- **Bordereaux individuels** : Un PDF par envoi avec toutes les informations
- **Bordereaux généraux** : Un PDF par départ avec tous les envois assignés
- **Reçus clients** : Format ticket (80mm) pour les clients avec toutes les informations de l'envoi
- **Format officiel** : Conforme aux standards de transport au Cameroun
- **Régénération** : Les PDF sont régénérés à chaque téléchargement pour refléter les modifications

### Statistiques

- Statistiques globales et filtrées par nature (colis/courrier)
- Répartition par nature (sur page générale uniquement)
- Filtrage par plage de dates sur toutes les pages (Dashboard, Envois, Dépenses, Répartitions)
- Revenus et poids totaux (masqués pour STAFF)
- Statistiques liées dynamiquement au sélecteur de dates

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
npm run seed:vehicles
npm run seed:drivers
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

- Les envois sont créés avec le statut **CONFIRMED** par défaut
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

## 🆕 Dernières Fonctionnalités Ajoutées

### Sélecteur de Plage de Dates (DateRangePicker)
- **Composant réutilisable** : DateRangePicker disponible sur toutes les pages nécessaires
- **Presets** : Aujourd'hui, Hier, Cette semaine, Semaine dernière, Ce mois, Mois dernier, Cette année, Année dernière, Personnalisé
- **Intégration** : Lié aux statistiques et tableaux de données
- **Pages concernées** : Dashboard, Envois, Dépenses, Répartitions

### Gestion des Répartitions
- **Nouvelle fonctionnalité** : Calcul automatique des répartitions (Chauffeurs, Ministère, Agence)
- **Page dédiée** : `/distribution` avec vue Chauffeur et Ministère
- **Filtrage par date** : Toutes les répartitions sont filtrables par plage de dates
- **Masquage STAFF** : Les montants sont masqués pour les utilisateurs STAFF

### Type d'Envoi
- **Nouveau champ** : Type d'envoi (Express ou Standard)
- **Intégration** : Utilisé dans les critères de répartition ministère
- **Formulaire** : Ajouté aux formulaires de création et modification d'envois
