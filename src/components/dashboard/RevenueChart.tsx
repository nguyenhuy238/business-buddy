import { useState, useEffect } from 'react';
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
import { getRevenueByTime } from '@/services/dashboardService';
import type { RevenueByTime } from '@/types';
import { Loader2 } from 'lucide-react';

export function RevenueChart() {
  const [data, setData] = useState<RevenueByTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load revenue data from API
   */
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const revenueData = await getRevenueByTime(30); // Last 30 days
        setData(revenueData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Không thể tải dữ liệu doanh thu";
        setError(errorMessage);
        console.error("Error loading revenue data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm animate-fade-in">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Doanh thu 30 ngày gần đây</h3>
        <p className="text-sm text-muted-foreground">
          Tổng: {loading ? "..." : formatCurrency(totalRevenue)}
        </p>
      </div>
      <div className="h-72">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            {error}
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            Chưa có dữ liệu
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
