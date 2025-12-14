import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '@/lib/format';

const data = [
  { name: 'T2', revenue: 4200000, orders: 12 },
  { name: 'T3', revenue: 5800000, orders: 18 },
  { name: 'T4', revenue: 3500000, orders: 10 },
  { name: 'T5', revenue: 7200000, orders: 24 },
  { name: 'T6', revenue: 8500000, orders: 28 },
  { name: 'T7', revenue: 12000000, orders: 42 },
  { name: 'CN', revenue: 9800000, orders: 35 },
];

export function RevenueChart() {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm animate-fade-in">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Doanh thu tuần này</h3>
        <p className="text-sm text-muted-foreground">
          Tổng: {formatCurrency(data.reduce((sum, d) => sum + d.revenue, 0))}
        </p>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${(value / 1000000).toFixed(0)}tr`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
              formatter={(value: number) => [formatCurrency(value), 'Doanh thu']}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
