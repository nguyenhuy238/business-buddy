import { AlertTriangle, Package } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import { Button } from '@/components/ui/button';

const lowStockProducts = [
  { name: 'Sữa đặc Ông Thọ', stock: 5, minStock: 20 },
  { name: 'Đường trắng', stock: 2, minStock: 10 },
  { name: 'Cà phê nguyên chất', stock: 8, minStock: 15 },
  { name: 'Trà xanh Thái Nguyên', stock: 3, minStock: 12 },
];

export function LowStockAlert() {
  if (lowStockProducts.length === 0) return null;

  return (
    <div className="rounded-xl border border-warning/30 bg-warning/5 p-5 shadow-sm animate-fade-in">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-lg bg-warning/20 p-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Cảnh báo tồn kho</h3>
          <p className="text-sm text-muted-foreground">
            {lowStockProducts.length} sản phẩm sắp hết hàng
          </p>
        </div>
      </div>
      <div className="space-y-2">
        {lowStockProducts.map((product) => (
          <div
            key={product.name}
            className="flex items-center justify-between rounded-lg bg-background p-3"
          >
            <div className="flex items-center gap-3">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {product.name}
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-destructive">
                Còn {formatNumber(product.stock)}
              </span>
              <span className="text-xs text-muted-foreground">
                {' '}
                / {formatNumber(product.minStock)} tối thiểu
              </span>
            </div>
          </div>
        ))}
      </div>
      <Button variant="outline" className="mt-4 w-full">
        Tạo đơn nhập hàng
      </Button>
    </div>
  );
}
