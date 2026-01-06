using BusinessBuddy.Application.DTOs;
using BusinessBuddy.Domain.Entities;
using BusinessBuddy.Infrastructure.Data.UnitOfWork;
using Microsoft.AspNetCore.Mvc;

namespace BusinessBuddy.API.Controllers;

/**
 * PayablesController
 * Handles all operations related to supplier payables (debt owed to suppliers)
 */
[ApiController]
[Route("api/[controller]")]
public class PayablesController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<PayablesController> _logger;

    public PayablesController(IUnitOfWork unitOfWork, ILogger<PayablesController> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    /**
     * Get all payables summary (list of suppliers with payables)
     */
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] bool? overdueOnly = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null)
    {
        try
        {
            var suppliers = await _unitOfWork.Suppliers.GetAllAsync();
            var payables = new List<PayableDto>();
            var today = DateTime.UtcNow.Date;

            foreach (var supplier in suppliers.Where(s => s.Payables > 0 || overdueOnly == true))
            {
                var payable = new PayableDto
                {
                    SupplierId = supplier.Id,
                    SupplierCode = supplier.Code,
                    SupplierName = supplier.Name,
                    SupplierPhone = supplier.Phone,
                    TotalPayables = supplier.Payables,
                    PaymentDueDate = supplier.PaymentDueDate,
                    IsOverdue = supplier.PaymentDueDate.HasValue && supplier.PaymentDueDate.Value.Date < today,
                    OverdueDays = supplier.PaymentDueDate.HasValue && supplier.PaymentDueDate.Value.Date < today
                        ? (int)(today - supplier.PaymentDueDate.Value.Date).TotalDays
                        : 0,
                    OverdueAmount = supplier.PaymentDueDate.HasValue && supplier.PaymentDueDate.Value.Date < today
                        ? supplier.Payables
                        : 0
                };

                if (overdueOnly == true && !payable.IsOverdue)
                    continue;

                payables.Add(payable);
            }

            return Ok(payables.OrderByDescending(p => p.TotalPayables));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting payables");
            return StatusCode(500, "An error occurred while retrieving payables");
        }
    }

    /**
     * Get payable transactions for a specific supplier
     */
    [HttpGet("supplier/{supplierId}/transactions")]
    public async Task<IActionResult> GetSupplierTransactions(
        Guid supplierId,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null)
    {
        try
        {
            var supplier = await _unitOfWork.Suppliers.GetByIdAsync(supplierId);
            if (supplier == null) return NotFound("Supplier not found");

            var transactions = await _unitOfWork.PayableTransactions.GetAllAsync();
            var query = transactions
                .Where(t => t.SupplierId == supplierId)
                .AsQueryable();

            if (from.HasValue)
                query = query.Where(t => t.TransactionDate >= from.Value);
            if (to.HasValue)
                query = query.Where(t => t.TransactionDate <= to.Value);

            var transactionDtos = new List<PayableTransactionDto>();
            foreach (var transaction in query.OrderByDescending(t => t.TransactionDate))
            {
                string? referenceCode = null;
                if (transaction.ReferenceType == "PurchaseOrder" && transaction.ReferenceId.HasValue)
                {
                    var purchaseOrder = await _unitOfWork.PurchaseOrders.GetByIdAsync(transaction.ReferenceId.Value);
                    referenceCode = purchaseOrder?.Code;
                }

                transactionDtos.Add(new PayableTransactionDto
                {
                    Id = transaction.Id,
                    SupplierId = transaction.SupplierId,
                    SupplierName = supplier.Name,
                    Type = transaction.Type.ToString(),
                    Amount = transaction.Amount,
                    BalanceBefore = transaction.BalanceBefore,
                    BalanceAfter = transaction.BalanceAfter,
                    Description = transaction.Description,
                    PaymentMethod = transaction.PaymentMethod.ToString(),
                    DueDate = transaction.DueDate,
                    TransactionDate = transaction.TransactionDate,
                    ReferenceType = transaction.ReferenceType,
                    ReferenceId = transaction.ReferenceId,
                    ReferenceCode = referenceCode,
                    CreatedBy = transaction.CreatedBy,
                    CreatedAt = transaction.CreatedAt
                });
            }

            return Ok(transactionDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting supplier transactions");
            return StatusCode(500, "An error occurred while retrieving transactions");
        }
    }

    /**
     * Create a payment (pay payables)
     */
    [HttpPost("payment")]
    public async Task<IActionResult> CreatePayment([FromBody] CreatePayablePaymentDto dto)
    {
        try
        {
            if (dto == null || dto.Amount <= 0)
                return BadRequest("Invalid payment amount");

            var supplier = await _unitOfWork.Suppliers.GetByIdAsync(dto.SupplierId);
            if (supplier == null)
                return NotFound("Supplier not found");

            if (dto.Amount > supplier.Payables)
                return BadRequest("Payment amount exceeds payables");

            var balanceBefore = supplier.Payables;
            var balanceAfter = balanceBefore - dto.Amount;

            // Create transaction
            var transaction = new PayableTransaction
            {
                SupplierId = dto.SupplierId,
                Type = PayableTransactionType.Payment,
                Amount = dto.Amount,
                BalanceBefore = balanceBefore,
                BalanceAfter = balanceAfter,
                Description = string.IsNullOrWhiteSpace(dto.Description)
                    ? $"Trả tiền công nợ cho {supplier.Name}"
                    : dto.Description,
                PaymentMethod = dto.PaymentMethod,
                TransactionDate = dto.TransactionDate,
                CreatedBy = dto.CreatedBy,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _unitOfWork.PayableTransactions.AddAsync(transaction);

            // Update supplier payables
            supplier.Payables = balanceAfter;
            if (supplier.Payables == 0)
                supplier.PaymentDueDate = null;
            supplier.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.Suppliers.UpdateAsync(supplier);

            // Create cashbook entry
            var cashbookEntry = new CashbookEntry
            {
                Type = CashbookEntryType.Expense,
                Category = "Trả công nợ",
                Amount = dto.Amount,
                Description = transaction.Description,
                PaymentMethod = dto.PaymentMethod,
                ReferenceType = "PayableTransaction",
                ReferenceId = transaction.Id,
                TransactionDate = dto.TransactionDate,
                CreatedBy = dto.CreatedBy,
                CreatedAt = DateTime.UtcNow
            };
            await _unitOfWork.CashbookEntries.AddAsync(cashbookEntry);

            await _unitOfWork.SaveChangesAsync();

            return Ok(new { message = "Payment recorded successfully", transaction });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating payment");
            return StatusCode(500, "An error occurred while creating payment");
        }
    }

    /**
     * Create an adjustment to payables
     */
    [HttpPost("adjustment")]
    public async Task<IActionResult> CreateAdjustment([FromBody] CreatePayableAdjustmentDto dto)
    {
        try
        {
            if (dto == null)
                return BadRequest("Invalid adjustment data");

            var supplier = await _unitOfWork.Suppliers.GetByIdAsync(dto.SupplierId);
            if (supplier == null)
                return NotFound("Supplier not found");

            var balanceBefore = supplier.Payables;
            var balanceAfter = balanceBefore + dto.Amount;

            if (balanceAfter < 0)
                return BadRequest("Adjustment would result in negative payables");

            // Create transaction
            var transaction = new PayableTransaction
            {
                SupplierId = dto.SupplierId,
                Type = PayableTransactionType.Adjustment,
                Amount = dto.Amount,
                BalanceBefore = balanceBefore,
                BalanceAfter = balanceAfter,
                Description = string.IsNullOrWhiteSpace(dto.Description)
                    ? $"Điều chỉnh công nợ cho {supplier.Name}"
                    : dto.Description,
                TransactionDate = dto.TransactionDate,
                CreatedBy = dto.CreatedBy,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _unitOfWork.PayableTransactions.AddAsync(transaction);

            // Update supplier payables
            supplier.Payables = balanceAfter;
            if (supplier.Payables == 0)
                supplier.PaymentDueDate = null;
            supplier.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.Suppliers.UpdateAsync(supplier);

            await _unitOfWork.SaveChangesAsync();

            return Ok(new { message = "Adjustment recorded successfully", transaction });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating adjustment");
            return StatusCode(500, "An error occurred while creating adjustment");
        }
    }

    /**
     * Get payable statistics
     */
    [HttpGet("statistics")]
    public async Task<IActionResult> GetStatistics()
    {
        try
        {
            var suppliers = await _unitOfWork.Suppliers.GetAllAsync();
            var today = DateTime.UtcNow.Date;

            var totalPayables = suppliers.Sum(s => s.Payables);
            var overduePayables = suppliers
                .Where(s => s.PaymentDueDate.HasValue && s.PaymentDueDate.Value.Date < today)
                .Sum(s => s.Payables);
            var overdueCount = suppliers
                .Count(s => s.PaymentDueDate.HasValue && s.PaymentDueDate.Value.Date < today && s.Payables > 0);
            var totalSuppliersWithPayables = suppliers.Count(s => s.Payables > 0);

            return Ok(new
            {
                totalPayables,
                overduePayables,
                overdueCount,
                totalSuppliersWithPayables,
                currentPayables = totalPayables - overduePayables
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting statistics");
            return StatusCode(500, "An error occurred while retrieving statistics");
        }
    }
}

