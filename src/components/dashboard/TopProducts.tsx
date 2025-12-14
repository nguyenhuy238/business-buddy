import { Package } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/format';
import { Progress } from '@/components/ui/progress';

const topProducts = [
  { name: 'Cà phê sữa đá', sold: 156, revenue: 7800000, percentage: 100 },
  { name: 'Trà đào cam sả', sold: 124, revenue: 6200000, percentage: 79 },
  { name: 'Bánh mì thịt nướng', sold: 98, revenue: 4900000, percentage: 63 },
  { name: 'Sinh tố bơ', sold: 85, revenue: 5100000, percentage: 54 },
  { name: 'Nước ép cam', sold: 72, revenue: 2880000, percentage: 46 },
];

export function TopProducts() {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm animate-fade-in">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Sản phẩm bán chạy</h3>
        <span className="text-sm text-muted-foreground">Tuần này</span>
      </div>
      <div className="space-y-4">
        {topProducts.map((product, index) => (
          <div key={product.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(product.sold)} đã bán
                  </p>
                </div>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {formatCurrency(product.revenue)}
              </p>
            </div>
            <Progress value={product.percentage} className="h-1.5" />
          </div>
        ))}
      </div>
    </div>
  );
}
