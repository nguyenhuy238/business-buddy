import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Truck,
  TrendingDown,
  AlertCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  FileText,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

const suppliers = [
  {
    id: '1',
    code: 'NCC001',
    name: 'Công ty TNHH Cà Phê Trung Nguyên',
    phone: '0281234567',
    email: 'sales@trungnguyen.com',
    address: '82 Nguyễn Du, Q1, TP.HCM',
    payables: 15000000,
    lastPurchase: new Date('2024-10-15'),
  },
  {
    id: '2',
    code: 'NCC002',
    name: 'Vinamilk - Chi nhánh TP.HCM',
    phone: '0287654321',
    email: 'order@vinamilk.com.vn',
    address: '10 Tân Trào, Q7, TP.HCM',
    payables: 8500000,
    lastPurchase: new Date('2024-10-18'),
  },
  {
    id: '3',
    code: 'NCC003',
    name: 'Cửa hàng Thực phẩm Sạch',
    phone: '0909123456',
    address: '123 Lê Văn Sỹ, Q3, TP.HCM',
    payables: 0,
    lastPurchase: new Date('2024-10-10'),
  },
  {
    id: '4',
    code: 'NCC004',
    name: 'Đại lý Nước giải khát ABC',
    phone: '0918234567',
    payables: 3200000,
    lastPurchase: new Date('2024-10-20'),
  },
];

export default function Suppliers() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.phone?.includes(searchQuery) ||
      supplier.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPayables = suppliers.reduce((sum, s) => sum + s.payables, 0);

  return (
    <div className="min-h-screen">
      <Header title="Nhà cung cấp" subtitle="Quản lý thông tin nhà cung cấp và công nợ" />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng NCC</p>
                <p className="text-2xl font-bold">{suppliers.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-warning/10 p-2">
                <TrendingDown className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Công nợ phải trả</p>
                <p className="text-2xl font-bold">{formatCurrency(totalPayables)}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-destructive/10 p-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đến hạn thanh toán</p>
                <p className="text-2xl font-bold">2</p>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên, SĐT, mã NCC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Thêm nhà cung cấp
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Mã NCC</TableHead>
                <TableHead>Tên nhà cung cấp</TableHead>
                <TableHead>Liên hệ</TableHead>
                <TableHead>Địa chỉ</TableHead>
                <TableHead className="text-right">Công nợ</TableHead>
                <TableHead>Mua gần nhất</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id} className="group">
                  <TableCell className="font-mono text-sm">
                    {supplier.code}
                  </TableCell>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {supplier.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {supplier.phone}
                        </div>
                      )}
                      {supplier.email && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {supplier.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-48 truncate text-sm text-muted-foreground">
                    {supplier.address || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        'font-medium',
                        supplier.payables > 0 && 'text-warning'
                      )}
                    >
                      {formatCurrency(supplier.payables)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(supplier.lastPurchase)}
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
                          <FileText className="mr-2 h-4 w-4" />
                          Lịch sử mua hàng
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
