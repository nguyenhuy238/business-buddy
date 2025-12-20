/**
 * Cashbook Dialog Component
 * Handles create and edit operations for cashbook entries (Income/Expense)
 */
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import {
  createCashbookEntry,
  updateCashbookEntry,
  deleteCashbookEntry,
} from "@/services/cashbookService";
import type { CashbookEntry, PaymentMethod } from "@/types";

/**
 * Form data interface for cashbook entry
 */
interface CashbookFormData {
  type: "Income" | "Expense";
  category: string;
  amount: number;
  description: string;
  paymentMethod: PaymentMethod;
  referenceId?: string;
  referenceType?: string;
  bankAccount?: string;
  transactionDate: string;
  createdBy: string;
}

interface CashbookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: CashbookEntry | null;
  defaultType?: "Income" | "Expense";
  onSuccess?: () => void;
}

/**
 * Income categories
 */
const incomeCategories = [
  "Bán hàng",
  "Thu khác",
  "Hoàn trả",
];

/**
 * Expense categories
 */
const expenseCategories = [
  "Nhập hàng",
  "Vận hành",
  "Lương",
  "Thuê mặt bằng",
  "Điện nước",
  "Lương nhân viên",
  "Marketing",
  "Vật tư",
  "Sửa chữa",
  "Thuế",
  "Khác",
];

/**
 * Payment method labels
 */
const paymentMethodLabels: Record<PaymentMethod, string> = {
  Cash: "Tiền mặt",
  BankTransfer: "Chuyển khoản",
  VietQR: "VietQR",
  Momo: "Momo",
  ZaloPay: "ZaloPay",
  Credit: "Tín dụng",
};

/**
 * Cashbook Dialog Component
 * @param open - Whether the dialog is open
 * @param onOpenChange - Callback when dialog open state changes
 * @param entry - Entry to edit (null for create)
 * @param defaultType - Default type for new entries
 * @param onSuccess - Callback when operation succeeds
 */
