using BusinessBuddy.Domain.Entities;
using BusinessBuddy.Infrastructure.Data.Repositories;

namespace BusinessBuddy.Infrastructure.Data.UnitOfWork;

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    private bool _disposed = false;

    private IRepository<Category>? _categories;
    private IRepository<UnitOfMeasure>? _unitOfMeasures;
    private IRepository<Product>? _products;
    private IRepository<Warehouse>? _warehouses;
    private IRepository<Stock>? _stocks;
    private IRepository<StockBatch>? _stockBatches;
    private IRepository<StockTransaction>? _stockTransactions;
    private IRepository<Customer>? _customers;
    private IRepository<Supplier>? _suppliers;
    private IRepository<SaleOrder>? _saleOrders;
    private IRepository<SaleOrderItem>? _saleOrderItems;
    private IRepository<PurchaseOrder>? _purchaseOrders;
    private IRepository<PurchaseOrderItem>? _purchaseOrderItems;
    private IRepository<CashbookEntry>? _cashbookEntries;
    private IRepository<PaymentSettings>? _paymentSettings;

    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context;
    }

    public IRepository<Category> Categories =>
        _categories ??= new Repository<Category>(_context);

    public IRepository<UnitOfMeasure> UnitOfMeasures =>
        _unitOfMeasures ??= new Repository<UnitOfMeasure>(_context);

    public IRepository<Product> Products =>
        _products ??= new Repository<Product>(_context);

    public IRepository<Warehouse> Warehouses =>
        _warehouses ??= new Repository<Warehouse>(_context);

    public IRepository<Stock> Stocks =>
        _stocks ??= new Repository<Stock>(_context);

    public IRepository<StockBatch> StockBatches =>
        _stockBatches ??= new Repository<StockBatch>(_context);

    public IRepository<StockTransaction> StockTransactions =>
        _stockTransactions ??= new Repository<StockTransaction>(_context);

    public IRepository<Customer> Customers =>
        _customers ??= new Repository<Customer>(_context);

    public IRepository<Supplier> Suppliers =>
        _suppliers ??= new Repository<Supplier>(_context);

    public IRepository<SaleOrder> SaleOrders =>
        _saleOrders ??= new Repository<SaleOrder>(_context);

    public IRepository<SaleOrderItem> SaleOrderItems =>
        _saleOrderItems ??= new Repository<SaleOrderItem>(_context);

    public IRepository<PurchaseOrder> PurchaseOrders =>
        _purchaseOrders ??= new Repository<PurchaseOrder>(_context);

    public IRepository<PurchaseOrderItem> PurchaseOrderItems =>
        _purchaseOrderItems ??= new Repository<PurchaseOrderItem>(_context);

    public IRepository<CashbookEntry> CashbookEntries =>
        _cashbookEntries ??= new Repository<CashbookEntry>(_context);

    public IRepository<PaymentSettings> PaymentSettings =>
        _paymentSettings ??= new Repository<PaymentSettings>(_context);

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (!_disposed && disposing)
        {
            _context.Dispose();
        }
        _disposed = true;
    }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }
}

