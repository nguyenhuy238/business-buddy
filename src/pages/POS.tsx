import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Search,
  Minus,
  Plus,
  Trash2,
  User,
  CreditCard,
  Banknote,
  QrCode,
  Wallet,
  Percent,
  X,
  ShoppingCart,
  AlertCircle,
  Loader2,
  Calendar,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { getProducts, getProductByBarcode, getProductByCode, getProductAvailableUnits } from '@/services/productService';
import { getCustomers } from '@/services/customerService';
import { createSaleOrder } from '@/services/saleOrderService';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CustomerDialog } from '@/components/dialogs/CustomerDialog';
import { PaymentQR } from '@/components/PaymentQR';
import { useNavigate } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import type { Product, Customer, SaleOrder, PaymentMethod, ProductAvailableUnit } from '@/types';

// Convert relative path ("/images/..") to absolute using backend API origin (supports /images returned by backend)
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "https://localhost:44384/api";
const apiOrigin = (() => {
  try {
    return new URL(API_BASE).origin;
  } catch {
    return window.location.origin;
  }
})();
const toAbsolute = (url?: string | null) => {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return `${apiOrigin}${url}`;
  return url;
};

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unitId?: string; // GUID of the unit of measure (required by backend)
  unitName?: string; // Name of the unit for display
  originalPrice?: number; // Original price in default unit (for conversion calculations)
}

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);

  // Customers & selection
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [customerSelectorOpen, setCustomerSelectorOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Checkout / payment
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [processing, setProcessing] = useState(false);
  const [waitingForPayment, setWaitingForPayment] = useState(false);
  const [pendingOrderCode, setPendingOrderCode] = useState<string | undefined>(undefined);
  
  // Credit payment (debt) dialog
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [paymentDueDate, setPaymentDueDate] = useState<string>("");
  
  const navigate = useNavigate();

  // Receipt
  const [receipt, setReceipt] = useState<SaleOrder | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  // Unit selection dialog
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
  const [pendingCartItemId, setPendingCartItemId] = useState<string | null>(null); // For updating existing cart item
  const [availableUnits, setAvailableUnits] = useState<ProductAvailableUnit[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);

  const toast = useToast();

  // Load customers when customer selector is opened
  useEffect(() => {
    if (!customerSelectorOpen) return;
    const loadCustomers = async () => {
      try {
        const data = await getCustomers();
        setCustomers(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Không thể tải khách hàng";
        toast.toast({ title: "Lỗi", description: message });
      }
    };

    loadCustomers();
  }, [customerSelectorOpen, toast]);

  // Handle barcode or code lookup when pressing Enter in search
  const handleBarcodeSearch = async (query: string) => {
    if (!query) return;
    try {
      setLoading(true);
      const byBarcode = await getProductByBarcode(query).catch(() => null);
      const byCode = byBarcode ? null : await getProductByCode(query).catch(() => null);
      const product = byBarcode || byCode;
      if (product) {
        addToCart(product);
        setSearchQuery('');
      } else {
        toast.toast({ title: 'Không tìm thấy', description: 'Không tìm thấy sản phẩm với mã này.' });
      }
    } catch (err) {
      toast.toast({ title: 'Lỗi', description: err instanceof Error ? err.message : 'Lỗi khi tìm sản phẩm' });
    } finally {
      setLoading(false);
    }
  };

  // Payload types for create order (matching CreateSaleOrderDto)
  interface CreateSaleOrderItem {
    productId: string;
    quantity: number;
    unitId: string;
    unitPrice: number;
    discount: number;
    discountType: string; // "Percent" or "Amount"
  }

  interface CreateSaleOrder {
    customerId?: string;
    items: CreateSaleOrderItem[];
    discount: number;
    discountType: string; // "Percent" or "Amount"
    paymentMethod: string; // "Cash", "BankTransfer", "VietQR", "Credit", etc.
    status?: string; // "Draft", "Completed", "Cancelled", "Refunded"
    paidAmount: number;
    paymentDueDate?: string; // ISO date string for credit orders
    notes?: string;
    createdBy: string;
  }

  /**
   * Check if payment method requires QR code display
   */
  const requiresQRCode = (method: PaymentMethod): boolean => {
    return method === 'BankTransfer' || method === 'VietQR' || method === 'Momo' || method === 'ZaloPay';
  };
  
  /**
   * Handle credit payment option - opens dialog to enter due date
   */
  const handleCreditPayment = () => {
    if (!selectedCustomer) {
      toast.toast({
        title: "Chưa chọn khách hàng",
        description: "Vui lòng chọn khách hàng trước khi tạo đơn nợ.",
      });
      return;
    }
    // Set default due date to 30 days from now
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 30);
    setPaymentDueDate(defaultDueDate.toISOString().split("T")[0]);
    setCreditDialogOpen(true);
  };
  
  /**
   * Confirm credit payment after entering due date
   */
  const confirmCreditPayment = () => {
    if (!paymentDueDate) {
      toast.toast({
        title: "Chưa nhập ngày đến hạn",
        description: "Vui lòng nhập ngày đến hạn thanh toán.",
      });
      return;
    }
    setPaymentMethod("Credit");
    setCreditDialogOpen(false);
    setCheckoutOpen(true);
  };

  /**
   * Handle payment confirmation
   * For QR-based payments, show QR first and wait for confirmation
   * For cash, process immediately
   */
  const confirmCheckout = async () => {
    if (cart.length === 0) return;

    // ensure unitId exists for all items
    const missingUnit = cart.find((c) => !c.unitId && !products.find(p => p.id === c.id)?.unitId && !products.find(p => p.id === c.id)?.baseUnitId);
    if (missingUnit) {
      toast.toast({ title: 'Lỗi dữ liệu', description: `Đơn chứa sản phẩm ${missingUnit.name} thiếu đơn vị (UnitId).` });
      return;
    }

    // For QR-based payments, create order first and show QR code
    // Credit payment should not go through QR flow
    if (requiresQRCode(paymentMethod) && !waitingForPayment && paymentMethod !== "Credit") {
      try {
        setProcessing(true);

        const items: CreateSaleOrderItem[] = cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          unitId: item.unitId || products.find(p => p.id === item.id)?.unitId || products.find(p => p.id === item.id)?.baseUnitId || '',
          unitPrice: item.price,
          discount: 0,
          discountType: "Percent",
        }));

        const orderPayload: CreateSaleOrder = {
          customerId: selectedCustomer?.id,
          items,
          discount,
          discountType: "Percent",
          paymentMethod: paymentMethod,
          paidAmount: total,
          notes: '',
          status: "Draft", // Create as draft first, complete after payment confirmation
          createdBy: 'POS',
        };

        const saved = await createSaleOrder(orderPayload as unknown as Partial<SaleOrder>);
        setPendingOrderCode(saved.code);
        setWaitingForPayment(true);
        setProcessing(false);
        toast.toast({ 
          title: 'Đã tạo đơn', 
          description: `Đơn ${saved.code} đã được tạo. Vui lòng quét mã QR để thanh toán.` 
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Lỗi khi tạo đơn';
        toast.toast({ title: 'Lỗi', description: message });
        setProcessing(false);
      }
      return;
    }

    // For cash payments or after QR payment confirmation, complete the order
    try {
      setProcessing(true);

      const items: CreateSaleOrderItem[] = cart.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        unitId: item.unitId || products.find(p => p.id === item.id)?.unitId || products.find(p => p.id === item.id)?.baseUnitId || '',
        unitPrice: item.price,
        discount: 0,
        discountType: "Percent",
      }));

      const orderPayload: CreateSaleOrder = {
        customerId: selectedCustomer?.id,
        items,
        discount,
        discountType: "Percent",
        paymentMethod: paymentMethod,
        paidAmount: paymentMethod === "Credit" ? 0 : total, // Credit orders have 0 paid amount
        paymentDueDate: paymentMethod === "Credit" && paymentDueDate ? paymentDueDate : undefined,
        notes: '',
        status: "Completed",
        createdBy: 'POS',
      };

      const saved = await createSaleOrder(orderPayload as unknown as Partial<SaleOrder>);
      
      if (paymentMethod === "Credit") {
        toast.toast({
          title: "Đơn hàng nợ đã được tạo",
          description: `Đơn ${saved.code} đã được tạo. Công nợ: ${formatCurrency(total)}`,
        });
        // Reset credit-related state
        setPaymentDueDate("");
        // Navigate to receivables page after a short delay
        setTimeout(() => {
          navigate("/receivables");
        }, 2000);
      } else {
        toast.toast({ title: "Thanh toán thành công", description: `Đơn ${saved.code} đã được tạo.` });
      }
      
      setReceipt(saved);
      setReceiptOpen(true);
      clearCart();
      setCheckoutOpen(false);
      setWaitingForPayment(false);
      setPendingOrderCode(undefined);
      
      // Reset payment method and due date after successful order
      if (paymentMethod === "Credit") {
        setPaymentDueDate("");
        setPaymentMethod("Cash");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi khi tạo đơn';
      toast.toast({ title: 'Lỗi', description: message });
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Handle payment confirmation after QR payment
   */
  const confirmQRPayment = async () => {
    // In a real implementation, you would verify payment with the payment gateway
    // For now, we'll just complete the order
    await confirmCheckout();
  };

  /**
   * Cancel QR payment and close dialog
   */
  const cancelQRPayment = () => {
    setWaitingForPayment(false);
    setPendingOrderCode(undefined);
    setCheckoutOpen(false);
  };

  /**
   * Load products from API
   */
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getProducts(false); // Only active products
        setProducts(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Không thể tải danh sách sản phẩm";
        setError(errorMessage);
        console.error("Error loading products:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  /**
   * Get unique categories from products
   */
  const categories = ['Tất cả', ...Array.from(new Set(products.map((p) => p.categoryName || 'Khác').filter(Boolean)))];

  /**
   * Filter products based on search query and selected category
   */
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const productCategory = product.categoryName || 'Khác';
    const matchesCategory =
      selectedCategory === 'Tất cả' || productCategory === selectedCategory;
    return matchesSearch && matchesCategory && product.isActive;
  });

  /**
   * Load available units for a product
   */
  const loadAvailableUnits = async (productId: string): Promise<ProductAvailableUnit[]> => {
    try {
      setLoadingUnits(true);
      const units = await getProductAvailableUnits(productId);
      setAvailableUnits(units);
      return units;
    } catch (err) {
      toast.toast({ 
        title: 'Lỗi', 
        description: err instanceof Error ? err.message : 'Không thể tải danh sách đơn vị' 
      });
      return [];
    } finally {
      setLoadingUnits(false);
    }
  };

  /**
   * Add product to cart with selected unit
   */
  const addToCartWithUnit = (product: Product, selectedUnit: ProductAvailableUnit) => {
    setCart((prev) => {
      // Check if product with same unit already exists in cart
      const existing = prev.find(
        (item) => item.id === product.id && item.unitId === selectedUnit.unitId
      );
      
      if (existing) {
        // Increment quantity if same product and unit
        return prev.map((item) =>
          item.id === product.id && item.unitId === selectedUnit.unitId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      // Add new item with selected unit
      return [...prev, { 
        id: product.id, 
        name: product.name, 
        price: selectedUnit.price, 
        quantity: 1,
        unitId: selectedUnit.unitId,
        unitName: selectedUnit.unitName,
        originalPrice: product.salePrice, // Store original price for reference
      }];
    });
  };

  /**
   * Add product to cart - shows unit selection dialog if multiple units available
   */
  const addToCart = async (product: Product) => {
    // Load available units
    const units = await loadAvailableUnits(product.id);
    
    if (units.length === 1) {
      // Only one unit available, add directly
      addToCartWithUnit(product, units[0]);
    } else if (units.length > 1) {
      // Multiple units available, show dialog
      setPendingProduct(product);
      setUnitDialogOpen(true);
    } else {
      // Fallback: use product's default unit
      const defaultUnit: ProductAvailableUnit = {
        unitId: product.unitId,
        unitName: product.unitName || "",
        unitCode: "",
        conversionRate: 1,
        price: product.salePrice,
        isDefault: true,
        isBaseUnit: false,
      };
      addToCartWithUnit(product, defaultUnit);
    }
  };

  /**
   * Handle unit selection from dialog
   */
  const handleUnitSelected = (unit: ProductAvailableUnit) => {
    if (pendingProduct) {
      if (pendingCartItemId) {
        // Update existing cart item - remove old and add new with updated unit
        setCart((prev) => {
          // Remove the old item
          const filtered = prev.filter((item) => {
            const itemKey = `${item.id}-${item.unitId || "default"}`;
            return itemKey !== pendingCartItemId;
          });
          
          // Find the old item to preserve quantity
          const oldItem = prev.find((item) => {
            const itemKey = `${item.id}-${item.unitId || "default"}`;
            return itemKey === pendingCartItemId;
          });
          
          // Check if same product with new unit already exists
          const existingWithNewUnit = filtered.find(
            (item) => item.id === pendingProduct.id && item.unitId === unit.unitId
          );
          
          if (existingWithNewUnit) {
            // Merge quantities
            return filtered.map((item) =>
              item.id === pendingProduct.id && item.unitId === unit.unitId
                ? { ...item, quantity: item.quantity + (oldItem?.quantity || 1) }
                : item
            );
          } else {
            // Add new item with updated unit
            return [
              ...filtered,
              {
                id: pendingProduct.id,
                name: pendingProduct.name,
                price: unit.price,
                quantity: oldItem?.quantity || 1,
                unitId: unit.unitId,
                unitName: unit.unitName,
                originalPrice: pendingProduct.salePrice,
              },
            ];
          }
        });
        setPendingCartItemId(null);
      } else {
        // Add new item to cart
        addToCartWithUnit(pendingProduct, unit);
      }
      setUnitDialogOpen(false);
      setPendingProduct(null);
    }
  };

  /**
   * Update cart item unit
   */
  const updateCartItemUnit = async (cartItemId: string) => {
    const cartItem = cart.find((item) => {
      // Create a unique key for cart items
      const itemKey = `${item.id}-${item.unitId || "default"}`;
      return itemKey === cartItemId || item.id === cartItemId;
    });
    if (!cartItem) return;

    const product = products.find((p) => p.id === cartItem.id);
    if (!product) return;

    await loadAvailableUnits(product.id);
    if (availableUnits.length > 0) {
      setPendingProduct(product);
      // Create unique key for the cart item
      const itemKey = `${cartItem.id}-${cartItem.unitId || "default"}`;
      setPendingCartItemId(itemKey);
      setUnitDialogOpen(true);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          // Match by unique key (id-unitId) or just id
          const itemKey = `${item.id}-${item.unitId || "default"}`;
          if (itemKey === id || item.id === id) {
            return { ...item, quantity: Math.max(0, item.quantity + delta) };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id: string) => {
    setCart((prev) =>
      prev.filter((item) => {
        const itemKey = `${item.id}-${item.unitId || "default"}`;
        return itemKey !== id && item.id !== id;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex h-screen">
      {/* Left Panel - Products */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h1 className="text-xl font-semibold">Bán hàng</h1>
            <p className="text-sm text-muted-foreground">Ca sáng • Nguyễn Văn A</p>
          </div>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm sản phẩm hoặc quét barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleBarcodeSearch(searchQuery.trim());
                }
              }}
              className="pl-9"
            />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Categories */}
        <div className="flex gap-2 border-b p-3 overflow-x-auto">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'rounded-full',
                selectedCategory === cat && 'shadow-glow'
              )}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Products Grid */}
        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">
                {searchQuery ? "Không tìm thấy sản phẩm" : "Chưa có sản phẩm"}
              </p>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "Thử thay đổi từ khóa tìm kiếm"
                  : "Chưa có sản phẩm nào trong hệ thống"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredProducts.map((product) => {
                const isLowStock = product.currentStock <= product.minStock;
                const isOutOfStock = product.currentStock <= 0;
                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={isOutOfStock}
                    className={cn(
                      "flex flex-col items-center rounded-xl border bg-card p-4 text-center transition-all hover:border-primary hover:shadow-md active:scale-95",
                      isOutOfStock && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 overflow-hidden relative">
                      {product.thumbnailUrl || product.imageUrl ? (
                        <img
                          src={toAbsolute(product.thumbnailUrl ?? product.imageUrl)}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full">
                          <ShoppingCart className="h-6 w-6 text-primary" />
                        </div>
                      )}
                      {isLowStock && !isOutOfStock && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                        >
                          !
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mb-1">
                      {product.code}
                    </p>
                    <p className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                      {product.name}
                    </p>
                    <div className="flex flex-col items-center gap-1 w-full">
                      <p className="text-xs text-muted-foreground">
                        Còn lại: {product.currentStock.toLocaleString()} {product.unitName || ""}
                      </p>
                      {isOutOfStock && (
                        <Badge variant="destructive" className="text-xs">
                          Hết hàng
                        </Badge>
                      )}
                      {isLowStock && !isOutOfStock && (
                        <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">
                          Sắp hết
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-semibold text-primary">
                      {formatCurrency(product.salePrice)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right Panel - Cart */}
      <div className="w-96 flex flex-col border-l bg-card">
        {/* Cart Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Giỏ hàng</h2>
            {itemCount > 0 && (
              <Badge variant="secondary" className="rounded-full">
                {itemCount}
              </Badge>
            )}
          </div>
          {cart.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearCart}>
              <Trash2 className="mr-1 h-4 w-4" />
              Xóa tất cả
            </Button>
          )}
        </div>

        {/* Customer */}
        <div className="border-b p-4">
          <Button variant="outline" className="w-full justify-start" onClick={() => setCustomerSelectorOpen(true)}>
            <User className="mr-2 h-4 w-4" />
            {selectedCustomer ? `${selectedCustomer.name}` : 'Chọn khách hàng'}
          </Button>
        </div>

        {/* Cart Items */}
        <ScrollArea className="flex-1">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ShoppingCart className="mb-3 h-12 w-12 opacity-20" />
              <p>Giỏ hàng trống</p>
              <p className="text-sm">Thêm sản phẩm để bắt đầu</p>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {cart.map((item) => (
                <div
                  key={`${item.id}-${item.unitId}`}
                  className="flex items-center gap-3 rounded-lg bg-background p-3"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-primary">
                        {formatCurrency(item.price)}
                      </p>
                      {item.unitName && (
                        <Badge variant="outline" className="text-xs">
                          / {item.unitName}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} {item.unitName || ""} × {formatCurrency(item.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => {
                        // Remove item by unique key
                        const itemKey = `${item.id}-${item.unitId || "default"}`;
                        removeItem(itemKey);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        const itemKey = `${item.id}-${item.unitId || "default"}`;
                        updateCartItemUnit(itemKey);
                      }}
                      title="Đổi đơn vị"
                    >
                      <Percent className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Summary */}
        <div className="border-t p-4 space-y-4">
          {/* Discount */}
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              placeholder="Chiết khấu %"
              value={discount || ''}
              onChange={(e) => {
                const val = Number(e.target.value);
                setDiscount(isNaN(val) ? 0 : Math.max(0, Math.min(100, val)));
              }}
              className="h-9"
            />
          </div>

          {/* Totals */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tạm tính</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-success">
                <span>Chiết khấu ({discount}%)</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Tổng cộng</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="h-12 flex-col gap-1"
              disabled={cart.length === 0}
              onClick={() => { setPaymentMethod('Cash'); setCheckoutOpen(true); }}
            >
              <Banknote className="h-4 w-4" />
              <span className="text-xs">Tiền mặt</span>
            </Button>
            <Button
              variant="outline"
              className="h-12 flex-col gap-1"
              disabled={cart.length === 0}
              onClick={() => { setPaymentMethod('BankTransfer'); setCheckoutOpen(true); }}
            >
              <CreditCard className="h-4 w-4" />
              <span className="text-xs">Chuyển khoản</span>
            </Button>
            <Button
              variant="outline"
              className="h-12 flex-col gap-1"
              disabled={cart.length === 0}
              onClick={() => { setPaymentMethod('VietQR'); setCheckoutOpen(true); }}
            >
              <QrCode className="h-4 w-4" />
              <span className="text-xs">VietQR</span>
            </Button>
            <Button
              variant="outline"
              className="h-12 flex-col gap-1"
              disabled={cart.length === 0}
              onClick={() => { setPaymentMethod('Momo'); setCheckoutOpen(true); }}
            >
              <Wallet className="h-4 w-4" />
              <span className="text-xs">Ví điện tử</span>
            </Button>
            <Button
              variant="outline"
              className="h-12 flex-col gap-1 border-orange-500 text-orange-600 hover:bg-orange-50"
              disabled={cart.length === 0 || !selectedCustomer}
              onClick={handleCreditPayment}
            >
              <FileText className="h-4 w-4" />
              <span className="text-xs">Nợ</span>
            </Button>
          </div>

          {/* Checkout Button */}
          <Button
            className="w-full h-12 text-base shadow-glow"
            size="lg"
            disabled={cart.length === 0}
            onClick={() => { setPaymentMethod('Cash'); setCheckoutOpen(true); }}
          >
            Thanh toán {formatCurrency(total)}
          </Button>
        </div>

        {/* Customer selector dialog */}
        <Dialog open={customerSelectorOpen} onOpenChange={setCustomerSelectorOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chọn khách hàng</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div className="flex gap-2">
                <Input placeholder="Tìm khách hàng..." onChange={(e) => { const q = e.target.value.toLowerCase(); setCustomers((prev) => prev.filter(c => c.name.toLowerCase().includes(q) || (c.phone || '').includes(q))); }} />
                <Button onClick={() => setCustomerDialogOpen(true)}>Thêm mới</Button>
              </div>

              <div className="max-h-64 overflow-y-auto">
                {customers.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-3">Không có khách hàng</div>
                ) : (
                  customers.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-2 hover:bg-muted rounded">
                      <div>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.phone}</div>
                      </div>
                      <div>
                        <Button size="sm" onClick={() => { setSelectedCustomer(c); setCustomerSelectorOpen(false); }}>
                          Chọn
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCustomerSelectorOpen(false)}>Đóng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <CustomerDialog
          open={customerDialogOpen}
          onOpenChange={setCustomerDialogOpen}
          onSuccess={() => {
            setCustomerDialogOpen(false);
            // reload customers if selector open
            if (customerSelectorOpen) getCustomers().then(setCustomers).catch(() => {});
          }}
        />

        {/* Checkout dialog */}
        <Dialog open={checkoutOpen} onOpenChange={(open) => {
          setCheckoutOpen(open);
          if (!open) {
            setWaitingForPayment(false);
            setPendingOrderCode(undefined);
            if (paymentMethod === "Credit") {
              setPaymentDueDate("");
              setPaymentMethod("Cash");
            }
          }
        }}>
          <DialogContent className={waitingForPayment && requiresQRCode(paymentMethod) ? "max-w-lg" : "max-w-md"}>
            <DialogHeader>
              <DialogTitle>Thanh toán</DialogTitle>
            </DialogHeader>

            {waitingForPayment && requiresQRCode(paymentMethod) ? (
              // Show QR code for QR-based payments
              <div className="space-y-4">
                <PaymentQR
                  paymentMethod={paymentMethod}
                  amount={total}
                  orderCode={pendingOrderCode}
                />
                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={cancelQRPayment} 
                    className="flex-1"
                    disabled={processing}
                  >
                    Hủy
                  </Button>
                  <Button 
                    onClick={confirmQRPayment} 
                    className="flex-1"
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      'Đã thanh toán'
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              // Show payment method selection or credit order confirmation
              <div className="space-y-4">
                <div className="text-sm"><strong>Tạm tính:</strong> {formatCurrency(subtotal)}</div>
                {discount > 0 && (
                  <div className="text-sm text-success"><strong>Chiết khấu:</strong> {discount}% (-{formatCurrency(discountAmount)})</div>
                )}
                <div className="text-lg font-semibold">Tổng: {formatCurrency(total)}</div>

                {paymentMethod === 'Credit' ? (
                  // Show credit order confirmation
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p><strong>Đơn hàng nợ</strong></p>
                        <p>Khách hàng: <strong>{selectedCustomer?.name || "Chưa chọn"}</strong></p>
                        <p>Ngày đến hạn: <strong>{paymentDueDate ? new Date(paymentDueDate).toLocaleDateString("vi-VN") : "Chưa có"}</strong></p>
                        <p>Công nợ: <strong>{formatCurrency(total)}</strong></p>
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  // Show payment method selection for non-credit orders
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={() => setPaymentMethod('Cash')} 
                      variant={paymentMethod === 'Cash' ? 'default' : 'outline'}
                      className="h-auto py-3 flex-col gap-1"
                    >
                      <Banknote className="h-4 w-4" />
                      <span className="text-xs">Tiền mặt</span>
                    </Button>
                    <Button 
                      onClick={() => setPaymentMethod('BankTransfer')} 
                      variant={paymentMethod === 'BankTransfer' ? 'default' : 'outline'}
                      className="h-auto py-3 flex-col gap-1"
                    >
                      <CreditCard className="h-4 w-4" />
                      <span className="text-xs">Chuyển khoản</span>
                    </Button>
                    <Button 
                      onClick={() => setPaymentMethod('VietQR')} 
                      variant={paymentMethod === 'VietQR' ? 'default' : 'outline'}
                      className="h-auto py-3 flex-col gap-1"
                    >
                      <QrCode className="h-4 w-4" />
                      <span className="text-xs">VietQR</span>
                    </Button>
                    <Button 
                      onClick={() => setPaymentMethod('Momo')} 
                      variant={paymentMethod === 'Momo' ? 'default' : 'outline'}
                      className="h-auto py-3 flex-col gap-1"
                    >
                      <Wallet className="h-4 w-4" />
                      <span className="text-xs">Ví điện tử</span>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {!waitingForPayment && (
              <DialogFooter>
                <Button variant="outline" onClick={() => setCheckoutOpen(false)} disabled={processing}>
                  Hủy
                </Button>
                <Button onClick={confirmCheckout} disabled={processing}>
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    'Xác nhận'
                  )}
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>

        {/* Credit Payment Dialog - Enter due date */}
        <Dialog open={creditDialogOpen} onOpenChange={setCreditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Tạo đơn hàng nợ</DialogTitle>
              <DialogDescription>
                Nhập thông tin để tạo đơn hàng nợ cho khách hàng {selectedCustomer?.name || ""}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Tổng tiền đơn hàng: <strong>{formatCurrency(total)}</strong>
                  <br />
                  Đơn hàng sẽ được tạo với công nợ này.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Ngày đến hạn thanh toán *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={paymentDueDate}
                  onChange={(e) => setPaymentDueDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Khách hàng sẽ phải thanh toán trước ngày này
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setCreditDialogOpen(false);
                  setPaymentDueDate("");
                }}
                disabled={processing}
              >
                Hủy
              </Button>
              <Button onClick={confirmCreditPayment} disabled={processing || !paymentDueDate}>
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    Xác nhận tạo đơn nợ
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Receipt dialog */}
        <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Biên lai {receipt?.code ? `- ${receipt.code}` : ''}</DialogTitle>
            </DialogHeader>

            <div className="space-y-2">
              <div className="text-sm">Khách hàng: {receipt?.customerName || 'Khách lẻ'}</div>
              <div className="text-sm">Thời gian: {receipt ? new Date(receipt.createdAt).toLocaleString() : ''}</div>
              <div className="text-sm">Phương thức: {receipt?.paymentMethod === 'Credit' ? 'Nợ' : receipt?.paymentMethod}</div>
              
              {receipt?.paymentMethod === 'Credit' && (
                <Alert variant="default" className="bg-orange-50 border-orange-200">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <p className="font-semibold">Đơn hàng nợ</p>
                    <p>Công nợ: {formatCurrency(receipt?.total || 0)}</p>
                    <p className="text-xs mt-1">Đơn hàng này đã được ghi vào công nợ phải thu</p>
                  </AlertDescription>
                </Alert>
              )}

              <div className="border rounded p-2 max-h-48 overflow-y-auto">
                {receipt?.items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <div>{it.productName} x{it.quantity} {it.unit || ""}</div>
                    <div>{formatCurrency(it.total)}</div>
                  </div>
                ))}
              </div>

              <div className="text-right font-semibold">Tổng: {formatCurrency(receipt?.total || 0)}</div>
              
              {receipt?.paymentMethod === 'Credit' && (
                <div className="pt-2 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setReceiptOpen(false);
                      navigate("/receivables");
                    }}
                  >
                    Xem công nợ phải thu
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setReceiptOpen(false)}>Đóng</Button>
              <Button onClick={() => window.print()}>In</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Unit selection dialog */}
        <Dialog open={unitDialogOpen} onOpenChange={setUnitDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Chọn đơn vị tính</DialogTitle>
              <DialogDescription>
                {pendingProduct?.name}
              </DialogDescription>
            </DialogHeader>

            {loadingUnits ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableUnits.map((unit) => (
                  <button
                    key={unit.unitId}
                    onClick={() => handleUnitSelected(unit)}
                    className="w-full flex items-center justify-between rounded-lg border p-3 text-left hover:bg-muted transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{unit.unitName}</span>
                        {unit.isDefault && (
                          <Badge variant="secondary" className="text-xs">Mặc định</Badge>
                        )}
                        {unit.isBaseUnit && (
                          <Badge variant="outline" className="text-xs">Cơ sở</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(unit.price)} / {unit.unitName}
                      </p>
                      {unit.conversionRate !== 1 && (
                        <p className="text-xs text-muted-foreground">
                          Tỷ lệ: {unit.conversionRate > 1 ? `1 ${unit.unitName} = ${unit.conversionRate.toFixed(2)}` : `${(1 / unit.conversionRate).toFixed(2)} ${unit.unitName} = 1`} {pendingProduct?.unitName || ""}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setUnitDialogOpen(false);
                setPendingProduct(null);
              }}>
                Hủy
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