export function CashbookDialog({
  open,
  onOpenChange,
  entry,
  defaultType = "Income",
  onSuccess,
}: CashbookDialogProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!entry;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CashbookFormData>({
    defaultValues: {
      type: defaultType,
      category: "",
      amount: 0,
      description: "",
      paymentMethod: "Cash",
      referenceId: "",
      referenceType: "",
      bankAccount: "",
      transactionDate: new Date().toISOString().split("T")[0],
      createdBy: "System",
    },
  });

  const type = watch("type");
  const paymentMethod = watch("paymentMethod");
  const categories = type === "Income" ? incomeCategories : expenseCategories;

  /**
   * Load entry data into form when editing
   */
  useEffect(() => {
    if (entry && open) {
      setValue("type", entry.type);
      setValue("category", entry.category);
      setValue("amount", entry.amount);
      setValue("description", entry.description);
      setValue("paymentMethod", entry.paymentMethod);
      setValue("referenceId", entry.referenceId || "");
      setValue("referenceType", entry.referenceType || "");
      setValue("bankAccount", entry.bankAccount || "");
      setValue(
        "transactionDate",
        entry.transactionDate ? entry.transactionDate.split("T")[0] : new Date().toISOString().split("T")[0]
      );
      setValue("createdBy", entry.createdBy);
    } else if (!entry && open) {
      // Reset form for create mode
      reset({
        type: defaultType,
        category: "",
        amount: 0,
        description: "",
        paymentMethod: "Cash",
        referenceId: "",
        referenceType: "",
        bankAccount: "",
        transactionDate: new Date().toISOString().split("T")[0],
        createdBy: "System",
      });
    }
    setError(null);
  }, [entry, open, defaultType, setValue, reset]);

  /**
   * Handle form submission (create or update)
   */
  const onSubmit = async (data: CashbookFormData) => {
    try {
      setLoading(true);
      setError(null);

      const entryData: Partial<CashbookEntry> = {
        type: data.type,
        category: data.category,
        amount: data.amount,
        description: data.description,
        paymentMethod: data.paymentMethod,
        referenceId: data.referenceId || undefined,
        referenceType: data.referenceType || undefined,
        bankAccount: data.bankAccount || undefined,
        transactionDate: new Date(data.transactionDate).toISOString(),
        createdBy: data.createdBy,
      };

      if (isEdit && entry) {
        await updateCashbookEntry(entry.id, entryData);
      } else {
        await createCashbookEntry(entryData);
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Có lỗi xảy ra khi lưu phiếu thu/chi";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle delete confirmation
   */
  const handleDelete = async () => {
    if (!entry) return;

    try {
      setLoading(true);
      setError(null);
      await deleteCashbookEntry(entry.id);
      setDeleteDialogOpen(false);
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Có lỗi xảy ra khi xóa phiếu thu/chi";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEdit
                ? entry?.type === "Income"
                  ? "Chỉnh sửa phiếu thu"
                  : "Chỉnh sửa phiếu chi"
                : type === "Income"
                  ? "Tạo phiếu thu"
                  : "Tạo phiếu chi"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Cập nhật thông tin phiếu thu/chi"
                : type === "Income"
                  ? "Tạo một phiếu thu mới"
                  : "Tạo một phiếu chi mới"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {!isEdit && (
              <div className="space-y-2">
                <Label htmlFor="type">
                  Loại giao dịch <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={type}
                  onValueChange={(value: "Income" | "Expense") => setValue("type", value)}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Income">Thu</SelectItem>
                    <SelectItem value="Expense">Chi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">
                  Danh mục <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch("category")}
                  onValueChange={(value) => {
                    setValue("category", value, { shouldValidate: true });
                  }}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-destructive">{errors.category.message}</p>
                )}
                <input
                  type="hidden"
                  {...register("category", { required: "Danh mục là bắt buộc" })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transactionDate">
                  Ngày giao dịch <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="transactionDate"
                  type="date"
                  {...register("transactionDate", { required: "Ngày giao dịch là bắt buộc" })}
                />
                {errors.transactionDate && (
                  <p className="text-sm text-destructive">{errors.transactionDate.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">
                Số tiền <span className="text-destructive">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                {...register("amount", {
                  valueAsNumber: true,
                  required: "Số tiền là bắt buộc",
                  min: { value: 0.01, message: "Số tiền phải lớn hơn 0" },
                })}
                placeholder="Nhập số tiền"
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Mô tả <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                {...register("description", { required: "Mô tả là bắt buộc" })}
                placeholder="Nhập mô tả giao dịch"
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">
                  Phương thức thanh toán <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(value: PaymentMethod) => setValue("paymentMethod", value)}
                >
                  <SelectTrigger id="paymentMethod">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(paymentMethodLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(paymentMethod === "BankTransfer" || paymentMethod === "Momo" || paymentMethod === "ZaloPay") && (
                <div className="space-y-2">
                  <Label htmlFor="bankAccount">Số tài khoản</Label>
                  <Input
                    id="bankAccount"
                    {...register("bankAccount")}
                    placeholder="Nhập số tài khoản"
                  />
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="referenceType">Loại tham chiếu</Label>
                <Input
                  id="referenceType"
                  {...register("referenceType")}
                  placeholder="VD: SaleOrder, PurchaseOrder"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="referenceId">ID Tham chiếu</Label>
                <Input
                  id="referenceId"
                  {...register("referenceId")}
                  placeholder="UUID của đơn hàng"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="createdBy">Người tạo</Label>
              <Input
                id="createdBy"
                {...register("createdBy", { required: "Người tạo là bắt buộc" })}
                placeholder="Tên người tạo"
              />
              {errors.createdBy && (
                <p className="text-sm text-destructive">{errors.createdBy.message}</p>
              )}
            </div>

            <DialogFooter>
              {isEdit && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={loading}
                >
                  Xóa
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Cập nhật" : "Tạo mới"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa phiếu {entry?.type === "Income" ? "thu" : "chi"} này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

