/**
 * Supplier Dialog Component
 * Handles create and edit operations for suppliers
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
import { Loader2 } from "lucide-react";
import { createSupplier, updateSupplier, deleteSupplier } from "@/services/supplierService";
import type { Supplier } from "@/types";

/**
 * Form data interface for supplier
 */
interface SupplierFormData {
  code: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  taxCode?: string;
  contactPerson?: string;
  notes?: string;
  isActive: boolean;
}

interface SupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier | null;
  onSuccess?: () => void;
}

/**
 * Supplier Dialog Component
 * @param open - Whether the dialog is open
 * @param onOpenChange - Callback when dialog open state changes
 * @param supplier - Supplier to edit (null for create)
 * @param onSuccess - Callback when operation succeeds
 */
export function SupplierDialog({
  open,
  onOpenChange,
  supplier,
  onSuccess,
}: SupplierDialogProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!supplier;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<SupplierFormData>({
    defaultValues: {
      code: "",
      name: "",
      phone: "",
      email: "",
      address: "",
      taxCode: "",
      contactPerson: "",
      notes: "",
      isActive: true,
    },
  });

  /**
   * Load supplier data into form when editing
   */
  useEffect(() => {
    if (supplier && open) {
      setValue("code", supplier.code);
      setValue("name", supplier.name);
      setValue("phone", supplier.phone || "");
      setValue("email", supplier.email || "");
      setValue("address", supplier.address || "");
      setValue("taxCode", supplier.taxCode || "");
      setValue("contactPerson", supplier.contactPerson || "");
      setValue("notes", supplier.notes || "");
      setValue("isActive", supplier.isActive);
    } else if (!supplier && open) {
      // Reset form for create mode
      reset({
        code: "",
        name: "",
        phone: "",
        email: "",
        address: "",
        taxCode: "",
        contactPerson: "",
        notes: "",
        isActive: true,
      });
    }
    setError(null);
  }, [supplier, open, setValue, reset]);

  /**
   * Handle form submission (create or update)
   */
  const onSubmit = async (data: SupplierFormData) => {
    try {
      setLoading(true);
      setError(null);

      const supplierData = {
        ...data,
        payables: supplier?.payables || 0,
      };

      if (isEdit && supplier) {
        await updateSupplier(supplier.id, supplierData);
      } else {
        await createSupplier(supplierData);
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Có lỗi xảy ra khi lưu nhà cung cấp";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle delete confirmation
   */
  const handleDelete = async () => {
    if (!supplier) return;

    try {
      setLoading(true);
      setError(null);
      await deleteSupplier(supplier.id);
      setDeleteDialogOpen(false);
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Có lỗi xảy ra khi xóa nhà cung cấp";
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
            <DialogTitle>{isEdit ? "Chỉnh sửa nhà cung cấp" : "Thêm nhà cung cấp mới"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Cập nhật thông tin nhà cung cấp trong hệ thống"
                : "Thêm một nhà cung cấp mới vào hệ thống"}
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
                  Mã nhà cung cấp <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="code"
                  {...register("code", { required: "Mã nhà cung cấp là bắt buộc" })}
                  placeholder="VD: NCC001"
                />
                {errors.code && (
                  <p className="text-sm text-destructive">{errors.code.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  Tên nhà cung cấp <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  {...register("name", { required: "Tên nhà cung cấp là bắt buộc" })}
                  placeholder="Nhập tên nhà cung cấp"
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
                  placeholder="VD: supplier@example.com"
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
                <Label htmlFor="taxCode">Mã số thuế</Label>
                <Input
                  id="taxCode"
                  {...register("taxCode")}
                  placeholder="Nhập mã số thuế"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPerson">Người liên hệ</Label>
                <Input
                  id="contactPerson"
                  {...register("contactPerson")}
                  placeholder="Nhập tên người liên hệ"
                />
              </div>
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
              Bạn có chắc chắn muốn xóa nhà cung cấp "{supplier?.name}"? Hành động này không thể hoàn tác.
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

