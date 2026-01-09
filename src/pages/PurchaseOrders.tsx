/**
 * Purchase Orders Management Page
 * - View list of purchase orders with filters and pagination
 * - Create new purchase orders
 * - View order details (items, supplier, totals)
 * - Edit draft orders
 * - Receive goods from orders
 * - Create payments for orders
 * - Delete draft/cancelled orders
 */
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Plus,
  Package,
  CreditCard,
  X,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/format";
import {
  getPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  receiveGoods,
  createPayment,
  type PurchaseOrder,
  type PurchaseOrderStatus,
  type CreatePurchaseOrder,
  type CreatePurchaseOrderItem,
  type ReceiveGoods,
  type ReceiveGoodsItem,
  type CreatePurchaseOrderPayment,
} from "@/services/purchaseOrderService";
import { getSuppliers } from "@/services/supplierService";
import { getProducts } from "@/services/productService";
import { getUnitOfMeasures } from "@/services/unitOfMeasureService";
import type { PaymentMethod, Supplier, Product, UnitOfMeasure, Warehouse } from "@/types";

/**
 * Filters for purchase orders list
 */
interface PurchaseOrderFilters {
  search: string;
  status: "all" | PurchaseOrderStatus;
  supplierId?: string;
}

/**
 * Dialog state for viewing and editing purchase orders
 */
interface OrderDialogState {
  mode: "view" | "edit" | "create" | "receive" | "payment";
  order: PurchaseOrder | null;
}

/**
 * Create/Edit order form state
 */
interface OrderFormState {
  supplierId: string;
  items: CreatePurchaseOrderItem[];
  discount: number;
  discountType: "Percent" | "Amount";
  paymentMethod: PaymentMethod;
  status: PurchaseOrderStatus;
  paidAmount: number;
  expectedDeliveryDate: string;
  notes: string;
}

/**
 * Receive goods form state
 */
interface ReceiveGoodsFormState {
  warehouseId: string;
  items: Array<{
    orderItemId: string;
    receivedQuantity: number;
    expiryDate?: string;
  }>;
  receivedDate: string;
  notes: string;
}

/**
 * Payment form state
 */
interface PaymentFormState {
  amount: number;
  paymentMethod: PaymentMethod;
  description: string;
  transactionDate: string;
}

