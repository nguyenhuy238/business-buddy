import { useState, useEffect, useCallback } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertCircle,
  Loader2,
  MoreHorizontal,
  Edit,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { getCashbookEntries, getCashbookStatistics, type CashbookStats } from '@/services/cashbookService';
import type { CashbookEntry } from '@/types';
import { CashbookDialog } from '@/components/dialogs/CashbookDialog';

/**
 * Category labels mapping for cashbook entries
 */
const categoryLabels: Record<string, { label: string; color: string }> = {
  'Bán hàng': { label: 'Bán hàng', color: 'bg-success/10 text-success' },
  'Nhập hàng': { label: 'Nhập hàng', color: 'bg-warning/10 text-warning' },
  'Vận hành': { label: 'Vận hành', color: 'bg-info/10 text-info' },
  'Lương': { label: 'Lương', color: 'bg-purple-100 text-purple-800' },
  'Rent': { label: 'Thuê mặt bằng', color: 'bg-blue-100 text-blue-800' },
  'Utilities': { label: 'Điện nước', color: 'bg-yellow-100 text-yellow-800' },
  'Salary': { label: 'Lương nhân viên', color: 'bg-purple-100 text-purple-800' },
  'Marketing': { label: 'Marketing', color: 'bg-pink-100 text-pink-800' },
  'Supplies': { label: 'Vật tư', color: 'bg-orange-100 text-orange-800' },
  'Maintenance': { label: 'Sửa chữa', color: 'bg-red-100 text-red-800' },
  'Tax': { label: 'Thuế', color: 'bg-indigo-100 text-indigo-800' },
  'Other': { label: 'Khác', color: 'bg-gray-100 text-gray-800' },
};

/**
 * Payment method labels mapping
 */
const paymentLabels: Record<string, string> = {
  Cash: 'Tiền mặt',
  BankTransfer: 'Chuyển khoản',
  Momo: 'Momo',
  ZaloPay: 'ZaloPay',
  VietQR: 'VietQR',
  Credit: 'Tín dụng',
};

export default function Cashbook() {
  const [entries, setEntries] = useState<CashbookEntry[]>([]);
  const [stats, setStats] = useState<CashbookStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<CashbookEntry | null>(null);
  const [dialogType, setDialogType] = useState<'Income' | 'Expense'>('Income');

  /**
   * Load cashbook entries and statistics from API
   */
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare date filters
      const from = dateFrom ? new Date(dateFrom) : undefined;
      const to = dateTo ? new Date(dateTo) : undefined;
      
      // Load entries and statistics in parallel
      const [entriesData, statsData] = await Promise.all([
        getCashbookEntries(from, to),
        getCashbookStatistics(from, to)
      ]);
      
      setEntries(entriesData);
      setStats(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể tải dữ liệu sổ quỹ";
      setError(errorMessage);
      console.error("Error loading cashbook data:", err);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Filter entries based on search query and type filter
   */
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch = entry.description
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || entry.type.toLowerCase() === typeFilter.toLowerCase();
    return matchesSearch && matchesType;
  });

  /**
   * Get statistics from API or calculate from filtered entries
   */
  const totalIncome = stats?.totalIncome ?? entries
    .filter((e) => e.type === 'Income')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalExpense = stats?.totalExpense ?? entries
    .filter((e) => e.type === 'Expense')
    .reduce((sum, e) => sum + e.amount, 0);
  const balance = stats?.balance ?? (totalIncome - totalExpense);
  const todayIncome = stats?.todayIncome ?? 0;
  const todayExpense = stats?.todayExpense ?? 0;
  const todayBalance = stats?.todayBalance ?? (todayIncome - todayExpense);

  return (
    <div className="min-h-screen">
      <Header title="Sổ quỹ" subtitle="Theo dõi thu chi hàng ngày" />

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
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Số dư hiện tại</p>
                <p className="text-2xl font-bold">{formatCurrency(balance)}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {dateFrom || dateTo ? "Tổng thu" : "Tổng thu hôm nay"}
                </p>
                <p className="text-2xl font-bold text-success">
                  +{formatCurrency(dateFrom || dateTo ? totalIncome : todayIncome)}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-destructive/10 p-2">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {dateFrom || dateTo ? "Tổng chi" : "Tổng chi hôm nay"}
                </p>
                <p className="text-2xl font-bold text-destructive">
                  -{formatCurrency(dateFrom || dateTo ? totalExpense : todayExpense)}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-info/10 p-2">
                <Calendar className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {dateFrom || dateTo ? "Số giao dịch" : "Giao dịch hôm nay"}
                </p>
                <p className="text-2xl font-bold">
                  {dateFrom || dateTo ? entries.length : (stats?.todayTransactions ?? 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-wrap gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm theo mô tả..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="income">Thu</SelectItem>
                <SelectItem value="expense">Chi</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input
                type="date"
                placeholder="Từ ngày"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-40"
              />
              <Input
                type="date"
                placeholder="Đến ngày"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-40"
              />
              {(dateFrom || dateTo) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                  }}
                >
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedEntry(null);
                setDialogType('Income');
                setDialogOpen(true);
              }}
            >
              <ArrowUpCircle className="mr-2 h-4 w-4 text-success" />
              Phiếu thu
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedEntry(null);
                setDialogType('Expense');
                setDialogOpen(true);
              }}
            >
              <ArrowDownCircle className="mr-2 h-4 w-4 text-destructive" />
              Phiếu chi
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">
                Không có giao dịch
              </p>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "Thử thay đổi từ khóa tìm kiếm"
                  : "Chưa có giao dịch nào trong hệ thống"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Phương thức</TableHead>
                  <TableHead className="text-right">Số tiền</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow                   key={entry.id}
                  className="group">
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(entry.transactionDate)}
                    </TableCell>
                    <TableCell>
                      {entry.type === 'Income' ? (
                        <Badge variant="outline" className="text-success border-success/30">
                          <ArrowUpCircle className="mr-1 h-3 w-3" />
                          Thu
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-destructive border-destructive/30">
                          <ArrowDownCircle className="mr-1 h-3 w-3" />
                          Chi
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          'rounded-full',
                          categoryLabels[entry.category]?.color || 'bg-gray-100 text-gray-800'
                        )}
                      >
                        {categoryLabels[entry.category]?.label || entry.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{entry.description}</p>
                        {entry.referenceId && (
                          <p className="text-xs text-muted-foreground">
                            Ref: {entry.referenceType} #{entry.referenceId.substring(0, 8)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {paymentLabels[entry.paymentMethod] || entry.paymentMethod}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          'font-semibold',
                          entry.type === 'Income' ? 'text-success' : 'text-destructive'
                        )}
                      >
                        {entry.type === 'Income' ? '+' : '-'}
                        {formatCurrency(entry.amount)}
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
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedEntry(entry);
                              setDialogOpen(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedEntry(entry);
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
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <CashbookDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entry={selectedEntry}
        defaultType={dialogType}
        onSuccess={() => {
          loadData();
          setSelectedEntry(null);
        }}
      />
    </div>
  );
}
