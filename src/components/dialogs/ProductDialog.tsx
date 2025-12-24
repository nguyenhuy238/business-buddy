/**
 * Product Dialog Component
 * Handles create and edit operations for products
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
import { createProduct, updateProduct, deleteProduct, uploadProductImage } from "@/services/productService";
import type { Product, CreateProduct, UpdateProduct } from "@/types";

/**
 * Form data interface for product
 */
interface ProductFormData {
  code: string;
  barcode?: string;
  name: string;
  description?: string;
  categoryId: string;
  unitId: string;
  baseUnitId?: string;
  conversionRate: number;
  costPrice: number;
  salePrice: number;
  wholesalePrice?: number;
  minStock: number;
  imageUrl?: string;
  isCombo: boolean;
  costMethod: string;
  isActive: boolean;
}

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSuccess?: () => void;
}

/**
 * Product Dialog Component
 * @param open - Whether the dialog is open
 * @param onOpenChange - Callback when dialog open state changes
 * @param product - Product to edit (null for create)
 * @param onSuccess - Callback when operation succeeds
 */
export function ProductDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
}: ProductDialogProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
  const [createThumb, setCreateThumb] = useState(true);
  const [uploading, setUploading] = useState(false);
  const isEdit = !!product;

  // Convert relative path ("/images/..") to absolute using backend API origin (supports /images/... returned by backend)
  const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "https://localhost:44384/api";
  const apiOrigin = (() => {
    try {
      return new URL(API_BASE).origin;
    } catch {
      return window.location.origin;
    }
  })();

  const toAbsolute = (url?: string | null) => {
    if (!url) return undefined;
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith("/")) return `${apiOrigin}${url}`;
    return url;
  }; 

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    defaultValues: {
      code: "",
      barcode: "",
      name: "",
      description: "",
      categoryId: "",
      unitId: "",
      baseUnitId: "",
      conversionRate: 1,
      costPrice: 0,
      salePrice: 0,
      wholesalePrice: undefined,
      minStock: 0,
      imageUrl: "",
      isCombo: false,
      costMethod: "SIMPLE",
      isActive: true,
    },
  });

  const isCombo = watch("isCombo");
  const costMethod = watch("costMethod");

  /**
   * Load product data into form when editing
   */
  useEffect(() => {
    if (product && open) {
      setValue("code", product.code);
      setValue("barcode", product.barcode || "");
      setValue("name", product.name);
      setValue("description", product.description || "");
      setValue("categoryId", product.categoryId);
      setValue("unitId", product.unitId);
      setValue("baseUnitId", product.baseUnitId || "");
      setValue("conversionRate", product.conversionRate);
      setValue("costPrice", product.costPrice);
      setValue("salePrice", product.salePrice);
      setValue("wholesalePrice", product.wholesalePrice);
      setValue("minStock", product.minStock);
      const absImageUrl = toAbsolute(product.imageUrl ?? undefined) ?? "";
      const absThumbUrl = toAbsolute(product.thumbnailUrl ?? product.imageUrl ?? undefined);
      setValue("imageUrl", absImageUrl);
      setPreviewUrl(absThumbUrl ?? (absImageUrl || undefined));
      setValue("isCombo", product.isCombo);
      setValue("costMethod", product.costMethod || "SIMPLE");
      setValue("isActive", product.isActive);
    } else if (!product && open) {
      // Reset form for create mode
      reset({
        code: "",
        barcode: "",
        name: "",
        description: "",
        categoryId: "",
        unitId: "",
        baseUnitId: "",
        conversionRate: 1,
        costPrice: 0,
        salePrice: 0,
        wholesalePrice: undefined,
        minStock: 0,
        imageUrl: "",
        isCombo: false,
        costMethod: "SIMPLE",
        isActive: true,
      });
      setSelectedFile(null);
      setPreviewUrl(undefined);
    }
    setError(null);
  }, [product, open, setValue, reset]);

  // Update preview when imageUrl is manually changed (unless a local file is selected)
  const watchedImageUrl = watch("imageUrl");
  useEffect(() => {
    if (selectedFile) return; // keep preview for selected local file
    if (!watchedImageUrl) {
      setPreviewUrl(undefined);
      return;
    }
    const abs = toAbsolute(watchedImageUrl) ?? watchedImageUrl;
    setPreviewUrl(abs);
  }, [watchedImageUrl, selectedFile]);

  /**
   * Handle form submission (create or update)
   */
  const onSubmit = async (data: ProductFormData) => {
    try {
      setLoading(true);
      setError(null);

      if (isEdit && product) {
        const updateData: UpdateProduct = {
          barcode: data.barcode || undefined,
          name: data.name,
          description: data.description || undefined,
          categoryId: data.categoryId,
          unitId: data.unitId,
          baseUnitId: data.baseUnitId || undefined,
          conversionRate: data.conversionRate,
          costPrice: data.costPrice,
          salePrice: data.salePrice,
          wholesalePrice: data.wholesalePrice,
          minStock: data.minStock,
          imageUrl: data.imageUrl || undefined,
          isActive: data.isActive,
          isCombo: data.isCombo,
          costMethod: data.costMethod,
        };
        await updateProduct(product.id, updateData);
      } else {
        const createData: CreateProduct = {
          code: data.code,
          barcode: data.barcode || undefined,
          name: data.name,
          description: data.description || undefined,
          categoryId: data.categoryId,
          unitId: data.unitId,
          baseUnitId: data.baseUnitId || undefined,
          conversionRate: data.conversionRate,
          costPrice: data.costPrice,
          salePrice: data.salePrice,
          wholesalePrice: data.wholesalePrice,
          minStock: data.minStock,
          imageUrl: data.imageUrl || undefined,
          isCombo: data.isCombo,
          costMethod: data.costMethod,
        };
        await createProduct(createData);
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Có lỗi xảy ra khi lưu sản phẩm";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle delete confirmation
   */
  const handleDelete = async () => {
    if (!product) return;

    try {
      setLoading(true);
      setError(null);
      await deleteProduct(product.id);
      setDeleteDialogOpen(false);
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Có lỗi xảy ra khi xóa sản phẩm";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Cập nhật thông tin sản phẩm trong hệ thống"
                : "Thêm một sản phẩm mới vào hệ thống"}
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
                  Mã sản phẩm <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="code"
                  {...register("code", { required: "Mã sản phẩm là bắt buộc" })}
                  placeholder="VD: SP001"
                  disabled={isEdit}
                />
                {errors.code && (
                  <p className="text-sm text-destructive">{errors.code.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="barcode">Mã vạch</Label>
                <Input
                  id="barcode"
                  {...register("barcode")}
                  placeholder="Nhập mã vạch (nếu có)"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                Tên sản phẩm <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                {...register("name", { required: "Tên sản phẩm là bắt buộc" })}
                placeholder="Nhập tên sản phẩm"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Nhập mô tả sản phẩm"
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="categoryId">
                  ID Danh mục <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="categoryId"
                  {...register("categoryId", { required: "ID danh mục là bắt buộc" })}
                  placeholder="UUID của danh mục"
                />
                {errors.categoryId && (
                  <p className="text-sm text-destructive">{errors.categoryId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitId">
                  ID Đơn vị tính <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="unitId"
                  {...register("unitId", { required: "ID đơn vị tính là bắt buộc" })}
                  placeholder="UUID của đơn vị tính"
                />
                {errors.unitId && (
                  <p className="text-sm text-destructive">{errors.unitId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="baseUnitId">ID Đơn vị cơ bản</Label>
                <Input
                  id="baseUnitId"
                  {...register("baseUnitId")}
                  placeholder="UUID của đơn vị cơ bản"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="conversionRate">Tỷ lệ quy đổi</Label>
                <Input
                  id="conversionRate"
                  type="number"
                  step="0.01"
                  {...register("conversionRate", {
                    valueAsNumber: true,
                    min: { value: 0.01, message: "Tỷ lệ quy đổi phải lớn hơn 0" },
                  })}
                />
                {errors.conversionRate && (
                  <p className="text-sm text-destructive">{errors.conversionRate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="minStock">Tồn kho tối thiểu</Label>
                <Input
                  id="minStock"
                  type="number"
                  {...register("minStock", {
                    valueAsNumber: true,
                    min: { value: 0, message: "Tồn kho tối thiểu không được âm" },
                  })}
                />
                {errors.minStock && (
                  <p className="text-sm text-destructive">{errors.minStock.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="costPrice">
                  Giá vốn <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  {...register("costPrice", {
                    valueAsNumber: true,
                    required: "Giá vốn là bắt buộc",
                    min: { value: 0, message: "Giá vốn không được âm" },
                  })}
                />
                {errors.costPrice && (
                  <p className="text-sm text-destructive">{errors.costPrice.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="salePrice">
                  Giá bán <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="salePrice"
                  type="number"
                  step="0.01"
                  {...register("salePrice", {
                    valueAsNumber: true,
                    required: "Giá bán là bắt buộc",
                    min: { value: 0, message: "Giá bán không được âm" },
                  })}
                />
                {errors.salePrice && (
                  <p className="text-sm text-destructive">{errors.salePrice.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="wholesalePrice">Giá bán sỉ</Label>
                <Input
                  id="wholesalePrice"
                  type="number"
                  step="0.01"
                  {...register("wholesalePrice", {
                    valueAsNumber: true,
                    min: { value: 0, message: "Giá bán sỉ không được âm" },
                  })}
                />
                {errors.wholesalePrice && (
                  <p className="text-sm text-destructive">{errors.wholesalePrice.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="costMethod">Phương pháp tính giá vốn</Label>
                <Select
                  value={costMethod}
                  onValueChange={(value) => setValue("costMethod", value)}
                >
                  <SelectTrigger id="costMethod">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SIMPLE">Đơn giản (SIMPLE)</SelectItem>
                    <SelectItem value="FIFO">Nhập trước xuất trước (FIFO)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
              <Label htmlFor="imageUrl">URL hình ảnh</Label>

              <div className="flex items-center space-x-4">
                <Input
                  id="imageUrl"
                  type="url"
                  {...register("imageUrl")}
                  placeholder="https://example.com/image.jpg"
                />

                <div className="flex flex-col">
                  <input
                    id="file"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      const f = e.target.files && e.target.files[0];
                      if (f) {
                        setSelectedFile(f);
                        setPreviewUrl(URL.createObjectURL(f));
                      }
                    }}
                    className="text-sm"
                  />

                  <label className="flex items-center space-x-2 text-sm mt-2">
                    <input
                      type="checkbox"
                      checked={createThumb}
                      onChange={(e) => setCreateThumb(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span>Tạo thumbnail 200x200</span>
                  </label>

                  <Button
                    type="button"
                    className="mt-2"
                    onClick={async () => {
                      if (!selectedFile || !product) return;
                      try {
                        setUploading(true);
                        const res = await uploadProductImage(product.id, selectedFile, createThumb);

                        // If backend returns relative paths (e.g. "/images/...") convert them to absolute URLs
                        const toAbsolute = (url?: string | null) => {
                          if (!url) return "";
                          if (/^https?:\/\//i.test(url)) return url;
                          if (url.startsWith("/")) return `${window.location.origin}${url}`;
                          return url;
                        };

                        const absImageUrl = toAbsolute(res.imageUrl ?? undefined) ?? "";
                        const absThumbUrl = toAbsolute(res.thumbnailUrl ?? res.imageUrl ?? undefined);

                        setValue("imageUrl", absImageUrl ?? "");
                        // Choose thumbnail if available, otherwise keep previous preview or undefined
                        setPreviewUrl(absThumbUrl ?? previewUrl ?? undefined);
                      } catch (err) {
                        const msg = err instanceof Error ? err.message : String(err);
                        setError(msg || "Upload failed");
                      } finally {
                        setUploading(false);
                      }
                    }}
                    disabled={!selectedFile || uploading}
                  >
                    {uploading ? "Uploading..." : "Upload"}
                  </Button>
                </div>

                <div className="w-24 h-24 bg-gray-50 border rounded overflow-hidden">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-gray-400">No image</div>
                  )}
                </div>
              </div>
            </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isCombo"
                  {...register("isCombo")}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isCombo" className="cursor-pointer">
                  Sản phẩm combo/bộ
                </Label>
              </div>

              {!isEdit && (
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
              Bạn có chắc chắn muốn xóa sản phẩm "{product?.name}"? Hành động này không thể hoàn tác.
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

