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
    - Informations du départ (bureau, immatriculation du véhicule, nom du chauffeur, date, heure)
    - Tableau détaillé des expéditions (numéro, expéditeur, destinataire, description, poids)
    - Totaux (nombre de colis, poids total, montant total)
    - Zones de signatures
    - **Affichage** : Immatriculation du véhicule et nom complet du chauffeur depuis la base de données

### 🚗 Gestion des Véhicules

#### Entité `Vehicle`

- **Champs principaux** :
  - Immatriculation (unique, obligatoire, varchar 50)
  - Nom/Code du véhicule (obligatoire, varchar 255)
  - Type (enum : bus, coaster, minibus)
  - Statut (enum : actif, inactif)
  - Date de création et modification
- **Relations** :
  - Créé par (User)
  - Départs (Departure[]) - relation OneToMany

#### Types de Véhicules

- `bus` : Bus
- `coaster` : Coaster
- `minibus` : Minibus

#### Statuts

- `actif` : Véhicule disponible
- `inactif` : Véhicule non disponible

#### Endpoints API

- `GET /api/vehicles` : Liste des véhicules (avec filtres)
  - Filtres : status, type, search
  - Pagination
- `GET /api/vehicles/available` : Liste des véhicules ACTIF (pour sélection dans départ)
- `GET /api/vehicles/:id` : Détails d'un véhicule
- `POST /api/vehicles` : Création de véhicule
  - Validation : immatriculation unique, champs obligatoires
- `PATCH /api/vehicles/:id` : Mise à jour de véhicule
  - Validation : immatriculation unique si modifiée
- `DELETE /api/vehicles/:id` : Suppression de véhicule
  - Vérification : Empêche la suppression si le véhicule est utilisé dans des départs

#### Services

- **`VehicleService`** :
  - CRUD complet
  - Validation d'unicité de l'immatriculation
  - Vérification d'utilisation avant suppression
  - Méthode `getAvailable()` pour récupérer uniquement les véhicules ACTIF
  - Audit logging

#### Permissions

- `view_vehicles` : Tous les utilisateurs peuvent voir les véhicules
- `create_vehicle` : ADMIN, SUPERVISOR, STAFF peuvent créer
- `edit_vehicle` : ADMIN, SUPERVISOR, STAFF peuvent modifier
- `delete_vehicle` : Seulement ADMIN et SUPERVISOR peuvent supprimer

#### Modification de l'Entité Departure

- Le champ `vehicle` (string) a été remplacé par une relation `ManyToOne` vers `Vehicle`
- La colonne `vehicle_id` a été ajoutée à la table `departures`
- Le champ `driver_name` (string) a été remplacé par une relation `ManyToOne` vers `Driver`
- La colonne `driver_id` a été ajoutée à la table `departures`
- Migrations : `UpdateDeparturesAddVehicleRelation`, `UpdateDeparturesAddDriverRelation`

### 👨‍✈️ Gestion des Chauffeurs

#### Entité `Driver`

- **Champs principaux** :
  - Prénom (obligatoire, varchar 100)
  - Nom (obligatoire, varchar 100)
  - Téléphone (obligatoire, varchar 20)
  - Numéro de permis (unique, obligatoire, varchar 50)
  - Email (optionnel, varchar 255)
  - Adresse (optionnel, text)
  - Statut (enum : actif, inactif)
  - Date de création et modification
- **Relations** :
  - Créé par (User)
  - Départs (Departure[]) - relation OneToMany

#### Statuts

- `actif` : Chauffeur disponible
- `inactif` : Chauffeur non disponible

#### Endpoints API

- `GET /api/drivers` : Liste des chauffeurs (avec filtres)
  - Filtres : status, search
  - Pagination
- `GET /api/drivers/available` : Liste des chauffeurs ACTIF (pour sélection dans départ)
- `GET /api/drivers/:id` : Détails d'un chauffeur
- `POST /api/drivers` : Création de chauffeur
  - Validation : numéro de permis unique, champs obligatoires
- `PATCH /api/drivers/:id` : Mise à jour de chauffeur
  - Validation : numéro de permis unique si modifié
- `DELETE /api/drivers/:id` : Suppression de chauffeur
  - Vérification : Empêche la suppression si le chauffeur est utilisé dans des départs

#### Services

- **`DriverService`** :
  - CRUD complet
  - Validation d'unicité du numéro de permis
  - Vérification d'utilisation avant suppression
  - Méthode `getAvailable()` pour récupérer uniquement les chauffeurs ACTIF
  - Audit logging

#### Permissions

- `view_drivers` : Tous les utilisateurs peuvent voir les chauffeurs
- `create_driver` : ADMIN, SUPERVISOR, STAFF peuvent créer
- `edit_driver` : ADMIN, SUPERVISOR, STAFF peuvent modifier
- `delete_driver` : Seulement ADMIN et SUPERVISOR peuvent supprimer

### 💰 Gestion des Dépenses

#### Entité `Expense`

- **Champs principaux** :
  - Description (obligatoire, texte)
  - Montant (obligatoire, decimal 10,2)
  - Catégorie (enum avec 13 catégories)
  - Date de création (utilisée comme date de dépense)
- **Relations** :
  - Créé par (User)
  - Modifié par (User, nullable)

#### Catégories de Dépenses

