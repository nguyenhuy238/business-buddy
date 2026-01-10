using AutoMapper;
using BusinessBuddy.Application.DTOs;
using BusinessBuddy.Domain.Entities;
using BusinessBuddy.Infrastructure.Data.UnitOfWork;
using Microsoft.EntityFrameworkCore;

namespace BusinessBuddy.Application.Services;

/**
 * Service for cashbook operations
 * Handles business logic for cashbook entries
 */
public class CashbookService : ICashbookService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public CashbookService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    /**
     * Get all cashbook entries with optional date filters
     */
    public async Task<IEnumerable<CashbookEntryDto>> GetAllEntriesAsync(DateTime? from = null, DateTime? to = null)
    {
        var entries = await _unitOfWork.CashbookEntries.GetAllAsync();
        var query = entries.AsQueryable();

        // Apply date filters
        if (from.HasValue)
        {
            query = query.Where(e => e.TransactionDate >= from.Value);
        }
        if (to.HasValue)
        {
            query = query.Where(e => e.TransactionDate <= to.Value.AddDays(1).AddTicks(-1)); // Include entire end date
        }

        // Order by transaction date descending
        var orderedEntries = query.OrderByDescending(e => e.TransactionDate).ToList();

        return orderedEntries.Select(e => _mapper.Map<CashbookEntryDto>(e));
    }

    /**
     * Get a cashbook entry by ID
     */
    public async Task<CashbookEntryDto?> GetEntryByIdAsync(Guid id)
    {
        var entry = await _unitOfWork.CashbookEntries.GetByIdAsync(id);
        if (entry == null) return null;

        return _mapper.Map<CashbookEntryDto>(entry);
    }

    /**
     * Create a new cashbook entry
     */
    public async Task<CashbookEntryDto> CreateEntryAsync(CreateCashbookEntryDto dto)
    {
        // Validate DTO
        ValidateCreateDto(dto);

        // Map to entity
        var entry = _mapper.Map<CashbookEntry>(dto);
        entry.Id = Guid.NewGuid();
        entry.CreatedAt = DateTime.UtcNow;

        // Save to database
        await _unitOfWork.CashbookEntries.AddAsync(entry);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<CashbookEntryDto>(entry);
    }

    /**
     * Update an existing cashbook entry
     */
    public async Task<CashbookEntryDto?> UpdateEntryAsync(Guid id, UpdateCashbookEntryDto dto)
    {
        var existing = await _unitOfWork.CashbookEntries.GetByIdAsync(id);
        if (existing == null) return null;

        // Validate update DTO
        ValidateUpdateDto(dto);

        // Update fields if provided
        if (!string.IsNullOrWhiteSpace(dto.Type))
        {
            if (Enum.TryParse<CashbookEntryType>(dto.Type, true, out var type))
            {
                existing.Type = type;
            }
        }

        if (!string.IsNullOrWhiteSpace(dto.Category))
        {
            existing.Category = dto.Category;
        }

        if (dto.Amount.HasValue)
        {
            if (dto.Amount.Value <= 0)
            {
                throw new ArgumentException("Amount must be greater than 0", nameof(dto.Amount));
            }
            existing.Amount = dto.Amount.Value;
        }

        if (!string.IsNullOrWhiteSpace(dto.Description))
        {
            existing.Description = dto.Description;
        }

        if (!string.IsNullOrWhiteSpace(dto.PaymentMethod))
        {
            if (Enum.TryParse<PaymentMethod>(dto.PaymentMethod, true, out var paymentMethod))
            {
                existing.PaymentMethod = paymentMethod;
            }
        }

        if (dto.ReferenceType != null)
        {
            existing.ReferenceType = dto.ReferenceType;
        }

        if (dto.ReferenceId.HasValue)
        {
            existing.ReferenceId = dto.ReferenceId;
        }

        if (dto.BankAccount != null)
        {
            existing.BankAccount = dto.BankAccount;
        }

        if (dto.TransactionDate.HasValue)
        {
            existing.TransactionDate = dto.TransactionDate.Value;
        }

        if (!string.IsNullOrWhiteSpace(dto.CreatedBy))
        {
            existing.CreatedBy = dto.CreatedBy;
        }

        // Save changes
        await _unitOfWork.CashbookEntries.UpdateAsync(existing);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<CashbookEntryDto>(existing);
    }

    /**
     * Delete a cashbook entry
     */
    public async Task<bool> DeleteEntryAsync(Guid id)
    {
        var entry = await _unitOfWork.CashbookEntries.GetByIdAsync(id);
        if (entry == null) return false;

        await _unitOfWork.CashbookEntries.DeleteAsync(entry);
        await _unitOfWork.SaveChangesAsync();

        return true;
    }

    /**
     * Get cashbook statistics
     */
    public async Task<CashbookStatsDto> GetStatisticsAsync(DateTime? from = null, DateTime? to = null)
    {
        var entries = await _unitOfWork.CashbookEntries.GetAllAsync();
        var query = entries.AsQueryable();

        // Apply date filters
        if (from.HasValue)
        {
            query = query.Where(e => e.TransactionDate >= from.Value);
        }
        if (to.HasValue)
        {
            query = query.Where(e => e.TransactionDate <= to.Value.AddDays(1).AddTicks(-1));
        }

        var filteredEntries = query.ToList();
        var today = DateTime.UtcNow.Date;
        var todayEntries = filteredEntries.Where(e => e.TransactionDate.Date == today).ToList();

        // Calculate statistics
        var stats = new CashbookStatsDto
        {
            TotalIncome = filteredEntries
                .Where(e => e.Type == CashbookEntryType.Income)
                .Sum(e => e.Amount),
            TotalExpense = filteredEntries
                .Where(e => e.Type == CashbookEntryType.Expense)
                .Sum(e => e.Amount),
            TotalTransactions = filteredEntries.Count,
            TodayIncome = todayEntries
                .Where(e => e.Type == CashbookEntryType.Income)
                .Sum(e => e.Amount),
            TodayExpense = todayEntries
                .Where(e => e.Type == CashbookEntryType.Expense)
                .Sum(e => e.Amount),
            TodayTransactions = todayEntries.Count,
        };

        stats.Balance = stats.TotalIncome - stats.TotalExpense;
        stats.TodayBalance = stats.TodayIncome - stats.TodayExpense;

        // Calculate income by category
        stats.IncomeByCategory = filteredEntries
            .Where(e => e.Type == CashbookEntryType.Income)
            .GroupBy(e => e.Category)
            .ToDictionary(g => g.Key, g => g.Sum(e => e.Amount));

        // Calculate expense by category
        stats.ExpenseByCategory = filteredEntries
            .Where(e => e.Type == CashbookEntryType.Expense)
            .GroupBy(e => e.Category)
            .ToDictionary(g => g.Key, g => g.Sum(e => e.Amount));

        return stats;
    }

    /**
     * Validate create DTO
     */
    private void ValidateCreateDto(CreateCashbookEntryDto dto)
    {
        if (dto == null)
        {
            throw new ArgumentNullException(nameof(dto));
        }

        if (string.IsNullOrWhiteSpace(dto.Type))
        {
            throw new ArgumentException("Type is required", nameof(dto.Type));
        }

        if (!Enum.TryParse<CashbookEntryType>(dto.Type, true, out _))
        {
            throw new ArgumentException($"Invalid type: {dto.Type}. Must be 'Income' or 'Expense'", nameof(dto.Type));
        }

        if (string.IsNullOrWhiteSpace(dto.Category))
        {
            throw new ArgumentException("Category is required", nameof(dto.Category));
        }

        if (dto.Amount <= 0)
        {
            throw new ArgumentException("Amount must be greater than 0", nameof(dto.Amount));
        }

        if (string.IsNullOrWhiteSpace(dto.Description))
        {
            throw new ArgumentException("Description is required", nameof(dto.Description));
        }

        if (string.IsNullOrWhiteSpace(dto.PaymentMethod))
        {
            throw new ArgumentException("PaymentMethod is required", nameof(dto.PaymentMethod));
        }

        if (!Enum.TryParse<PaymentMethod>(dto.PaymentMethod, true, out _))
        {
            throw new ArgumentException($"Invalid payment method: {dto.PaymentMethod}", nameof(dto.PaymentMethod));
        }
    }

    /**
     * Validate update DTO
     */
    private void ValidateUpdateDto(UpdateCashbookEntryDto dto)
    {
        if (dto == null)
        {
            throw new ArgumentNullException(nameof(dto));
        }

        if (!string.IsNullOrWhiteSpace(dto.Type))
        {
            if (!Enum.TryParse<CashbookEntryType>(dto.Type, true, out _))
            {
                throw new ArgumentException($"Invalid type: {dto.Type}. Must be 'Income' or 'Expense'", nameof(dto.Type));
            }
        }

        if (dto.Amount.HasValue && dto.Amount.Value <= 0)
        {
            throw new ArgumentException("Amount must be greater than 0", nameof(dto.Amount));
        }

        if (!string.IsNullOrWhiteSpace(dto.PaymentMethod))
        {
            if (!Enum.TryParse<PaymentMethod>(dto.PaymentMethod, true, out _))
            {
                throw new ArgumentException($"Invalid payment method: {dto.PaymentMethod}", nameof(dto.PaymentMethod));
            }
        }
    }
}

