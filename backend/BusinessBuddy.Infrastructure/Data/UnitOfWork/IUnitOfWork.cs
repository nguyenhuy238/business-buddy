using BusinessBuddy.Infrastructure.Data.Repositories;
using BusinessBuddy.Domain.Entities;

namespace BusinessBuddy.Infrastructure.Data.UnitOfWork;

public interface IUnitOfWork : IDisposable
{
    IRepository<Category> Categories { get; }
    IRepository<UnitOfMeasure> UnitOfMeasures { get; }
    IRepository<Product> Products { get; }
    IRepository<Warehouse> Warehouses { get; }
    IRepository<Stock> Stocks { get; }
    IRepository<StockBatch> StockBatches { get; }
    IRepository<StockTransaction> StockTransactions { get; }
    IRepository<Customer> Customers { get; }
    IRepository<Supplier> Suppliers { get; }
    IRepository<SaleOrder> SaleOrders { get; }
    IRepository<SaleOrderItem> SaleOrderItems { get; }
    IRepository<PurchaseOrder> PurchaseOrders { get; }
    IRepository<PurchaseOrderItem> PurchaseOrderItems { get; }
    IRepository<CashbookEntry> CashbookEntries { get; }
    IRepository<PaymentSettings> PaymentSettings { get; }
    IRepository<ReceivableTransaction> ReceivableTransactions { get; }
    IRepository<PayableTransaction> PayableTransactions { get; }
    IRepository<ReturnOrder> ReturnOrders { get; }
    IRepository<ReturnOrderItem> ReturnOrderItems { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