13 catégories disponibles :
- `depense_du_boss` : Dépense du boss
- `carburant` : Carburant
- `maintenance` : Maintenance
- `fournitures_bureau` : Fournitures de bureau
- `loyer` : Loyer
- `salaires` : Salaires
- `communication` : Communication
- `assurance` : Assurance
- `reparations` : Réparations
- `charges` : Charges
- `impots` : Impôts/Taxes
- `marketing` : Marketing
- `autre` : Autre

#### Endpoints API

- `GET /api/expenses` : Liste des dépenses (avec filtres)
  - Filtres : category, dateFrom, dateTo
  - Pagination
  - **Filtre automatique pour STAFF** : Ne voit que ses propres dépenses
  - **Masque le montant pour les utilisateurs STAFF**
- `GET /api/expenses/:id` : Détails d'une dépense
  - **Vérifie que le STAFF ne peut voir que ses propres dépenses**
  - **Masque le montant pour les utilisateurs STAFF**
- `POST /api/expenses` : Création de dépense
  - Validation : description, amount > 0, category valide
- `PATCH /api/expenses/:id` : Mise à jour de dépense
  - **Blocage pour les utilisateurs STAFF** (au niveau de l'autorisation)
- `DELETE /api/expenses/:id` : Suppression de dépense
  - **Seulement pour ADMIN/SUPERVISOR** (permission `delete_expense`)
- `GET /api/expenses/statistics` : Statistiques des dépenses
  - Total, montant total, répartition par catégorie
  - Statistiques du jour et du mois
  - **Filtre automatique pour STAFF** : Statistiques seulement sur ses propres dépenses
  - **Masque les montants pour les utilisateurs STAFF**

#### Services

- **`ExpenseService`** :
  - CRUD complet
  - Filtrage automatique pour STAFF (ne voit que ses propres dépenses)
  - Masquage des montants pour STAFF
  - Calcul de statistiques
  - Audit logging

#### Permissions

- `create_expense` : Tous les utilisateurs peuvent créer des dépenses
- `view_expenses` : Tous les utilisateurs peuvent voir les dépenses (liste)
- `view_expense_amount` : Seuls les non-STAFF peuvent voir les montants
- `edit_expense` : Seuls les non-STAFF peuvent modifier les dépenses
- `delete_expense` : Seulement ADMIN et SUPERVISOR peuvent supprimer

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

### `ExpenseService`
- Gestion complète du cycle de vie des dépenses
- Filtrage automatique pour STAFF (ne voit que ses propres dépenses)
- Masquage des montants pour STAFF
- Calcul de statistiques
- Audit logging

### `VehicleService`
- Gestion complète du cycle de vie des véhicules
- Validation d'unicité de l'immatriculation
- Vérification d'utilisation avant suppression
- Méthode pour récupérer uniquement les véhicules ACTIF
- Audit logging

## 🗄️ Base de Données

### Tables Principales

- **`users`** : Utilisateurs du système
- **`shipments`** : Expéditions
- **`departures`** : Départs
- **`vehicles`** : Véhicules de la flotte
- **`drivers`** : Chauffeurs
- **`expenses`** : Dépenses
- **`audit_logs`** : Logs d'audit

### Migrations

- `InitialMigration` : Création des tables de base
- `CreateShipmentsAndAuditLogs` : Tables shipments et audit_logs
- `CreateDeparturesAndUpdateShipments` : Table departures et relation avec shipments
- `AddNatureToShipments` : Ajout du champ nature (colis/courrier)
- `DeleteEmailFromUserEntity` : Suppression du champ email
- `CreateExpensesTable` : Table expenses avec enum de catégories
- `CreateVehiclesTable` : Table vehicles avec enums type et status
- `UpdateDeparturesAddVehicleRelation` : Ajout de vehicle_id à departures et relation avec vehicles
- `CreateDriversTable` : Table drivers avec enum status
- `UpdateDeparturesAddDriverRelation` : Ajout de driver_id à departures et relation avec drivers

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
- `create_expense` : Créer des dépenses
- `view_expenses` : Voir les dépenses
- `view_expense_amount` : Voir les montants des dépenses (seuls les non-STAFF)
- `edit_expense` : Modifier les dépenses (seuls les non-STAFF)
- `delete_expense` : Supprimer les dépenses (seulement ADMIN/SUPERVISOR)
- `view_vehicles` : Voir les véhicules
- `create_vehicle` : Créer des véhicules (ADMIN, SUPERVISOR, STAFF)
- `edit_vehicle` : Modifier des véhicules (ADMIN, SUPERVISOR, STAFF)
- `delete_vehicle` : Supprimer des véhicules (seulement ADMIN/SUPERVISOR)

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
- `npm run seed:expenses` : Insère des dépenses de test
- `npm run seed:vehicles` : Insère des véhicules de test
- `npm run seed:drivers` : Insère des chauffeurs de test

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
```

### Véhicules
```
GET    /vehicles
GET    /vehicles/available
GET    /vehicles/:id
POST   /vehicles
PATCH  /vehicles/:id
DELETE /vehicles/:id
```

### Dépenses
```
GET    /expenses
GET    /expenses/:id
POST   /expenses
PATCH  /expenses/:id
DELETE /expenses/:id
GET    /expenses/statistics
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

