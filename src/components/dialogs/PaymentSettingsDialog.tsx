import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  createPaymentSettings,
  updatePaymentSettings,
  type PaymentSettings,
  type CreatePaymentSettings,
  type UpdatePaymentSettings,
} from "@/services/paymentSettingsService";
import { Loader2 } from "lucide-react";

/**
 * Common bank codes in Vietnam
 * Format: { code: "970415", name: "Vietcombank", shortName: "VCB" }
 */
const COMMON_BANK_CODES = [
  { code: "970415", name: "Ngân hàng TMCP Ngoại Thương Việt Nam", shortName: "Vietcombank (VCB)" },
  { code: "970422", name: "Ngân hàng TMCP Kỹ Thương Việt Nam", shortName: "Techcombank (TCB)" },
  { code: "970432", name: "Ngân hàng TMCP Việt Nam Thịnh Vượng", shortName: "VPBank (VPB)" },
  { code: "970436", name: "Ngân hàng TMCP Á Châu", shortName: "ACB" },
  { code: "970441", name: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam", shortName: "BIDV" },
  { code: "970448", name: "Ngân hàng TMCP Sài Gòn Thương Tín", shortName: "Sacombank (STB)" },
  { code: "970454", name: "Ngân hàng TMCP Quân đội", shortName: "MB Bank (MBB)" },
  { code: "970458", name: "Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh", shortName: "HDBank (HDB)" },
  { code: "970416", name: "Ngân hàng TMCP Công thương Việt Nam", shortName: "Vietinbank (CTG)" },
  { code: "970423", name: "Ngân hàng TMCP Tiên Phong", shortName: "TPBank (TPB)" },
  { code: "970427", name: "Ngân hàng TMCP Việt Nam Thịnh Vượng", shortName: "VPBank" },
  { code: "970429", name: "Ngân hàng TMCP Đông Á", shortName: "DongA Bank (DAB)" },
  { code: "970430", name: "Ngân hàng TMCP Phương Đông", shortName: "OCB" },
  { code: "970437", name: "Ngân hàng TMCP Bắc Á", shortName: "BacABank (BAB)" },
  { code: "970443", name: "Ngân hàng TMCP Sài Gòn - Hà Nội", shortName: "SHB" },
  { code: "970449", name: "Ngân hàng TMCP Xây dựng Việt Nam", shortName: "VietABank (VAB)" },
  { code: "970452", name: "Ngân hàng TMCP Nam Á", shortName: "NamABank (NAB)" },
  { code: "970456", name: "Ngân hàng TMCP Quốc Dân", shortName: "NCB" },
  { code: "970457", name: "Ngân hàng TMCP Việt Á", shortName: "VietABank" },
  { code: "970459", name: "Ngân hàng TMCP Bản Việt", shortName: "VietCapitalBank (VCB)" },
];

interface PaymentSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings?: PaymentSettings | null;
  onSuccess?: () => void;
}

/**
 * Dialog for creating/editing payment settings
 */
