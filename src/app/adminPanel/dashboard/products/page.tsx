"use client";

import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  Plus,
  LayoutDashboard,
  ArrowLeft,
  AlertCircle,
  FolderOpen,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Tag,
  X,
  ImageIcon,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = { id: string; name: string };

type ProductDetails = {
  model?: string;
  countryOfOrigin?: string;
  warrantyPeriod?: string;
  department?: string;
  genericName?: string;
};

type Pricing = {
  basePrice: number;
  discountPercent: number;
  taxPercent: number;
  shipping: number;
  discountAmount: number;
  taxAmount: number;
  finalPrice: number;
};

type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

type Product = {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  categoryId?: string;
  category: Category;
  createdAt: string;
  images: { url: string }[];
  pricing?: Pricing;
  details: ProductDetails[];
  stockStatus?: StockStatus;
};

type Pagination = {
  page: number;
  limit: number;
  totalProducts: number;
  totalPages: number;
};

type ApiResponse<T> = { message: string; data: T };

const EMPTY_FORM = {
  name: "",
  description: "",
  quantity: "",
  categoryId: "",
  images: [] as string[],
  basePrice: "",
  discount: "",
  tax: "",
  shipping: "",
  model: "",
  countryOfOrigin: "",
  warrantyPeriod: "",
  department: "",
  genericName: "",
};

// ─── Stock Badge ──────────────────────────────────────────────────────────────

