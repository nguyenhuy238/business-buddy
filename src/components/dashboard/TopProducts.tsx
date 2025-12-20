import { useState, useEffect } from 'react';
import { Package, Loader2 } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/format';
import { Progress } from '@/components/ui/progress';
import { getTopProducts } from '@/services/topProductsService';
import type { TopProduct } from '@/services/topProductsService';

export function TopProducts() {
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load top products from API (last 7 days)
   */
  useEffect(() => {
    const loadTopProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const from = new Date();
        from.setDate(from.getDate() - 7); // Last 7 days
        const data = await getTopProducts(from, new Date(), 5);
        setTopProducts(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Không thể tải sản phẩm bán chạy";
        setError(errorMessage);
        console.error("Error loading top products:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTopProducts();
  }, []);

  /**
   * Calculate percentage for progress bar
   */
  const maxRevenue = topProducts.length > 0 ? Math.max(...topProducts.map(p => p.revenue)) : 0;

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm animate-fade-in">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Sản phẩm bán chạy</h3>
        <span className="text-sm text-muted-foreground">7 ngày qua</span>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-sm text-muted-foreground text-center py-8">{error}</div>
      ) : topProducts.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-8">
          Chưa có dữ liệu bán hàng
        </div>
      ) : (
        <div className="space-y-4">
          {topProducts.map((product, index) => {
            const percentage = maxRevenue > 0 ? (product.revenue / maxRevenue) * 100 : 0;
            return (
              <div key={product.productId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{product.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatNumber(product.quantity)} đã bán
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {formatCurrency(product.revenue)}
                  </p>
                </div>
                <Progress value={percentage} className="h-1.5" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