export default function PurchaseOrders() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<PurchaseOrderFilters>({
    search: "",
    status: "all",
  });

  const [dialogState, setDialogState] = useState<OrderDialogState>({
    mode: "view",
    order: null,
  });

  const [orderForm, setOrderForm] = useState<OrderFormState | null>(null);
  const [receiveForm, setReceiveForm] = useState<ReceiveGoodsFormState | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "delete" | "cancel";
    order: PurchaseOrder;
  } | null>(null);

  // Options for dropdowns
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  /**
   * Load purchase orders from API
   */
  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getPurchaseOrders(
        filters.supplierId,
        filters.status === "all" ? undefined : filters.status,
        undefined,
        undefined,
        page,
        pageSize
      );
      setOrders(response.items);
      setTotal(response.total);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Không thể tải danh sách đơn nhập hàng";
      setError(message);
      // eslint-disable-next-line no-console
      console.error("Error loading purchase orders:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load options (suppliers, products, units, warehouses)
   */
  const loadOptions = async () => {
    try {
      const [suppliersData, productsData, unitsData] = await Promise.all([
        getSuppliers(),
        getProducts(),
        getUnitOfMeasures(),
      ]);
      setSuppliers(suppliersData);
      setProducts(productsData);
      setUnits(unitsData);

      // TODO: Load warehouses when warehouse API is available
      // For now, use a default warehouse
      setWarehouses([
        {
          id: "default",
          name: "Kho chính",
          isDefault: true,
        },
      ]);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error loading options:", err);
    }
  };

  useEffect(() => {
    void loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, filters.status, filters.supplierId]);

  useEffect(() => {
    void loadOptions();
  }, []);

  /**
   * Apply client-side filters (search by code or supplier name)
   */
  const filteredOrders = useMemo(() => {
    const searchLower = filters.search.trim().toLowerCase();

    return orders.filter((order) => {
      if (searchLower.length === 0) {
        return true;
      }

      const codeMatch = order.code.toLowerCase().includes(searchLower);
      const supplierName = order.supplierName ?? "";
      const supplierMatch = supplierName.toLowerCase().includes(searchLower);

      return codeMatch || supplierMatch;
    });
  }, [orders, filters]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  /**
   * Open order details dialog
   */
  const openOrder = (order: PurchaseOrder) => {
    setDialogState({ mode: "view", order });
  };

  /**
   * Open create order dialog
   */
  const openCreateDialog = () => {
    setOrderForm({
      supplierId: "",
      items: [],
      discount: 0,
      discountType: "Percent",
      paymentMethod: "Cash",
      status: "Draft",
      paidAmount: 0,
      expectedDeliveryDate: "",
      notes: "",
    });
    setDialogState({ mode: "create", order: null });
  };

  /**
   * Open edit dialog
   */
  const openEditDialog = (order: PurchaseOrder) => {
    if (order.status !== "Draft") {
      setError("Chỉ có thể chỉnh sửa đơn ở trạng thái Nháp");
      return;
    }

    setOrderForm({
      supplierId: order.supplierId,
      items: order.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitId: item.unitId,
        unitPrice: item.unitPrice,
        discount: item.discount,
        discountType: item.discountType,
      })),
      discount: order.discount,
      discountType: order.discountType,
      paymentMethod: order.paymentMethod,
      status: order.status,
      paidAmount: order.paidAmount,
      expectedDeliveryDate: order.expectedDeliveryDate
        ? new Date(order.expectedDeliveryDate).toISOString().split("T")[0]
        : "",
      notes: order.notes ?? "",
    });
    setDialogState({ mode: "edit", order });
  };

  /**
   * Open receive goods dialog
   */
  const openReceiveDialog = (order: PurchaseOrder) => {
    if (order.status !== "Ordered" && order.status !== "PartialReceived") {
      setError("Chỉ có thể nhận hàng từ đơn ở trạng thái Đã đặt hoặc Nhận một phần");
      return;
    }

    const defaultWarehouse = warehouses.find((w) => w.isDefault)?.id ?? warehouses[0]?.id ?? "";

    setReceiveForm({
      warehouseId: defaultWarehouse,
      items: order.items
        .filter((item) => item.quantity > item.receivedQuantity)
        .map((item) => ({
          orderItemId: item.id,
          receivedQuantity: 0,
          expiryDate: "",
        })),
      receivedDate: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setDialogState({ mode: "receive", order });
  };

  /**
   * Open payment dialog
   */
  const openPaymentDialog = (order: PurchaseOrder) => {
    const remainingAmount = order.total - order.paidAmount;
    if (remainingAmount <= 0) {
      setError("Đơn hàng đã được thanh toán đầy đủ");
      return;
    }

    setPaymentForm({
      amount: remainingAmount,
      paymentMethod: order.paymentMethod,
      description: `Thanh toán đơn nhập hàng ${order.code}`,
      transactionDate: new Date().toISOString().split("T")[0],
    });
    setDialogState({ mode: "payment", order });
  };

  /**
   * Save create/edit order
   */
  const saveOrder = async () => {
    if (!orderForm) {
      return;
    }

    if (!orderForm.supplierId) {
      setError("Vui lòng chọn nhà cung cấp");
      return;
    }

    if (orderForm.items.length === 0) {
      setError("Vui lòng thêm ít nhất một sản phẩm");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const orderData: CreatePurchaseOrder = {
        supplierId: orderForm.supplierId,
        items: orderForm.items,
        discount: orderForm.discount,
        discountType: orderForm.discountType,
        paymentMethod: orderForm.paymentMethod,
        status: orderForm.status,
        paidAmount: orderForm.paidAmount,
        expectedDeliveryDate: orderForm.expectedDeliveryDate
          ? new Date(orderForm.expectedDeliveryDate).toISOString()
          : undefined,
        notes: orderForm.notes || undefined,
        createdBy: "System",
      };

      if (dialogState.mode === "create") {
        await createPurchaseOrder(orderData);
      } else if (dialogState.mode === "edit" && dialogState.order) {
        await updatePurchaseOrder(dialogState.order.id, orderData);
      }

      await loadOrders();
      setDialogState({ mode: "view", order: null });
      setOrderForm(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Không thể lưu đơn nhập hàng";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Save receive goods
   */
  const saveReceiveGoods = async () => {
    if (!receiveForm || !dialogState.order) {
      return;
    }

    if (receiveForm.items.every((item) => item.receivedQuantity <= 0)) {
      setError("Vui lòng nhập số lượng nhận cho ít nhất một sản phẩm");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const receiveData: ReceiveGoods = {
        warehouseId: receiveForm.warehouseId,
        items: receiveForm.items
          .filter((item) => item.receivedQuantity > 0)
          .map((item) => ({
            orderItemId: item.orderItemId,
            receivedQuantity: item.receivedQuantity,
            expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString() : undefined,
          })),
        receivedDate: new Date(receiveForm.receivedDate).toISOString(),
        notes: receiveForm.notes || undefined,
        createdBy: "System",
      };

      await receiveGoods(dialogState.order.id, receiveData);
      await loadOrders();

      // Reload order to get updated status
      const updatedOrder = await getPurchaseOrders(
        undefined,
        undefined,
        undefined,
        undefined,
        1,
        1
      );
      const foundOrder = updatedOrder.items.find((o) => o.id === dialogState.order?.id);
      if (foundOrder) {
        setDialogState({ mode: "view", order: foundOrder });
      } else {
        setDialogState({ mode: "view", order: null });
      }
      setReceiveForm(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Không thể nhận hàng";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Save payment
   */
  const savePayment = async () => {
    if (!paymentForm || !dialogState.order) {
      return;
    }

    if (paymentForm.amount <= 0) {
      setError("Số tiền thanh toán phải lớn hơn 0");
      return;
    }

    const remainingAmount = dialogState.order.total - dialogState.order.paidAmount;
    if (paymentForm.amount > remainingAmount) {
      setError(`Số tiền thanh toán không được vượt quá số tiền còn lại (${formatCurrency(remainingAmount)})`);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const paymentData: CreatePurchaseOrderPayment = {
        amount: paymentForm.amount,
        paymentMethod: paymentForm.paymentMethod,
        description: paymentForm.description || undefined,
        transactionDate: new Date(paymentForm.transactionDate).toISOString(),
        createdBy: "System",
      };

      await createPayment(dialogState.order.id, paymentData);
      await loadOrders();

      // Reload order to get updated paid amount
      const updatedOrder = await getPurchaseOrders(
        undefined,
        undefined,
        undefined,
        undefined,
        1,
        1
      );
      const foundOrder = updatedOrder.items.find((o) => o.id === dialogState.order?.id);
      if (foundOrder) {
        setDialogState({ mode: "view", order: foundOrder });
      } else {
        setDialogState({ mode: "view", order: null });
      }
      setPaymentForm(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Không thể tạo thanh toán";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Delete order
   */
  const handleDelete = async () => {
    if (!confirmAction) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await deletePurchaseOrder(confirmAction.order.id);
      await loadOrders();

      if (dialogState.order?.id === confirmAction.order.id) {
        setDialogState({ mode: "view", order: null });
      }
      setConfirmAction(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Không thể xóa đơn nhập hàng";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Add item to order form
   */
  const addItemToForm = () => {
    if (!orderForm) {
      return;
    }

    setOrderForm({
      ...orderForm,
      items: [
        ...orderForm.items,
        {
          productId: "",
          quantity: 1,
          unitId: "",
          unitPrice: 0,
          discount: 0,
          discountType: "Percent",
        },
      ],
    });
  };

  /**
   * Remove item from order form
   */
  const removeItemFromForm = (index: number) => {
    if (!orderForm) {
      return;
    }

    setOrderForm({
      ...orderForm,
      items: orderForm.items.filter((_, i) => i !== index),
    });
  };

  /**
   * Update item in order form
   */
  const updateItemInForm = (index: number, field: keyof CreatePurchaseOrderItem, value: unknown) => {
    if (!orderForm) {
      return;
    }

    const newItems = [...orderForm.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };

    // Auto-fill unit and price when product is selected
    if (field === "productId" && typeof value === "string") {
      const product = products.find((p) => p.id === value);
      if (product) {
        newItems[index].unitId = product.unitId;
        newItems[index].unitPrice = product.costPrice;
      }
    }

    setOrderForm({
      ...orderForm,
      items: newItems,
    });
  };

  /**
   * Calculate order totals
   */
  const calculateOrderTotals = useMemo(() => {
    if (!orderForm) {
      return { subtotal: 0, total: 0 };
    }

    const subtotal = orderForm.items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemDiscount =
        item.discountType === "Percent"
          ? (itemSubtotal * item.discount) / 100
          : item.discount;
      return sum + itemSubtotal - itemDiscount;
    }, 0);

    const discountAmount =
      orderForm.discountType === "Percent"
        ? (subtotal * orderForm.discount) / 100
        : orderForm.discount;

    const total = subtotal - discountAmount;

    return { subtotal, total };
  }, [orderForm]);

  /**
   * Map status to label and badge variant
   */
  const renderStatusBadge = (status: PurchaseOrderStatus) => {
    const statusMap: Record<PurchaseOrderStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      Draft: { label: "Nháp", variant: "outline" },
      Ordered: { label: "Đã đặt", variant: "secondary" },
      Received: { label: "Đã nhận", variant: "default" },
      PartialReceived: { label: "Nhận một phần", variant: "secondary" },
      Cancelled: { label: "Đã hủy", variant: "destructive" },
    };

    const statusInfo = statusMap[status];
    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  /**
   * Map payment method to Vietnamese label
   */
  const getPaymentLabel = (method: PaymentMethod): string => {
    const methodMap: Record<PaymentMethod, string> = {
      Cash: "Tiền mặt",
      BankTransfer: "Chuyển khoản",
      VietQR: "VietQR",
      Momo: "Momo",
      ZaloPay: "ZaloPay",
      Credit: "Ghi nợ",
    };
    return methodMap[method] ?? method;
  };

  const currentOrder = dialogState.order;
  const isCreateMode = dialogState.mode === "create";
  const isEditMode = dialogState.mode === "edit";
  const isReceiveMode = dialogState.mode === "receive";
  const isPaymentMode = dialogState.mode === "payment";

  return (
    <div className="min-h-screen">
      <Header
        title="Đơn nhập hàng"
        subtitle="Quản lý đơn nhập hàng, nhận hàng và thanh toán"
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
                placeholder="Tìm theo mã đơn hoặc tên nhà cung cấp..."
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
                  value === "Ordered" ||
                  value === "Received" ||
                  value === "PartialReceived" ||
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
                <SelectItem value="Ordered">Đã đặt</SelectItem>
                <SelectItem value="Received">Đã nhận</SelectItem>
                <SelectItem value="PartialReceived">Nhận một phần</SelectItem>
                <SelectItem value="Cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.supplierId ?? "all"}
              onValueChange={(value) => {
                setFilters((prev) => ({
                  ...prev,
                  supplierId: value === "all" ? undefined : value,
                }));
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Nhà cung cấp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả nhà cung cấp</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Tạo đơn mới
            </Button>
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
                Chưa có đơn nhập hàng nào
              </p>
              <p className="text-sm text-muted-foreground">
                {filters.search
                  ? "Thử thay đổi từ khóa tìm kiếm"
                  : "Nhấn 'Tạo đơn mới' để bắt đầu"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã đơn</TableHead>
                  <TableHead>Nhà cung cấp</TableHead>
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
                        {order.supplierName ?? "N/A"}
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

      {/* Order detail / edit / create / receive / payment dialog */}
      <Dialog
        open={currentOrder !== null || isCreateMode}
        onOpenChange={(open) => {
          if (!open) {
            setDialogState({ mode: "view", order: null });
            setOrderForm(null);
            setReceiveForm(null);
            setPaymentForm(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* View Mode */}
          {currentOrder && !isCreateMode && !isEditMode && !isReceiveMode && !isPaymentMode && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Đơn nhập hàng {currentOrder.code}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Top summary */}
                <div className="grid gap-4 md:grid-cols-3 text-sm">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">
                      Nhà cung cấp
                    </div>
                    <div className="font-medium">
                      {currentOrder.supplierName ?? "N/A"}
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
                            {item.quantity} {item.unitName} • Đã nhận: {item.receivedQuantity}
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

                {/* Totals */}
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

                {/* Payment info */}
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
                    <div>
                      {formatCurrency(currentOrder.paidAmount)} / {formatCurrency(currentOrder.total)}
                    </div>
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
              </div>

              <DialogFooter className="mt-4">
                {currentOrder.status === "Draft" && (
                  <Button
                    variant="outline"
                    onClick={() => openEditDialog(currentOrder)}
                    disabled={saving}
                  >
                    Chỉnh sửa
                  </Button>
                )}
                {(currentOrder.status === "Ordered" || currentOrder.status === "PartialReceived") && (
                  <Button
                    variant="outline"
                    onClick={() => openReceiveDialog(currentOrder)}
                    disabled={saving}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Nhận hàng
                  </Button>
                )}
                {currentOrder.total > currentOrder.paidAmount && (
                  <Button
                    variant="outline"
                    onClick={() => openPaymentDialog(currentOrder)}
                    disabled={saving}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Thanh toán
                  </Button>
                )}
                {(currentOrder.status === "Draft" || currentOrder.status === "Cancelled") && (
                  <Button
                    variant="destructive"
                    className="ml-auto"
                    onClick={() => setConfirmAction({ type: "delete", order: currentOrder })}
                    disabled={saving}
                  >
                    Xóa đơn
                  </Button>
                )}
              </DialogFooter>
            </>
          )}

          {/* Create/Edit Mode */}
          {(isCreateMode || isEditMode) && orderForm && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {isCreateMode ? "Tạo đơn nhập hàng mới" : "Chỉnh sửa đơn nhập hàng"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Supplier */}
                <div className="space-y-2">
                  <Label>Nhà cung cấp *</Label>
                  <Select
                    value={orderForm.supplierId}
                    onValueChange={(value) =>
                      setOrderForm((prev) => prev ? { ...prev, supplierId: value } : null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn nhà cung cấp" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Sản phẩm *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addItemToForm}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Thêm sản phẩm
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                    {orderForm.items.map((item, index) => (
                      <div key={index} className="flex gap-2 items-start p-2 border rounded">
                        <div className="flex-1 grid grid-cols-4 gap-2">
                          <Select
                            value={item.productId}
                            onValueChange={(value) =>
                              updateItemInForm(index, "productId", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sản phẩm" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            placeholder="Số lượng"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItemInForm(index, "quantity", Number(e.target.value))
                            }
                          />
                          <Select
                            value={item.unitId}
                            onValueChange={(value) =>
                              updateItemInForm(index, "unitId", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Đơn vị" />
                            </SelectTrigger>
                            <SelectContent>
                              {units.map((unit) => (
                                <SelectItem key={unit.id} value={unit.id}>
                                  {unit.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            placeholder="Đơn giá"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateItemInForm(index, "unitPrice", Number(e.target.value))
                            }
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItemFromForm(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {orderForm.items.length === 0 && (
                      <div className="text-center text-sm text-muted-foreground py-4">
                        Chưa có sản phẩm nào. Nhấn "Thêm sản phẩm" để thêm.
                      </div>
                    )}
                  </div>
                </div>

                {/* Discount and totals */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Giảm giá</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={orderForm.discount}
                        onChange={(e) =>
                          setOrderForm((prev) => prev ? { ...prev, discount: Number(e.target.value) } : null)
                        }
                      />
                      <Select
                        value={orderForm.discountType}
                        onValueChange={(value: "Percent" | "Amount") =>
                          setOrderForm((prev) => prev ? { ...prev, discountType: value } : null)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Percent">%</SelectItem>
                          <SelectItem value="Amount">VNĐ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Tổng tiền</Label>
                    <div className="text-lg font-semibold text-primary">
                      {formatCurrency(calculateOrderTotals.total)}
                    </div>
                  </div>
                </div>

                {/* Payment method and status */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Phương thức thanh toán</Label>
                    <Select
                      value={orderForm.paymentMethod}
                      onValueChange={(value: PaymentMethod) =>
                        setOrderForm((prev) => prev ? { ...prev, paymentMethod: value } : null)
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
                  <div className="space-y-2">
                    <Label>Trạng thái</Label>
                    <Select
                      value={orderForm.status}
                      onValueChange={(value: PurchaseOrderStatus) =>
                        setOrderForm((prev) => prev ? { ...prev, status: value } : null)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Draft">Nháp</SelectItem>
                        <SelectItem value="Ordered">Đã đặt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Expected delivery date and notes */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Ngày dự kiến giao hàng</Label>
                    <Input
                      type="date"
                      value={orderForm.expectedDeliveryDate}
                      onChange={(e) =>
                        setOrderForm((prev) => prev ? { ...prev, expectedDeliveryDate: e.target.value } : null)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ghi chú</Label>
                    <Textarea
                      value={orderForm.notes}
                      onChange={(e) =>
                        setOrderForm((prev) => prev ? { ...prev, notes: e.target.value } : null)
                      }
                      placeholder="Ghi chú nội bộ"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDialogState({ mode: "view", order: null });
                    setOrderForm(null);
                  }}
                  disabled={saving}
                >
                  Hủy
                </Button>
                <Button onClick={() => { void saveOrder(); }} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isCreateMode ? "Tạo đơn" : "Lưu thay đổi"}
                </Button>
              </DialogFooter>
            </>
          )}

          {/* Receive Goods Mode */}
          {isReceiveMode && receiveForm && currentOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Nhận hàng - {currentOrder.code}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Kho nhận hàng *</Label>
                  <Select
                    value={receiveForm.warehouseId}
                    onValueChange={(value) =>
                      setReceiveForm((prev) => prev ? { ...prev, warehouseId: value } : null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Số lượng nhận</Label>
                  <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                    {receiveForm.items.map((item, index) => {
                      const orderItem = currentOrder.items.find((i) => i.id === item.orderItemId);
                      if (!orderItem) {
                        return null;
                      }
                      const remaining = orderItem.quantity - orderItem.receivedQuantity;

                      return (
                        <div key={item.orderItemId} className="flex gap-2 items-start p-2 border rounded">
                          <div className="flex-1">
                            <div className="font-medium">{orderItem.productName}</div>
                            <div className="text-xs text-muted-foreground">
                              Đặt: {orderItem.quantity} • Đã nhận: {orderItem.receivedQuantity} • Còn lại: {remaining}
                            </div>
                            <div className="flex gap-2 mt-2">
                              <Input
                                type="number"
                                placeholder="Số lượng nhận"
                                min={0}
                                max={remaining}
                                value={item.receivedQuantity}
                                onChange={(e) => {
                                  const newItems = [...receiveForm.items];
                                  newItems[index].receivedQuantity = Number(e.target.value);
                                  setReceiveForm((prev) => prev ? { ...prev, items: newItems } : null);
                                }}
                                className="flex-1"
                              />
                              <Input
                                type="date"
                                placeholder="Hạn sử dụng (tùy chọn)"
                                value={item.expiryDate}
                                onChange={(e) => {
                                  const newItems = [...receiveForm.items];
                                  newItems[index].expiryDate = e.target.value;
                                  setReceiveForm((prev) => prev ? { ...prev, items: newItems } : null);
                                }}
                                className="w-40"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Ngày nhận hàng</Label>
                    <Input
                      type="date"
                      value={receiveForm.receivedDate}
                      onChange={(e) =>
                        setReceiveForm((prev) => prev ? { ...prev, receivedDate: e.target.value } : null)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ghi chú</Label>
                    <Textarea
                      value={receiveForm.notes}
                      onChange={(e) =>
                        setReceiveForm((prev) => prev ? { ...prev, notes: e.target.value } : null)
                      }
                      placeholder="Ghi chú nhận hàng"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDialogState({ mode: "view", order: currentOrder });
                    setReceiveForm(null);
                  }}
                  disabled={saving}
                >
                  Hủy
                </Button>
                <Button onClick={() => { void saveReceiveGoods(); }} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Xác nhận nhận hàng
                </Button>
              </DialogFooter>
            </>
          )}

          {/* Payment Mode */}
          {isPaymentMode && paymentForm && currentOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Thanh toán - {currentOrder.code}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tổng tiền đơn hàng</Label>
                  <div className="text-lg font-semibold">
                    {formatCurrency(currentOrder.total)}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Đã thanh toán</Label>
                  <div className="text-lg font-semibold">
                    {formatCurrency(currentOrder.paidAmount)}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Còn lại</Label>
                  <div className="text-lg font-semibold text-primary">
                    {formatCurrency(currentOrder.total - currentOrder.paidAmount)}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Số tiền thanh toán *</Label>
                  <Input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) =>
                      setPaymentForm((prev) => prev ? { ...prev, amount: Number(e.target.value) } : null)
                    }
                    min={0}
                    max={currentOrder.total - currentOrder.paidAmount}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Phương thức thanh toán *</Label>
                  <Select
                    value={paymentForm.paymentMethod}
                    onValueChange={(value: PaymentMethod) =>
                      setPaymentForm((prev) => prev ? { ...prev, paymentMethod: value } : null)
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
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Ngày giao dịch</Label>
                  <Input
                    type="date"
                    value={paymentForm.transactionDate}
                    onChange={(e) =>
                      setPaymentForm((prev) => prev ? { ...prev, transactionDate: e.target.value } : null)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ghi chú</Label>
                  <Textarea
                    value={paymentForm.description}
                    onChange={(e) =>
                      setPaymentForm((prev) => prev ? { ...prev, description: e.target.value } : null)
                    }
                    placeholder="Ghi chú thanh toán"
                  />
                </div>
              </div>

              <DialogFooter className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDialogState({ mode: "view", order: currentOrder });
                    setPaymentForm(null);
                  }}
                  disabled={saving}
                >
                  Hủy
                </Button>
                <Button onClick={() => { void savePayment(); }} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Xác nhận thanh toán
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog for delete */}
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
            <DialogTitle>Xóa đơn nhập hàng</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p>
              Bạn có chắc chắn muốn xóa đơn nhập hàng{" "}
              <span className="font-mono font-semibold">
                {confirmAction?.order.code}
              </span>
              ? Hành động này không thể hoàn tác.
            </p>
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
              onClick={() => { void handleDelete(); }}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

