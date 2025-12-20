# HƯỚNG DẪN SETUP VÀ PHÁT TRIỂN BACKEND

## 📋 CÁC BƯỚC THIẾT LẬP BAN ĐẦU

### Bước 1: Kiểm tra Yêu Cầu

Đảm bảo máy tính của bạn đã cài đặt:
- ✅ **.NET SDK 8.0** trở lên (kiểm tra: `dotnet --version`)
- ✅ **SQL Server** (LocalDB, Express, hoặc Standard)
- ✅ **Visual Studio 2022** với workload ".NET desktop development"

### Bước 2: Mở Solution trong Visual Studio

1. Mở **Visual Studio 2022**
2. **File** → **Open** → **Project/Solution**
3. Duyệt đến thư mục `backend` và chọn file **`BusinessBuddy.sln`**
4. Visual Studio sẽ tự động restore NuGet packages (chờ vài phút)

### Bước 3: Cấu Hình Connection String

1. Mở file `BusinessBuddy.API/appsettings.json`
2. Tìm section `ConnectionStrings` và chỉnh sửa:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=BusinessBuddyDB;Trusted_Connection=true;MultipleActiveResultSets=true;TrustServerCertificate=true"
  }
}
```

**Các lựa chọn Connection String:**

- **LocalDB** (Mặc định):
  ```
  Server=(localdb)\\mssqllocaldb;Database=BusinessBuddyDB;Trusted_Connection=true;MultipleActiveResultSets=true;TrustServerCertificate=true
  ```

- **SQL Server Express**:
  ```
  Server=.\\SQLEXPRESS;Database=BusinessBuddyDB;Trusted_Connection=true;MultipleActiveResultSets=true;TrustServerCertificate=true
  ```

- **SQL Server** (với username/password):
  ```
  Server=localhost;Database=BusinessBuddyDB;User Id=sa;Password=YourPassword;TrustServerCertificate=true
  ```

### Bước 4: Tạo Database và Migrate

#### Cách 1: Sử dụng Package Manager Console (Khuyên dùng)

1. Trong Visual Studio, mở **Package Manager Console**:
   - **Tools** → **NuGet Package Manager** → **Package Manager Console**

2. Đảm bảo Default Project là **`BusinessBuddy.Infrastructure`**

3. Chạy lệnh tạo migration:
   ```powershell
   Add-Migration InitialCreate -Project BusinessBuddy.Infrastructure -StartupProject BusinessBuddy.API
   ```

4. Chạy lệnh update database:
   ```powershell
   Update-Database -Project BusinessBuddy.Infrastructure -StartupProject BusinessBuddy.API
   ```

#### Cách 2: Sử dụng .NET CLI

1. Mở **Terminal** hoặc **Command Prompt**
2. Chuyển đến thư mục backend:
   ```bash
   cd backend/BusinessBuddy.API
   ```

3. Tạo migration:
   ```bash
   dotnet ef migrations add InitialCreate --project ../BusinessBuddy.Infrastructure
   ```

4. Update database:
   ```bash
   dotnet ef database update --project ../BusinessBuddy.Infrastructure
   ```

**✅ Kết quả mong đợi:**
- Database `BusinessBuddyDB` được tạo trong SQL Server
- Tất cả các bảng được tạo với đúng schema
- Không có lỗi trong console

### Bước 5: Chạy Application

1. Trong Visual Studio, đảm bảo **`BusinessBuddy.API`** là Startup Project:
   - Click chuột phải vào `BusinessBuddy.API` → **Set as StartUp Project**

2. Nhấn **F5** (hoặc **Ctrl + F5** để chạy không debug)

3. Trình duyệt sẽ tự động mở Swagger UI tại:
   - **HTTPS**: `https://localhost:5001/swagger`
   - **HTTP**: `http://localhost:5000/swagger`

### Bước 6: Kiểm Tra API

1. Trong Swagger UI, thử các endpoints:
   - `GET /api/products` - Lấy danh sách sản phẩm
   - `GET /api/dashboard/stats` - Lấy thống kê

2. Nếu API trả về dữ liệu (có thể rỗng), nghĩa là setup thành công! ✅

## 🔧 CẤU HÌNH FRONTEND KẾT NỐI BACKEND

### Bước 1: Cập nhật API Base URL trong Frontend

