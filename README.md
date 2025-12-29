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

- **Création et modification** d'expéditions
- **Nature des expéditions** : Colis ou Courrier
- **Statuts** : Pending, Confirmed, Assigned, Cancelled
- **Génération automatique** de numéros de bordereau (`TC-YYYY-NNNN`)
- **Filtrage avancé** : par statut, route, nature, date, numéro de bordereau
- **Génération de bordereaux PDF** individuels
- **Statistiques détaillées** :
  - Total d'expéditions
  - Revenu total (masqué pour STAFF)
  - Poids total
  - Statistiques du jour et du mois
  - Répartition par statut et par nature

### 🚌 Gestion des Départs

- **Création et gestion** de départs de véhicules
- **Assignation d'expéditions** à un départ
- **Scellement de départ** :
  - Génération du numéro de bordereau général (`BG-YYYY-NNNN`)
  - Génération du PDF du bordereau général
  - Blocage des modifications
- **Fermeture de départ** : Finalisation du départ
- **Téléchargement de bordereaux** :
  - Bordereau général (toutes les expéditions)
  - Tous les bordereaux individuels (ZIP)

### 👥 Gestion des Utilisateurs

- **Système de rôles** :
  - **ADMIN** : Toutes les permissions
  - **SUPERVISOR** : Gestion des utilisateurs (sauf ADMIN), gestion des expéditions et départs
  - **STAFF** : Création et visualisation d'expéditions (sans voir les montants)
  - **OPERATIONAL_ACCOUNTANT** : Permissions spécifiques
- **Contrôle d'accès** :
  - Les STAFF ne peuvent pas voir les montants (prix) des expéditions
  - Les SUPERVISOR ne peuvent pas gérer les comptes ADMIN
  - Permissions granulaires pour chaque action

### 🔐 Sécurité

- **Authentification JWT** avec tokens sécurisés
- **Hachage de mots de passe** avec bcrypt
- **Contrôle d'accès basé sur les permissions**
- **Masquage des données sensibles** selon les rôles
- **Audit logging** pour traçabilité complète

### 🌐 Internationalisation

- **Support multilingue** : Français (FR) et Anglais (EN)
- **Basculement de langue** en temps réel
- **Traductions complètes** de l'interface

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
- `GET /api/departures/:id/waybills` : Télécharger tous les bordereaux individuels

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
- **SUPERVISOR** : Gestion des utilisateurs (sauf ADMIN), gestion des expéditions et départs
- **STAFF** : Création et visualisation d'expéditions (les montants sont masqués)
- **OPERATIONAL_ACCOUNTANT** : Permissions spécifiques (à définir selon les besoins)

### Restrictions Spécifiques

- Les utilisateurs **STAFF** ne peuvent pas voir les montants (prix) des expéditions
- Les **SUPERVISOR** ne peuvent pas créer, modifier ou supprimer les comptes **ADMIN**
- Les utilisateurs ne peuvent pas supprimer leur propre compte

## 📊 Fonctionnalités Avancées

### Génération de PDF

- **Bordereaux individuels** : Un PDF par expédition avec toutes les informations
- **Bordereaux généraux** : Un PDF par départ avec toutes les expéditions assignées
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
