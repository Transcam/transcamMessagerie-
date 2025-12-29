# Backend - Transcam Messagerie

API REST backend pour la gestion de messagerie et d'expéditions Transcam, construite avec Node.js, Express, TypeScript et PostgreSQL.

## 🚀 Technologies

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **TypeScript** - Typage statique
- **TypeORM** - ORM pour PostgreSQL
- **PostgreSQL** - Base de données relationnelle
- **JWT** - Authentification par tokens
- **bcrypt** - Hachage de mots de passe
- **PDFKit** - Génération de PDF
- **dotenv** - Gestion des variables d'environnement

## 📁 Structure du Projet

```
backend/
├── src/
│   ├── controllers/        # Contrôleurs HTTP
│   ├── entities/           # Entités TypeORM (modèles)
│   ├── services/           # Logique métier
│   ├── routes/             # Définition des routes
│   ├── middlewares/        # Middlewares Express
│   ├── helpers/            # Fonctions utilitaires
│   ├── migrations/         # Migrations de base de données
│   ├── types/              # Types TypeScript
│   └── server.ts           # Point d'entrée de l'application
├── scripts/                # Scripts utilitaires
│   └── insert-test-shipments.ts
└── data-source.ts          # Configuration TypeORM
```

## ✨ Fonctionnalités Implémentées

### 🔐 Authentification et Autorisation

- **Authentification JWT** : Tokens avec expiration (1h)
- **Hachage de mots de passe** avec bcrypt
- **Système de rôles** :
  - `ADMIN` : Toutes les permissions
  - `SUPERVISOR` : Gestion des utilisateurs (sauf ADMIN), gestion des expéditions et départs
  - `STAFF` : Création et visualisation d'expéditions (sans voir les montants)
  - `OPERATIONAL_ACCOUNTANT` : Permissions spécifiques (à définir)
- **Contrôle d'accès basé sur les permissions** :
  - Middleware `authenticate` : Vérifie le token JWT
  - Middleware `authorize` : Vérifie les permissions spécifiques
  - Masquage des données sensibles selon les rôles (ex: prix pour STAFF)

### 📦 Gestion des Expéditions

#### Entité `Shipment`

- **Champs principaux** :
  - Numéro de bordereau (généré automatiquement : `TC-YYYY-NNNN`)
  - Informations expéditeur et destinataire
  - Poids, prix, valeur déclarée
  - Route
  - **Nature** : Colis ou Courrier
  - Statut : Pending, Confirmed, Assigned, Cancelled
- **Relations** :
  - Créé par, confirmé par, annulé par (User)
  - Départ assigné (Departure)

#### Endpoints API

- `GET /api/shipments` : Liste des expéditions (avec filtres)
  - Filtres : status, route, nature, dateFrom, dateTo, waybillNumber
  - Pagination
  - **Masque le prix pour les utilisateurs STAFF**
- `GET /api/shipments/:id` : Détails d'une expédition
  - **Masque le prix pour les utilisateurs STAFF**
- `POST /api/shipments` : Création d'expédition
  - Génération automatique du numéro de bordereau
  - Statut automatiquement défini à `CONFIRMED`
- `PATCH /api/shipments/:id` : Mise à jour d'expédition
- `DELETE /api/shipments/:id` : Annulation d'expédition (avec raison)
- `GET /api/shipments/:id/waybill` : Téléchargement du bordereau PDF individuel
- `GET /api/shipments/:id/receipt` : Téléchargement du reçu PDF (format ticket 80mm)
- `GET /api/shipments/statistics` : Statistiques des expéditions
  - Total, revenu total, poids total
  - Répartition par statut et par nature
  - Statistiques du jour et du mois
  - **Masque les revenus pour les utilisateurs STAFF**

#### Services

- **`ShipmentService`** :
  - CRUD complet
  - Génération de numéros de bordereau
  - Calcul de statistiques
  - Audit logging

- **`IndividualWaybillService`** :
  - Génération de PDF pour bordereaux individuels

- **`ReceiptService`** :
  - Génération de PDF pour reçus clients
  - Format ticket (80mm) pour impression thermique
  - Contenu : Informations complètes de l'expédition, conditions générales

### 🚌 Gestion des Départs

#### Entité `Departure`

- **Champs principaux** :
  - Route, véhicule, chauffeur
  - Statut : Open, Sealed, Closed
  - Numéro de bordereau général (généré lors du scellement : `BG-YYYY-NNNN`)
  - Date de scellement
  - Chemin du PDF du bordereau général
