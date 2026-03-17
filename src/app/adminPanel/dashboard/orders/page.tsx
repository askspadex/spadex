"use client";

import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingCart,
  LayoutDashboard,
  ArrowLeft,
  AlertCircle,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  Eye,
  Package,
  User,
  ImageIcon,
  CalendarIcon,
  X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type DeliveryStatus = "PAYMENT_PENDING" | "ORDERED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  deliveryStatus: DeliveryStatus;
  deliveryDate?: string;
  product: {
    id: string;
    name: string;
    images: { url: string }[];
  };
};

type Order = {
  id: string;
  status: DeliveryStatus;
  createdAt: string;
  totalAmount?: number;
  user: {
    name?: string;
    email: string;
    image?: string;
    createdAt: string;
  };
  orderItems: OrderItem[];
};

type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type ApiResponse<T> = { message: string; data: T };

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_OPTIONS: DeliveryStatus[] = ["PAYMENT_PENDING", "ORDERED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

const statusColor: Record<DeliveryStatus, string> = {
  PAYMENT_PENDING: "bg-red-500/10 text-red-600 border-red-500/20",
  ORDERED: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  PROCESSING: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  SHIPPED: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  DELIVERED: "bg-green-500/10 text-green-600 border-green-500/20",
  CANCELLED: "bg-red-500/10 text-red-600 border-red-500/20",
};

function StatusBadge({ status }: { status: DeliveryStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor[status]}`}>
      {status}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [notAdmin, setNotAdmin] = useState(false);
  const [error, setError] = useState("");

  // Filter
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Detail modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Status update
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Order item status update
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  // Per-item delivery date inputs (itemId -> date string "YYYY-MM-DD")
  const [itemDateInputs, setItemDateInputs] = useState<Record<string, string>>({});

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchOrders = async (page = 1, status?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (status && status !== "all") params.set("status", status);

      const res = await axios.get<ApiResponse<{ orders: Order[]; pagination: Pagination }>>(
        `/api/v1/admin/orders?${params.toString()}`
      );
      setOrders(res.data.data.orders);
      setPagination(res.data.data.pagination);
    } catch (err) {
      const axiosError = err as AxiosError;
      if (axiosError.response?.status === 401) setNotAdmin(true);
      else setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetail = async (orderId: string) => {
    setDetailLoading(true);
    try {
      const res = await axios.get<ApiResponse<Order>>(`/api/v1/admin/orders/${orderId}`);
      setSelectedOrder(res.data.data);
      // Pre-fill date inputs from existing deliveryDate values
      const dates: Record<string, string> = {};
      res.data.data.orderItems.forEach((item) => {
        if (item.deliveryDate) {
          dates[item.id] = new Date(item.deliveryDate).toISOString().split("T")[0];
        }
      });
      setItemDateInputs(dates);
    } catch (err) {
      const axiosError = err as AxiosError;
      if (axiosError.response?.status === 401) setNotAdmin(true);
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Update order status ────────────────────────────────────────────────────

  const updateOrderStatus = async (orderId: string, status: DeliveryStatus) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await axios.patch<ApiResponse<Order>>(`/api/v1/admin/orders/${orderId}/status`, { status });
      // Update in list
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: res.data.data.status } : o));
      // Update in detail modal if open
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => prev ? { ...prev, status: res.data.data.status } : prev);
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message ?? "Failed to update order status");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // ── Update order item delivery status ──────────────────────────────────────

  const updateItemStatus = async (itemId: string, deliveryStatus: DeliveryStatus, deliveryDate?: string) => {
    setUpdatingItemId(itemId);
    try {
      const res = await axios.patch<ApiResponse<OrderItem>>(`/api/v1/admin/order-item/${itemId}/status`, {
        deliveryStatus,
        ...(deliveryDate ? { deliveryDate } : {}),
      });
      // Sync date input with saved value
      if (res.data.data.deliveryDate) {
        setItemDateInputs((prev) => ({
          ...prev,
          [itemId]: new Date(res.data.data.deliveryDate!).toISOString().split("T")[0],
        }));
      }
      // Update item in selected order modal
      setSelectedOrder((prev) =>
        prev
          ? {
              ...prev,
              orderItems: prev.orderItems.map((item) =>
                item.id === itemId
                  ? { ...item, deliveryStatus: res.data.data.deliveryStatus, deliveryDate: res.data.data.deliveryDate }
                  : item
              ),
            }
          : prev
      );
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message ?? "Failed to update item status");
    } finally {
      setUpdatingItemId(null);
    }
  };

  useEffect(() => { fetchOrders(1); }, []);

  const handleFilterChange = (val: string) => {
    setFilterStatus(val);
    fetchOrders(1, val);
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
          <span className="text-foreground font-medium">Orders</span>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground mt-1 text-sm">View and manage all customer orders and delivery statuses.</p>
        </div>

        {/* Global error */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-4 py-3">
            <AlertCircle className="h-4 w-4 shrink-0" />{error}
            <button className="ml-auto text-xs underline" onClick={() => setError("")}>Dismiss</button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                <ShoppingCart className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-16" /> : <p className="text-3xl font-bold">{pagination.total}</p>}
              <p className="text-xs text-muted-foreground mt-1">All time orders</p>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">All Orders</span>
              <Separator className="flex-1" />
            </div>
            <div className="ml-4 w-48">
              <Select value={filterStatus} onValueChange={handleFilterChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card className="border shadow-sm">
            {loading ? (
              <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <FolderOpen className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="font-medium text-sm">No orders found</p>
                <p className="text-xs text-muted-foreground">Orders placed by customers will appear here.</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Update Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order, index) => (
                      <TableRow key={order.id} className="hover:bg-muted/40">
                        <TableCell className="text-muted-foreground text-sm">
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">{order.id.slice(0, 8)}…</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {order.user.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={order.user.image} alt="" className="h-7 w-7 rounded-full object-cover border" />
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium leading-tight">{order.user.name ?? "—"}</p>
                              <p className="text-xs text-muted-foreground">{order.user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{order.orderItems.length} item{order.orderItems.length !== 1 ? "s" : ""}</Badge>
                        </TableCell>
                        <TableCell><StatusBadge status={order.status} /></TableCell>
                        <TableCell>
                          <Select
                            value={order.status}
                            onValueChange={(val) => updateOrderStatus(order.id, val as DeliveryStatus)}
                            disabled={updatingOrderId === order.id}
                          >
                            <SelectTrigger className="h-7 text-xs w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                            onClick={() => fetchOrderDetail(order.id)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      Page {pagination.page} of {pagination.totalPages} · {pagination.total} orders
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0"
                        disabled={pagination.page <= 1}
                        onClick={() => fetchOrders(pagination.page - 1, filterStatus)}>
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0"
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() => fetchOrders(pagination.page + 1, filterStatus)}>
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

      {/* Order Detail Modal */}
      <Dialog open={!!selectedOrder || detailLoading} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                <ShoppingCart className="h-4 w-4 text-primary" />
              </div>
              Order Details
            </DialogTitle>
          </DialogHeader>
          <Separator />

          {detailLoading ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : selectedOrder ? (
            <div className="space-y-6 pt-2">

              {/* Order meta */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Order ID</p>
                  <p className="font-mono text-sm font-medium">{selectedOrder.id.slice(0, 16)}…</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Placed On</p>
                  <p className="text-sm font-medium">
                    {new Date(selectedOrder.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Order Status</p>
                  <StatusBadge status={selectedOrder.status} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Update Order Status</p>
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(val) => updateOrderStatus(selectedOrder.id, val as DeliveryStatus)}
                    disabled={!!updatingOrderId}
                  >
                    <SelectTrigger className="h-7 text-xs w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Customer */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Customer</p>
                <div className="flex items-center gap-3">
                  {selectedOrder.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedOrder.user.image} alt="" className="h-10 w-10 rounded-full object-cover border" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-sm">{selectedOrder.user.name ?? "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{selectedOrder.user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Member since {new Date(selectedOrder.user.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Order Items */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  Order Items ({selectedOrder.orderItems.length})
                </p>
                <div className="space-y-3">
                  {selectedOrder.orderItems.map((item) => (
                    <Card key={item.id} className="border shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {item.product.images[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.product.images[0].url} alt={item.product.name} className="h-14 w-14 rounded-md object-cover border shrink-0" />
                          ) : (
                            <div className="h-14 w-14 rounded-md bg-muted flex items-center justify-center shrink-0">
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium text-sm leading-tight">{item.product.name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Qty: {item.quantity} </p>
                              </div>
                              <StatusBadge status={item.deliveryStatus} />
                            </div>

                            {item.deliveryDate && (
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <CalendarIcon className="h-3 w-3" />
                                Delivered: {new Date(item.deliveryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </p>
                            )}

                            {/* Item controls */}
                            <div className="mt-3 space-y-2">
                              {/* Delivery Status */}
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground w-24 shrink-0">Delivery Status</span>
                                <Select
                                  value={item.deliveryStatus}
                                  onValueChange={(val) =>
                                    updateItemStatus(
                                      item.id,
                                      val as DeliveryStatus,
                                      itemDateInputs[item.id]
                                        ? new Date(itemDateInputs[item.id]).toISOString()
                                        : undefined
                                    )
                                  }
                                  disabled={updatingItemId === item.id}
                                >
                                  <SelectTrigger className="h-7 text-xs w-36">
                                    <Package className="h-3 w-3 mr-1" />
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {STATUS_OPTIONS.map((s) => (
                                      <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Delivery Date */}
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground w-24 shrink-0">Delivery Date</span>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="date"
                                    className="h-7 text-xs w-36 px-2"
                                    value={itemDateInputs[item.id] ?? ""}
                                    onChange={(e) =>
                                      setItemDateInputs((prev) => ({
                                        ...prev,
                                        [item.id]: e.target.value,
                                      }))
                                    }
                                    disabled={updatingItemId === item.id}
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs px-2 gap-1"
                                    disabled={
                                      updatingItemId === item.id ||
                                      !itemDateInputs[item.id]
                                    }
                                    onClick={() =>
                                      updateItemStatus(
                                        item.id,
                                        item.deliveryStatus,
                                        new Date(itemDateInputs[item.id]).toISOString()
                                      )
                                    }
                                  >
                                    <CalendarIcon className="h-3 w-3" />
                                    {updatingItemId === item.id ? "Saving…" : "Save"}
                                  </Button>
                                  {itemDateInputs[item.id] && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                      disabled={updatingItemId === item.id}
                                      onClick={() =>
                                        setItemDateInputs((prev) => {
                                          const next = { ...prev };
                                          delete next[item.id];
                                          return next;
                                        })
                                      }
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}