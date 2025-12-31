import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  expenseService,
  Expense,
  CreateExpenseDTO,
  UpdateExpenseDTO,
  ExpenseFilters,
} from "@/services/expense.service";
import { useToast } from "@/hooks/use-toast";

// Re-export types for convenience
export type { Expense, CreateExpenseDTO, UpdateExpenseDTO, ExpenseFilters };

export function useExpenses(filters?: ExpenseFilters) {
  return useQuery({
    queryKey: ["expenses", filters],
    queryFn: () => expenseService.list(filters),
  });
}

export function useExpense(id: number) {
  return useQuery({
    queryKey: ["expense", id],
    queryFn: () => expenseService.getOne(id),
    enabled: !!id,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateExpenseDTO) => expenseService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-statistics"] });
      toast({
        title: "Succès",
        description: "Dépense créée avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.error || "Erreur lors de la création de la dépense",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateExpenseDTO }) =>
      expenseService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["expense-statistics"] });
      toast({
        title: "Succès",
        description: "Dépense modifiée avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.error || "Erreur lors de la modification de la dépense",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => expenseService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-statistics"] });
      toast({
        title: "Succès",
        description: "Dépense supprimée avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.error || "Erreur lors de la suppression de la dépense",
        variant: "destructive",
      });
    },
  });
}

export function useExpenseStatistics(filters?: {
  dateFrom?: string;
  dateTo?: string;
}) {
  return useQuery({
    queryKey: ["expense-statistics", filters],
    queryFn: () => expenseService.getStatistics(filters),
  });
}

