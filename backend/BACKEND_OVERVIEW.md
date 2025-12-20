# TỔNG QUAN BACKEND - BUSINESS BUDDY

## 🏗️ KIẾN TRÚC HỆ THỐNG

Backend được xây dựng theo **Clean Architecture** với 4 layers chính:

```
┌─────────────────────────────────────────┐
│  BusinessBuddy.API                      │  ← Presentation Layer
│  - Controllers                          │
│  - Middleware                           │
│  - Configuration                        │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│  BusinessBuddy.Application              │  ← Application Layer
│  - DTOs                                 │
│  - Services (Business Logic)            │
│  - AutoMapper Profiles                  │
│  - Interfaces                           │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│  BusinessBuddy.Domain                   │  ← Domain Layer
│  - Entities                             │
│  - Enums                                │
│  - Domain Rules                         │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│  BusinessBuddy.Infrastructure           │  ← Infrastructure Layer
│  - DbContext                            │
│  - Repositories                         │
│  - Unit of Work                         │
│  - External Services                    │
└─────────────────────────────────────────┘
```

## 📦 CÁC PROJECT VÀ CHỨC NĂNG

### 1. BusinessBuddy.Domain
**Chức năng**: Chứa domain entities và business rules

**Entities chính**:
- `Product` - Sản phẩm
- `Category` - Danh mục sản phẩm
- `UnitOfMeasure` - Đơn vị tính
- `Warehouse` - Kho hàng
- `Stock` - Tồn kho
- `StockBatch` - Lô hàng (cho FIFO)
- `StockTransaction` - Giao dịch tồn kho
- `Customer` - Khách hàng
- `Supplier` - Nhà cung cấp
- `SaleOrder` - Đơn hàng bán
- `SaleOrderItem` - Chi tiết đơn hàng bán
- `PurchaseOrder` - Đơn hàng mua
- `PurchaseOrderItem` - Chi tiết đơn hàng mua
- `CashbookEntry` - Sổ quỹ (Thu/Chi)
- `ComboItem` - Item trong combo/bundle

### 2. BusinessBuddy.Infrastructure
**Chức năng**: Data access layer

**Các thành phần**:
- `ApplicationDbContext` - EF Core DbContext
- `Repository<T>` - Generic repository pattern
- `IUnitOfWork` - Unit of Work pattern
- Entity configurations

### 3. BusinessBuddy.Application
**Chức năng**: Business logic layer

**Các thành phần**:
- **DTOs**: Data Transfer Objects cho API
- **Services**: Business logic services
- **Mapping**: AutoMapper profiles
- **Interfaces**: Service interfaces

**Services hiện có**:
- `IProductService` / `ProductService` - Quản lý sản phẩm
- `IDashboardService` / `DashboardService` - Thống kê dashboard

### 4. BusinessBuddy.API
**Chức năng**: Web API presentation layer

**Các thành phần**:
- **Controllers**: API endpoints
- **Program.cs**: Application startup và configuration
- **appsettings.json**: Configuration files
- **Middleware**: CORS, error handling

**Controllers hiện có**:
- `ProductsController` - CRUD sản phẩm
- `DashboardController` - Thống kê và báo cáo

## 🔄 DATA FLOW

```
Frontend Request
    ↓
API Controller
    ↓
Application Service (Business Logic)
    ↓
Repository (Unit of Work)
    ↓
Entity Framework Core
    ↓
SQL Server Database
```

## 📊 DATABASE SCHEMA

### Core Entities

```
Category (1) ──→ (*) Product
UnitOfMeasure (1) ──→ (*) Product
Warehouse (1) ──→ (*) Stock ──→ (1) Product
Product (1) ──→ (*) StockBatch
Product (1) ──→ (*) ComboItem
Customer (1) ──→ (*) SaleOrder
SaleOrder (1) ──→ (*) SaleOrderItem ──→ (1) Product
Supplier (1) ──→ (*) PurchaseOrder
PurchaseOrder (1) ──→ (*) PurchaseOrderItem ──→ (1) Product
```

### Key Relationships

- **Product ↔ Category**: Many-to-One
- **Product ↔ UnitOfMeasure**: Many-to-One (và BaseUnit)
- **Product ↔ Stock**: One-to-Many (qua Warehouse)
- **SaleOrder ↔ Customer**: Many-to-One (nullable)
- **SaleOrder ↔ SaleOrderItem**: One-to-Many
- **PurchaseOrder ↔ Supplier**: Many-to-One

## 🔐 SECURITY & BEST PRACTICES

### Hiện tại:
- ✅ CORS configuration cho frontend
- ✅ Input validation trong DTOs
- ✅ Error handling trong controllers
- ✅ Logging với Serilog

### Cần thêm (Phase 2):
- ⚠️ Authentication & Authorization (JWT)
- ⚠️ API versioning
- ⚠️ Rate limiting
- ⚠️ Request validation (FluentValidation)
- ⚠️ API documentation (Swagger improvements)

## 🚀 MỞ RỘNG HỆ THỐNG

### Thêm chức năng mới - Ví dụ: Thêm Customer Service

**Bước 1**: Tạo DTOs
```csharp
// BusinessBuddy.Application/DTOs/CustomerDto.cs
public class CustomerDto { ... }
public class CreateCustomerDto { ... }
```

**Bước 2**: Tạo Service Interface
```csharp
// BusinessBuddy.Application/Services/ICustomerService.cs
public interface ICustomerService {
    Task<IEnumerable<CustomerDto>> GetAllCustomersAsync();
    ...
}
```

**Bước 3**: Implement Service
```csharp
// BusinessBuddy.Application/Services/CustomerService.cs
public class CustomerService : ICustomerService {
    private readonly IUnitOfWork _unitOfWork;
    ...
}
```

**Bước 4**: Đăng ký Service
```csharp
// BusinessBuddy.Application/Extensions/ServiceCollectionExtensions.cs
services.AddScoped<ICustomerService, CustomerService>();
```

**Bước 5**: Tạo Controller
```csharp
// BusinessBuddy.API/Controllers/CustomersController.cs
[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase {
    private readonly ICustomerService _customerService;
    ...
}
```

## 📈 PERFORMANCE CONSIDERATIONS

### Hiện tại:
- ✅ Async/await pattern
- ✅ Entity Framework Core tracking
- ✅ Indexed database columns (Code, Barcode)

### Cải thiện (Phase 2):
- ⚠️ Caching (Redis/Memory Cache)
- ⚠️ Pagination cho list endpoints
- ⚠️ Lazy loading configuration
- ⚠️ Query optimization
- ⚠️ Database indexing strategy

## 🧪 TESTING (Phase 2)

Cần thêm:
- Unit tests cho Services
- Integration tests cho Controllers
- Repository tests
- Database tests

## 📝 CODING STANDARDS

- **Naming**: PascalCase cho classes, camelCase cho properties
- **Async Methods**: Tất cả I/O operations đều async
- **Error Handling**: Try-catch trong controllers, throw exceptions trong services
- **Dependencies**: Dependency Injection cho tất cả services
- **Comments**: XML comments cho public APIs (cần thêm)

## 🔗 API DOCUMENTATION

Swagger UI tự động được generate tại `/swagger` khi chạy application.

**Cải thiện**: Thêm XML comments và Swagger annotations cho better documentation.

---

**Version**: 1.0.0  
**Last Updated**: 2024

