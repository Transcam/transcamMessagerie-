import { useQuery } from "@tanstack/react-query";
import {
  distributionService,
  DistributionFilters,
  DriverDistribution,
  MinistryDistribution,
  AgencyDistribution,
  DistributionSummary,
} from "@/services/distribution.service";

export type {
  DistributionFilters,
  DriverDistribution,
  MinistryDistribution,
  AgencyDistribution,
  DistributionSummary,
};

export function useDriverDistributions(filters?: DistributionFilters) {
  return useQuery({
    queryKey: ["distributions", "drivers", filters],
    queryFn: () => distributionService.getDriverDistributions(filters),
  });
}

export function useMinistryDistribution(filters?: DistributionFilters) {
  return useQuery({
    queryKey: ["distributions", "ministry", filters],
    queryFn: () => distributionService.getMinistryDistribution(filters),
  });
}

export function useAgencyDistribution(filters?: DistributionFilters) {
  return useQuery({
    queryKey: ["distributions", "agency", filters],
    queryFn: () => distributionService.getAgencyDistribution(filters),
  });
}

export function useDistributionSummary(filters?: DistributionFilters) {
  return useQuery({
    queryKey: ["distributions", "summary", filters],
    queryFn: () => distributionService.getSummary(filters),
  });
}


