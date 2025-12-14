import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Store,
  User,
  Bell,
  Printer,
  CreditCard,
  Shield,
  Database,
  Calculator,
} from 'lucide-react';

export default function Settings() {
  return (
    <div className="min-h-screen">
      <Header title="Cài đặt" subtitle="Cấu hình hệ thống và tùy chọn" />

      <div className="p-6 space-y-6 max-w-4xl">
        {/* Store Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Thông tin cửa hàng
            </CardTitle>
            <CardDescription>Thông tin cơ bản về hộ kinh doanh</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="storeName">Tên cửa hàng</Label>
                <Input id="storeName" defaultValue="Quán Cà Phê Nhà Mình" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeCode">Mã số thuế/ĐKKD</Label>
                <Input id="storeCode" defaultValue="0123456789" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input id="phone" defaultValue="0901234567" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="contact@quancafe.vn" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Địa chỉ</Label>
                <Input id="address" defaultValue="123 Nguyễn Huệ, Quận 1, TP.HCM" />
              </div>
            </div>
            <Button>Lưu thay đổi</Button>
          </CardContent>
        </Card>

        {/* Tax Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Cài đặt thuế HKD
            </CardTitle>
            <CardDescription>Cấu hình phương pháp tính thuế</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Phương pháp tính thuế</Label>
                <Select defaultValue="direct">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Trực tiếp trên doanh thu</SelectItem>
                    <SelectItem value="deduction">Khấu trừ (nếu có đăng ký)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ngành nghề chính</Label>
                <Select defaultValue="goods">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="goods">Bán hàng hóa (1% + 0.5%)</SelectItem>
                    <SelectItem value="services">Dịch vụ (5% + 2%)</SelectItem>
                    <SelectItem value="production">Sản xuất/Vận tải (3% + 1.5%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Cảnh báo gần ngưỡng thuế</Label>
                <p className="text-sm text-muted-foreground">
                  Thông báo khi doanh thu đạt 80% ngưỡng miễn thuế
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Thông báo
            </CardTitle>
            <CardDescription>Cấu hình thông báo và cảnh báo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Cảnh báo hết hàng</Label>
                <p className="text-sm text-muted-foreground">
                  Thông báo khi sản phẩm dưới mức tồn kho tối thiểu
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Nhắc công nợ</Label>
                <p className="text-sm text-muted-foreground">
                  Gửi nhắc nhở công nợ qua Zalo/SMS
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Báo cáo ngày</Label>
                <p className="text-sm text-muted-foreground">
                  Gửi tổng kết cuối ngày qua email
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Phương thức thanh toán
            </CardTitle>
            <CardDescription>Cấu hình các phương thức nhận thanh toán</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Tiền mặt</Label>
                <p className="text-sm text-muted-foreground">Thanh toán trực tiếp tại quầy</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>VietQR</Label>
                <p className="text-sm text-muted-foreground">Quét mã QR chuyển khoản</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Momo / ZaloPay</Label>
                <p className="text-sm text-muted-foreground">Ví điện tử</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Ghi nợ</Label>
                <p className="text-sm text-muted-foreground">Cho phép khách mua chịu</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Print Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              In ấn
            </CardTitle>
            <CardDescription>Cấu hình máy in và mẫu hóa đơn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Khổ giấy hóa đơn</Label>
                <Select defaultValue="58mm">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="58mm">58mm (K57)</SelectItem>
                    <SelectItem value="80mm">80mm (K80)</SelectItem>
                    <SelectItem value="a4">A4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Số bản in</Label>
                <Select defaultValue="1">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 bản</SelectItem>
                    <SelectItem value="2">2 bản</SelectItem>
                    <SelectItem value="3">3 bản</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Tự động in sau thanh toán</Label>
                <p className="text-sm text-muted-foreground">In hóa đơn ngay khi hoàn tất</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Data & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Dữ liệu & Bảo mật
            </CardTitle>
            <CardDescription>Sao lưu và bảo vệ dữ liệu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Sao lưu tự động</Label>
                <p className="text-sm text-muted-foreground">Sao lưu dữ liệu hàng ngày</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Sao lưu ngay</Button>
              <Button variant="outline">Khôi phục dữ liệu</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
