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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  createUnitOfMeasure,
  updateUnitOfMeasure,
} from "@/services/unitOfMeasureService";
import type { UnitOfMeasure } from "@/types";
import { Loader2 } from "lucide-react";

interface UnitOfMeasureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit?: UnitOfMeasure | null;
  onSuccess?: () => void;
}

/**
 * Dialog for creating/editing units of measure
 */
export function UnitOfMeasureDialog({
  open,
  onOpenChange,
  unit,
  onSuccess,
}: UnitOfMeasureDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    isActive: true,
  });

  const toast = useToast();

  /**
   * Reset form when dialog opens/closes or unit changes
   */
  useEffect(() => {
    if (open) {
      if (unit) {
        setFormData({
          code: unit.code,
          name: unit.name,
          description: unit.description || "",
          isActive: unit.isActive,
        });
      } else {
        setFormData({
          code: "",
          name: "",
          description: "",
          isActive: true,
        });
      }
    }
  }, [open, unit]);

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (!formData.code.trim() || !formData.name.trim()) {
      toast.toast({
        title: "Lỗi",
        description: "Vui lòng nhập mã và tên đơn vị tính",
      });
      return;
    }

    try {
      setLoading(true);

      const unitData = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        isActive: formData.isActive,
      };

      if (unit) {
        // Update existing
        await updateUnitOfMeasure(unit.id, unitData);
        toast.toast({
          title: "Thành công",
          description: "Cập nhật đơn vị tính thành công",
        });
      } else {
        // Create new
        await createUnitOfMeasure(unitData);
        toast.toast({
          title: "Thành công",
          description: "Thêm đơn vị tính thành công",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {unit ? "Cập nhật đơn vị tính" : "Thêm đơn vị tính mới"}
          </DialogTitle>
          <DialogDescription>
            {unit
              ? "Cập nhật thông tin đơn vị tính"
              : "Thêm đơn vị tính mới (có thể dùng làm đơn vị tính hoặc đơn vị cơ bản)"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Code */}
          <div className="space-y-2">
            <Label htmlFor="code">
              Mã đơn vị tính <span className="text-destructive">*</span>
            </Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              placeholder="Ví dụ: PIECE, BOX, BOTTLE"
              disabled={!!unit}
            />
            <p className="text-xs text-muted-foreground">
              Mã đơn vị tính phải duy nhất và không thể thay đổi sau khi tạo
            </p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Tên đơn vị tính <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Ví dụ: Cái, Hộp, Chai, Kg, Lít"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Mô tả về đơn vị tính (tùy chọn)"
              rows={3}
            />
          </div>

          {/* Is Active */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Trạng thái hoạt động</Label>
              <p className="text-sm text-muted-foreground">
                Đơn vị tính sẽ không hiển thị trong danh sách nếu tắt
              </p>
            </div>
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isActive: checked })
              }
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
            ) : unit ? (
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

