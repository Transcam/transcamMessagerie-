import React, { createContext, useContext, useState, ReactNode } from "react";

type Language = "fr" | "en";

interface Translations {
  [key: string]: {
    fr: string;
    en: string;
  };
}

const translations: Translations = {
  // Navigation
  "nav.dashboard": { fr: "Tableau de bord", en: "Dashboard" },
  "nav.users": { fr: "Utilisateurs", en: "Users" },
  "nav.shipments": { fr: "Expéditions", en: "Shipments" },
  "nav.shipments.courrier": { fr: "Courrier", en: "Mail" },
  "nav.shipments.colis": { fr: "Colis", en: "Parcel" },
  "nav.newShipment": { fr: "Nouvelle expédition", en: "New Shipment" },
  "nav.departures": { fr: "Départs", en: "Departures" },
  "nav.vehicles": { fr: "Véhicules", en: "Vehicles" },
  "nav.drivers": { fr: "Chauffeurs", en: "Drivers" },
  "nav.expenses": { fr: "depense", en: "Expenses" },
  "nav.waybills": { fr: "Bordereaux", en: "Waybills" },
  "nav.finance": { fr: "Finance", en: "Finance" },
  "nav.distribution": { fr: "Répartition", en: "Distribution" },
  "nav.reports": { fr: "Rapports", en: "Reports" },
  "nav.settings": { fr: "Paramètres", en: "Settings" },
  "nav.logout": { fr: "Déconnexion", en: "Logout" },

  // Login
  "login.title": { fr: "Connexion", en: "Login" },
  "login.subtitle": {
    fr: "Accédez à votre espace de gestion",
    en: "Access your management dashboard",
  },
  "login.email": { fr: "Email", en: "Email" },
  "login.password": { fr: "Mot de passe", en: "Password" },
  "login.submit": { fr: "Se connecter", en: "Sign In" },
  "login.forgotPassword": {
    fr: "Mot de passe oublié?",
    en: "Forgot password?",
  },

  // Dashboard
  "dashboard.title": { fr: "Tableau de bord", en: "Dashboard" },
  "dashboard.welcome": { fr: "Bienvenue", en: "Welcome" },
  "dashboard.todayShipments": {
    fr: "Expéditions du jour",
    en: "Today's Shipments",
  },
  "dashboard.monthShipments": {
    fr: "Expéditions du mois",
    en: "Month's Shipments",
  },
  "dashboard.totalRevenue": { fr: "Recettes totales", en: "Total Revenue" },
  "dashboard.totalDepartures": { fr: "Total départs", en: "Total Departures" },
  "dashboard.driverDistribution": { fr: "À verser aux chauffeurs", en: "Driver Distribution" },
  "dashboard.ministryDistribution": { fr: "À verser au ministère", en: "Ministry Distribution" },
  "dashboard.globalRevenue": { fr: "Chiffre d'affaire global", en: "Global Revenue" },
  "dashboard.totalExpenses": { fr: "Total des dépenses", en: "Total Expenses" },
  "dashboard.recentShipments": {
    fr: "Expéditions récentes",
    en: "Recent Shipments",
  },

  // Shipments
  "shipment.new": { fr: "Nouvelle expédition", en: "New Shipment" },
  "shipment.list": { fr: "Liste des expéditions", en: "Shipments List" },
  "shipment.sender": { fr: "Expéditeur", en: "Sender" },
  "shipment.senderName": { fr: "Nom de l'expéditeur", en: "Sender Name" },
  "shipment.senderPhone": {
    fr: "Téléphone de l'expéditeur",
    en: "Sender Phone",
  },
  "shipment.receiver": { fr: "Destinataire", en: "Receiver" },
  "shipment.receiverName": { fr: "Nom du destinataire", en: "Receiver Name" },
  "shipment.receiverPhone": {
    fr: "Téléphone du destinataire",
    en: "Receiver Phone",
  },
  "shipment.parcel": { fr: "Colis", en: "Parcel" },
  "shipment.description": { fr: "Description", en: "Description" },
  "shipment.weight": { fr: "Poids", en: "Weight" },
  "shipment.declaredValue": { fr: "Valeur déclarée", en: "Declared Value" },
  "shipment.price": { fr: "Prix", en: "Price" },
  "shipment.route": { fr: "Itinéraire", en: "Route" },
  "shipment.status": { fr: "Statut", en: "Status" },
  "shipment.date": { fr: "Date", en: "Date" },
  "shipment.confirm": { fr: "Confirmer", en: "Confirm" },
      "shipment.print": { fr: "Imprimer", en: "Print" },
      "shipment.printReceipt": { fr: "Imprimer Reçu", en: "Print Receipt" },
      "receipt.downloading": { fr: "Téléchargement du reçu...", en: "Downloading receipt..." },
      "receipt.error": { fr: "Erreur lors de la génération du reçu", en: "Error generating receipt" },
      "shipment.confirmed": { fr: "Confirmé", en: "Confirmed" },
  "shipment.pending": { fr: "En attente", en: "Pending" },
  "shipment.assigned": { fr: "Assigné", en: "Assigned" },
  "shipment.cancelled": { fr: "Annulé", en: "Cancelled" },

  // Departures
  "departure.new": { fr: "Nouveau départ", en: "New Departure" },
  "departure.list": { fr: "Liste des départs", en: "Departures List" },
  "departure.route": { fr: "Itinéraire", en: "Route" },
  "departure.vehicle": { fr: "Véhicule", en: "Vehicle" },
  "departure.driver": { fr: "Chauffeur", en: "Driver" },
  "departure.selectShipments": {
    fr: "Sélectionner les expéditions",
    en: "Select Shipments",
  },
  "departure.validate": { fr: "Valider le départ", en: "Validate Departure" },

  // Waybills
  "waybill.title": { fr: "Bordereau", en: "Waybill" },
  "waybill.number": { fr: "N° Bordereau", en: "Waybill No." },
  "waybill.general": { fr: "Bordereau général", en: "General Waybill" },
  "waybill.individual": {
    fr: "Bordereau individuel",
    en: "Individual Waybill",
  },
  "waybill.download": { fr: "Télécharger", en: "Download" },
  "waybill.signature": { fr: "Signature", en: "Signature" },

  // Finance
  "finance.title": { fr: "Tableau financier", en: "Finance Dashboard" },
  "finance.revenue": { fr: "Recettes", en: "Revenue" },
  "finance.period": { fr: "Période", en: "Period" },
  "finance.today": { fr: "Aujourd'hui", en: "Today" },
  "finance.thisMonth": { fr: "Ce mois", en: "This Month" },

  // Distribution
  "distribution.title": {
    fr: "Répartition des recettes",
    en: "Revenue Distribution",
  },
  "distribution.partner": { fr: "Partenaire", en: "Partner" },
  "distribution.percentage": { fr: "Pourcentage", en: "Percentage" },
  "distribution.amount": { fr: "Montant", en: "Amount" },

  // Reports
  "reports.title": { fr: "Rapports", en: "Reports" },
  "reports.activity": { fr: "Rapport d'activité", en: "Activity Report" },
  "reports.financial": { fr: "Rapport financier", en: "Financial Report" },
  "reports.export": { fr: "Exporter", en: "Export" },
  "reports.pdf": { fr: "PDF", en: "PDF" },
  "reports.excel": { fr: "Excel", en: "Excel" },

  // Common
  "common.save": { fr: "Enregistrer", en: "Save" },
  "common.cancel": { fr: "Annuler", en: "Cancel" },
  "common.edit": { fr: "Modifier", en: "Edit" },
  "common.delete": { fr: "Supprimer", en: "Delete" },
  "common.view": { fr: "Voir", en: "View" },
  "common.search": { fr: "Rechercher", en: "Search" },
  "common.filter": { fr: "Filtrer", en: "Filter" },
  "common.actions": { fr: "Actions", en: "Actions" },
  "common.total": { fr: "Total", en: "Total" },
  "common.from": { fr: "De", en: "From" },
  "common.to": { fr: "À", en: "To" },
  "common.date": { fr: "Date", en: "Date" },
  "common.amount": { fr: "Montant", en: "Amount" },
  "common.fcfa": { fr: "FCFA", en: "FCFA" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [language, setLanguage] = useState<Language>("fr");

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Missing translation for key: ${key}`);
      return key;
    }
    return translation[language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
