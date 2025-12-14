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
  Filter,
  Download,
  Upload,
  Package,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

const products = [
  {
    id: '1',
    code: 'SP001',
    name: 'Cà phê sữa đá',
    category: 'Đồ uống',
    unit: 'Ly',
    costPrice: 15000,
    salePrice: 35000,
    stock: 0,
    minStock: 10,
    status: 'out_of_stock',
  },
  {
    id: '2',
    code: 'SP002',
    name: 'Trà đào cam sả',
    category: 'Đồ uống',
    unit: 'Ly',
    costPrice: 18000,
    salePrice: 45000,
    stock: 25,
    minStock: 10,
    status: 'in_stock',
  },
  {
    id: '3',
    code: 'SP003',
    name: 'Bánh mì thịt nướng',
    category: 'Đồ ăn',
    unit: 'Cái',
    costPrice: 20000,
    salePrice: 35000,
    stock: 8,
    minStock: 15,
    status: 'low_stock',
  },
  {
    id: '4',
    code: 'SP004',
    name: 'Sinh tố bơ',
    category: 'Đồ uống',
    unit: 'Ly',
    costPrice: 25000,
    salePrice: 55000,
    stock: 42,
    minStock: 10,
    status: 'in_stock',
  },
  {
    id: '5',
    code: 'SP005',
    name: 'Nước ép cam',
    category: 'Đồ uống',
    unit: 'Ly',
    costPrice: 15000,
    salePrice: 40000,
    stock: 5,
    minStock: 20,
    status: 'low_stock',
  },
  {
    id: '6',
    code: 'SP006',
    name: 'Sữa đặc Ông Thọ',
    category: 'Nguyên liệu',
    unit: 'Hộp',
    costPrice: 28000,
    salePrice: 35000,
    stock: 120,
    minStock: 50,
    status: 'in_stock',
  },
];

const statusLabels = {
  in_stock: { label: 'Còn hàng', variant: 'success' },
  low_stock: { label: 'Sắp hết', variant: 'warning' },
  out_of_stock: { label: 'Hết hàng', variant: 'destructive' },
};

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen">
      <Header title="Quản lý hàng hóa" subtitle="Quản lý sản phẩm, tồn kho và giá cả" />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng sản phẩm</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2">
                <Package className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Còn hàng</p>
                <p className="text-2xl font-bold">
                  {products.filter((p) => p.status === 'in_stock').length}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-warning/10 p-2">
                <Package className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sắp hết</p>
                <p className="text-2xl font-bold">
                  {products.filter((p) => p.status === 'low_stock').length}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-destructive/10 p-2">
                <Package className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hết hàng</p>
                <p className="text-2xl font-bold">
                  {products.filter((p) => p.status === 'out_of_stock').length}
                </p>
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
                placeholder="Tìm theo tên, mã sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="Đồ uống">Đồ uống</SelectItem>
                <SelectItem value="Đồ ăn">Đồ ăn</SelectItem>
                <SelectItem value="Nguyên liệu">Nguyên liệu</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Nhập Excel
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Xuất Excel
            </Button>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Thêm sản phẩm
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Mã SP</TableHead>
                <TableHead>Tên sản phẩm</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>ĐVT</TableHead>
                <TableHead className="text-right">Giá vốn</TableHead>
                <TableHead className="text-right">Giá bán</TableHead>
                <TableHead className="text-right">Tồn kho</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} className="group">
                  <TableCell className="font-mono text-sm">
                    {product.code}
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{product.category}</Badge>
                  </TableCell>
                  <TableCell>{product.unit}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(product.costPrice)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(product.salePrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        'font-medium',
                        product.status === 'low_stock' && 'text-warning',
                        product.status === 'out_of_stock' && 'text-destructive'
                      )}
                    >
                      {formatNumber(product.stock)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        statusLabels[product.status as keyof typeof statusLabels]
                          .variant as any
                      }
                    >
                      {
                        statusLabels[product.status as keyof typeof statusLabels]
                          .label
                      }
                    </Badge>
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
                          <Eye className="mr-2 h-4 w-4" />
                          Xem chi tiết
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
