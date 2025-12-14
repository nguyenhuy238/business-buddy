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
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

const customers = [
  {
    id: '1',
    code: 'KH001',
    name: 'Nguyễn Văn An',
    phone: '0901234567',
    email: 'an.nguyen@email.com',
    tier: 'gold',
    points: 2450,
    totalSpent: 12500000,
    receivables: 0,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    code: 'KH002',
    name: 'Trần Thị Bình',
    phone: '0912345678',
    email: 'binh.tran@email.com',
    tier: 'platinum',
    points: 5800,
    totalSpent: 35200000,
    receivables: 1500000,
    createdAt: new Date('2023-11-20'),
  },
  {
    id: '3',
    code: 'KH003',
    name: 'Lê Văn Cường',
    phone: '0923456789',
    tier: 'silver',
    points: 850,
    totalSpent: 5400000,
    receivables: 0,
    createdAt: new Date('2024-03-10'),
  },
  {
    id: '4',
    code: 'KH004',
    name: 'Phạm Thị Dung',
    phone: '0934567890',
    email: 'dung.pham@email.com',
    tier: 'bronze',
    points: 320,
    totalSpent: 2100000,
    receivables: 500000,
    createdAt: new Date('2024-06-01'),
  },
  {
    id: '5',
    code: 'KH005',
    name: 'Hoàng Văn Em',
    phone: '0945678901',
    tier: 'gold',
    points: 1950,
    totalSpent: 9800000,
    receivables: 0,
    createdAt: new Date('2024-02-28'),
  },
];

const tierLabels = {
  bronze: { label: 'Đồng', color: 'bg-orange-100 text-orange-800' },
  silver: { label: 'Bạc', color: 'bg-gray-100 text-gray-800' },
  gold: { label: 'Vàng', color: 'bg-yellow-100 text-yellow-800' },
  platinum: { label: 'Bạch kim', color: 'bg-purple-100 text-purple-800' },
};

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery) ||
      customer.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalReceivables = customers.reduce((sum, c) => sum + c.receivables, 0);

  return (
    <div className="min-h-screen">
      <Header title="Quản lý khách hàng" subtitle="Quản lý thông tin và công nợ khách hàng" />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng khách hàng</p>
                <p className="text-2xl font-bold">{customers.length}</p>
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
                <p className="text-2xl font-bold">
                  {customers.filter((c) => c.tier === 'gold' || c.tier === 'platinum').length}
                </p>
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
                  {formatCurrency(customers.reduce((sum, c) => sum + c.totalSpent, 0))}
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
                <p className="text-2xl font-bold">{formatCurrency(totalReceivables)}</p>
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
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Thêm khách hàng
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card shadow-sm">
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
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id} className="group">
                  <TableCell className="font-mono text-sm">
                    {customer.code}
                  </TableCell>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {customer.phone}
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        'rounded-full',
                        tierLabels[customer.tier as keyof typeof tierLabels].color
                      )}
                    >
                      <Star className="mr-1 h-3 w-3" />
                      {tierLabels[customer.tier as keyof typeof tierLabels].label}
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
                        <DropdownMenuItem>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Nhắn tin Zalo
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
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
        </div>
      </div>
    </div>
  );
}
