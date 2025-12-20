# Business Buddy Backend API

Hệ thống quản lý kinh doanh hộ gia đình (HKD) - Backend API được xây dựng bằng .NET 8.0 với Clean Architecture.

## 📋 Mục Lục

- [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
- [Cấu Trúc Dự Án](#cấu-trúc-dự-án)
- [Cài Đặt và Chạy](#cài-đặt-và-chạy)
- [Database Setup](#database-setup)
- [API Endpoints](#api-endpoints)
- [Kiến Trúc](#kiến-trúc)
- [Phát Triển Tiếp](#phát-triển-tiếp)

## 🖥️ Yêu Cầu Hệ Thống

- **.NET SDK 8.0** trở lên
- **SQL Server** (LocalDB hoặc SQL Server Express/Standard)
- **Visual Studio 2022** hoặc **Visual Studio Code** với C# extension
- **Git** (nếu cần clone repository)

## 📁 Cấu Trúc Dự Án

Dự án sử dụng Clean Architecture với 4 layers:

```
backend/
├── BusinessBuddy.API/              # Web API layer (Controllers, Program.cs)
├── BusinessBuddy.Application/      # Application layer (DTOs, Services, Mappings)
├── BusinessBuddy.Domain/           # Domain layer (Entities, Enums)
├── BusinessBuddy.Infrastructure/   # Infrastructure layer (DbContext, Repositories)
└── BusinessBuddy.sln               # Solution file
```

### Chi Tiết Các Layer:

- **API**: Chứa Controllers, middleware, configuration
- **Application**: Business logic, DTOs, Services, AutoMapper profiles
- **Domain**: Domain entities, enums, domain interfaces
- **Infrastructure**: Entity Framework, Repositories, Unit of Work pattern

## 🚀 Cài Đặt và Chạy

### Bước 1: Mở Solution trong Visual Studio

1. Mở **Visual Studio 2022**
2. File → Open → Project/Solution
3. Chọn file `backend/BusinessBuddy.sln`

### Bước 2: Restore NuGet Packages

Visual Studio sẽ tự động restore packages khi mở solution. Nếu không:

- Click chuột phải vào Solution → **Restore NuGet Packages**
- Hoặc chạy lệnh trong Package Manager Console: `dotnet restore`

### Bước 3: Cấu Hình Connection String

Mở file `BusinessBuddy.API/appsettings.json` và chỉnh sửa connection string:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=BusinessBuddyDB;Trusted_Connection=true;MultipleActiveResultSets=true;TrustServerCertificate=true"
  }
}
```

**Lưu ý**: 
- Đối với SQL Server Express: `Server=.\\SQLEXPRESS;Database=BusinessBuddyDB;...`
- Đối với SQL Server: `Server=localhost;Database=BusinessBuddyDB;User Id=sa;Password=YourPassword;...`

### Bước 4: Tạo và Migrate Database

Có 2 cách:

#### Cách 1: Sử dụng Package Manager Console (Visual Studio)

1. Mở **Package Manager Console**
2. Set Default Project: `BusinessBuddy.Infrastructure`
3. Chạy các lệnh:

```powershell
# Tạo migration đầu tiên
Add-Migration InitialCreate -Project BusinessBuddy.Infrastructure -StartupProject BusinessBuddy.API

# Cập nhật database
Update-Database -Project BusinessBuddy.Infrastructure -StartupProject BusinessBuddy.API
```

#### Cách 2: Sử dụng .NET CLI (Terminal)

```bash
cd backend/BusinessBuddy.API

# Tạo migration
dotnet ef migrations add InitialCreate --project ../BusinessBuddy.Infrastructure

# Cập nhật database
dotnet ef database update --project ../BusinessBuddy.Infrastructure
```

### Bước 5: Chạy Application

1. Set `BusinessBuddy.API` làm **Startup Project** (click chuột phải → Set as StartUp Project)
2. Nhấn **F5** hoặc **Ctrl + F5** để chạy
3. API sẽ chạy tại: `https://localhost:5001` hoặc `http://localhost:5000`
4. Swagger UI: `https://localhost:5001/swagger`

## 🗄️ Database Setup

### Schema Overview

Database được tự động tạo khi chạy migrations. Các bảng chính:

- **Categories**: Danh mục sản phẩm
- **Products**: Sản phẩm
- **UnitOfMeasures**: Đơn vị tính
- **Warehouses**: Kho hàng
- **Stocks**: Tồn kho
- **StockBatches**: Lô hàng (FIFO)
- **StockTransactions**: Giao dịch tồn kho
- **Customers**: Khách hàng
- **Suppliers**: Nhà cung cấp
- **SaleOrders**: Đơn hàng bán
- **SaleOrderItems**: Chi tiết đơn hàng bán
- **PurchaseOrders**: Đơn hàng mua
- **PurchaseOrderItems**: Chi tiết đơn hàng mua
- **CashbookEntries**: Sổ quỹ

### Seeding Data (Optional)

Bạn có thể tạo file seed data trong `BusinessBuddy.Infrastructure/Data/SeedData.cs` để thêm dữ liệu mẫu.

## 📡 API Endpoints

### Products

- `GET /api/products` - Lấy danh sách sản phẩm
- `GET /api/products/{id}` - Lấy sản phẩm theo ID
- `GET /api/products/code/{code}` - Lấy sản phẩm theo mã
- `GET /api/products/barcode/{barcode}` - Lấy sản phẩm theo barcode
- `POST /api/products` - Tạo sản phẩm mới
- `PUT /api/products/{id}` - Cập nhật sản phẩm
- `DELETE /api/products/{id}` - Xóa sản phẩm

### Dashboard

- `GET /api/dashboard/stats` - Thống kê tổng quan
- `GET /api/dashboard/revenue-by-category` - Doanh thu theo danh mục
- `GET /api/dashboard/revenue-by-time` - Doanh thu theo thời gian

### Xem Full API Documentation

Truy cập Swagger UI khi chạy ứng dụng: `https://localhost:5001/swagger`

## 🏗️ Kiến Trúc

### Clean Architecture Pattern

```
┌─────────────────────────────────────┐
│         API (Controllers)           │  ← HTTP Requests/Responses
├─────────────────────────────────────┤
│      Application (Services)         │  ← Business Logic
├─────────────────────────────────────┤
│      Domain (Entities)              │  ← Core Business Rules
├─────────────────────────────────────┤
│   Infrastructure (DbContext)        │  ← Data Access
└─────────────────────────────────────┘
```

### Repository Pattern & Unit of Work

- **IRepository<T>**: Generic repository interface
- **Repository<T>**: Generic repository implementation
- **IUnitOfWork**: Unit of Work pattern để quản lý transactions

### Dependency Injection

Tất cả services được đăng ký trong:
- `BusinessBuddy.Application/Extensions/ServiceCollectionExtensions.cs`
- `BusinessBuddy.Infrastructure/Extensions/ServiceCollectionExtensions.cs`

## 🔧 Phát Triển Tiếp

### Thêm Controller Mới

1. Tạo Controller trong `BusinessBuddy.API/Controllers/`
2. Inject service từ Application layer
3. Implement các action methods

**Ví dụ:**

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

### Thêm Service Mới

1. Tạo interface trong `BusinessBuddy.Application/Services/I{ServiceName}Service.cs`
2. Tạo implementation trong `BusinessBuddy.Application/Services/{ServiceName}Service.cs`
3. Đăng ký service trong `ServiceCollectionExtensions.cs`

### Thêm Entity Mới

1. Tạo entity trong `BusinessBuddy.Domain/Entities/`
2. Thêm DbSet vào `ApplicationDbContext`
3. Cấu hình relationship trong `OnModelCreating`
4. Tạo migration: `Add-Migration Add{EntityName} -Project BusinessBuddy.Infrastructure`
5. Update database: `Update-Database -Project BusinessBuddy.Infrastructure`

### CORS Configuration

CORS đã được cấu hình trong `Program.cs` để cho phép frontend kết nối. Nếu cần thêm origin:

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

## 📝 Notes

- Tất cả datetime được lưu dưới dạng UTC trong database
- Entity IDs sử dụng `Guid`
- Entity Framework Core tracking được sử dụng cho queries
- Logging sử dụng Serilog (có thể cấu hình trong appsettings.json)

## 🐛 Troubleshooting

### Lỗi Connection String

- Kiểm tra SQL Server đang chạy
- Kiểm tra connection string đúng format
- Đảm bảo có quyền truy cập database

### Lỗi Migration

- Xóa folder `Migrations` nếu cần reset
- Chạy lại `Add-Migration InitialCreate`
- Kiểm tra các entities có navigation properties đúng không

### Lỗi CORS

- Kiểm tra `appsettings.json` có đúng origins không
- Đảm bảo frontend đang chạy trên port đã cấu hình

## 📚 Tài Liệu Tham Khảo

- [.NET 8 Documentation](https://docs.microsoft.com/dotnet/)
- [Entity Framework Core](https://docs.microsoft.com/ef/core/)
- [ASP.NET Core Web API](https://docs.microsoft.com/aspnet/core/web-api/)
- [AutoMapper](https://docs.automapper.org/)

---

**Phát triển bởi**: Business Buddy Team  
**Version**: 1.0.0

