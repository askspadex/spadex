"use client";

import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tag,
  Plus,
  LayoutDashboard,
  ArrowLeft,
  AlertCircle,
  FolderOpen,
  Pencil,
  Trash2,
} from "lucide-react";

type Category = {
  id: string;
  name: string;
  createdAt: string;
};

type ApiResponse<T> = {
  message: string;
  data: T;
};

export default function CategoriesPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [notAdmin, setNotAdmin] = useState(false);
  const [error, setError] = useState("");

  // Create
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [updating, setUpdating] = useState(false);

  // Delete
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await axios.get<ApiResponse<Category[]>>("/api/v1/admin/category");
      setCategories(res.data.data);
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 401) setNotAdmin(true);
      else setError("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async () => {
    if (!categoryName.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await axios.post<ApiResponse<Category>>("/api/v1/admin/category", { categoryName });
      setCategories((prev) => [res.data.data, ...prev]);
      setCategoryName("");
      setOpenCreateDialog(false);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      if (axiosError.response?.status === 401) setNotAdmin(true);
      else setError(axiosError.response?.data?.message ?? "Failed to create category");
    } finally {
      setCreating(false);
    }
  };

  const updateCategory = async () => {
    if (!editName.trim() || !editingCategory) return;
    setUpdating(true);
    setError("");
    try {
      const res = await axios.patch<ApiResponse<Category>>(
        `/api/v1/admin/category/${editingCategory.id}`,
        { categoryName: editName }
      );
      setCategories((prev) =>
        prev.map((c) => (c.id === editingCategory.id ? res.data.data : c))
      );
      setOpenEditDialog(false);
      setEditingCategory(null);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      if (axiosError.response?.status === 401) setNotAdmin(true);
      else setError(axiosError.response?.data?.message ?? "Failed to update category");
    } finally {
      setUpdating(false);
    }
  };

  const deleteCategory = async () => {
    if (!deletingCategory) return;
    setDeleting(true);
    setError("");
    try {
      await axios.delete(`/api/v1/admin/category/${deletingCategory.id}`);
      setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id));
      setDeletingCategory(null);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      if (axiosError.response?.status === 401) setNotAdmin(true);
      else setError(axiosError.response?.data?.message ?? "Failed to delete category");
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setEditName(category.name);
    setError("");
    setOpenEditDialog(true);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  if (notAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-sm w-full text-center border shadow-sm">
          <CardHeader>
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don&apos;t have admin privileges to view this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => router.push("/")}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b bg-card px-8 py-4 flex items-center gap-3">
        <LayoutDashboard className="h-5 w-5 text-primary" />
        <span className="font-semibold text-lg tracking-tight">Admin Panel</span>
        <Badge variant="secondary" className="ml-auto">v1.0</Badge>
      </div>

      <div className="px-8 py-8 max-w-7xl mx-auto space-y-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 px-2 h-7 cursor-pointer"
            onClick={() => router.push("/adminPanel/dashboard")}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Button>
          <span>/</span>
          <span className="text-foreground font-medium">Categories</span>
        </div>

        {/* Title + Add button */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Create, edit, and delete product categories for your store.
            </p>
          </div>

          <Dialog open={openCreateDialog} onOpenChange={(open) => { setOpenCreateDialog(open); if (!open) { setCategoryName(""); setError(""); } }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                    <Tag className="h-4 w-4 text-primary" />
                  </div>
                  Add Category
                </DialogTitle>
              </DialogHeader>
              <Separator />
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Category Name</label>
                  <Input
                    placeholder="e.g. Electronics, Clothing..."
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && createCategory()}
                  />
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" className="flex-1" onClick={() => { setOpenCreateDialog(false); setCategoryName(""); }}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={createCategory} disabled={creating || !categoryName.trim()}>
                    {creating ? "Creating..." : "Create Category"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Global error banner */}
        {error && !openCreateDialog && !openEditDialog && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-4 py-3">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Categories
              </CardTitle>
              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                <Tag className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-bold">{categories.length}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Active categories</p>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Table */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              All Categories
            </span>
            <Separator className="flex-1" />
          </div>

          <Card className="border shadow-sm">
            {loading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <FolderOpen className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">No categories found</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Create your first category to get started.
                  </p>
                </div>
                <Button size="sm" variant="outline" className="mt-1 gap-2" onClick={() => setOpenCreateDialog(true)}>
                  <Plus className="h-3.5 w-3.5" />
                  Add Category
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Category Name</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category, index) => (
                    <TableRow key={category.id} className="hover:bg-muted/40">
                      <TableCell className="text-muted-foreground text-sm">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
                            <Tag className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="font-medium">{category.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(category.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {category.id.slice(0, 8)}…
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                            onClick={() => openEdit(category)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setDeletingCategory(category)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={openEditDialog}
        onOpenChange={(open) => {
          setOpenEditDialog(open);
          if (!open) { setEditingCategory(null); setError(""); }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                <Pencil className="h-4 w-4 text-primary" />
              </div>
              Edit Category
            </DialogTitle>
          </DialogHeader>
          <Separator />
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Category Name</label>
              <Input
                placeholder="Category name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && updateCategory()}
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setOpenEditDialog(false); setEditingCategory(null); }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 cursor-pointer"
                onClick={updateCategory}
                disabled={updating || !editName.trim() || editName === editingCategory?.name}
              >
                {updating ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingCategory}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {deletingCategory?.name}
              </span>
              ? This action cannot be undone and may affect associated products.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteCategory}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}