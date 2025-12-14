import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  FileText,
  Download,
  TrendingUp,
  AlertTriangle,
  Calculator,
  Calendar,
} from 'lucide-react';
import { formatCurrency, formatPercent, calculateTax, getBusinessLicenseFee, TAX_THRESHOLDS } from '@/lib/format';

const revenueByCategory = [
  { name: 'Đồ uống', value: 45000000, percentage: 58 },
  { name: 'Đồ ăn', value: 22000000, percentage: 28 },
  { name: 'Combo', value: 8500000, percentage: 11 },
  { name: 'Khác', value: 2500000, percentage: 3 },
];

const monthlyRevenue = [
  { month: 'T5', revenue: 65000000, profit: 19500000 },
  { month: 'T6', revenue: 72000000, profit: 21600000 },
  { month: 'T7', revenue: 68000000, profit: 20400000 },
  { month: 'T8', revenue: 85000000, profit: 25500000 },
  { month: 'T9', revenue: 92000000, profit: 27600000 },
  { month: 'T10', revenue: 78000000, profit: 23400000 },
];

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

// Tax calculation for demo
const annualRevenue = 460000000; // 460 triệu
const taxInfo = calculateTax(annualRevenue, 'goods');
const businessLicenseFee = getBusinessLicenseFee(annualRevenue);
const revenueProgress = (annualRevenue / TAX_THRESHOLDS.exemptionThreshold) * 100;

export default function Reports() {
  return (
    <div className="min-h-screen">
      <Header title="Báo cáo" subtitle="Thống kê kinh doanh và báo cáo thuế" />

      <div className="p-6 space-y-6">
        <Tabs defaultValue="business" className="space-y-6">
          <TabsList>
            <TabsTrigger value="business">Kinh doanh</TabsTrigger>
            <TabsTrigger value="inventory">Tồn kho</TabsTrigger>
            <TabsTrigger value="tax">Thuế HKD</TabsTrigger>
          </TabsList>

          {/* Business Reports */}
          <TabsContent value="business" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Monthly Revenue Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Doanh thu & Lợi nhuận theo tháng</CardTitle>
                  <CardDescription>6 tháng gần nhất</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyRevenue}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="month"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <YAxis
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          tickFormatter={(value) => `${(value / 1000000).toFixed(0)}tr`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => formatCurrency(value)}
                        />
                        <Bar dataKey="revenue" name="Doanh thu" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="profit" name="Lợi nhuận" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue by Category */}
              <Card>
                <CardHeader>
                  <CardTitle>Doanh thu theo danh mục</CardTitle>
                  <CardDescription>Tháng này</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-8">
                    <div className="h-48 w-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={revenueByCategory}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {revenueByCategory.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-3">
                      {revenueByCategory.map((cat, index) => (
                        <div key={cat.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: COLORS[index] }}
                            />
                            <span className="text-sm">{cat.name}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{formatCurrency(cat.value)}</p>
                            <p className="text-xs text-muted-foreground">{cat.percentage}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Reports */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="cursor-pointer hover:border-primary transition-colors">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Báo cáo doanh thu</p>
                    <p className="text-sm text-muted-foreground">Theo ngày/tuần/tháng</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:border-primary transition-colors">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="rounded-lg bg-success/10 p-3">
                    <TrendingUp className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="font-medium">Báo cáo lãi gộp</p>
                    <p className="text-sm text-muted-foreground">Theo sản phẩm/nhóm</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:border-primary transition-colors">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="rounded-lg bg-info/10 p-3">
                    <Download className="h-6 w-6 text-info" />
                  </div>
                  <div>
                    <p className="font-medium">Xuất báo cáo</p>
                    <p className="text-sm text-muted-foreground">Excel/PDF</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Inventory Reports */}
          <TabsContent value="inventory" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Tồn kho hiện tại</p>
                    <p className="text-sm text-muted-foreground">Báo cáo chi tiết</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="rounded-lg bg-warning/10 p-3">
                    <AlertTriangle className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <p className="font-medium">Sản phẩm chậm bán</p>
                    <p className="text-sm text-muted-foreground">Phân tích vòng quay</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="rounded-lg bg-info/10 p-3">
                    <TrendingUp className="h-6 w-6 text-info" />
                  </div>
                  <div>
                    <p className="font-medium">Nhập xuất tồn</p>
                    <p className="text-sm text-muted-foreground">Theo kỳ báo cáo</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tax Reports */}
          <TabsContent value="tax" className="space-y-6">
            {/* Tax Summary */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Thuế HKD năm 2024
                    </CardTitle>
                    <CardDescription>
                      Tính theo phương pháp trực tiếp (TT40/2021)
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-primary">
                    Ngành: Bán hàng hóa
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Revenue Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Doanh thu năm</span>
                    <span className="font-medium">{formatCurrency(annualRevenue)}</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                      style={{ width: `${Math.min(revenueProgress, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Ngưỡng miễn thuế: {formatCurrency(TAX_THRESHOLDS.exemptionThreshold)}</span>
                    <span>{formatPercent(revenueProgress)} ngưỡng</span>
                  </div>
                </div>

                {/* Tax Calculation */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground">Thuế GTGT (1%)</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(taxInfo.vat)}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground">Thuế TNCN (0.5%)</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(taxInfo.pit)}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-primary/10 p-4">
                    <p className="text-sm text-muted-foreground">Tổng thuế phải nộp</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(taxInfo.total)}
                    </p>
                  </div>
                </div>

                {/* Business License Fee */}
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-warning" />
                      <div>
                        <p className="font-medium">Lệ phí môn bài 2024</p>
                        <p className="text-sm text-muted-foreground">
                          Bậc doanh thu: 300-500 triệu/năm
                        </p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-warning">
                      {formatCurrency(businessLicenseFee)}
                    </p>
                  </div>
                </div>

                {/* Tax Rate Reference */}
                <div className="rounded-lg border p-4">
                  <p className="mb-3 font-medium">Tham khảo tỷ lệ thuế HKD</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bán hàng hóa:</span>
                      <span>1% GTGT + 0.5% TNCN</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dịch vụ:</span>
                      <span>5% GTGT + 2% TNCN</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sản xuất/Vận tải/Xây dựng:</span>
                      <span>3% GTGT + 1.5% TNCN</span>
                    </div>
                  </div>
                </div>

                <Button className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Xuất báo cáo thuế
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
