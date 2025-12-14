import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { TopProducts } from '@/components/dashboard/TopProducts';
import { RecentOrders } from '@/components/dashboard/RecentOrders';
import { LowStockAlert } from '@/components/dashboard/LowStockAlert';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
  Package,
  AlertCircle,
} from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="min-h-screen">
      <Header
        title="Tổng quan"
        subtitle="Xin chào! Đây là tình hình kinh doanh hôm nay."
      />
      
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Doanh thu hôm nay"
            value={12500000}
            icon={DollarSign}
            trend={{ value: 12.5, isPositive: true }}
            variant="primary"
            isCurrency
          />
          <StatCard
            title="Đơn hàng hôm nay"
            value={48}
            subtitle="32 hoàn thành • 16 đang xử lý"
            icon={ShoppingCart}
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard
            title="Lợi nhuận ước tính"
            value={3750000}
            subtitle="Tỷ suất: 30%"
            icon={TrendingUp}
            variant="success"
            isCurrency
          />
          <StatCard
            title="Khách hàng mới"
            value={12}
            subtitle="Tổng: 1,284 khách"
            icon={Users}
          />
        </div>

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