export function PaymentSettingsDialog({
  open,
  onOpenChange,
  settings,
  onSuccess,
}: PaymentSettingsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePaymentSettings>({
    paymentMethod: "BankTransfer",
    accountNumber: "",
    accountName: "",
    bankName: "",
    bankCode: "",
    phoneNumber: "",
    isDefault: false,
    notes: "",
  });

  const toast = useToast();

  /**
   * Reset form when dialog opens/closes or settings change
   */
  useEffect(() => {
    if (open) {
      if (settings) {
        setFormData({
          paymentMethod: settings.paymentMethod,
          accountNumber: settings.accountNumber,
          accountName: settings.accountName,
          bankName: settings.bankName || "",
          bankCode: settings.bankCode || "",
          phoneNumber: settings.phoneNumber || "",
          isDefault: settings.isDefault,
          notes: settings.notes || "",
        });
      } else {
        setFormData({
          paymentMethod: "BankTransfer",
          accountNumber: "",
          accountName: "",
          bankName: "",
          bankCode: "",
          phoneNumber: "",
          isDefault: false,
          notes: "",
        });
      }
    }
  }, [open, settings]);

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (!formData.accountNumber || !formData.accountName) {
      toast.toast({
        title: "Lỗi",
        description: "Vui lòng nhập số tài khoản và tên chủ tài khoản",
      });
      return;
    }

    // Validate Bank Code for VietQR
    if (formData.paymentMethod === "VietQR" && !formData.bankCode) {
      toast.toast({
        title: "Lỗi",
        description: "Vui lòng nhập mã ngân hàng cho VietQR",
      });
      return;
    }

    try {
      setLoading(true);

      if (settings) {
        // Update existing
        const updateData: UpdatePaymentSettings = {
          accountNumber: formData.accountNumber,
          accountName: formData.accountName,
          bankName: formData.bankName || undefined,
          bankCode: formData.bankCode || undefined,
          phoneNumber: formData.phoneNumber || undefined,
          isDefault: formData.isDefault,
          notes: formData.notes || undefined,
        };
        await updatePaymentSettings(settings.id, updateData);
        toast.toast({
          title: "Thành công",
          description: "Cập nhật thông tin thanh toán thành công",
        });
      } else {
        // Create new
        await createPaymentSettings(formData);
        toast.toast({
          title: "Thành công",
          description: "Thêm thông tin thanh toán thành công",
        });
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Có lỗi xảy ra";
      toast.toast({
        title: "Lỗi",
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if payment method requires bank info
   */
  const requiresBankInfo = (method: string): boolean => {
    return method === "BankTransfer" || method === "VietQR";
  };

  /**
   * Check if payment method requires phone number
   */
  const requiresPhoneNumber = (method: string): boolean => {
    return method === "Momo" || method === "ZaloPay";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {settings ? "Cập nhật thông tin thanh toán" : "Thêm thông tin thanh toán"}
          </DialogTitle>
          <DialogDescription>
            Cấu hình thông tin tài khoản cho phương thức thanh toán
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Phương thức thanh toán *</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value) =>
                setFormData({ ...formData, paymentMethod: value })
              }
              disabled={!!settings}
            >
              <SelectTrigger id="paymentMethod">
                <SelectValue placeholder="Chọn phương thức thanh toán" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BankTransfer">Chuyển khoản</SelectItem>
                <SelectItem value="VietQR">VietQR</SelectItem>
                <SelectItem value="Momo">Ví MoMo</SelectItem>
                <SelectItem value="ZaloPay">Ví ZaloPay</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bank Name */}
          {requiresBankInfo(formData.paymentMethod) && (
            <div className="space-y-2">
              <Label htmlFor="bankName">Tên ngân hàng</Label>
              <Input
                id="bankName"
                value={formData.bankName}
                onChange={(e) =>
                  setFormData({ ...formData, bankName: e.target.value })
                }
                placeholder="Ví dụ: Ngân hàng ABC"
              />
            </div>
          )}

          {/* Bank Code (for VietQR and BankTransfer) */}
          {requiresBankInfo(formData.paymentMethod) && (
            <div className="space-y-2">
              <Label htmlFor="bankCode">
                Mã ngân hàng {formData.paymentMethod === "VietQR" ? "*" : "(khuyến nghị)"}
              </Label>
              <div className="space-y-2">
                <Select
                  value={COMMON_BANK_CODES.find(b => b.code === formData.bankCode) ? formData.bankCode : ""}
                  onValueChange={(value) => {
                    if (value) {
                      setFormData({ ...formData, bankCode: value });
                    }
                  }}
                >
                  <SelectTrigger id="bankCode">
                    <SelectValue placeholder="Chọn từ danh sách ngân hàng phổ biến" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_BANK_CODES.map((bank) => (
                      <SelectItem key={bank.code} value={bank.code}>
                        {bank.shortName} - {bank.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="bankCodeInput"
                  value={formData.bankCode}
                  onChange={(e) =>
                    setFormData({ ...formData, bankCode: e.target.value })
                  }
                  placeholder="Hoặc nhập mã ngân hàng thủ công (ví dụ: 970415)"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {formData.paymentMethod === "VietQR" 
                  ? "Cần mã ngân hàng để tạo mã QR có thể quét được"
                  : "Mã ngân hàng giúp tạo mã QR EMV có thể quét bằng ứng dụng ngân hàng"}
              </p>
            </div>
          )}

          {/* Account Number / Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="accountNumber">
              {requiresPhoneNumber(formData.paymentMethod)
                ? "Số điện thoại *"
                : "Số tài khoản *"}
            </Label>
            <Input
              id="accountNumber"
              value={formData.accountNumber}
              onChange={(e) =>
                setFormData({ ...formData, accountNumber: e.target.value })
              }
              placeholder={
                requiresPhoneNumber(formData.paymentMethod)
                  ? "Ví dụ: 0901234567"
                  : "Ví dụ: 1234567890"
              }
            />
          </div>

          {/* Account Name */}
          {!requiresPhoneNumber(formData.paymentMethod) && (
            <div className="space-y-2">
              <Label htmlFor="accountName">Tên chủ tài khoản *</Label>
              <Input
                id="accountName"
                value={formData.accountName}
                onChange={(e) =>
                  setFormData({ ...formData, accountName: e.target.value })
                }
                placeholder="Ví dụ: NGUYEN VAN A"
              />
            </div>
          )}

          {/* Phone Number (for e-wallet) */}
          {requiresPhoneNumber(formData.paymentMethod) && (
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Số điện thoại (nếu khác)</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
                placeholder="Ví dụ: 0901234567"
              />
            </div>
          )}

          {/* Is Default */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Đặt làm mặc định</Label>
              <p className="text-sm text-muted-foreground">
                Sử dụng tài khoản này làm mặc định cho phương thức này
              </p>
            </div>
            <Switch
              checked={formData.isDefault}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isDefault: checked })
              }
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Ghi chú thêm (tùy chọn)"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : settings ? (
              "Cập nhật"
            ) : (
              "Thêm mới"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