Trong frontend project, tạo file `.env` hoặc cập nhật `vite.config.ts`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
# hoặc
VITE_API_BASE_URL=https://localhost:5001/api
```

### Bước 2: Tạo API Client trong Frontend

Tạo file `src/services/api.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const apiClient = {
  async get<T>(url: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${url}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },
  
  async post<T>(url: string, data: unknown): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },
  
  // Thêm PUT, DELETE tương tự...
};
```

### Bước 3: Sử dụng trong Components

```typescript
import { apiClient } from "@/services/api";

// Trong component
const products = await apiClient.get<Product[]>("/products");
```

## 📝 PHÁT TRIỂN TIẾP THEO

### Thêm Controller Mới

1. Tạo file mới trong `BusinessBuddy.API/Controllers/`:
   ```csharp
   [ApiController]
   [Route("api/[controller]")]
   public class CustomersController : ControllerBase
   {
       private readonly ICustomerService _customerService;
       
       public CustomersController(ICustomerService customerService)
       {
           _customerService = customerService;
       }
       
       [HttpGet]
       public async Task<ActionResult<IEnumerable<CustomerDto>>> GetCustomers()
       {
           var customers = await _customerService.GetAllCustomersAsync();
           return Ok(customers);
       }
   }
   ```

2. Service sẽ được tự động inject nhờ Dependency Injection

### Thêm Service Mới

1. Tạo interface: `BusinessBuddy.Application/Services/ICustomerService.cs`
2. Tạo implementation: `BusinessBuddy.Application/Services/CustomerService.cs`
3. Đăng ký trong: `BusinessBuddy.Application/Extensions/ServiceCollectionExtensions.cs`:
   ```csharp
   services.AddScoped<ICustomerService, CustomerService>();
   ```

### Thêm Entity Mới

1. Tạo entity: `BusinessBuddy.Domain/Entities/Customer.cs`
2. Thêm DbSet vào `ApplicationDbContext`:
   ```csharp
   public DbSet<Customer> Customers { get; set; }
   ```
3. Cấu hình trong `OnModelCreating` (nếu cần)
4. Tạo migration:
   ```powershell
   Add-Migration AddCustomer -Project BusinessBuddy.Infrastructure -StartupProject BusinessBuddy.API
   ```
5. Update database:
   ```powershell
   Update-Database -Project BusinessBuddy.Infrastructure -StartupProject BusinessBuddy.API
   ```

## 🐛 XỬ LÝ LỖI THƯỜNG GẶP

### Lỗi: "Cannot open database"

**Nguyên nhân**: Connection string sai hoặc SQL Server chưa chạy

**Giải pháp**:
1. Kiểm tra SQL Server đang chạy (SQL Server Management Studio)
2. Kiểm tra lại connection string trong `appsettings.json`
3. Thử connection string với LocalDB trước

### Lỗi: "Package restore failed"

**Giuyên nhân**: NuGet packages chưa được restore

**Giải pháp**:
1. Click chuột phải vào Solution → **Restore NuGet Packages**
2. Hoặc chạy: `dotnet restore` trong terminal

### Lỗi: "Migration already exists"

**Nguyên nhân**: Migration đã được tạo trước đó

**Giải pháp**:
1. Xóa folder `Migrations` trong `BusinessBuddy.Infrastructure` (nếu cần reset)
2. Hoặc tạo migration với tên khác:
   ```powershell
   Add-Migration MigrationName2 -Project BusinessBuddy.Infrastructure -StartupProject BusinessBuddy.API
   ```

### Lỗi CORS khi gọi API từ Frontend

**Nguyên nhân**: Frontend origin chưa được thêm vào CORS config

**Giải pháp**:
1. Mở `appsettings.json`
2. Thêm origin vào `Cors:AllowedOrigins`:
   ```json
   {
     "Cors": {
       "AllowedOrigins": [
         "http://localhost:5173",
         "http://localhost:8080"
       ]
     }
   }
   ```

## 📚 TÀI NGUYÊN HỌC TẬP

- [.NET 8 Documentation](https://learn.microsoft.com/dotnet/)
- [Entity Framework Core](https://learn.microsoft.com/ef/core/)
- [ASP.NET Core Web API](https://learn.microsoft.com/aspnet/core/web-api/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

## ✅ CHECKLIST HOÀN THÀNH SETUP

- [ ] .NET SDK 8.0 đã cài đặt
- [ ] SQL Server đã cài đặt và chạy
- [ ] Solution mở được trong Visual Studio
- [ ] NuGet packages đã restore
- [ ] Connection string đã cấu hình đúng
- [ ] Migration đã tạo và database đã update
- [ ] API chạy được và Swagger UI hiển thị
- [ ] Test API thành công

---

**Chúc bạn phát triển thành công! 🚀**

