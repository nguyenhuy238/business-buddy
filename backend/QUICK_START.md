# 🚀 QUICK START GUIDE

## Các bước nhanh để chạy Backend

### 1. Mở Solution
```
Mở Visual Studio 2022 → Open → Chọn backend/BusinessBuddy.sln
```

### 2. Restore Packages
```
Visual Studio tự động restore, hoặc click chuột phải Solution → Restore NuGet Packages
```

### 3. Cấu hình Database
Mở `BusinessBuddy.API/appsettings.json`, kiểm tra connection string:
```json
"DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=BusinessBuddyDB;..."
```

### 4. Tạo Database
**Package Manager Console** (Tools → NuGet Package Manager → Package Manager Console):
```powershell
Add-Migration InitialCreate -Project BusinessBuddy.Infrastructure -StartupProject BusinessBuddy.API
Update-Database -Project BusinessBuddy.Infrastructure -StartupProject BusinessBuddy.API
```

### 5. Chạy API
```
Set BusinessBuddy.API làm Startup Project → Nhấn F5
```

### 6. Kiểm tra
```
Mở browser → https://localhost:5001/swagger
Test GET /api/products và GET /api/dashboard/stats
```

## ✅ Checklist

- [ ] Visual Studio 2022 đã cài
- [ ] .NET 8 SDK đã cài (`dotnet --version`)
- [ ] SQL Server (LocalDB) đã cài
- [ ] Solution mở được
- [ ] Packages restored
- [ ] Database migrated
- [ ] API chạy được
- [ ] Swagger hiển thị

## 📚 Tài liệu đầy đủ

- `HUONG_DAN_SETUP.md` - Hướng dẫn chi tiết
- `BACKEND_OVERVIEW.md` - Tổng quan kiến trúc
- `README.md` - Tài liệu chính

## 🆘 Gặp vấn đề?

Xem phần **Xử Lý Lỗi Thường Gặp** trong `HUONG_DAN_SETUP.md`

---

**Happy Coding! 🎉**

