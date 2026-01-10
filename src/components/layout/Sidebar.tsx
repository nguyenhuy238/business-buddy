import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Truck,
  Wallet,
  FileText,
  Settings,
  Store,
  ChevronLeft,
  ChevronRight,
  ArrowDownCircle,
  ArrowUpCircle,
  Receipt,
  PackageCheck,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Tổng quan' },
  { path: '/inventory', icon: Package, label: 'Hàng hóa' },
  { path: '/pos', icon: ShoppingCart, label: 'Bán hàng' },
  { path: '/sale-orders', icon: Receipt, label: 'Đơn hàng bán' },
  { path: '/purchase-orders', icon: PackageCheck, label: 'Đơn nhập hàng' },
  { path: '/customers', icon: Users, label: 'Khách hàng' },
  { path: '/suppliers', icon: Truck, label: 'Nhà cung cấp' },
  { path: '/cashbook', icon: Wallet, label: 'Sổ quỹ' },
  { path: '/receivables', icon: ArrowDownCircle, label: 'Công nợ phải thu' },
  { path: '/payables', icon: ArrowUpCircle, label: 'Công nợ phải trả' },
  { path: '/reports', icon: FileText, label: 'Báo cáo' },
  { path: '/settings', icon: Settings, label: 'Cài đặt' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
              <Store className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-sidebar-foreground">
              HKD Pro
            </span>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
            <Store className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                isActive && 'bg-sidebar-accent text-sidebar-foreground',
                collapsed && 'justify-center px-2'
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-card text-foreground shadow-md hover:bg-secondary"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>

      {/* Footer */}
      {!collapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="rounded-lg bg-sidebar-accent/50 p-3">
            <p className="text-xs text-sidebar-foreground/70">
              Phiên bản 1.0
            </p>
            <p className="text-xs text-sidebar-foreground/50">
              © 2024 HKD Pro
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
