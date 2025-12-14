import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';

const entries = [
  {
    id: '1',
    type: 'income',
    category: 'Bán hàng',
    amount: 2500000,
    description: 'Thu tiền mặt ca sáng',
    paymentMethod: 'cash',
    reference: 'DH001-015',
    createdAt: new Date(),
  },
  {
    id: '2',
    type: 'income',
    category: 'Bán hàng',
    amount: 1850000,
    description: 'Thu chuyển khoản ca sáng',
    paymentMethod: 'bank_transfer',
    reference: 'DH016-028',
    createdAt: new Date(),
  },
  {
    id: '3',
    type: 'expense',
    category: 'Nhập hàng',
    amount: 5000000,
    description: 'Thanh toán NCC Vinamilk',
    paymentMethod: 'bank_transfer',
    reference: 'NH001',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '4',
    type: 'expense',
    category: 'Vận hành',
    amount: 500000,
    description: 'Tiền điện tháng 10',
    paymentMethod: 'cash',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
  {
    id: '5',
    type: 'income',
    category: 'Bán hàng',
    amount: 3200000,
    description: 'Thu tiền mặt ca chiều hôm qua',
    paymentMethod: 'cash',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: '6',
    type: 'expense',
    category: 'Lương',
    amount: 8000000,
    description: 'Lương nhân viên tháng 10',
    paymentMethod: 'bank_transfer',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
  },
];

const categoryLabels: Record<string, { label: string; color: string }> = {
  'Bán hàng': { label: 'Bán hàng', color: 'bg-success/10 text-success' },
  'Nhập hàng': { label: 'Nhập hàng', color: 'bg-warning/10 text-warning' },
  'Vận hành': { label: 'Vận hành', color: 'bg-info/10 text-info' },
  'Lương': { label: 'Lương', color: 'bg-purple-100 text-purple-800' },
};

const paymentLabels: Record<string, string> = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  momo: 'Momo',
  zalopay: 'ZaloPay',
};

export default function Cashbook() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch = entry.description
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || entry.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalIncome = entries
    .filter((e) => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalExpense = entries
    .filter((e) => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="min-h-screen">
      <Header title="Sổ quỹ" subtitle="Theo dõi thu chi hàng ngày" />

      <div className="p-6 space-y-6">
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
                <p className="text-sm text-muted-foreground">Tổng thu hôm nay</p>
                <p className="text-2xl font-bold text-success">
                  +{formatCurrency(totalIncome)}
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
                <p className="text-sm text-muted-foreground">Tổng chi hôm nay</p>
                <p className="text-2xl font-bold text-destructive">
                  -{formatCurrency(totalExpense)}
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
                <p className="text-sm text-muted-foreground">Số giao dịch</p>
                <p className="text-2xl font-bold">{entries.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 gap-3">
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
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <ArrowUpCircle className="mr-2 h-4 w-4 text-success" />
              Phiếu thu
            </Button>
            <Button variant="outline" size="sm">
              <ArrowDownCircle className="mr-2 h-4 w-4 text-destructive" />
              Phiếu chi
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Phương thức</TableHead>
                <TableHead className="text-right">Số tiền</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(entry.createdAt)}
                  </TableCell>
                  <TableCell>
                    {entry.type === 'income' ? (
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
                        categoryLabels[entry.category]?.color
                      )}
                    >
                      {entry.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{entry.description}</p>
                      {entry.reference && (
                        <p className="text-xs text-muted-foreground">
                          Ref: {entry.reference}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {paymentLabels[entry.paymentMethod]}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        'font-semibold',
                        entry.type === 'income' ? 'text-success' : 'text-destructive'
                      )}
                    >
                      {entry.type === 'income' ? '+' : '-'}
                      {formatCurrency(entry.amount)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
