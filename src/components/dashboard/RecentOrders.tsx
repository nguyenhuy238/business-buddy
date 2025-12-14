import { formatCurrency, formatDateTime } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const recentOrders = [
  {
    id: 'DH001',
    customer: 'Nguyễn Văn A',
    total: 250000,
    status: 'completed',
    paymentMethod: 'cash',
    createdAt: new Date(),
  },
  {
    id: 'DH002',
    customer: 'Khách lẻ',
    total: 185000,
    status: 'completed',
    paymentMethod: 'momo',
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: 'DH003',
    customer: 'Trần Thị B',
    total: 520000,
    status: 'pending',
    paymentMethod: 'bank_transfer',
    createdAt: new Date(Date.now() - 60 * 60 * 1000),
  },
  {
    id: 'DH004',
    customer: 'Lê Văn C',
    total: 95000,
    status: 'completed',
    paymentMethod: 'vietqr',
    createdAt: new Date(Date.now() - 90 * 60 * 1000),
  },
  {
    id: 'DH005',
    customer: 'Phạm Thị D',
    total: 340000,
    status: 'cancelled',
    paymentMethod: 'cash',
    createdAt: new Date(Date.now() - 120 * 60 * 1000),
  },
];

const statusLabels = {
  completed: { label: 'Hoàn thành', variant: 'success' },
  pending: { label: 'Chờ xử lý', variant: 'warning' },
  cancelled: { label: 'Đã hủy', variant: 'destructive' },
};

const paymentLabels = {
  cash: 'Tiền mặt',
  momo: 'Momo',
  zalopay: 'ZaloPay',
  vietqr: 'VietQR',
  bank_transfer: 'Chuyển khoản',
  credit: 'Ghi nợ',
};

export function RecentOrders() {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm animate-fade-in">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Đơn hàng gần đây</h3>
        <a href="/reports" className="text-sm text-primary hover:underline">
          Xem tất cả
        </a>
      </div>
      <div className="space-y-3">
        {recentOrders.map((order) => (
          <div
            key={order.id}
            className="flex items-center justify-between rounded-lg border bg-background p-3 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                #{order.id.slice(-3)}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {order.customer}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(order.createdAt)} • {paymentLabels[order.paymentMethod as keyof typeof paymentLabels]}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">
                {formatCurrency(order.total)}
              </p>
              <Badge
                variant={
                  statusLabels[order.status as keyof typeof statusLabels].variant as any
                }
                className="mt-1 text-xs"
              >
                {statusLabels[order.status as keyof typeof statusLabels].label}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
