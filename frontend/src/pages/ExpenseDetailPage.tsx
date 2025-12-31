import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useExpense, useDeleteExpense } from "@/hooks/use-expenses";
import { Skeleton } from "@/components/ui/skeleton";
import { EXPENSE_CATEGORY_LABELS } from "@/services/expense.service";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ExpenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const expenseId = id ? parseInt(id) : 0;
  const { data: expense, isLoading, error } = useExpense(expenseId);
  const deleteExpense = useDeleteExpense();

  const canEdit = hasPermission("edit_expense");
  const canDelete = hasPermission("delete_expense");
  const canSeeAmount = hasPermission("view_expense_amount");

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return "-";
    return new Intl.NumberFormat(language === "fr" ? "fr-FR" : "en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "fr" ? "fr-FR" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDelete = async () => {
    if (!expense) return;
    try {
      await deleteExpense.mutateAsync(expense.id);
      setDeleteDialogOpen(false);
      navigate("/expenses");
    } catch (error) {
      // Error handled by hook
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !expense) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">
              {language === "fr"
                ? "Erreur lors du chargement de la dépense"
                : "Error loading expense"}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate("/expenses")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {language === "fr" ? "Retour à la liste" : "Back to list"}
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/expenses")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {language === "fr" ? "Détails de la dépense" : "Expense Details"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {language === "fr" ? "ID" : "ID"} #{expense.id}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {canEdit && (
              <Button
                variant="outline"
                onClick={() => navigate(`/expenses/${expense.id}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                {language === "fr" ? "Modifier" : "Edit"}
              </Button>
            )}
            {canDelete && (
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {language === "fr" ? "Supprimer" : "Delete"}
              </Button>
            )}
          </div>
        </div>

        {/* Expense Information */}
        <Card>
          <CardHeader>
            <CardTitle>
              {language === "fr" ? "Informations de la dépense" : "Expense Information"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {language === "fr" ? "Description" : "Description"}
                </label>
                <p className="text-lg mt-1">{expense.description}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {language === "fr" ? "Catégorie" : "Category"}
                </label>
                <div className="mt-1">
                  <Badge variant="secondary" className="text-sm">
                    {EXPENSE_CATEGORY_LABELS[expense.category]}
                  </Badge>
                </div>
              </div>
              {canSeeAmount && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {language === "fr" ? "Montant" : "Amount"}
                  </label>
                  <p className="text-lg mt-1 font-semibold">
                    {formatCurrency(expense.amount)} FCFA
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {language === "fr" ? "Date de création" : "Created Date"}
                </label>
                <p className="text-lg mt-1">{formatDate(expense.created_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {language === "fr" ? "Créé par" : "Created by"}
                </label>
                <p className="text-lg mt-1">
                  {expense.created_by?.username || "-"}
                </p>
              </div>
              {expense.updated_at && expense.updated_at !== expense.created_at && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {language === "fr" ? "Dernière modification" : "Last Updated"}
                  </label>
                  <p className="text-lg mt-1">{formatDate(expense.updated_at)}</p>
                </div>
              )}
              {expense.updated_by && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {language === "fr" ? "Modifié par" : "Updated by"}
                  </label>
                  <p className="text-lg mt-1">
                    {expense.updated_by?.username || "-"}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "fr" ? "Confirmer la suppression" : "Confirm Deletion"}
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
              onClick={handleDelete}
              disabled={deleteExpense.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteExpense.isPending
                ? (language === "fr" ? "Suppression..." : "Deleting...")
                : (language === "fr" ? "Supprimer" : "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

