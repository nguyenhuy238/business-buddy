/**
 * Payable Payment Dialog Component
 * Handles paying payables (supplier debt payments)
 */
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { createPayablePayment } from "@/services/payableService";
import type { Payable, PaymentMethod } from "@/types";
import { formatCurrency } from "@/lib/format";

/**
 * Form data interface for payable payment
 */
interface PayablePaymentFormData {
  amount: number;
  paymentMethod: PaymentMethod;
  description: string;
  transactionDate: string;
}

interface PayablePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payable: Payable | null;
  onSuccess?: () => void;
}

/**
 * Payment method labels
 */
const paymentMethodLabels: Record<PaymentMethod, string> = {
  Cash: "Tiền mặt",
  BankTransfer: "Chuyển khoản",
  VietQR: "VietQR",
  Momo: "Momo",
  ZaloPay: "ZaloPay",
  Credit: "Công nợ",
};

export function PayablePaymentDialog({
  open,
  onOpenChange,
  payable,
  onSuccess,
}: PayablePaymentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<PayablePaymentFormData>({
    defaultValues: {
      amount: 0,
      paymentMethod: "Cash",
      description: "",
      transactionDate: new Date().toISOString().split("T")[0],
    },
  });

  const amount = watch("amount");
  const maxAmount = payable?.totalPayables || 0;

  /**
   * Reset form when dialog opens/closes or payable changes
   */
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
      setError(null);
    }
    onOpenChange(newOpen);
  };

  /**
   * Handle form submission
   */
  const onSubmit = async (data: PayablePaymentFormData) => {
    if (!payable) return;

    if (data.amount <= 0) {
      setError("Số tiền phải lớn hơn 0");
      return;
    }

    if (data.amount > maxAmount) {
      setError(`Số tiền không được vượt quá công nợ hiện tại: ${formatCurrency(maxAmount)}`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await createPayablePayment({
        supplierId: payable.supplierId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        description: data.description || `Trả tiền công nợ cho ${payable.supplierName}`,
        transactionDate: new Date(data.transactionDate).toISOString(),
        createdBy: "System", // TODO: Get from auth context
      });

      reset();
      handleOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể tạo phiếu chi";
      setError(errorMessage);
      console.error("Error creating payable payment:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Set amount to maximum
   */
  const setMaxAmount = () => {
    setValue("amount", maxAmount);
  };

  if (!payable) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Trả tiền công nợ</DialogTitle>
          <DialogDescription>
            Trả tiền công nợ cho nhà cung cấp: <strong>{payable.supplierName}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Supplier Info */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Nhà cung cấp:</span>
                <span className="font-medium">{payable.supplierName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Mã nhà cung cấp:</span>
                <span className="font-medium">{payable.supplierCode}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Công nợ hiện tại:</span>
                <span className="font-semibold text-primary">
                  {formatCurrency(payable.totalPayables)}
                </span>
              </div>
              {payable.isOverdue && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Quá hạn:</span>
                  <span className="font-semibold text-destructive">
                    {payable.overdueDays} ngày
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              Số tiền trả <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                max={maxAmount}
                {...register("amount", {
                  required: "Vui lòng nhập số tiền",
                  min: { value: 0.01, message: "Số tiền phải lớn hơn 0" },
                  max: { value: maxAmount, message: `Số tiền không được vượt quá ${formatCurrency(maxAmount)}` },
                  valueAsNumber: true,
                })}
                className="flex-1"
                placeholder="0"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={setMaxAmount}
                disabled={loading}
              >
                Tối đa
              </Button>
            </div>
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
            {amount > 0 && (
              <p className="text-xs text-muted-foreground">
                Còn lại sau khi trả: {formatCurrency(maxAmount - amount)}
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">
              Phương thức thanh toán <span className="text-destructive">*</span>
            </Label>
            <Select
              value={watch("paymentMethod")}
              onValueChange={(value) => setValue("paymentMethod", value as PaymentMethod)}
            >
              <SelectTrigger id="paymentMethod">
                <SelectValue placeholder="Chọn phương thức thanh toán" />
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

          {/* Transaction Date */}
          <div className="space-y-2">
            <Label htmlFor="transactionDate">
              Ngày giao dịch <span className="text-destructive">*</span>
            </Label>
            <Input
              id="transactionDate"
              type="date"
              {...register("transactionDate", {
                required: "Vui lòng chọn ngày giao dịch",
              })}
            />
            {errors.transactionDate && (
              <p className="text-sm text-destructive">{errors.transactionDate.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Ghi chú</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Nhập ghi chú (tùy chọn)"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận trả tiền
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

