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
} from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { getProducts, getProductByBarcode, getProductByCode } from '@/services/productService';
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
import type { Product, Customer, SaleOrder, PaymentMethod } from '@/types';

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

  // Receipt
  const [receipt, setReceipt] = useState<SaleOrder | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

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
    paymentMethod: string; // "Cash", "BankTransfer", "VietQR", etc.
    status?: string; // "Draft", "Completed", "Cancelled", "Refunded"
    paidAmount: number;
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
    if (requiresQRCode(paymentMethod) && !waitingForPayment) {
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
        paidAmount: total,
        notes: '',
        status: "Completed",
        createdBy: 'POS',
      };

      const saved = await createSaleOrder(orderPayload as unknown as Partial<SaleOrder>);
      toast.toast({ title: 'Thanh toán thành công', description: `Đơn ${saved.code} đã được tạo.` });
      setReceipt(saved);
      setReceiptOpen(true);
      clearCart();
      setCheckoutOpen(false);
      setWaitingForPayment(false);
      setPendingOrderCode(undefined);
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
   * Add product to cart
   */
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { 
        id: product.id, 
        name: product.name, 
        price: product.salePrice, 
        quantity: 1,
        unitId: product.unitId || product.baseUnitId || undefined,
      }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
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
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg bg-background p-3"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-sm text-primary">
                      {formatCurrency(item.price)}
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => removeItem(item.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
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
              // Show payment method selection
              <div className="space-y-4">
                <div className="text-sm"><strong>Tạm tính:</strong> {formatCurrency(subtotal)}</div>
                {discount > 0 && (
                  <div className="text-sm text-success"><strong>Chiết khấu:</strong> {discount}% (-{formatCurrency(discountAmount)})</div>
                )}
                <div className="text-lg font-semibold">Tổng: {formatCurrency(total)}</div>

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

        {/* Receipt dialog */}
        <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Biên lai {receipt?.code ? `- ${receipt.code}` : ''}</DialogTitle>
            </DialogHeader>

            <div className="space-y-2">
              <div className="text-sm">Khách hàng: {receipt?.customerName || 'Khách lẻ'}</div>
              <div className="text-sm">Thời gian: {receipt ? new Date(receipt.createdAt).toLocaleString() : ''}</div>

              <div className="border rounded p-2 max-h-48 overflow-y-auto">
                {receipt?.items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <div>{it.productName} x{it.quantity}</div>
                    <div>{formatCurrency(it.total)}</div>
                  </div>
                ))}
              </div>

              <div className="text-right font-semibold">Tổng: {formatCurrency(receipt?.total || 0)}</div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setReceiptOpen(false)}>Đóng</Button>
              <Button onClick={() => window.print()}>In</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
