import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Filter, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  useExpenses,
  useDeleteExpense,
  Expense,
} from "@/hooks/use-expenses";
import { Skeleton } from "@/components/ui/skeleton";
import { ExpenseStats } from "@/components/expenses/ExpenseStats";
import {
  ExpenseCategory,
  EXPENSE_CATEGORY_LABELS,
} from "@/services/expense.service";

export default function ExpenseListPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { hasPermission, user } = useAuth();

  const [filters, setFilters] = useState({
    category: "" as ExpenseCategory | "",
    dateFrom: "",
    dateTo: "",
    page: 1,
    limit: 20,
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const { data, isLoading, error } = useExpenses(filters);
  const deleteExpense = useDeleteExpense();

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "-";
    return new Intl.NumberFormat(language === "fr" ? "fr-FR" : "en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "fr" ? "fr-FR" : "en-US");
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      dateFrom: "",
      dateTo: "",
      page: 1,
      limit: 20,
    });
  };

  const handleDelete = (expense: Expense) => {
    setExpenseToDelete(expense);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;

    try {
      await deleteExpense.mutateAsync(expenseToDelete.id);
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const canEdit = hasPermission("edit_expense");
  const canDelete = hasPermission("delete_expense");
  const canSeeAmount = user?.role !== "staff";

  if (error) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">
              {language === "fr"
                ? "Erreur lors du chargement des dépenses"
                : "Error loading expenses"}
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {language === "fr" ? "Dépenses" : "Expenses"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === "fr"
                ? "Gérez toutes vos dépenses"
                : "Manage all your expenses"}
            </p>
          </div>
          {hasPermission("create_expense") && (
            <Button onClick={() => navigate("/expenses/new")}>
              <Plus className="mr-2 h-4 w-4" />
              {language === "fr" ? "Nouvelle dépense" : "New Expense"}
            </Button>
          )}
        </div>

        {/* Statistics */}
        <ExpenseStats />

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              {language === "fr" ? "Filtres" : "Filters"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === "fr" ? "Catégorie" : "Category"}
                </label>
                <Select
                  value={filters.category || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("category", value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={language === "fr" ? "Toutes" : "All"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {language === "fr" ? "Toutes" : "All"}
                    </SelectItem>
                    {(Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]).map(
                      (category) => (
                        <SelectItem key={category} value={category}>
                          {EXPENSE_CATEGORY_LABELS[category]}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === "fr" ? "Date de début" : "Start Date"}
                </label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === "fr" ? "Date de fin" : "End Date"}
                </label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  {language === "fr" ? "Effacer" : "Clear"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {language === "fr" ? "Liste des dépenses" : "Expenses List"}
            </CardTitle>
            <CardDescription>
              {data?.pagination.total || 0}{" "}
              {language === "fr" ? "dépenses trouvées" : "expenses found"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !data?.data || data.data.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {language === "fr"
                    ? "Aucune dépense trouvée"
                    : "No expenses found"}
                </p>
                {hasPermission("create_expense") && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => navigate("/expenses/new")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {language === "fr" ? "Nouvelle dépense" : "New Expense"}
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        {language === "fr" ? "Date" : "Date"}
                      </TableHead>
                      <TableHead>
                        {language === "fr" ? "Description" : "Description"}
                      </TableHead>
                      <TableHead>
                        {language === "fr" ? "Catégorie" : "Category"}
                      </TableHead>
                      {canSeeAmount && (
                        <TableHead className="text-right">
                          {language === "fr" ? "Montant" : "Amount"}
                        </TableHead>
                      )}
                      <TableHead>
                        {language === "fr" ? "Créé par" : "Created by"}
                      </TableHead>
                      <TableHead className="w-12 text-right">
                        {language === "fr" ? "Actions" : "Actions"}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="text-muted-foreground">
                          {formatDate(expense.created_at)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {expense.description}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                            {EXPENSE_CATEGORY_LABELS[expense.category]}
                          </span>
                        </TableCell>
                        {canSeeAmount && (
                          <TableCell className="text-right font-medium">
                            {expense.amount !== null
                              ? `${formatCurrency(expense.amount)} FCFA`
                              : "-"}
                          </TableCell>
                        )}
                        <TableCell className="text-muted-foreground">
                          {expense.created_by?.username || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canEdit && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    navigate(`/expenses/${expense.id}/edit`)
                                  }
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  {language === "fr" ? "Modifier" : "Edit"}
                                </DropdownMenuItem>
                              )}
                              {canDelete && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(expense)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {language === "fr" ? "Supprimer" : "Delete"}
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {data.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      {language === "fr"
                        ? `Page ${data.pagination.page} sur ${data.pagination.totalPages}`
                        : `Page ${data.pagination.page} of ${data.pagination.totalPages}`}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={data.pagination.page === 1}
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            page: prev.page - 1,
                          }))
                        }
                      >
                        {language === "fr" ? "Précédent" : "Previous"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          data.pagination.page >= data.pagination.totalPages
                        }
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            page: prev.page + 1,
                          }))
                        }
                      >
                        {language === "fr" ? "Suivant" : "Next"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {language === "fr"
                  ? "Confirmer la suppression"
                  : "Confirm deletion"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {language === "fr"
                  ? `Êtes-vous sûr de vouloir supprimer cette dépense ? Cette action est irréversible.`
                  : `Are you sure you want to delete this expense? This action cannot be undone.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {language === "fr" ? "Annuler" : "Cancel"}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {language === "fr" ? "Supprimer" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}

