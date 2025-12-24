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
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  getPaymentSettings,
  deletePaymentSettings,
  type PaymentSettings,
} from '@/services/paymentSettingsService';
import { PaymentSettingsDialog } from '@/components/dialogs/PaymentSettingsDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Settings() {
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings[]>([]);
  const [loading, setLoading] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [editingSettings, setEditingSettings] = useState<PaymentSettings | null>(null);
  const [deletingSettings, setDeletingSettings] = useState<PaymentSettings | null>(null);
  const toast = useToast();

  /**
   * Load payment settings
   */
  const loadPaymentSettings = async () => {
    try {
      setLoading(true);
      const data = await getPaymentSettings();
      setPaymentSettings(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tải thông tin thanh toán";
      toast.toast({ title: "Lỗi", description: message });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load payment settings on mount
   */
  useEffect(() => {
    loadPaymentSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Handle edit payment settings
   */
  const handleEdit = (settings: PaymentSettings) => {
    setEditingSettings(settings);
    setSettingsDialogOpen(true);
  };

  /**
   * Handle delete payment settings
   */
  const handleDelete = async () => {
    if (!deletingSettings) return;

    try {
      await deletePaymentSettings(deletingSettings.id);
      toast.toast({
        title: "Thành công",
        description: "Xóa thông tin thanh toán thành công",
      });
      setDeletingSettings(null);
      loadPaymentSettings();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Có lỗi xảy ra";
      toast.toast({ title: "Lỗi", description: message });
    }
  };

  /**
   * Get payment method display name
   */
  const getPaymentMethodName = (method: string): string => {
    switch (method) {
      case "BankTransfer":
        return "Chuyển khoản";
      case "VietQR":
        return "VietQR";
      case "Momo":
        return "Ví MoMo";
      case "ZaloPay":
        return "Ví ZaloPay";
      default:
        return method;
    }
  };

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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Thông tin tài khoản thanh toán
                </CardTitle>
                <CardDescription>Cấu hình thông tin tài khoản cho các phương thức thanh toán</CardDescription>
              </div>
              <Button
                onClick={() => {
                  setEditingSettings(null);
                  setSettingsDialogOpen(true);
                }}
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Thêm mới
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
            ) : paymentSettings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Chưa có thông tin tài khoản thanh toán</p>
                <p className="text-sm">Nhấn "Thêm mới" để thêm thông tin tài khoản</p>
              </div>
            ) : (
              <div className="space-y-3">
                {paymentSettings.map((setting) => (
                  <div
                    key={setting.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Label className="font-semibold">
                          {getPaymentMethodName(setting.paymentMethod)}
                        </Label>
                        {setting.isDefault && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                            Mặc định
                          </span>
                        )}
                      </div>
                      {setting.bankName && (
                        <p className="text-sm text-muted-foreground">
                          {setting.bankName}
                        </p>
                      )}
                      <p className="text-sm font-mono">
                        {setting.accountNumber}
                      </p>
                      {setting.accountName && (
                        <p className="text-sm text-muted-foreground">
                          {setting.accountName}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(setting)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingSettings(setting)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Settings Dialog */}
        <PaymentSettingsDialog
          open={settingsDialogOpen}
          onOpenChange={(open) => {
            setSettingsDialogOpen(open);
            if (!open) {
              setEditingSettings(null);
            }
          }}
          settings={editingSettings}
          onSuccess={loadPaymentSettings}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!deletingSettings}
          onOpenChange={(open) => {
            if (!open) setDeletingSettings(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa thông tin thanh toán này không? Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