- **Relations** :
  - Expéditions assignées (Shipment[])

#### Endpoints API

- `GET /api/departures` : Liste des départs
- `GET /api/departures/:id` : Détails d'un départ
- `POST /api/departures` : Création de départ
- `PATCH /api/departures/:id` : Mise à jour de départ
- `POST /api/departures/:id/assign` : Assignation d'expéditions
- `DELETE /api/departures/:id/shipments/:shipmentId` : Retrait d'expédition
- `POST /api/departures/:id/seal` : Scellement du départ
  - Génère le numéro de bordereau général
  - Génère le PDF du bordereau général
  - Change le statut à "sealed"
- `POST /api/departures/:id/close` : Fermeture du départ
  - Change le statut à "closed"
- `GET /api/departures/:id/general-waybill` : Téléchargement du bordereau général PDF
- `GET /api/departures/:id/waybills` : Téléchargement de tous les bordereaux individuels (ZIP)

#### Services

- **`DepartureService`** :
  - CRUD complet
  - Assignation/retrait d'expéditions
  - Scellement et fermeture
  - Calcul de résumés (nombre de colis, poids total, montant total)
  - Audit logging

- **`GeneralWaybillService`** :
  - Génération de numéros de bordereau général
  - Génération de PDF du bordereau général avec :
    - En-tête officiel de l'entreprise
    - Informations du départ (bureau, véhicule, chauffeur, date, heure)
    - Tableau détaillé des expéditions (numéro, expéditeur, destinataire, description, poids)
    - Totaux (nombre de colis, poids total, montant total)
    - Zones de signatures

### 👥 Gestion des Utilisateurs

#### Entité `User`

- **Champs** :
  - Username (unique)
  - Password (hashé)
  - Role (enum)
  - Date de création

#### Endpoints API

- `POST /api/users/login` : Connexion (retourne JWT)
- `GET /api/users` : Liste des utilisateurs
  - **Filtre les ADMIN pour les SUPERVISOR**
- `GET /api/users/:id` : Détails d'un utilisateur
  - **Empêche les SUPERVISOR de voir les ADMIN**
- `POST /api/users` : Création d'utilisateur
  - **Empêche les SUPERVISOR de créer des ADMIN**
- `PATCH /api/users/:id` : Mise à jour d'utilisateur
  - **Empêche les SUPERVISOR de modifier les ADMIN ou d'assigner le rôle ADMIN**
- `DELETE /api/users/:id` : Suppression d'utilisateur
  - **Empêche les SUPERVISOR de supprimer les ADMIN**
  - Empêche la suppression de son propre compte

### 📊 Audit et Traçabilité

#### Entité `AuditLog`

- Enregistrement de toutes les actions importantes
- Champs : entity_type, entity_id, action, old_values, new_values, user, reason
- Utilisé pour tracer les modifications sur les expéditions et départs

### 📄 Génération de PDF

#### Bordereaux Individuels

- Format : `TC-YYYY-NNNN`
- Contenu : Informations complètes de l'expédition
- Stockage : Générés à la volée (pas de stockage)

#### Reçus Clients

- Format : Ticket 80mm (226.77 points de largeur)
- Contenu : 
  - En-tête de l'entreprise
  - Numéro de reçu (numéro de bordereau)
  - Informations expéditeur et destinataire
  - Détails de l'expédition (trajet, nature, poids, valeur déclarée, montant)
  - Date de départ
  - Conditions générales
- Stockage : Générés à la volée (pas de stockage)

#### Bordereaux Généraux

- Format : `BG-YYYY-NNNN`
- Généré uniquement lors du scellement d'un départ
- Contenu :
  - En-tête officiel de l'entreprise
  - Informations du départ
  - Tableau des expéditions assignées
  - Totaux et signatures
- Stockage : `/storage/waybills/general/`
- **Régénération** : Le PDF est régénéré à chaque téléchargement pour refléter les modifications

## 🔧 Services Principaux

### `ShipmentService`
- Gestion complète du cycle de vie des expéditions
- Génération de numéros de bordereau
- Calcul de statistiques
- Audit logging

### `DepartureService`
- Gestion des départs
- Assignation d'expéditions
- Scellement et fermeture
- Calcul de résumés

### `GeneralWaybillService`
- Génération de numéros de bordereau général
- Création de PDF du bordereau général
- Mise en page professionnelle

### `IndividualWaybillService`
- Création de PDF pour bordereaux individuels

