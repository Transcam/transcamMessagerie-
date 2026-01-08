import { httpService } from "./http-service";

export interface DistributionFilters {
  dateFrom?: string;
  dateTo?: string;
  driverId?: number;
}

export interface DriverDistributionShipment {
  shipment_id: number;
  waybill_number: string;
  weight: number | null;
  price: number;
  driver_amount: number;
  departure_id: number;
  sealed_at: string;
}

export interface DriverDistribution {
  driver: {
    id: number;
    first_name: string;
    last_name: string;
  };
  total_amount: number;
  shipment_count: number;
  shipments: DriverDistributionShipment[];
}

export interface MinistryDistributionShipment {
  shipment_id: number;
  waybill_number: string;
  nature: "colis" | "courrier";
  type: "express" | "standard";
  weight: number | null;
  price: number;
  departure_id: number;
  sealed_at: string;
}

export interface MinistryDistribution {
  total_revenue: number;
  ministry_amount: number;
  shipment_count: number;
  shipments: MinistryDistributionShipment[];
}

export interface AgencyDistribution {
  total_revenue: number;
  total_driver_distributions: number;
  total_ministry_distribution: number;
  agency_amount: number;
  shipment_count: number;
}

export interface DistributionSummary {
  total_driver_distributions: number;
  total_ministry_distribution: number;
  total_agency_amount: number;
  total_revenue_concerned: number;
  total_shipments_concerned: number;
}

export const distributionService = {
  // Get driver distributions
  getDriverDistributions: async (filters?: DistributionFilters): Promise<DriverDistribution[]> => {
    const params = new URLSearchParams();
    if (filters?.driverId) params.append("driverId", filters.driverId.toString());
    if (filters?.dateFrom) params.append("dateFrom", filters.dateFrom);
    if (filters?.dateTo) params.append("dateTo", filters.dateTo);

    const response = await httpService.get(`/distributions/drivers?${params.toString()}`);
    return response.data.data;
  },

  // Get ministry distribution
  getMinistryDistribution: async (filters?: DistributionFilters): Promise<MinistryDistribution> => {
    const params = new URLSearchParams();
    if (filters?.dateFrom) params.append("dateFrom", filters.dateFrom);
    if (filters?.dateTo) params.append("dateTo", filters.dateTo);

    const response = await httpService.get(`/distributions/ministry?${params.toString()}`);
    return response.data.data;
  },

  // Get agency distribution
  getAgencyDistribution: async (filters?: DistributionFilters): Promise<AgencyDistribution> => {
    const params = new URLSearchParams();
    if (filters?.dateFrom) params.append("dateFrom", filters.dateFrom);
    if (filters?.dateTo) params.append("dateTo", filters.dateTo);

    const response = await httpService.get(`/distributions/agency?${params.toString()}`);
    return response.data.data;
  },

  // Get distribution summary
  getSummary: async (filters?: DistributionFilters): Promise<DistributionSummary> => {
    const params = new URLSearchParams();
    if (filters?.dateFrom) params.append("dateFrom", filters.dateFrom);
    if (filters?.dateTo) params.append("dateTo", filters.dateTo);

    const response = await httpService.get(`/distributions/summary?${params.toString()}`);
    return response.data.data;
  },
};


