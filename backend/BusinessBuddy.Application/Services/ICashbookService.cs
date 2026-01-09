using BusinessBuddy.Application.DTOs;

namespace BusinessBuddy.Application.Services;

/**
 * Service interface for cashbook operations
 */
public interface ICashbookService
{
    /**
     * Get all cashbook entries with optional date filters
     * @param from - Optional start date filter
     * @param to - Optional end date filter
     * @returns List of cashbook entries
     */
    Task<IEnumerable<CashbookEntryDto>> GetAllEntriesAsync(DateTime? from = null, DateTime? to = null);

    /**
     * Get a cashbook entry by ID
     * @param id - Entry ID
     * @returns Cashbook entry or null if not found
     */
    Task<CashbookEntryDto?> GetEntryByIdAsync(Guid id);

    /**
     * Create a new cashbook entry
     * @param dto - Entry data
     * @returns Created entry
     */
    Task<CashbookEntryDto> CreateEntryAsync(CreateCashbookEntryDto dto);

    /**
     * Update an existing cashbook entry
     * @param id - Entry ID
     * @param dto - Updated entry data
     * @returns Updated entry or null if not found
     */
    Task<CashbookEntryDto?> UpdateEntryAsync(Guid id, UpdateCashbookEntryDto dto);

    /**
     * Delete a cashbook entry
     * @param id - Entry ID
     * @returns True if deleted, false if not found
     */
    Task<bool> DeleteEntryAsync(Guid id);

    /**
     * Get cashbook statistics
     * @param from - Optional start date filter
     * @param to - Optional end date filter
     * @returns Statistics DTO
     */
    Task<CashbookStatsDto> GetStatisticsAsync(DateTime? from = null, DateTime? to = null);
}

