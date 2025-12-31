import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useExpense, useUpdateExpense } from "@/hooks/use-expenses";
import {
  ExpenseCategory,
  EXPENSE_CATEGORY_LABELS,
} from "@/services/expense.service";
import { Skeleton } from "@/components/ui/skeleton";

// Form validation schema
const expenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  category: z.enum([
    "depense_du_boss",
    "carburant",
    "maintenance",
    "fournitures_bureau",
    "loyer",
    "salaires",
    "communication",
    "assurance",
    "reparations",
    "charges",
    "impots",
    "marketing",
    "autre",
  ]),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export default function EditExpensePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const expenseId = parseInt(id || "0");
  const { language } = useLanguage();
  const { data: expense, isLoading: isLoadingExpense } = useExpense(expenseId);
  const updateExpense = useUpdateExpense();

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      amount: 0,
      category: undefined,
    },
  });

  // Update form when expense data loads
  useEffect(() => {
    if (expense) {
      form.reset({
        description: expense.description,
        amount: expense.amount || 0,
        category: expense.category,
      });
    }
  }, [expense, form]);

  const onSubmit = async (data: ExpenseFormValues) => {
    if (!expenseId) return;
    try {
      await updateExpense.mutateAsync({ id: expenseId, data });
      navigate("/expenses");
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  if (isLoadingExpense) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!expense) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-destructive">
                {language === "fr"
                  ? "Dépense non trouvée"
                  : "Expense not found"}
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">
            {language === "fr" ? "Modifier la dépense" : "Edit Expense"}
          </h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {language === "fr"
                    ? "Informations de la dépense"
                    : "Expense Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {language === "fr" ? "Description" : "Description"} *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={
                            language === "fr"
                              ? "Entrez la description de la dépense..."
                              : "Enter expense description..."
                          }
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {language === "fr" ? "Catégorie" : "Category"} *
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                language === "fr"
                                  ? "Sélectionner une catégorie"
                                  : "Select a category"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]).map(
                            (category) => (
                              <SelectItem key={category} value={category}>
                                {EXPENSE_CATEGORY_LABELS[category]}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {language === "fr" ? "Montant" : "Amount"} (FCFA) *
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="50000"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "" || /^\d*\.?\d*$/.test(value)) {
                              field.onChange(
                                value === "" ? 0 : parseFloat(value) || 0
                              );
                            }
                          }}
                          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigate(-1)}
              >
                {language === "fr" ? "Annuler" : "Cancel"}
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={updateExpense.isPending}
              >
                {updateExpense.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {language === "fr" ? "Enregistrement..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {language === "fr" ? "Enregistrer" : "Save"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}

