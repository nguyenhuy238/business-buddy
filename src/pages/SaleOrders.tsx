import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
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
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Ban,
  Calendar,
  ChevronLeft,
  ChevronRight,
  History,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/format";
import {
  getSaleOrders,
  updateSaleOrder,
  deleteSaleOrder,
  createSaleOrderRefund,
  type SaleOrderRefundItemRequest,
} from "@/services/saleOrderService";
import type { PaymentMethod, SaleOrder } from "@/types";

/**
 * Available order status values (must match backend enum names)
 */
type SaleOrderStatus = "Draft" | "Completed" | "Cancelled" | "Refunded";

/**
 * Filters for sale orders list
 */
interface SaleOrderFilters {
  search: string;
  status: "all" | SaleOrderStatus;
}

/**
 * Dialog state for viewing and editing sale orders
 */
interface OrderDialogState {
  mode: "view" | "edit";
  order: SaleOrder | null;
}

/**
 * Edit form state for basic order fields
 */
interface EditOrderForm {
  status: SaleOrderStatus;
  paymentMethod: PaymentMethod;
  paidAmount: number;
  notes: string;
}

/**
 * State for selecting which items and quantities to refund in a partial return.
 */
interface RefundLineState {
  orderItemId: string;
  productName: string;
  maxQuantity: number;
  quantity: number;
  unitPrice: number;
}

/**
 * Sale Orders Management Page
 * - View list of sale orders with filters and pagination
 * - View order details (items, customer, totals)
 * - Edit basic fields for draft orders
 * - Cancel or refund completed orders (status changes only, stock handled on backend)
 */
