import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
} from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

const categories = ['Tất cả', 'Đồ uống', 'Đồ ăn', 'Combo', 'Khác'];

const products = [
  { id: '1', name: 'Cà phê sữa đá', price: 35000, category: 'Đồ uống' },
  { id: '2', name: 'Trà đào cam sả', price: 45000, category: 'Đồ uống' },
  { id: '3', name: 'Bánh mì thịt nướng', price: 35000, category: 'Đồ ăn' },
  { id: '4', name: 'Sinh tố bơ', price: 55000, category: 'Đồ uống' },
  { id: '5', name: 'Nước ép cam', price: 40000, category: 'Đồ uống' },
  { id: '6', name: 'Trà sữa trân châu', price: 45000, category: 'Đồ uống' },
  { id: '7', name: 'Bạc xỉu', price: 35000, category: 'Đồ uống' },
  { id: '8', name: 'Cà phê đen đá', price: 29000, category: 'Đồ uống' },
  { id: '9', name: 'Combo sáng', price: 55000, category: 'Combo' },
  { id: '10', name: 'Sandwich gà', price: 45000, category: 'Đồ ăn' },
  { id: '11', name: 'Croissant bơ', price: 35000, category: 'Đồ ăn' },
  { id: '12', name: 'Matcha latte', price: 55000, category: 'Đồ uống' },
];

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function POS() {
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'Tất cả' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: (typeof products)[0]) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
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
              className="pl-9"
            />
          </div>
        </div>

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
          <div className="grid grid-cols-3 gap-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="flex flex-col items-center rounded-xl border bg-card p-4 text-center transition-all hover:border-primary hover:shadow-md active:scale-95"
              >
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground line-clamp-2">
                  {product.name}
                </p>
                <p className="mt-1 text-sm font-semibold text-primary">
                  {formatCurrency(product.price)}
                </p>
              </button>
            ))}
          </div>
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
          <Button variant="outline" className="w-full justify-start">
            <User className="mr-2 h-4 w-4" />
            Chọn khách hàng
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
              onChange={(e) => setDiscount(Number(e.target.value))}
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
            >
              <Banknote className="h-4 w-4" />
              <span className="text-xs">Tiền mặt</span>
            </Button>
            <Button
              variant="outline"
              className="h-12 flex-col gap-1"
              disabled={cart.length === 0}
            >
              <CreditCard className="h-4 w-4" />
              <span className="text-xs">Chuyển khoản</span>
            </Button>
            <Button
              variant="outline"
              className="h-12 flex-col gap-1"
              disabled={cart.length === 0}
            >
              <QrCode className="h-4 w-4" />
              <span className="text-xs">VietQR</span>
            </Button>
            <Button
              variant="outline"
              className="h-12 flex-col gap-1"
              disabled={cart.length === 0}
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
          >
            Thanh toán {formatCurrency(total)}
          </Button>
        </div>
      </div>
    </div>
  );
}
