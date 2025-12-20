import { useState, useEffect } from 'react';
import { AlertTriangle, Package, Loader2 } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { getProducts } from '@/services/productService';
import type { Product } from '@/types';

/**
 * Determine if product is low stock
 */
function isLowStock(product: Product): boolean {
  return product.isActive && product.currentStock < product.minStock && product.currentStock > 0;
}

export function LowStockAlert() {
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Load low stock products from API
   */
  useEffect(() => {
    const loadLowStockProducts = async () => {
      try {
        setLoading(true);
        const products = await getProducts(false); // Only active products
        const lowStock = products.filter(isLowStock).slice(0, 5); // Top 5
        setLowStockProducts(lowStock);
      } catch (err) {
        console.error("Error loading low stock products:", err);
      } finally {
        setLoading(false);
      }
    };

    loadLowStockProducts();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-5 shadow-sm animate-fade-in">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

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
            key={product.id}
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
                Còn {formatNumber(product.currentStock)}
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
