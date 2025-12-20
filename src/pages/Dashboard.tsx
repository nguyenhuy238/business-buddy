import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { TopProducts } from '@/components/dashboard/TopProducts';
import { RecentOrders } from '@/components/dashboard/RecentOrders';
import { LowStockAlert } from '@/components/dashboard/LowStockAlert';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
  Package,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { getDashboardStats } from '@/services/dashboardService';
import type { DashboardStats } from '@/types';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load dashboard stats from API
   */
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Không thể tải thống kê";
        setError(errorMessage);
        console.error("Error loading dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  /**
   * Calculate profit margin percentage
   */
  const profitMargin = stats && stats.todayRevenue > 0
    ? ((stats.todayProfit / stats.todayRevenue) * 100).toFixed(1)
    : "0";

  return (
    <div className="min-h-screen">
      <Header
        title="Tổng quan"
        subtitle="Xin chào! Đây là tình hình kinh doanh hôm nay."
      />
      
      <div className="p-6 space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Grid */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-center h-24">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Doanh thu hôm nay"
              value={stats.todayRevenue}
              icon={DollarSign}
              variant="primary"
              isCurrency
            />
            <StatCard
              title="Đơn hàng hôm nay"
              value={stats.todayOrders}
              icon={ShoppingCart}
            />
            <StatCard
              title="Lợi nhuận ước tính"
              value={stats.todayProfit}
              subtitle={`Tỷ suất: ${profitMargin}%`}
              icon={TrendingUp}
              variant="success"
              isCurrency
            />
            <StatCard
              title="Sản phẩm sắp hết"
              value={stats.lowStockProducts}
              subtitle="Cần nhập hàng"
              icon={Package}
            />
          </div>
        ) : null}

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Revenue Chart - Takes 2 columns */}
          <div className="lg:col-span-2">
            <RevenueChart />
          </div>
          
          {/* Low Stock Alert */}
          <div>
            <LowStockAlert />
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <TopProducts />
          <RecentOrders />
        </div>
      </div>
    </div>
  );
}
