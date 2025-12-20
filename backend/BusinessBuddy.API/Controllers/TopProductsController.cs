using BusinessBuddy.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BusinessBuddy.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TopProductsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<TopProductsController> _logger;

    public TopProductsController(ApplicationDbContext context, ILogger<TopProductsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetTop([FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null, [FromQuery] int limit = 10)
    {
        try
        {
            var query = _context.SaleOrderItems.Include(i => i.Product).AsQueryable();
            if (from.HasValue)
                query = query.Where(i => i.CreatedAt >= from.Value);
            if (to.HasValue)
                query = query.Where(i => i.CreatedAt <= to.Value);

            var top = await query.GroupBy(i => new { i.ProductId, i.Product.Name })
                                 .Select(g => new
                                 {
                                     ProductId = g.Key.ProductId,
                                     ProductName = g.Key.Name,
                                     Quantity = g.Sum(x => x.Quantity),
                                     Revenue = g.Sum(x => x.Total)
                                 })
                                 .OrderByDescending(x => x.Quantity)
                                 .Take(limit)
                                 .ToListAsync();

            return Ok(top);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting top products");
            return StatusCode(500, "An error occurred while retrieving top products");
        }
    }
}