const stockConfig: Record<string, { label: string; className: string }> = {
  IN_STOCK: { label: "In Stock", className: "bg-green-500/10 text-green-600 border-green-500/20" },
  LOW_STOCK: { label: "Low Stock", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  OUT_OF_STOCK: { label: "Out of Stock", className: "bg-red-500/10 text-red-600 border-red-500/20" },
};

function StockBadge({ status }: { status?: string }) {
  const cfg = status ? stockConfig[status] : null;
  if (!cfg) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, totalProducts: 0, totalPages: 1 });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [notAdmin, setNotAdmin] = useState(false);
  const [error, setError] = useState("");

  // Filter
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Create
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [imageInput, setImageInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Edit
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editImageInput, setEditImageInput] = useState("");
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState("");

  // Delete
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchProducts = async (page = 1, categoryId?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (categoryId && categoryId !== "all") params.set("categoryId", categoryId);

      const res = await axios.get<ApiResponse<{ products: Product[]; pagination: Pagination }>>(
        `/api/v1/admin/product?${params.toString()}`
      );
      setProducts(res.data.data.products);
      setPagination(res.data.data.pagination);
    } catch (err) {
      const axiosError = err as AxiosError;
      if (axiosError.response?.status === 401) setNotAdmin(true);
      else setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get<ApiResponse<Category[]>>("/api/v1/admin/category");
      setCategories(res.data.data);
    } catch { /* non-critical */ }
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts(1);
  }, []);

  // ── Create ─────────────────────────────────────────────────────────────────

  const createProduct = async () => {
    if (!createForm.name || !createForm.categoryId || !createForm.basePrice) {
      setCreateError("Name, category, and base price are required.");
      return;
    }
    setCreating(true);
    setCreateError("");
    try {
      await axios.post("/api/v1/admin/product", {
        ...createForm,
        quantity: createForm.quantity ? parseInt(createForm.quantity) : 0,
        // API stores prices in paise (×100)
        basePrice: createForm.basePrice ? Math.round(parseFloat(createForm.basePrice)) : undefined,
        discount: createForm.discount ? parseFloat(createForm.discount) : undefined,
        tax: createForm.tax ? parseFloat(createForm.tax) : undefined,
        shipping: createForm.shipping ? Math.round(parseFloat(createForm.shipping)) : undefined,
      });
      setOpenCreateDialog(false);
      setCreateForm(EMPTY_FORM);
      setImageInput("");
      fetchProducts(1, filterCategory);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      if (axiosError.response?.status === 401) setNotAdmin(true);
      else setCreateError(axiosError.response?.data?.message ?? "Failed to create product");
    } finally {
      setCreating(false);
    }
  };

  // ── Update ─────────────────────────────────────────────────────────────────

  const updateProduct = async () => {
    if (!editingProduct) return;
    setUpdating(true);
    setEditError("");
    try {
      await axios.patch(`/api/v1/admin/product/${editingProduct.id}`, {
        ...editForm,
        quantity: editForm.quantity ? parseInt(editForm.quantity) : undefined,
        // API stores prices in paise (×100)
        basePrice: editForm.basePrice ? Math.round(parseFloat(editForm.basePrice)) : undefined,
        discount: editForm.discount ? parseFloat(editForm.discount) : undefined,
        tax: editForm.tax ? parseFloat(editForm.tax) : undefined,
        shipping: editForm.shipping ? Math.round(parseFloat(editForm.shipping)) : undefined,
      });
      setOpenEditDialog(false);
      setEditingProduct(null);
      fetchProducts(pagination.page, filterCategory);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      if (axiosError.response?.status === 401) setNotAdmin(true);
      else setEditError(axiosError.response?.data?.message ?? "Failed to update product");
    } finally {
      setUpdating(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const deleteProduct = async () => {
    if (!deletingProduct) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/v1/admin/product/${deletingProduct.id}`);
      setDeletingProduct(null);
      fetchProducts(pagination.page, filterCategory);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      if (axiosError.response?.status === 401) setNotAdmin(true);
      else setError(axiosError.response?.data?.message ?? "Failed to delete product");
    } finally {
      setDeleting(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    const details = product.details?.[0];
    setEditForm({
      name: product.name,
      description: product.description ?? "",
      quantity: product.quantity?.toString() ?? "0",
      categoryId: product.categoryId ?? "",
      images: product.images.map((i) => i.url),
      // pricing values are already divided by 100 by the API
      basePrice: product.pricing?.basePrice?.toString() ?? "",
      discount: product.pricing?.discountPercent?.toString() ?? "",
      tax: product.pricing?.taxPercent?.toString() ?? "",
      shipping: product.pricing?.shipping?.toString() ?? "",
      model: details?.model ?? "",
      countryOfOrigin: details?.countryOfOrigin ?? "",
      warrantyPeriod: details?.warrantyPeriod ?? "",
      department: details?.department ?? "",
      genericName: details?.genericName ?? "",
    });
    setEditError("");
    setOpenEditDialog(true);
  };

  const addImage = (form: typeof EMPTY_FORM, setForm: (f: typeof EMPTY_FORM) => void, url: string, setInput: (s: string) => void) => {
    if (!url.trim()) return;
    setForm({ ...form, images: [...form.images, url.trim()] });
    setInput("");
  };

  const removeImage = (form: typeof EMPTY_FORM, setForm: (f: typeof EMPTY_FORM) => void, idx: number) => {
    setForm({ ...form, images: form.images.filter((_, i) => i !== idx) });
  };

  const handleFilterChange = (val: string) => {
    setFilterCategory(val);
    fetchProducts(1, val);
  };

  // ── Not admin ──────────────────────────────────────────────────────────────

  if (notAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-sm w-full text-center border shadow-sm">
          <CardHeader>
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don&apos;t have admin privileges to view this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => router.push("/")}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

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
          <Button variant="ghost" size="sm" className="gap-1.5 px-2 h-7" onClick={() => router.push("/adminPanel/dashboard")}>
            <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
          </Button>
          <span>/</span>
          <span className="text-foreground font-medium">Products</span>
        </div>

        {/* Title + Add */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground mt-1 text-sm">Manage your store&apos;s product catalogue.</p>
          </div>
          <Dialog open={openCreateDialog} onOpenChange={(open) => { setOpenCreateDialog(open); if (!open) { setCreateForm(EMPTY_FORM); setImageInput(""); setCreateError(""); } }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Add Product</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  Add Product
                </DialogTitle>
              </DialogHeader>
              <Separator />
              <ProductForm
                form={createForm}
                setForm={setCreateForm}
                imageInput={imageInput}
                setImageInput={setImageInput}
                categories={categories}
                error={createError}
                submitting={creating}
                submitLabel="Create Product"
                onSubmit={createProduct}
                onCancel={() => setOpenCreateDialog(false)}
                onAddImage={(url) => addImage(createForm, setCreateForm, url, setImageInput)}
                onRemoveImage={(idx) => removeImage(createForm, setCreateForm, idx)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Global error */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-4 py-3">
            <AlertCircle className="h-4 w-4 shrink-0" />{error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                <Package className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-16" /> : <p className="text-3xl font-bold">{pagination.totalProducts}</p>}
              <p className="text-xs text-muted-foreground mt-1">Across all categories</p>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">All Products</span>
              <Separator className="flex-1" />
            </div>
            <div className="ml-4 w-48">
              <Select value={filterCategory} onValueChange={handleFilterChange}>
                <SelectTrigger className="h-8 text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card className="border shadow-sm">
            {loading ? (
              <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <FolderOpen className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">No products found</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Add your first product to get started.</p>
                </div>
                <Button size="sm" variant="outline" className="mt-1 gap-2" onClick={() => setOpenCreateDialog(true)}>
                  <Plus className="h-3.5 w-3.5" /> Add Product
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Final Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Images</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product, index) => (
                      <TableRow key={product.id} className="hover:bg-muted/40">
                        <TableCell className="text-muted-foreground text-sm">
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {product.images[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={product.images[0].url} alt={product.name} className="h-8 w-8 rounded-md object-cover border" />
                            ) : (
                              <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-sm leading-tight">{product.name}</p>
                              {product.description && (
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">{product.description}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Tag className="h-2.5 w-2.5" />{product.category.name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {product.pricing ? (
                            <div className="space-y-0.5">
                              <p className="font-semibold text-foreground">₹{product.pricing.finalPrice.toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground line-through">₹{product.pricing.basePrice.toFixed(2)}</p>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {product.pricing.discountPercent > 0 && (
                                  <Badge variant="secondary" className="text-xs px-1.5 py-0">-{product.pricing.discountPercent}%</Badge>
                                )}
                                {product.pricing.taxPercent > 0 && (
                                  <Badge variant="outline" className="text-xs px-1.5 py-0 text-muted-foreground">+{product.pricing.taxPercent}% tax</Badge>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <StockBadge status={product.stockStatus} />
                            <p className="text-xs text-muted-foreground">Qty: {product.quantity ?? 0}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{product.images.length} img</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(product.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary" onClick={() => openEdit(product)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeletingProduct(product)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      Page {pagination.page} of {pagination.totalPages} · {pagination.totalProducts} products
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={pagination.page <= 1}
                        onClick={() => fetchProducts(pagination.page - 1, filterCategory)}>
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={pagination.page >= pagination.totalPages}
                        onClick={() => fetchProducts(pagination.page + 1, filterCategory)}>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onOpenChange={(open) => { setOpenEditDialog(open); if (!open) { setEditingProduct(null); setEditError(""); } }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                <Pencil className="h-4 w-4 text-primary" />
              </div>
              Edit Product
            </DialogTitle>
          </DialogHeader>
          <Separator />
          <ProductForm
            form={editForm}
            setForm={setEditForm}
            imageInput={editImageInput}
            setImageInput={setEditImageInput}
            categories={categories}
            error={editError}
            submitting={updating}
            submitLabel="Save Changes"
            onSubmit={updateProduct}
            onCancel={() => setOpenEditDialog(false)}
            onAddImage={(url) => addImage(editForm, setEditForm, url, setEditImageInput)}
            onRemoveImage={(idx) => removeImage(editForm, setEditForm, idx)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingProduct} onOpenChange={(open) => !open && setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">{deletingProduct?.name}</span>?
              This will permanently remove all associated images, cost info, details, reviews, cart items, and order items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteProduct} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Product Form (shared for create + edit) ──────────────────────────────────

type FormState = typeof EMPTY_FORM;

function ProductForm({
  form, setForm, imageInput, setImageInput, categories,
  error, submitting, submitLabel, onSubmit, onCancel, onAddImage, onRemoveImage,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  imageInput: string;
  setImageInput: (s: string) => void;
  categories: Category[];
  error: string;
  submitting: boolean;
  submitLabel: string;
  onSubmit: () => void;
  onCancel: () => void;
  onAddImage: (url: string) => void;
  onRemoveImage: (idx: number) => void;
}) {
  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [key]: e.target.value });

  return (
    <div className="space-y-5 pt-2">

      {/* Basic Info */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Basic Info</p>
        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Product Name <span className="text-destructive">*</span></label>
            <Input placeholder="e.g. Wireless Headphones" value={form.name} onChange={set("name")} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <Textarea placeholder="Product description..." value={form.description} onChange={set("description")} className="resize-none" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Category <span className="text-destructive">*</span></label>
              <Select value={form.categoryId} onValueChange={(val) => setForm({ ...form, categoryId: val })}>
                <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Stock Quantity</label>
              <Input type="number" min="0" placeholder="0" value={form.quantity} onChange={set("quantity")} />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Pricing */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Pricing</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Base Price (₹)", key: "basePrice", required: true, placeholder: "999" },
            { label: "Discount (%)", key: "discount", placeholder: "10" },
            { label: "Tax (%)", key: "tax", placeholder: "18" },
            { label: "Shipping (₹)", key: "shipping", placeholder: "50" },
          ].map(({ label, key, required, placeholder }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-sm font-medium">{label}{required && <span className="text-destructive"> *</span>}</label>
              <Input type="number" placeholder={placeholder} value={form[key as keyof FormState] as string}
                onChange={set(key as keyof FormState)} />
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Images */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Images</p>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input placeholder="Paste image URL..." value={imageInput} onChange={(e) => setImageInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onAddImage(imageInput)} />
            <Button type="button" variant="outline" size="sm" onClick={() => onAddImage(imageInput)} disabled={!imageInput.trim()}>
              Add
            </Button>
          </div>
          {form.images.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {form.images.map((url, idx) => (
                <div key={idx} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-16 w-16 rounded-md object-cover border" />
                  <button onClick={() => onRemoveImage(idx)}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Details */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Product Details</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Model", key: "model", placeholder: "XYZ-1000" },
            { label: "Generic Name", key: "genericName", placeholder: "Headphones" },
            { label: "Country of Origin", key: "countryOfOrigin", placeholder: "India" },
            { label: "Warranty Period", key: "warrantyPeriod", placeholder: "1 Year" },
            { label: "Department", key: "department", placeholder: "Electronics" },
          ].map(({ label, key, placeholder }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-sm font-medium">{label}</label>
              <Input placeholder={placeholder} value={form[key as keyof FormState] as string} onChange={set(key as keyof FormState)} />
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button className="flex-1" onClick={onSubmit} disabled={submitting}>
          {submitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </div>
  );
}








