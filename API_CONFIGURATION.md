# API Configuration Guide

## Backend API URL

Backend đang chạy trên IIS Express với URL:
- **HTTPS**: `https://localhost:44384/api`
- **HTTP**: `http://localhost:50853/api` (nếu có)

## Frontend API Configuration

Frontend được cấu hình để gọi API tại `https://localhost:44384/api` (mặc định).

### Thay đổi API Base URL

Có 2 cách để thay đổi API base URL:

#### Cách 1: Sử dụng Environment Variable (Khuyên dùng)

Tạo file `.env` trong thư mục root của frontend:

```env
VITE_API_BASE_URL=https://localhost:44384/api
```

Hoặc nếu backend chạy bằng `dotnet run`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
# hoặc
VITE_API_BASE_URL=https://localhost:5001/api
```

#### Cách 2: Sửa trực tiếp trong code

Mở file `src/services/api.ts` và thay đổi giá trị mặc định:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "YOUR_API_URL_HERE";
```

## API Endpoints

### Products
- `GET /api/Products` hoặc `/api/products` - Lấy danh sách sản phẩm
- `GET /api/Products/{id}` - Lấy sản phẩm theo ID
- `GET /api/Products/code/{code}` - Lấy sản phẩm theo mã
- `GET /api/Products/barcode/{barcode}` - Lấy sản phẩm theo barcode
- `POST /api/Products` - Tạo sản phẩm mới
- `PUT /api/Products/{id}` - Cập nhật sản phẩm
- `DELETE /api/Products/{id}` - Xóa sản phẩm
- `POST /api/Products/{id}/image` - Upload hình ảnh cho sản phẩm (multipart/form-data)
  - Fields:
    - `file` (file, required) - Hình ảnh (jpg, jpeg, png, webp), max 5 MB
    - `createThumbnail` (bool, optional, default true) - Tạo thumbnail 200x200
  - Response: JSON { "imageUrl": "/images/products/<file>", "thumbnailUrl": "/images/products/<thumb>" | null }

**Lưu ý**: ASP.NET Core routing không phân biệt hoa thường, nên `/Products` và `/products` đều hoạt động.

### Dashboard
- `GET /api/Dashboard/stats` - Thống kê tổng quan
- `GET /api/Dashboard/revenue-by-category` - Doanh thu theo danh mục
- `GET /api/Dashboard/revenue-by-time?days=30` - Doanh thu theo thời gian

## CORS Configuration

Backend đã được cấu hình CORS để cho phép frontend chạy trên:
- `http://localhost:8080` (Vite dev server)
- `http://localhost:5173` (Vite alternative port)
- `http://127.0.0.1:8080`
- `http://127.0.0.1:5173`

Nếu frontend chạy trên port khác, cần cập nhật CORS trong `backend/BusinessBuddy.API/appsettings.json`:

```json
{
  "Cors": {
    "AllowedOrigins": [
      "http://localhost:8080",
      "http://localhost:5173",
      "YOUR_FRONTEND_PORT_HERE"
    ]
  }
}
```

## Testing API Connection

Để kiểm tra API có hoạt động, có thể:

1. Mở Swagger UI: `https://localhost:44384/swagger`
2. Hoặc dùng curl:
```bash
curl -X GET "https://localhost:44384/api/Products?includeInactive=false" -H "accept: application/json"
```

3. Kiểm tra trong browser console khi frontend load để xem có lỗi CORS không.

