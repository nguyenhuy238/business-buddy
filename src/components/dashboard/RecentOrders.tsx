import { useState, useEffect } from 'react';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { getSaleOrders } from '@/services/saleOrderService';
import type { SaleOrder } from '@/types';
import { cn } from '@/lib/utils';

/**
 * Status labels mapping
 */
const statusLabels = {
  Completed: { label: 'Hoàn thành', variant: 'secondary' as const },
  Draft: { label: 'Chờ xử lý', variant: 'outline' as const },
  Cancelled: { label: 'Đã hủy', variant: 'destructive' as const },
  Refunded: { label: 'Đã hoàn tiền', variant: 'destructive' as const },
};

/**
 * Payment method labels
 */
const paymentLabels: Record<string, string> = {
  Cash: 'Tiền mặt',
  Momo: 'Momo',
  ZaloPay: 'ZaloPay',
  VietQR: 'VietQR',
  BankTransfer: 'Chuyển khoản',
  Credit: 'Ghi nợ',
};

export function RecentOrders() {
  const [recentOrders, setRecentOrders] = useState<SaleOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load recent orders from API (last 5 orders)
   */
  useEffect(() => {
    const loadRecentOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getSaleOrders(undefined, undefined, undefined, 1, 5);
        setRecentOrders(response.items);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Không thể tải đơn hàng gần đây";
        setError(errorMessage);
        console.error("Error loading recent orders:", err);
      } finally {
        setLoading(false);
      }
    };

    loadRecentOrders();
  }, []);

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm animate-fade-in">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Đơn hàng gần đây</h3>
        <a href="/reports" className="text-sm text-primary hover:underline">
          Xem tất cả
        </a>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-sm text-muted-foreground text-center py-8">{error}</div>
      ) : recentOrders.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-8">
          Chưa có đơn hàng nào
        </div>
      ) : (
        <div className="space-y-3">
          {recentOrders.map((order) => {
            const status = statusLabels[order.status as keyof typeof statusLabels] || statusLabels.Draft;
            const paymentLabel = paymentLabels[order.paymentMethod] || order.paymentMethod;
            return (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-lg border bg-background p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                    #{order.code.slice(-3)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {order.customerName || "Khách lẻ"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(order.createdAt)} • {paymentLabel}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">
                    {formatCurrency(order.total)}
                  </p>
                  <Badge variant={status.variant} className="mt-1 text-xs">
                    {status.label}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
