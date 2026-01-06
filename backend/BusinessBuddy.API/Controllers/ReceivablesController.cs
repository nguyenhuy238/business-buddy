using BusinessBuddy.Application.DTOs;
using BusinessBuddy.Domain.Entities;
using BusinessBuddy.Infrastructure.Data.UnitOfWork;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BusinessBuddy.API.Controllers;

/**
 * ReceivablesController
 * Handles all operations related to customer receivables (debt owed by customers)
 */
[ApiController]
[Route("api/[controller]")]
public class ReceivablesController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<ReceivablesController> _logger;

    public ReceivablesController(IUnitOfWork unitOfWork, ILogger<ReceivablesController> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    /**
     * Get all receivables summary (list of customers with receivables)
     */
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] bool? overdueOnly = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null)
    {
        try
        {
            var customers = await _unitOfWork.Customers.GetAllAsync();
            var receivables = new List<ReceivableDto>();
            var today = DateTime.UtcNow.Date;

            foreach (var customer in customers.Where(c => c.Receivables > 0 || overdueOnly == true))
            {
                var receivable = new ReceivableDto
                {
                    CustomerId = customer.Id,
                    CustomerCode = customer.Code,
                    CustomerName = customer.Name,
                    CustomerPhone = customer.Phone,
                    TotalReceivables = customer.Receivables,
                    PaymentDueDate = customer.PaymentDueDate,
                    IsOverdue = customer.PaymentDueDate.HasValue && customer.PaymentDueDate.Value.Date < today,
                    OverdueDays = customer.PaymentDueDate.HasValue && customer.PaymentDueDate.Value.Date < today
                        ? (int)(today - customer.PaymentDueDate.Value.Date).TotalDays
                        : 0,
                    OverdueAmount = customer.PaymentDueDate.HasValue && customer.PaymentDueDate.Value.Date < today
                        ? customer.Receivables
                        : 0
                };

                if (overdueOnly == true && !receivable.IsOverdue)
                    continue;

                receivables.Add(receivable);
            }

            return Ok(receivables.OrderByDescending(r => r.TotalReceivables));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting receivables");
            return StatusCode(500, "An error occurred while retrieving receivables");
        }
    }

    /**
     * Get receivable transactions for a specific customer
     */
    [HttpGet("customer/{customerId}/transactions")]
    public async Task<IActionResult> GetCustomerTransactions(
        Guid customerId,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null)
    {
        try
        {
            var customer = await _unitOfWork.Customers.GetByIdAsync(customerId);
            if (customer == null) return NotFound("Customer not found");

            var transactions = await _unitOfWork.ReceivableTransactions.GetAllAsync();
            var query = transactions
                .Where(t => t.CustomerId == customerId)
                .AsQueryable();

            if (from.HasValue)
                query = query.Where(t => t.TransactionDate >= from.Value);
            if (to.HasValue)
                query = query.Where(t => t.TransactionDate <= to.Value);

            var transactionDtos = new List<ReceivableTransactionDto>();
            foreach (var transaction in query.OrderByDescending(t => t.TransactionDate))
            {
                string? referenceCode = null;
                if (transaction.ReferenceType == "SaleOrder" && transaction.ReferenceId.HasValue)
                {
                    var saleOrder = await _unitOfWork.SaleOrders.GetByIdAsync(transaction.ReferenceId.Value);
                    referenceCode = saleOrder?.Code;
                }

                transactionDtos.Add(new ReceivableTransactionDto
                {
                    Id = transaction.Id,
                    CustomerId = transaction.CustomerId,
                    CustomerName = customer.Name,
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
            _logger.LogError(ex, "Error getting customer transactions");
            return StatusCode(500, "An error occurred while retrieving transactions");
        }
    }

    /**
     * Create a payment (collect receivables)
     */
    [HttpPost("payment")]
    public async Task<IActionResult> CreatePayment([FromBody] CreateReceivablePaymentDto dto)
    {
        try
        {
            if (dto == null || dto.Amount <= 0)
                return BadRequest("Invalid payment amount");

            var customer = await _unitOfWork.Customers.GetByIdAsync(dto.CustomerId);
            if (customer == null)
                return NotFound("Customer not found");

            if (dto.Amount > customer.Receivables)
                return BadRequest("Payment amount exceeds receivables");

            var balanceBefore = customer.Receivables;
            var balanceAfter = balanceBefore - dto.Amount;

            // Create transaction
            var transaction = new ReceivableTransaction
            {
                CustomerId = dto.CustomerId,
                Type = ReceivableTransactionType.Payment,
                Amount = dto.Amount,
                BalanceBefore = balanceBefore,
                BalanceAfter = balanceAfter,
                Description = string.IsNullOrWhiteSpace(dto.Description)
                    ? $"Thu tiền công nợ từ {customer.Name}"
                    : dto.Description,
                PaymentMethod = dto.PaymentMethod,
                TransactionDate = dto.TransactionDate,
                CreatedBy = dto.CreatedBy,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _unitOfWork.ReceivableTransactions.AddAsync(transaction);

            // Update customer receivables
            customer.Receivables = balanceAfter;
            if (customer.Receivables == 0)
                customer.PaymentDueDate = null;
            customer.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.Customers.UpdateAsync(customer);

            // Create cashbook entry
            var cashbookEntry = new CashbookEntry
            {
                Type = CashbookEntryType.Income,
                Category = "Thu công nợ",
                Amount = dto.Amount,
                Description = transaction.Description,
                PaymentMethod = dto.PaymentMethod,
                ReferenceType = "ReceivableTransaction",
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
     * Create an adjustment to receivables
     */
    [HttpPost("adjustment")]
    public async Task<IActionResult> CreateAdjustment([FromBody] CreateReceivableAdjustmentDto dto)
    {
        try
        {
            if (dto == null)
                return BadRequest("Invalid adjustment data");

            var customer = await _unitOfWork.Customers.GetByIdAsync(dto.CustomerId);
            if (customer == null)
                return NotFound("Customer not found");

            var balanceBefore = customer.Receivables;
            var balanceAfter = balanceBefore + dto.Amount;

            if (balanceAfter < 0)
                return BadRequest("Adjustment would result in negative receivables");

            // Create transaction
            var transaction = new ReceivableTransaction
            {
                CustomerId = dto.CustomerId,
                Type = ReceivableTransactionType.Adjustment,
                Amount = dto.Amount,
                BalanceBefore = balanceBefore,
                BalanceAfter = balanceAfter,
                Description = string.IsNullOrWhiteSpace(dto.Description)
                    ? $"Điều chỉnh công nợ cho {customer.Name}"
                    : dto.Description,
                TransactionDate = dto.TransactionDate,
                CreatedBy = dto.CreatedBy,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _unitOfWork.ReceivableTransactions.AddAsync(transaction);

            // Update customer receivables
            customer.Receivables = balanceAfter;
            if (customer.Receivables == 0)
                customer.PaymentDueDate = null;
            customer.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.Customers.UpdateAsync(customer);

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
     * Get receivable statistics
     */
    [HttpGet("statistics")]
    public async Task<IActionResult> GetStatistics()
    {
        try
        {
            var customers = await _unitOfWork.Customers.GetAllAsync();
            var today = DateTime.UtcNow.Date;

            var totalReceivables = customers.Sum(c => c.Receivables);
            var overdueReceivables = customers
                .Where(c => c.PaymentDueDate.HasValue && c.PaymentDueDate.Value.Date < today)
                .Sum(c => c.Receivables);
            var overdueCount = customers
                .Count(c => c.PaymentDueDate.HasValue && c.PaymentDueDate.Value.Date < today && c.Receivables > 0);
            var totalCustomersWithReceivables = customers.Count(c => c.Receivables > 0);

            return Ok(new
            {
                totalReceivables,
                overdueReceivables,
                overdueCount,
                totalCustomersWithReceivables,
                currentReceivables = totalReceivables - overdueReceivables
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting statistics");
            return StatusCode(500, "An error occurred while retrieving statistics");
        }
    }
}

