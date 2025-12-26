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
  createCategory,
  updateCategory,
  getCategories,
} from "@/services/categoryService";
import type { Category } from "@/types";
import { Loader2 } from "lucide-react";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  onSuccess?: () => void;
}

/**
 * Dialog for creating/editing categories
 */
export function CategoryDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: CategoryDialogProps) {
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    parentId: "__none__",
    description: "",
    color: "",
    icon: "",
    isActive: true,
  });

  const toast = useToast();

  /**
   * Load parent categories for selection
   */
  useEffect(() => {
    if (open) {
      const loadCategories = async () => {
        try {
          setLoadingCategories(true);
          const data = await getCategories(true); // Include inactive for parent selection
          setCategories(data);
        } catch (error) {
          console.error("Error loading categories:", error);
        } finally {
          setLoadingCategories(false);
        }
      };
      loadCategories();
    }
  }, [open]);

  /**
   * Reset form when dialog opens/closes or category changes
   */
  useEffect(() => {
    if (open) {
      if (category) {
        setFormData({
          code: category.code,
          name: category.name,
          parentId: category.parentId || "__none__",
          description: category.description || "",
          color: category.color || "",
          icon: category.icon || "",
          isActive: category.isActive,
        });
      } else {
        setFormData({
          code: "",
          name: "",
          parentId: "__none__",
          description: "",
          color: "",
          icon: "",
          isActive: true,
        });
      }
    }
  }, [open, category]);

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (!formData.code.trim() || !formData.name.trim()) {
      toast.toast({
        title: "Lỗi",
        description: "Vui lòng nhập mã và tên danh mục",
      });
      return;
    }

    try {
      setLoading(true);

      const categoryData = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        parentId: formData.parentId === "__none__" ? undefined : formData.parentId,
        description: formData.description.trim() || undefined,
        color: formData.color.trim() || undefined,
        icon: formData.icon.trim() || undefined,
        isActive: formData.isActive,
      };

      if (category) {
        // Update existing
        await updateCategory(category.id, categoryData);
        toast.toast({
          title: "Thành công",
          description: "Cập nhật danh mục thành công",
        });
      } else {
        // Create new
        await createCategory(categoryData);
        toast.toast({
          title: "Thành công",
          description: "Thêm danh mục thành công",
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
   * Filter out current category and its children from parent options
   */
  const getParentOptions = (): Category[] => {
    if (!category) return categories;
    // Exclude current category and its children
    const excludeIds = new Set<string>([category.id]);
    const findChildren = (parentId: string) => {
      categories.forEach((cat) => {
        if (cat.parentId === parentId) {
          excludeIds.add(cat.id);
          findChildren(cat.id);
        }
      });
    };
    findChildren(category.id);
    return categories.filter((cat) => !excludeIds.has(cat.id));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {category ? "Cập nhật danh mục" : "Thêm danh mục mới"}
          </DialogTitle>
          <DialogDescription>
            {category
              ? "Cập nhật thông tin danh mục sản phẩm"
              : "Thêm danh mục mới để phân loại sản phẩm"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Code */}
          <div className="space-y-2">
            <Label htmlFor="code">
              Mã danh mục <span className="text-destructive">*</span>
            </Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              placeholder="Ví dụ: BEVERAGE"
              disabled={!!category}
            />
            <p className="text-xs text-muted-foreground">
              Mã danh mục phải duy nhất và không thể thay đổi sau khi tạo
            </p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Tên danh mục <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Ví dụ: Đồ uống"
            />
          </div>

          {/* Parent Category */}
          <div className="space-y-2">
            <Label htmlFor="parentId">Danh mục cha (tùy chọn)</Label>
            <Select
              value={formData.parentId}
              onValueChange={(value) =>
                setFormData({ ...formData, parentId: value })
              }
              disabled={loadingCategories}
            >
              <SelectTrigger id="parentId">
                <SelectValue placeholder="Chọn danh mục cha (để trống nếu là danh mục gốc)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Không có (Danh mục gốc)</SelectItem>
                {getParentOptions().map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name} ({cat.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Chọn danh mục cha nếu muốn tạo danh mục con
            </p>
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
              placeholder="Mô tả về danh mục (tùy chọn)"
              rows={3}
            />
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label htmlFor="color">Màu sắc (Hex code)</Label>
            <div className="flex gap-2">
              <Input
                id="color"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                placeholder="#FF5733"
                className="flex-1"
              />
              {formData.color && (
                <div
                  className="w-12 h-10 rounded border"
                  style={{ backgroundColor: formData.color }}
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Màu sắc để phân biệt danh mục (tùy chọn)
            </p>
          </div>

          {/* Icon */}
          <div className="space-y-2">
            <Label htmlFor="icon">Icon</Label>
            <Input
              id="icon"
              value={formData.icon}
              onChange={(e) =>
                setFormData({ ...formData, icon: e.target.value })
              }
              placeholder="Tên icon từ thư viện (tùy chọn)"
            />
            <p className="text-xs text-muted-foreground">
              Tên icon từ thư viện Lucide (tùy chọn)
            </p>
          </div>

          {/* Is Active */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Trạng thái hoạt động</Label>
              <p className="text-sm text-muted-foreground">
                Danh mục sẽ không hiển thị trong danh sách nếu tắt
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
            ) : category ? (
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

