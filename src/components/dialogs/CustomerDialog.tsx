/**
 * Customer Dialog Component
 * Handles create and edit operations for customers
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
import { createCustomer, updateCustomer, deleteCustomer } from "@/services/customerService";
import type { Customer } from "@/types";

/**
 * Form data interface for customer
 */
interface CustomerFormData {
  code: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  membershipTier: "Bronze" | "Silver" | "Gold" | "Platinum";
  zaloId?: string;
  birthday?: string;
  notes?: string;
  isActive: boolean;
}

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  onSuccess?: () => void;
}

/**
 * Customer Dialog Component
 * @param open - Whether the dialog is open
 * @param onOpenChange - Callback when dialog open state changes
 * @param customer - Customer to edit (null for create)
 * @param onSuccess - Callback when operation succeeds
 */
export function CustomerDialog({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: CustomerDialogProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!customer;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CustomerFormData>({
    defaultValues: {
      code: "",
      name: "",
      phone: "",
      email: "",
      address: "",
      membershipTier: "Bronze",
      zaloId: "",
      birthday: "",
      notes: "",
      isActive: true,
    },
  });

  const membershipTier = watch("membershipTier");

  /**
   * Load customer data into form when editing
   */
  useEffect(() => {
    if (customer && open) {
      setValue("code", customer.code);
      setValue("name", customer.name);
      setValue("phone", customer.phone || "");
      setValue("email", customer.email || "");
      setValue("address", customer.address || "");
      setValue("membershipTier", customer.membershipTier);
      setValue("zaloId", customer.zaloId || "");
      setValue("birthday", customer.birthday ? customer.birthday.split("T")[0] : "");
      setValue("notes", customer.notes || "");
      setValue("isActive", customer.isActive);
    } else if (!customer && open) {
      // Reset form for create mode
      reset({
        code: "",
        name: "",
        phone: "",
        email: "",
        address: "",
        membershipTier: "Bronze",
        zaloId: "",
        birthday: "",
        notes: "",
        isActive: true,
      });
    }
    setError(null);
  }, [customer, open, setValue, reset]);

  /**
   * Handle form submission (create or update)
   */
  const onSubmit = async (data: CustomerFormData) => {
    try {
      setLoading(true);
      setError(null);

      const customerData = {
        ...data,
        birthday: data.birthday ? new Date(data.birthday).toISOString() : undefined,
        receivables: customer?.receivables || 0,
        points: customer?.points || 0,
        totalSpent: customer?.totalSpent || 0,
      };

      if (isEdit && customer) {
        await updateCustomer(customer.id, customerData);
      } else {
        await createCustomer(customerData);
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Có lỗi xảy ra khi lưu khách hàng";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle delete confirmation
   */
  const handleDelete = async () => {
    if (!customer) return;

    try {
      setLoading(true);
      setError(null);
      await deleteCustomer(customer.id);
      setDeleteDialogOpen(false);
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Có lỗi xảy ra khi xóa khách hàng";
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
            <DialogTitle>{isEdit ? "Chỉnh sửa khách hàng" : "Thêm khách hàng mới"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Cập nhật thông tin khách hàng trong hệ thống"
                : "Thêm một khách hàng mới vào hệ thống"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">
                  Mã khách hàng <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="code"
                  {...register("code", { required: "Mã khách hàng là bắt buộc" })}
                  placeholder="VD: KH001"
                />
                {errors.code && (
                  <p className="text-sm text-destructive">{errors.code.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  Tên khách hàng <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  {...register("name", { required: "Tên khách hàng là bắt buộc" })}
                  placeholder="Nhập tên khách hàng"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...register("phone")}
                  placeholder="VD: 0901234567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="VD: customer@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Địa chỉ</Label>
              <Textarea
                id="address"
                {...register("address")}
                placeholder="Nhập địa chỉ"
                rows={2}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="membershipTier">Hạng thành viên</Label>
                <Select
                  value={membershipTier}
                  onValueChange={(value: "Bronze" | "Silver" | "Gold" | "Platinum") =>
                    setValue("membershipTier", value)
                  }
                >
                  <SelectTrigger id="membershipTier">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bronze">Đồng</SelectItem>
                    <SelectItem value="Silver">Bạc</SelectItem>
                    <SelectItem value="Gold">Vàng</SelectItem>
                    <SelectItem value="Platinum">Bạch kim</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthday">Ngày sinh</Label>
                <Input
                  id="birthday"
                  type="date"
                  {...register("birthday")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zaloId">Zalo ID</Label>
              <Input
                id="zaloId"
                {...register("zaloId")}
                placeholder="Nhập Zalo ID"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                placeholder="Nhập ghi chú (nếu có)"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                {...register("isActive")}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Đang hoạt động
              </Label>
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
              Bạn có chắc chắn muốn xóa khách hàng "{customer?.name}"? Hành động này không thể hoàn tác.
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

