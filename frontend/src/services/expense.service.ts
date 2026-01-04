import { httpService } from "./http-service";

export type ExpenseCategory =
  | "depense_du_boss"
  | "carburant"
  | "maintenance"
  | "fournitures_bureau"
  | "loyer"
  | "salaires"
  | "communication"
  | "assurance"
  | "reparations"
  | "charges"
  | "impots"
  | "marketing"
  | "autre";

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  depense_du_boss: "Dépense du boss",
  carburant: "Carburant",
  maintenance: "Maintenance",
  fournitures_bureau: "Fournitures de bureau",
  loyer: "Loyer",
  salaires: "Salaires",
  communication: "Communication",
  assurance: "Assurance",
  reparations: "Réparations",
  charges: "Charges",
  impots: "Impôts/Taxes",
  marketing: "Marketing",
  autre: "Autre",
};

export interface Expense {
  id: number;
  description: string;
  amount: number | null; // null for staff users
  category: ExpenseCategory;
  created_by: { id: number; username: string };
  updated_by?: { id: number; username: string };
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseDTO {
  description: string;
  amount: number;
  category: ExpenseCategory;
}

export interface UpdateExpenseDTO {
  description?: string;
  amount?: number;
  category?: ExpenseCategory;
}

export interface ExpenseFilters {
  category?: ExpenseCategory;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface ExpenseListResponse {
  data: Expense[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ExpenseStatistics {
  total: number;
  totalAmount: number | null;
  byCategory: { [key: string]: number };
  todayCount: number;
  todayAmount: number | null;
  monthCount: number;
  monthAmount: number | null;
  averageAmount: number | null;
}

export const expenseService = {
  // List expenses with filters
  list: async (filters?: ExpenseFilters): Promise<ExpenseListResponse> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append("category", filters.category);
    if (filters?.dateFrom) params.append("dateFrom", filters.dateFrom);
    if (filters?.dateTo) params.append("dateTo", filters.dateTo);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const response = await httpService.get(`/expenses?${params.toString()}`);
    return response.data;
  },

  // Get single expense
  getOne: async (id: number): Promise<Expense> => {
    const response = await httpService.get(`/expenses/${id}`);
    return response.data.data;
  },

  // Create expense
  create: async (data: CreateExpenseDTO): Promise<Expense> => {
    const response = await httpService.post("/expenses", data);
    return response.data.data;
  },

  // Update expense
  update: async (id: number, data: UpdateExpenseDTO): Promise<Expense> => {
    const response = await httpService.patch(`/expenses/${id}`, data);
    return response.data.data;
  },

  // Delete expense
  delete: async (id: number): Promise<void> => {
    await httpService.delete(`/expenses/${id}`);
  },

  // Get statistics
  getStatistics: async (filters?: {
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ExpenseStatistics> => {
    const params = new URLSearchParams();
    if (filters?.dateFrom) params.append("dateFrom", filters.dateFrom);
    if (filters?.dateTo) params.append("dateTo", filters.dateTo);
    const response = await httpService.get(
      `/expenses/statistics?${params.toString()}`
    );
    return response.data.data;
  },
};


