import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  UserPlus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  useUsers,
  useDeleteUser,
  useCreateUser,
  useUpdateUser,
} from "@/hooks/use-users";
import { UserRole } from "@/types/role";
import { User, UpdateUserDTO } from "@/services/user.service";
import { Skeleton } from "@/components/ui/skeleton";

const roleLabels: Record<UserRole, { fr: string; en: string }> = {
  [UserRole.ADMIN]: { fr: "Administrateur", en: "Administrator" },
  [UserRole.STAFF]: { fr: "Personnel", en: "Staff" },
  [UserRole.OPERATIONAL_ACCOUNTANT]: {
    fr: "Comptable Opérationnel",
    en: "Operational Accountant",
  },
  [UserRole.SUPERVISOR]: { fr: "Superviseur", en: "Supervisor" },
};

export default function UserListPage() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: UserRole.STAFF as UserRole,
  });

  const { data: users, isLoading } = useUsers();
  const deleteUser = useDeleteUser();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "fr" ? "fr-FR" : "en-US");
  };

  const getRoleLabel = (role: UserRole) => {
    return roleLabels[role]?.[language] || role;
  };

  const filteredUsers =
    users?.filter(
      (user) =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getRoleLabel(user.role).toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      username: "",
      password: "",
      role: UserRole.STAFF,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: "",
      role: user.role,
    });
    setDialogOpen(true);
  };

  const handleDelete = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      deleteUser.mutate(userToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setUserToDelete(null);
        },
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      const updateData: UpdateUserDTO = {
        username: formData.username,
        role: formData.role,
      };
      if (formData.password) {
        updateData.password = formData.password;
      }
      updateUser.mutate(
        { id: editingUser.id, data: updateData },
        {
          onSuccess: () => {
            setDialogOpen(false);
            setEditingUser(null);
          },
        }
      );
    } else {
      createUser.mutate(formData, {
        onSuccess: () => {
          setDialogOpen(false);
          setFormData({
            username: "",
            password: "",
            role: UserRole.STAFF,
          });
        },
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t("nav.users")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === "fr"
                ? "Gérer les utilisateurs du système"
                : "Manage system users"}
            </p>
          </div>
          <Button onClick={handleOpenCreate} className="w-full md:w-auto">
            <UserPlus className="mr-2 h-4 w-4" />
            {language === "fr" ? "Nouvel utilisateur" : "New User"}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("nav.users")}</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={
                    language === "fr" ? "Rechercher..." : "Search..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !filteredUsers || filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {language === "fr"
                    ? "Aucun utilisateur trouvé"
                    : "No users found"}
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleOpenCreate}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {language === "fr" ? "Nouvel utilisateur" : "New User"}
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        {language === "fr" ? "Nom d'utilisateur" : "Username"}
                      </TableHead>
                      <TableHead>
                        {language === "fr" ? "Rôle" : "Role"}
                      </TableHead>
                      <TableHead>
                        {language === "fr"
                          ? "Date de création"
                          : "Created Date"}
                      </TableHead>
                      <TableHead className="w-12 text-right">
                        {language === "fr" ? "Actions" : "Actions"}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.username}
                          {currentUser?.id === user.id && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({language === "fr" ? "Vous" : "You"})
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                            {getRoleLabel(user.role)}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(user.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleOpenEdit(user)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                {language === "fr" ? "Modifier" : "Edit"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(user)}
                                disabled={currentUser?.id === user.id}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {language === "fr" ? "Supprimer" : "Delete"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingUser
                    ? language === "fr"
                      ? "Modifier l'utilisateur"
                      : "Edit User"
                    : language === "fr"
                    ? "Nouvel utilisateur"
                    : "New User"}
                </DialogTitle>
                <DialogDescription>
                  {editingUser
                    ? language === "fr"
                      ? "Modifiez les informations de l'utilisateur"
                      : "Edit user information"
                    : language === "fr"
                    ? "Créer un nouvel utilisateur dans le système"
                    : "Create a new user in the system"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">
                    {language === "fr" ? "Nom d'utilisateur" : "Username"}
                  </Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">
                    {language === "fr" ? "Mot de passe" : "Password"}
                    {editingUser && (
                      <span className="text-xs text-muted-foreground ml-2">
                        (
                        {language === "fr"
                          ? "Laisser vide pour ne pas changer"
                          : "Leave empty to keep unchanged"}
                        )
                      </span>
                    )}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required={!editingUser}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">
                    {language === "fr" ? "Rôle" : "Role"}
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({ ...formData, role: value as UserRole })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(UserRole).map((role) => (
                        <SelectItem key={role} value={role}>
                          {getRoleLabel(role)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  {language === "fr" ? "Annuler" : "Cancel"}
                </Button>
                <Button type="submit">
                  {editingUser
                    ? language === "fr"
                      ? "Enregistrer"
                      : "Save"
                    : language === "fr"
                    ? "Créer"
                    : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {language === "fr" ? "Supprimer l'utilisateur" : "Delete User"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {language === "fr"
                  ? `Êtes-vous sûr de vouloir supprimer l'utilisateur "${userToDelete?.username}" ? Cette action est irréversible.`
                  : `Are you sure you want to delete user "${userToDelete?.username}"? This action cannot be undone.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {language === "fr" ? "Annuler" : "Cancel"}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
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
