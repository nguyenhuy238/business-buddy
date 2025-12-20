import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Search,
  Phone,
  Mail,
  Star,
  TrendingUp,
  Users,
  AlertCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { getCustomers } from '@/services/customerService';
import type { Customer } from '@/types';
import { CustomerDialog } from '@/components/dialogs/CustomerDialog';

/**
 * Tier labels mapping (backend uses PascalCase)
 */
const tierLabels = {
  Bronze: { label: 'Đồng', color: 'bg-orange-100 text-orange-800' },
  Silver: { label: 'Bạc', color: 'bg-gray-100 text-gray-800' },
  Gold: { label: 'Vàng', color: 'bg-yellow-100 text-yellow-800' },
  Platinum: { label: 'Bạch kim', color: 'bg-purple-100 text-purple-800' },
};

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  /**
   * Load customers from API
   */
  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCustomers();
      setCustomers(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể tải danh sách khách hàng";
      setError(errorMessage);
      console.error("Error loading customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  /**
   * Filter customers based on search query
   */
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      customer.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /**
   * Calculate statistics
   */
  const stats = {
    total: customers.filter((c) => c.isActive).length,
    vip: customers.filter((c) => c.isActive && (c.membershipTier === 'Gold' || c.membershipTier === 'Platinum')).length,
    totalSpent: customers.reduce((sum, c) => sum + c.totalSpent, 0),
    totalReceivables: customers.reduce((sum, c) => sum + c.receivables, 0),
  };

  return (
    <div className="min-h-screen">
      <Header title="Quản lý khách hàng" subtitle="Quản lý thông tin và công nợ khách hàng" />

      <div className="p-6 space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng khách hàng</p>
                <p className="text-2xl font-bold">{loading ? "..." : stats.total}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent/10 p-2">
                <Star className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Thành viên VIP</p>
                <p className="text-2xl font-bold">{loading ? "..." : stats.vip}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng doanh số</p>
                <p className="text-2xl font-bold">
                  {loading ? "..." : formatCurrency(stats.totalSpent)}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-destructive/10 p-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Công nợ phải thu</p>
                <p className="text-2xl font-bold">
                  {loading ? "..." : formatCurrency(stats.totalReceivables)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên, SĐT, mã KH..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button size="sm" onClick={() => {
            setSelectedCustomer(null);
            setDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm khách hàng
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">
                Không tìm thấy khách hàng
              </p>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "Thử thay đổi từ khóa tìm kiếm"
                  : "Chưa có khách hàng nào trong hệ thống"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Mã KH</TableHead>
                  <TableHead>Tên khách hàng</TableHead>
                  <TableHead>Liên hệ</TableHead>
                  <TableHead>Hạng thành viên</TableHead>
                  <TableHead className="text-right">Điểm tích lũy</TableHead>
                  <TableHead className="text-right">Tổng mua</TableHead>
                  <TableHead className="text-right">Công nợ</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers
                  .filter((c) => c.isActive)
                  .map((customer) => {
                    const tier = tierLabels[customer.membershipTier as keyof typeof tierLabels] || tierLabels.Bronze;
                    return (
                      <TableRow key={customer.id} className="group">
                        <TableCell className="font-mono text-sm">
                          {customer.code}
                        </TableCell>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {customer.phone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                {customer.phone}
                              </div>
                            )}
                            {customer.email && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {customer.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("rounded-full", tier.color)}>
                            <Star className="mr-1 h-3 w-3" />
                            {tier.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {customer.points.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(customer.totalSpent)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={cn(
                              'font-medium',
                              customer.receivables > 0 && 'text-destructive'
                            )}
                          >
                            {formatCurrency(customer.receivables)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {customer.zaloId && (
                                <DropdownMenuItem>
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  Nhắn tin Zalo
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedCustomer(customer);
                                  setDialogOpen(true);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Chỉnh sửa
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setSelectedCustomer(customer);
                                  setDialogOpen(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Xóa
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <CustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customer={selectedCustomer}
        onSuccess={() => {
          loadCustomers();
          setSelectedCustomer(null);
        }}
      />
    </div>
  );
}
