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
  FolderTree,
  Ruler,
  Palette,
  Moon,
  Sun,
  RotateCcw,
  Check,
  X,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  getPaymentSettings,
  deletePaymentSettings,
  type PaymentSettings,
} from '@/services/paymentSettingsService';
import { PaymentSettingsDialog } from '@/components/dialogs/PaymentSettingsDialog';
import { CategoryDialog } from '@/components/dialogs/CategoryDialog';
import { UnitOfMeasureDialog } from '@/components/dialogs/UnitOfMeasureDialog';
import {
  getCategories,
  deleteCategory,
} from '@/services/categoryService';
import {
  getUnitOfMeasures,
  deleteUnitOfMeasure,
} from '@/services/unitOfMeasureService';
import type { Category, UnitOfMeasure } from '@/types';
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
import { useTheme, type ThemeColor, parseColorCode } from '@/contexts/ThemeContext';

export default function Settings() {
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings[]>([]);
  const [loading, setLoading] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [editingSettings, setEditingSettings] = useState<PaymentSettings | null>(null);
  const [deletingSettings, setDeletingSettings] = useState<PaymentSettings | null>(null);
  
  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  
  // Unit of Measures state
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitOfMeasure | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<UnitOfMeasure | null>(null);
  
  const toast = useToast();
  const { theme, setTheme, themes, isDark, setIsDark, customColor, setCustomColor, resetToDefaultTheme } = useTheme();
  const [customColorInput, setCustomColorInput] = useState<string>(customColor || "");
  const [colorError, setColorError] = useState<string | null>(null);

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
   * Load categories
   */
  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const data = await getCategories(true); // Include inactive
      setCategories(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tải danh sách danh mục";
      toast.toast({ title: "Lỗi", description: message });
    } finally {
      setLoadingCategories(false);
    }
  };

  /**
   * Load units of measure
   */
  const loadUnits = async () => {
    try {
      setLoadingUnits(true);
      const data = await getUnitOfMeasures(true); // Include inactive
      setUnits(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tải danh sách đơn vị tính";
      toast.toast({ title: "Lỗi", description: message });
    } finally {
      setLoadingUnits(false);
    }
  };

  /**
   * Handle edit category
   */
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryDialogOpen(true);
  };

  /**
   * Handle delete category
   */
  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;

    try {
      await deleteCategory(deletingCategory.id);
      toast.toast({
        title: "Thành công",
        description: "Xóa danh mục thành công",
      });
      setDeletingCategory(null);
      loadCategories();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Có lỗi xảy ra";
      toast.toast({ title: "Lỗi", description: message });
    }
  };

  /**
   * Handle edit unit
   */
  const handleEditUnit = (unit: UnitOfMeasure) => {
    setEditingUnit(unit);
    setUnitDialogOpen(true);
  };

  /**
   * Handle delete unit
   */
  const handleDeleteUnit = async () => {
    if (!deletingUnit) return;

    try {
      await deleteUnitOfMeasure(deletingUnit.id);
      toast.toast({
        title: "Thành công",
        description: "Xóa đơn vị tính thành công",
      });
      setDeletingUnit(null);
      loadUnits();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Có lỗi xảy ra";
      toast.toast({ title: "Lỗi", description: message });
    }
  };

  /**
   * Get category hierarchy display name
   */
  const getCategoryDisplayName = (category: Category): string => {
    if (!category.parentId) return category.name;
    const parent = categories.find((c) => c.id === category.parentId);
    return parent ? `${parent.name} > ${category.name}` : category.name;
  };

  /**
   * Load payment settings on mount
   */
  useEffect(() => {
    loadPaymentSettings();
    loadCategories();
    loadUnits();
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

  /**
   * Handle apply custom color
   */
  const handleApplyCustomColor = () => {
    if (!customColorInput.trim()) {
      setColorError("Vui lòng nhập mã màu");
      return;
    }

    try {
      setCustomColor(customColorInput.trim());
      setColorError(null);
      toast.toast({
        title: "Thành công",
        description: "Đã áp dụng màu tùy chỉnh",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Mã màu không hợp lệ";
      setColorError(message);
      toast.toast({
        title: "Lỗi",
        description: message,
        variant: "destructive",
      });
    }
  };

  /**
   * Update custom color input when customColor changes
   */
  useEffect(() => {
    setCustomColorInput(customColor || "");
  }, [customColor]);

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

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Giao diện
            </CardTitle>
            <CardDescription>Tùy chỉnh màu sắc và chế độ hiển thị</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  Chế độ tối
                </Label>
                <p className="text-sm text-muted-foreground">
                  Chuyển đổi giữa chế độ sáng và tối
                </p>
              </div>
              <Switch checked={isDark} onCheckedChange={setIsDark} />
            </div>

            {/* Theme Color Selection */}
            <div className="space-y-3">
              <Label>Tone màu chủ đạo</Label>
              <p className="text-sm text-muted-foreground">
                Chọn tone màu cho giao diện của bạn
              </p>
              <div className="grid grid-cols-4 gap-3">
                {(Object.keys(themes) as ThemeColor[]).map((themeKey) => {
                  const themeConfig = themes[themeKey];
                  const isSelected = theme === themeKey && !customColor;
                  const primaryColor = isDark
                    ? themeConfig.colors.dark.primary
                    : themeConfig.colors.light.primary;

                  return (
                    <button
                      key={themeKey}
                      type="button"
                      onClick={() => {
                        setTheme(themeKey);
                        setCustomColorInput("");
                        setColorError(null);
                      }}
                      className={`
                        relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all
                        ${isSelected
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border hover:border-primary/50 hover:bg-accent/50"
                        }
                      `}
                      aria-label={`Chọn theme ${themeConfig.displayName}`}
                    >
                      <div
                        className="h-12 w-12 rounded-full border-2 border-background shadow-sm"
                        style={{
                          backgroundColor: `hsl(${primaryColor})`,
                        }}
                      />
                      <span className="text-sm font-medium">{themeConfig.displayName}</span>
                      {isSelected && (
                        <div className="absolute right-2 top-2">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Custom Color Input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Màu tùy chỉnh</Label>
                  <p className="text-sm text-muted-foreground">
                    Nhập mã màu hex (#FF5733), RGB (rgb(255, 87, 51)) hoặc HSL (10 80% 60%)
                  </p>
                </div>
                {customColor && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCustomColor(null);
                      setCustomColorInput("");
                      setColorError(null);
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Xóa
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="#FF5733 hoặc rgb(255, 87, 51)"
                      value={customColorInput}
                      onChange={(e) => {
                        setCustomColorInput(e.target.value);
                        setColorError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleApplyCustomColor();
                        }
                      }}
                      className={colorError ? "border-destructive" : ""}
                    />
                    <Button
                      type="button"
                      onClick={handleApplyCustomColor}
                      disabled={!customColorInput.trim()}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Áp dụng
                    </Button>
                  </div>
                  {colorError && (
                    <p className="text-sm text-destructive">{colorError}</p>
                  )}
                  {customColor && !colorError && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div
                        className="h-4 w-4 rounded border border-border"
                        style={{
                          backgroundColor: customColor.startsWith("#")
                            ? customColor
                            : customColor.startsWith("rgb")
                            ? customColor
                            : `hsl(${customColor})`,
                        }}
                      />
                      <span>Màu hiện tại: {customColor}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Reset Button */}
            {(customColor || theme !== "green") && (
              <>
                <Separator />
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      resetToDefaultTheme();
                      setCustomColorInput("");
                      setColorError(null);
                      toast.toast({
                        title: "Đã reset",
                        description: "Đã khôi phục về theme mặc định",
                      });
                    }}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Khôi phục mặc định
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Categories Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FolderTree className="h-5 w-5" />
                  Quản lý Danh mục
                </CardTitle>
                <CardDescription>
                  Cấu hình danh mục sản phẩm để phân loại hàng hóa
                </CardDescription>
              </div>
              <Button
                onClick={() => {
                  setEditingCategory(null);
                  setCategoryDialogOpen(true);
                }}
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Thêm mới
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingCategories ? (
              <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Chưa có danh mục nào</p>
                <p className="text-sm">Nhấn "Thêm mới" để thêm danh mục đầu tiên</p>
              </div>
            ) : (
              <div className="space-y-3">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Label className="font-semibold">
                          {getCategoryDisplayName(category)}
                        </Label>
                        <span className="text-xs text-muted-foreground">
                          ({category.code})
                        </span>
                        {!category.isActive && (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                            Không hoạt động
                          </span>
                        )}
                      </div>
                      {category.description && (
                        <p className="text-sm text-muted-foreground">
                          {category.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingCategory(category)}
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

        {/* Unit of Measures Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Ruler className="h-5 w-5" />
                  Quản lý Đơn vị tính
                </CardTitle>
                <CardDescription>
                  Cấu hình đơn vị tính và đơn vị cơ bản cho sản phẩm
                </CardDescription>
              </div>
              <Button
                onClick={() => {
                  setEditingUnit(null);
                  setUnitDialogOpen(true);
                }}
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Thêm mới
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingUnits ? (
              <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
            ) : units.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Chưa có đơn vị tính nào</p>
                <p className="text-sm">Nhấn "Thêm mới" để thêm đơn vị tính đầu tiên</p>
              </div>
            ) : (
              <div className="space-y-3">
                {units.map((unit) => (
                  <div
                    key={unit.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Label className="font-semibold">{unit.name}</Label>
                        <span className="text-xs text-muted-foreground">
                          ({unit.code})
                        </span>
                        {!unit.isActive && (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                            Không hoạt động
                          </span>
                        )}
                      </div>
                      {unit.description && (
                        <p className="text-sm text-muted-foreground">
                          {unit.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUnit(unit)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingUnit(unit)}
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

        {/* Category Dialog */}
        <CategoryDialog
          open={categoryDialogOpen}
          onOpenChange={(open) => {
            setCategoryDialogOpen(open);
            if (!open) {
              setEditingCategory(null);
            }
          }}
          category={editingCategory}
          onSuccess={loadCategories}
        />

        {/* Unit of Measure Dialog */}
        <UnitOfMeasureDialog
          open={unitDialogOpen}
          onOpenChange={(open) => {
            setUnitDialogOpen(open);
            if (!open) {
              setEditingUnit(null);
            }
          }}
          unit={editingUnit}
          onSuccess={loadUnits}
        />

        {/* Delete Payment Settings Confirmation Dialog */}
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

        {/* Delete Category Confirmation Dialog */}
        <AlertDialog
          open={!!deletingCategory}
          onOpenChange={(open) => {
            if (!open) setDeletingCategory(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa danh mục này không? Không thể xóa danh mục đang được sử dụng bởi sản phẩm. Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteCategory} className="bg-destructive text-destructive-foreground">
                Xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Unit Confirmation Dialog */}
        <AlertDialog
          open={!!deletingUnit}
          onOpenChange={(open) => {
            if (!open) setDeletingUnit(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa đơn vị tính này không? Không thể xóa đơn vị tính đang được sử dụng bởi sản phẩm. Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteUnit} className="bg-destructive text-destructive-foreground">
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
