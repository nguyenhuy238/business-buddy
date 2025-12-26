using BusinessBuddy.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BusinessBuddy.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Category> Categories { get; set; }
    public DbSet<UnitOfMeasure> UnitOfMeasures { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<ProductUnitConversion> ProductUnitConversions { get; set; }
    public DbSet<ComboItem> ComboItems { get; set; }
    public DbSet<Warehouse> Warehouses { get; set; }
    public DbSet<Stock> Stocks { get; set; }
    public DbSet<StockBatch> StockBatches { get; set; }
    public DbSet<StockTransaction> StockTransactions { get; set; }
    public DbSet<Customer> Customers { get; set; }
    public DbSet<Supplier> Suppliers { get; set; }
    public DbSet<SaleOrder> SaleOrders { get; set; }
    public DbSet<SaleOrderItem> SaleOrderItems { get; set; }
    public DbSet<PurchaseOrder> PurchaseOrders { get; set; }
    public DbSet<PurchaseOrderItem> PurchaseOrderItems { get; set; }
    public DbSet<CashbookEntry> CashbookEntries { get; set; }
    public DbSet<PaymentSettings> PaymentSettings { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Category
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code).IsUnique();
            entity.HasOne(e => e.Parent)
                  .WithMany(e => e.Children)
                  .HasForeignKey(e => e.ParentId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // UnitOfMeasure
        modelBuilder.Entity<UnitOfMeasure>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code).IsUnique();
        });

        // Product
        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code).IsUnique();
            entity.HasIndex(e => e.Barcode).IsUnique().HasFilter("[Barcode] IS NOT NULL");
            entity.HasOne(e => e.Category)
                  .WithMany(e => e.Products)
                  .HasForeignKey(e => e.CategoryId)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Unit)
                  .WithMany(e => e.Products)
                  .HasForeignKey(e => e.UnitId)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.BaseUnit)
                  .WithMany()
                  .HasForeignKey(e => e.BaseUnitId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // ProductUnitConversion
        modelBuilder.Entity<ProductUnitConversion>(entity =>
        {
            entity.HasKey(e => e.Id);

            // relation to Product
            entity.HasOne(e => e.Product)
                  .WithMany(e => e.UnitConversions)
                  .HasForeignKey(e => e.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);

            // explicit relations for FromUnit and ToUnit because both target UnitOfMeasure
            entity.HasOne(e => e.FromUnit)
                  .WithMany()
                  .HasForeignKey(e => e.FromUnitId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.ToUnit)
                  .WithMany()
                  .HasForeignKey(e => e.ToUnitId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // ComboItem
        modelBuilder.Entity<ComboItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.ComboProduct)
                  .WithMany(e => e.ComboItems)
                  .HasForeignKey(e => e.ComboProductId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Product)
                  .WithMany(e => e.InCombos)
                  .HasForeignKey(e => e.ProductId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Warehouse
        modelBuilder.Entity<Warehouse>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code).IsUnique();
        });

        // Stock
        modelBuilder.Entity<Stock>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.ProductId, e.WarehouseId }).IsUnique();
            entity.HasOne(e => e.Product)
                  .WithMany(e => e.Stocks)
                  .HasForeignKey(e => e.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Warehouse)
                  .WithMany(e => e.Stocks)
                  .HasForeignKey(e => e.WarehouseId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // StockBatch
        modelBuilder.Entity<StockBatch>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Product)
                  .WithMany(e => e.StockBatches)
                  .HasForeignKey(e => e.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Warehouse)
                  .WithMany()
                  .HasForeignKey(e => e.WarehouseId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // StockTransaction
        modelBuilder.Entity<StockTransaction>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Product)
                  .WithMany()
                  .HasForeignKey(e => e.ProductId)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Warehouse)
                  .WithMany(e => e.StockTransactions)
                  .HasForeignKey(e => e.WarehouseId)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Batch)
                  .WithMany(e => e.StockTransactions)
                  .HasForeignKey(e => e.BatchId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // Customer
        modelBuilder.Entity<Customer>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code).IsUnique();
            entity.HasIndex(e => e.Phone).HasFilter("[Phone] IS NOT NULL");
        });

        // Supplier
        modelBuilder.Entity<Supplier>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code).IsUnique();
        });

        // SaleOrder
        modelBuilder.Entity<SaleOrder>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code).IsUnique();
            entity.HasOne(e => e.Customer)
                  .WithMany(e => e.SaleOrders)
                  .HasForeignKey(e => e.CustomerId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // SaleOrderItem
        modelBuilder.Entity<SaleOrderItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.SaleOrder)
                  .WithMany(e => e.Items)
                  .HasForeignKey(e => e.SaleOrderId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Product)
                  .WithMany(e => e.SaleOrderItems)
                  .HasForeignKey(e => e.ProductId)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Unit)
                  .WithMany()
                  .HasForeignKey(e => e.UnitId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // PurchaseOrder
        modelBuilder.Entity<PurchaseOrder>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code).IsUnique();
            entity.HasOne(e => e.Supplier)
                  .WithMany(e => e.PurchaseOrders)
                  .HasForeignKey(e => e.SupplierId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // PurchaseOrderItem
        modelBuilder.Entity<PurchaseOrderItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.PurchaseOrder)
                  .WithMany(e => e.Items)
                  .HasForeignKey(e => e.PurchaseOrderId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Product)
                  .WithMany(e => e.PurchaseOrderItems)
                  .HasForeignKey(e => e.ProductId)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Unit)
                  .WithMany()
                  .HasForeignKey(e => e.UnitId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // CashbookEntry
        modelBuilder.Entity<CashbookEntry>(entity =>
        {
            entity.HasKey(e => e.Id);
            // Note: ReferenceType and ReferenceId are stored as strings/guids for flexibility
            // Navigation properties are optional and may need manual handling in code
        });

        // PaymentSettings
        modelBuilder.Entity<PaymentSettings>(entity =>
        {
            entity.HasKey(e => e.Id);
            // Ensure only one default per payment method
            // Note: Using filtered unique index to allow multiple non-default entries
            // The filter ensures uniqueness only when IsDefault = 1
            entity.HasIndex(e => new { e.PaymentMethod, e.IsDefault })
                  .IsUnique()
                  .HasFilter("[IsDefault] = 1");
        });
    }
}

