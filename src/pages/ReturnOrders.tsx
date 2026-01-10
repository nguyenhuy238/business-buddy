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
  Calendar,
  ChevronLeft,
  ChevronRight,
  History,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/format";
import {
  getReturnOrders,
  getReturnOrderById,
  deleteReturnOrder,
  type CreateReturnOrderRequest,
  type CreateReturnOrderItemRequest,
} from "@/services/returnOrderService";
import type { ReturnOrder, ReturnOrderStatus, PaymentMethod } from "@/types";

/**
 * Filters for return orders list
 */
interface ReturnOrderFilters {
  search: string;
  status: "all" | ReturnOrderStatus;
}

/**
 * Return Orders Management Page
 * - View list of return orders with filters and pagination
 * - View return order details (items, original sale order, refund amount)
 * - Delete draft return orders
 */
export default function ReturnOrders() {
  const [orders, setOrders] = useState<ReturnOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<ReturnOrderFilters>({
    search: "",
    status: "all",
  });

  const [selectedOrder, setSelectedOrder] = useState<ReturnOrder | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ReturnOrder | null>(null);
  const [deleting, setDeleting] = useState(false);

  /**
   * Load return orders from API with current pagination
   */
  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getReturnOrders(undefined, undefined, undefined, undefined, page, pageSize);
      setOrders(response.items);
      setTotal(response.total);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Không thể tải danh sách đơn trả hàng";
      setError(message);
      // eslint-disable-next-line no-console
      console.error("Error loading return orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  /**
   * Apply client-side filters (search by code or sale order code, status)
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
      const saleOrderCodeMatch = order.saleOrderCode.toLowerCase().includes(searchLower);
      const customerName = order.customerName ?? "";
      const customerMatch = customerName.toLowerCase().includes(searchLower);

      return codeMatch || saleOrderCodeMatch || customerMatch;
    });
  }, [orders, filters]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  /**
   * Open return order details dialog
   */
  const openOrder = async (order: ReturnOrder) => {
    try {
      const fullOrder = await getReturnOrderById(order.id);
      if (fullOrder) {
        setSelectedOrder(fullOrder);
      } else {
        setSelectedOrder(order);
      }
    } catch (err) {
      setSelectedOrder(order);
    }
  };

  /**
   * Request delete confirmation
   */
  const requestDelete = (order: ReturnOrder) => {
    if (order.status !== "Draft") {
      setError("Chỉ có thể xóa đơn trả hàng ở trạng thái Nháp");
      return;
    }
    setDeleteConfirm(order);
  };

  /**
   * Perform delete after confirmation
   */
  const confirmDelete = async () => {
    if (!deleteConfirm) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);

      await deleteReturnOrder(deleteConfirm.id);
      setOrders((prev) => prev.filter((o) => o.id !== deleteConfirm.id));
      if (selectedOrder?.id === deleteConfirm.id) {
        setSelectedOrder(null);
      }
      setDeleteConfirm(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Không thể xóa đơn trả hàng";
      setError(message);
    } finally {
      setDeleting(false);
    }
  };

  /**
   * Map status to label and badge variant
   */
  const renderStatusBadge = (status: ReturnOrderStatus) => {
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
    return (
      <Badge variant="destructive">
        Đã hủy
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

  return (
    <div className="min-h-screen">
      <Header
        title="Đơn trả hàng"
        subtitle="Quản lý danh sách đơn trả hàng và hoàn tiền"
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
                placeholder="Tìm theo mã đơn, mã đơn gốc hoặc khách hàng..."
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
                  value === "Cancelled"
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
                Chưa có đơn trả hàng nào
              </p>
              <p className="text-sm text-muted-foreground">
                {filters.search
                  ? "Thử thay đổi từ khóa tìm kiếm"
                  : "Đơn trả hàng sẽ xuất hiện tại đây"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã đơn trả</TableHead>
                  <TableHead>Đơn hàng gốc</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Phương thức hoàn tiền</TableHead>
                  <TableHead className="text-right">Số tiền hoàn</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      void openOrder(order);
                    }}
                  >
                    <TableCell>
                      <div className="font-mono text-sm">{order.code}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm text-muted-foreground">
                        {order.saleOrderCode}
                      </div>
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
                        {getPaymentLabel(order.refundMethod)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-destructive">
                        {formatCurrency(order.refundAmount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {renderStatusBadge(order.status)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {order.status === "Draft" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => requestDelete(order)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
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
            Trang {page} / {totalPages} • {total.toLocaleString()} đơn trả hàng
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

      {/* Return order detail dialog */}
      <Dialog
        open={selectedOrder !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedOrder(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Đơn trả hàng {selectedOrder.code}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Top summary */}
                <div className="grid gap-4 md:grid-cols-3 text-sm">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">
                      Đơn hàng gốc
                    </div>
                    <div className="font-mono font-medium">
                      {selectedOrder.saleOrderCode}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">
                      Khách hàng
                    </div>
                    <div className="font-medium">
                      {selectedOrder.customerName ?? "Khách lẻ"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">
                      Trạng thái
                    </div>
                    <div>
                      {renderStatusBadge(selectedOrder.status)}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="rounded-lg border bg-muted/40 p-3">
                  <div className="mb-2 text-sm font-medium">
                    Sản phẩm trả ({selectedOrder.items.length})
                  </div>
                  <div className="max-h-64 overflow-y-auto border-t pt-2 space-y-1 text-sm">
                    {selectedOrder.items.map((item, idx) => (
                      <div
                        key={`${item.id}-${idx.toString()}`}
                        className="flex items-center justify-between gap-2 py-1"
                      >
                        <div className="flex-1">
                          <div className="font-medium">
                            {item.productName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.quantity} {item.unitName}
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
                      Tổng tiền hoàn
                    </div>
                    <div className="text-lg font-semibold text-destructive">
                      {formatCurrency(selectedOrder.refundAmount)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">
                      Phương thức hoàn tiền
                    </div>
                    <div>{getPaymentLabel(selectedOrder.refundMethod)}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">
                      Thời gian tạo
                    </div>
                    <div>{formatDateTime(selectedOrder.createdAt)}</div>
                  </div>
                </div>

                {/* Reason and notes */}
                {selectedOrder.reason && (
                  <div className="space-y-1 text-sm">
                    <div className="text-xs text-muted-foreground">
                      Lý do trả hàng
                    </div>
                    <div className="rounded-md bg-muted/40 p-2">
                      {selectedOrder.reason}
                    </div>
                  </div>
                )}

                {selectedOrder.notes && (
                  <div className="space-y-1 text-sm">
                    <div className="text-xs text-muted-foreground">
                      Ghi chú
                    </div>
                    <div>{selectedOrder.notes}</div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSelectedOrder(null)}
                >
                  Đóng
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteConfirm !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteConfirm(null);
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Xóa đơn trả hàng</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p>
              Bạn có chắc chắn muốn xóa đơn trả hàng{" "}
              <span className="font-mono font-semibold">
                {deleteConfirm?.code}
              </span>
              ? Hành động này không thể hoàn tác.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              disabled={deleting}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                void confirmDelete();
              }}
              disabled={deleting}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