export default function SaleOrders() {
  const [orders, setOrders] = useState<SaleOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<SaleOrderFilters>({
    search: "",
    status: "all",
  });

  const [dialogState, setDialogState] = useState<OrderDialogState>({
    mode: "view",
    order: null,
  });

  const [editForm, setEditForm] = useState<EditOrderForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    null | { type: "cancel" | "refund" | "delete"; order: SaleOrder }
  >(null);

  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundLines, setRefundLines] = useState<RefundLineState[]>([]);
  const [refundDescription, setRefundDescription] = useState("");

  /**
   * Load sale orders from API with current pagination
   * Note: server-side already supports basic filters, but we keep search filter client-side for now.
   */
  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getSaleOrders(undefined, undefined, undefined, page, pageSize);
      setOrders(response.items);
      setTotal(response.total);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Không thể tải danh sách đơn hàng bán";
      setError(message);
      // eslint-disable-next-line no-console
      console.error("Error loading sale orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  /**
   * Apply client-side filters (search by code or customer name, status)
   */
  const filteredOrders = useMemo(() => {
    const searchLower = filters.search.trim().toLowerCase();

    return orders.filter((order) => {
      if (filters.status !== "all" && order.status !== filters.status) {
        return false;
      }

      if (searchLower.length === 0) {
        return true;
      }

      const codeMatch = order.code.toLowerCase().includes(searchLower);
      const customerName = order.customerName ?? "";
      const customerMatch = customerName.toLowerCase().includes(searchLower);

      return codeMatch || customerMatch;
    });
  }, [orders, filters]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  /**
   * Open order details dialog
   */
  const openOrder = (order: SaleOrder) => {
    setDialogState({ mode: "view", order });
    setEditForm(null);
  };

  /**
   * Determine if order is editable (only drafts can be edited safely)
   */
  const canEditOrder = (order: SaleOrder | null): boolean => {
    if (!order) {
      return false;
    }
    return order.status === "Draft";
  };

  /**
   * Open edit mode for current order
   */
  const startEdit = () => {
    if (!dialogState.order || !canEditOrder(dialogState.order)) {
      return;
    }

    const order = dialogState.order;

    setEditForm({
      status: order.status,
      paymentMethod: order.paymentMethod,
      paidAmount: order.paidAmount,
      notes: order.notes ?? "",
    });
    setDialogState({ mode: "edit", order });
  };

  /**
   * Handle edit form field change
   */
  const updateEditField = <K extends keyof EditOrderForm>(
    key: K,
    value: EditOrderForm[K],
  ) => {
    setEditForm((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        [key]: value,
      };
    });
  };

  /**
   * Save basic changes for draft order
   */
  const saveEdit = async () => {
    if (!dialogState.order || !editForm) {
      return;
    }

    const order = dialogState.order;

    try {
      setSaving(true);
      setError(null);

      const updatedOrder = await updateSaleOrder(order.id, {
        status: editForm.status,
        paymentMethod: editForm.paymentMethod,
        paidAmount: editForm.paidAmount,
        notes: editForm.notes,
        subtotal: order.subtotal,
        discount: order.discount,
        discountType: order.discountType,
        total: order.total,
        customerId: order.customerId,
        items: order.items,
        createdBy: order.createdBy,
        createdAt: order.createdAt,
        code: order.code,
      });

      // Update local state list
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)),
      );

      // Update dialog state
      setDialogState({
        mode: "view",
        order: updatedOrder,
      });
      setEditForm(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Không thể lưu thay đổi đơn hàng";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Request cancel/refund/delete confirmation
   */
  const requestAction = (type: "cancel" | "refund" | "delete", order: SaleOrder) => {
    setConfirmAction({ type, order });
  };

  /**
   * Perform cancel/refund/delete after confirmation
   */
  const confirmActionAndRun = async () => {
    if (!confirmAction) {
      return;
    }

    const { type, order } = confirmAction;

    try {
      setSaving(true);
      setError(null);

      if (type === "delete") {
        await deleteSaleOrder(order.id);
        setOrders((prev) => prev.filter((o) => o.id !== order.id));
        if (dialogState.order?.id === order.id) {
          setDialogState({ mode: "view", order: null });
        }
      } else if (type === "cancel") {
        const newStatus: SaleOrderStatus =
          type === "cancel" ? "Cancelled" : "Refunded";

        const updatedOrder = await updateSaleOrder(order.id, {
          ...order,
          status: newStatus,
        });

        setOrders((prev) =>
          prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)),
        );

        if (dialogState.order?.id === order.id) {
          setDialogState({
            mode: "view",
            order: updatedOrder,
          });
        }
      } else if (type === "refund") {
        // Open partial refund dialog instead of directly setting status
        const lines: RefundLineState[] = order.items.map((item) => ({
          orderItemId: (item as { id?: string }).id ?? "",
          productName: item.productName,
          maxQuantity: item.quantity,
          quantity: 0,
          unitPrice: item.unitPrice,
        }));

        setRefundLines(lines);
        setRefundDescription("");
        setRefundDialogOpen(true);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Không thể cập nhật trạng thái đơn hàng";
      setError(message);
    } finally {
      setSaving(false);
      setConfirmAction(null);
    }
  };

  /**
   * Map status to label and badge variant
   */
  const renderStatusBadge = (status: SaleOrderStatus) => {
    if (status === "Completed") {
      return (
        <Badge variant="secondary">
          Hoàn thành
        </Badge>
      );
    }
    if (status === "Draft") {
      return (
        <Badge variant="outline">
          Nháp
        </Badge>
      );
    }
    if (status === "Cancelled") {
      return (
        <Badge variant="destructive">
          Đã hủy
        </Badge>
      );
    }
    return (
      <Badge variant="destructive">
        Đã hoàn tiền
      </Badge>
    );
  };

  /**
   * Map payment method to Vietnamese label
   */
  const getPaymentLabel = (method: PaymentMethod): string => {
    if (method === "Cash") return "Tiền mặt";
    if (method === "BankTransfer") return "Chuyển khoản";
    if (method === "VietQR") return "VietQR";
    if (method === "Momo") return "Momo";
    if (method === "ZaloPay") return "ZaloPay";
    if (method === "Credit") return "Ghi nợ";
    return method;
  };

  const currentOrder = dialogState.order;
  const isEditMode = dialogState.mode === "edit" && currentOrder !== null && editForm !== null;

  /**
   * Compute estimated refund amount from selected refund lines
   */
  const estimatedRefundAmount = useMemo(() => {
    return refundLines.reduce((sum, line) => {
      if (line.quantity <= 0) {
        return sum;
      }
      return sum + line.quantity * line.unitPrice;
    }, 0);
  }, [refundLines]);

  /**
   * Submit partial refund to backend
   */
  const submitPartialRefund = async () => {
    if (!currentOrder) {
      return;
    }

    const validLines = refundLines.filter((line) => line.quantity > 0 && line.orderItemId);
    if (validLines.length === 0) {
      setError("Vui lòng chọn ít nhất một dòng để trả hàng");
      return;
    }

    const items: SaleOrderRefundItemRequest[] = validLines.map((line) => ({
      orderItemId: line.orderItemId,
      quantity: line.quantity,
    }));

    try {
      setSaving(true);
      setError(null);

      const response = await createSaleOrderRefund(currentOrder.id, {
        orderId: currentOrder.id,
        items,
        paymentMethod: currentOrder.paymentMethod,
        updateReceivables: true,
        createCashbookEntry: true,
        description: refundDescription,
        transactionDate: new Date().toISOString(),
        createdBy: currentOrder.createdBy,
      });

      // After refund, we keep order status as Completed (could be enhanced later)
      await loadOrders();
      setRefundDialogOpen(false);
      setRefundLines([]);
      setRefundDescription("");

      // Optionally show success message in error area as info
      // eslint-disable-next-line no-console
      console.log("Partial refund success:", response);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Không thể tạo phiếu trả hàng";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Đơn hàng bán"
        subtitle="Quản lý danh sách đơn hàng, chỉnh sửa, hủy và hoàn tiền"
      />

      <div className="p-6 space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Toolbar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm theo mã đơn hoặc tên khách hàng..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    search: e.target.value,
                  }))
                }
                className="pl-9"
              />
            </div>
            <Select
              value={filters.status}
              onValueChange={(value: string) => {
                if (
                  value === "all" ||
                  value === "Draft" ||
                  value === "Completed" ||
                  value === "Cancelled" ||
                  value === "Refunded"
                ) {
                  setFilters((prev) => ({
                    ...prev,
                    status: value,
                  }));
                }
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="Draft">Nháp</SelectItem>
                <SelectItem value="Completed">Hoàn thành</SelectItem>
                <SelectItem value="Cancelled">Đã hủy</SelectItem>
                <SelectItem value="Refunded">Đã hoàn tiền</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                void loadOrders();
              }}
              disabled={loading}
              title="Làm mới"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <History className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">
                Chưa có đơn hàng nào
              </p>
              <p className="text-sm text-muted-foreground">
                {filters.search
                  ? "Thử thay đổi từ khóa tìm kiếm"
                  : "Đơn hàng sẽ xuất hiện tại đây sau khi tạo từ POS"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã đơn</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Thanh toán</TableHead>
                  <TableHead className="text-right">Tổng tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openOrder(order)}
                  >
                    <TableCell>
                      <div className="font-mono text-sm">{order.code}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {order.customerName ?? "Khách lẻ"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDateTime(order.createdAt)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {getPaymentLabel(order.paymentMethod)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-primary">
                        {formatCurrency(order.total)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {renderStatusBadge(order.status)}
                    </TableCell>
                    <TableCell>
                      {/* Reserved for future context menu */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Trang {page} / {totalPages} • {total.toLocaleString()} đơn hàng
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Order detail / edit dialog */}
      <Dialog
        open={currentOrder !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDialogState({ mode: "view", order: null });
            setEditForm(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {currentOrder && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Đơn hàng {currentOrder.code}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Top summary */}
                <div className="grid gap-4 md:grid-cols-3 text-sm">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">
                      Khách hàng
                    </div>
                    <div className="font-medium">
                      {currentOrder.customerName ?? "Khách lẻ"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">
                      Thời gian tạo
                    </div>
                    <div>{formatDateTime(currentOrder.createdAt)}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">
                      Trạng thái
                    </div>
                    <div>
                      {renderStatusBadge(currentOrder.status)}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="rounded-lg border bg-muted/40 p-3">
                  <div className="mb-2 text-sm font-medium">
                    Sản phẩm ({currentOrder.items.length})
                  </div>
                  <div className="max-h-64 overflow-y-auto border-t pt-2 space-y-1 text-sm">
                    {currentOrder.items.map((item, idx) => (
                      <div
                        key={`${item.productId}-${idx.toString()}`}
                        className="flex items-center justify-between gap-2 py-1"
                      >
                        <div className="flex-1">
                          <div className="font-medium">
                            {item.productName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.quantity} {("unit" in item && item.unit) ? item.unit : ""}
                          </div>
                        </div>
                        <div className="text-right text-xs">
                          <div>{formatCurrency(item.unitPrice)}</div>
                          <div className="font-semibold">
                            {formatCurrency(item.total)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals and notes */}
                <div className="grid gap-4 md:grid-cols-3 text-sm">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">
                      Tạm tính
                    </div>
                    <div>{formatCurrency(currentOrder.subtotal)}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">
                      Giảm giá
                    </div>
                    <div>
                      {currentOrder.discount > 0
                        ? currentOrder.discountType === "Percent"
                          ? `${currentOrder.discount.toFixed(0)}%`
                          : formatCurrency(currentOrder.discount)
                        : "0"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">
                      Tổng tiền
                    </div>
                    <div className="text-lg font-semibold text-primary">
                      {formatCurrency(currentOrder.total)}
                    </div>
                  </div>
                </div>

                {/* Editable basic fields */}
                {isEditMode ? (
                  <div className="grid gap-4 md:grid-cols-2 text-sm">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">
                        Trạng thái
                      </div>
                      <Select
                        value={editForm.status}
                        onValueChange={(value: SaleOrderStatus) =>
                          updateEditField("status", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Draft">Nháp</SelectItem>
                          <SelectItem value="Completed">Hoàn thành</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">
                        Phương thức thanh toán
                      </div>
                      <Select
                        value={editForm.paymentMethod}
                        onValueChange={(value: PaymentMethod) =>
                          updateEditField("paymentMethod", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cash">Tiền mặt</SelectItem>
                          <SelectItem value="BankTransfer">Chuyển khoản</SelectItem>
                          <SelectItem value="VietQR">VietQR</SelectItem>
                          <SelectItem value="Momo">Momo</SelectItem>
                          <SelectItem value="ZaloPay">ZaloPay</SelectItem>
                          <SelectItem value="Credit">Ghi nợ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">
                        Số tiền đã thanh toán
                      </div>
                      <Input
                        type="number"
                        min={0}
                        value={editForm.paidAmount}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          updateEditField(
                            "paidAmount",
                            Number.isNaN(value) ? 0 : value,
                          );
                        }}
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <div className="text-xs text-muted-foreground">
                        Ghi chú
                      </div>
                      <Input
                        value={editForm.notes}
                        onChange={(e) =>
                          updateEditField("notes", e.target.value)
                        }
                        placeholder="Ghi chú nội bộ cho đơn hàng"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 text-sm">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">
                        Phương thức thanh toán
                      </div>
                      <div>{getPaymentLabel(currentOrder.paymentMethod)}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">
                        Đã thanh toán
                      </div>
                      <div>{formatCurrency(currentOrder.paidAmount)}</div>
                    </div>
                    {currentOrder.notes && (
                      <div className="space-y-1 md:col-span-2">
                        <div className="text-xs text-muted-foreground">
                          Ghi chú
                        </div>
                        <div>{currentOrder.notes}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter className="mt-4">
                {canEditOrder(currentOrder) && !isEditMode && (
                  <Button
                    variant="outline"
                    onClick={startEdit}
                    disabled={saving}
                  >
                    Chỉnh sửa
                  </Button>
                )}
                {isEditMode && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDialogState({
                          mode: "view",
                          order: currentOrder,
                        });
                        setEditForm(null);
                      }}
                      disabled={saving}
                    >
                      Hủy
                    </Button>
                    <Button onClick={() => { void saveEdit(); }} disabled={saving}>
                      {saving && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Lưu thay đổi
                    </Button>
                  </>
                )}

                {/* Cancel and refund actions for completed orders */}
                {!isEditMode && currentOrder.status === "Completed" && (
                  <>
                    <Button
                      variant="outline"
                      className="ml-auto"
                      onClick={() => requestAction("cancel", currentOrder)}
                      disabled={saving}
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Hủy đơn
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => requestAction("refund", currentOrder)}
                      disabled={saving}
                    >
                      Trả hàng / Hoàn tiền
                    </Button>
                  </>
                )}

                {/* Delete drafts */}
                {!isEditMode && currentOrder.status === "Draft" && (
                  <Button
                    variant="destructive"
                    className="ml-auto"
                    onClick={() => requestAction("delete", currentOrder)}
                    disabled={saving}
                  >
                    Xóa đơn nháp
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog for destructive actions */}
      <Dialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmAction(null);
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.type === "delete"
                ? "Xóa đơn nháp"
                : confirmAction?.type === "cancel"
                  ? "Hủy đơn hàng"
                  : "Hoàn tiền đơn hàng"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p>
              Bạn có chắc chắn muốn{" "}
              {confirmAction?.type === "delete"
                ? "xóa"
                : confirmAction?.type === "cancel"
                  ? "hủy"
                  : "đánh dấu hoàn tiền cho"}{" "}
              đơn hàng{" "}
              <span className="font-mono font-semibold">
                {confirmAction?.order.code}
              </span>
              ? Hành động này không thể hoàn tác.
            </p>
            {confirmAction?.type !== "delete" && (
              <p className="text-xs text-muted-foreground">
                Thay đổi trạng thái sẽ tự động cập nhật tồn kho theo cấu hình
                trên hệ thống.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmAction(null)}
              disabled={saving}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={() => { void confirmActionAndRun(); }}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Partial refund dialog */}
      <Dialog
        open={refundDialogOpen}
        onOpenChange={(open) => {
          setRefundDialogOpen(open);
          if (!open) {
            setRefundLines([]);
            setRefundDescription("");
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Trả hàng / Hoàn tiền một phần</DialogTitle>
          </DialogHeader>

          {currentOrder && (
            <div className="space-y-4 text-sm">
              <div className="text-xs text-muted-foreground">
                Đơn hàng:{" "}
                <span className="font-mono font-semibold">
                  {currentOrder.code}
                </span>
              </div>

              <div className="rounded-lg border bg-muted/40 p-3">
                <div className="mb-2 text-sm font-medium">
                  Chọn dòng hàng và số lượng trả
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {refundLines.map((line, index) => (
                    <div
                      key={line.orderItemId || `${line.productName}-${index.toString()}`}
                      className="flex items-center gap-3 rounded-md bg-background p-2"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{line.productName}</div>
                        <div className="text-xs text-muted-foreground">
                          Tối đa: {line.maxQuantity}
                        </div>
                      </div>
                      <div className="w-40">
                        <Input
                          type="number"
                          min={0}
                          max={line.maxQuantity}
                          value={line.quantity}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            const safeValue = Number.isNaN(value)
                              ? 0
                              : Math.max(
                                  0,
                                  Math.min(line.maxQuantity, value),
                                );
                            setRefundLines((prev) =>
                              prev.map((l) =>
                                l.orderItemId === line.orderItemId
                                  ? { ...l, quantity: safeValue }
                                  : l,
                              ),
                            );
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  Ghi chú hoàn tiền
                </div>
                <Input
                  placeholder="Lý do trả hàng / hoàn tiền"
                  value={refundDescription}
                  onChange={(e) => setRefundDescription(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between border-t pt-3">
                <div className="text-xs text-muted-foreground">
                  Số tiền hoàn (ước tính)
                </div>
                <div className="text-lg font-semibold text-primary">
                  {formatCurrency(estimatedRefundAmount)}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRefundDialogOpen(false)}
              disabled={saving}
            >
              Hủy
            </Button>
            <Button
              onClick={() => {
                void submitPartialRefund();
              }}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận hoàn tiền
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