### `ReceiptService`
- Création de PDF pour reçus clients
- Format ticket (80mm) optimisé pour impression thermique

### `WaybillService`
- Génération de numéros de bordereau séquentiels

## 🗄️ Base de Données

### Tables Principales

- **`users`** : Utilisateurs du système
- **`shipments`** : Expéditions
- **`departures`** : Départs
- **`audit_logs`** : Logs d'audit

### Migrations

- `InitialMigration` : Création des tables de base
- `CreateShipmentsAndAuditLogs` : Tables shipments et audit_logs
- `CreateDeparturesAndUpdateShipments` : Table departures et relation avec shipments
- `AddNatureToShipments` : Ajout du champ nature (colis/courrier)
- `DeleteEmailFromUserEntity` : Suppression du champ email

## 🔒 Sécurité

- **JWT** : Tokens signés avec secret
- **bcrypt** : Hachage des mots de passe (10 rounds)
- **Middleware d'authentification** : Vérification du token sur toutes les routes protégées
- **Middleware d'autorisation** : Vérification des permissions spécifiques
- **Masquage des données** : Les prix sont masqués pour les utilisateurs STAFF
- **Validation des entrées** : Validation des données avant traitement

## 📝 Permissions

Le système de permissions est défini dans `src/types/permissions.ts` et `src/helpers/authorize.ts`.

### Permissions Disponibles

- `view_dashboard` : Voir le tableau de bord
- `view_shipments` : Voir les expéditions
- `create_shipment` : Créer des expéditions
- `edit_shipment` : Modifier des expéditions
- `delete_shipment` : Annuler des expéditions
- `view_departures` : Voir les départs
- `create_departure` : Créer des départs
- `validate_departure` : Sceller/fermer des départs
- `print_waybill` : Imprimer des bordereaux
- `print_receipt` : Imprimer des reçus (tickets clients)
- `manage_users` : Gérer les utilisateurs
- `view_finance` : Voir les finances
- `view_distribution` : Voir la distribution
- `view_reports` : Voir les rapports
- `export_data` : Exporter des données

## 🚀 Installation et Démarrage

### Prérequis

- Node.js 18+
- PostgreSQL 12+
- npm ou yarn

### Installation

```bash
# Installer les dépendances
npm install
```

### Configuration

Créer un fichier `.env` à la racine du backend :

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

### Base de Données

```bash
# Exécuter les migrations
npm run migration:run
```

### Développement

```bash
# Démarrer le serveur avec nodemon (auto-reload)
npm run dev
```

Le serveur sera accessible sur `http://localhost:3000`

### Production

```bash
# Compiler TypeScript
npm run build

# Démarrer le serveur
npm start
```

## 🛠️ Scripts Disponibles

- `npm run dev` : Démarre le serveur de développement avec nodemon
- `npm run build` : Compile TypeScript vers JavaScript
- `npm start` : Démarre le serveur en production
- `npm run migration:generate` : Génère une nouvelle migration
- `npm run migration:run` : Exécute les migrations
- `npm run migration:revert` : Annule la dernière migration
- `npm run seed:shipments` : Insère des expéditions de test

## 📂 Stockage des Fichiers

Les PDF générés sont stockés dans :

- **Bordereaux individuels** : `/storage/waybills/individual/`
- **Bordereaux généraux** : `/storage/waybills/general/`

Assurez-vous que ces dossiers existent et sont accessibles en écriture.

## 🔍 Endpoints API

### Base URL
```
http://localhost:3000/api
```

### Authentification
```
POST /users/login
```

### Expéditions
```
GET    /shipments
GET    /shipments/:id
POST   /shipments
PATCH  /shipments/:id
DELETE /shipments/:id
GET    /shipments/:id/waybill
GET    /shipments/:id/receipt
GET    /shipments/statistics
```

### Départs
```
GET    /departures
GET    /departures/:id
POST   /departures
PATCH  /departures/:id
POST   /departures/:id/assign
DELETE /departures/:id/shipments/:shipmentId
POST   /departures/:id/seal
POST   /departures/:id/close
GET    /departures/:id/general-waybill
GET    /departures/:id/waybills
```

### Utilisateurs
```
GET    /users
GET    /users/:id
POST   /users
PATCH  /users/:id
DELETE /users/:id
```

## 📚 Documentation Additionnelle

Pour plus d'informations sur les technologies utilisées :

- [Express.js Documentation](https://expressjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT Documentation](https://jwt.io/)
- [PDFKit Documentation](https://pdfkit.org/)

