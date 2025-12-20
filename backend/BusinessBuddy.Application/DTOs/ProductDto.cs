namespace BusinessBuddy.Application.DTOs;

public class ProductDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public Guid UnitId { get; set; }
    public string? UnitName { get; set; }
    public Guid? BaseUnitId { get; set; }
    public string? BaseUnitName { get; set; }
    public decimal ConversionRate { get; set; }
    public decimal CostPrice { get; set; }
    public decimal SalePrice { get; set; }
    public decimal? WholesalePrice { get; set; }
    public int MinStock { get; set; }
    public decimal CurrentStock { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; }
    public bool IsCombo { get; set; }
    public string? CostMethod { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateProductDto
{
    public string Code { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid CategoryId { get; set; }
    public Guid UnitId { get; set; }
    public Guid? BaseUnitId { get; set; }
    public decimal ConversionRate { get; set; } = 1;
    public decimal CostPrice { get; set; }
    public decimal SalePrice { get; set; }
    public decimal? WholesalePrice { get; set; }
    public int MinStock { get; set; } = 0;
    public string? ImageUrl { get; set; }
    public bool IsCombo { get; set; } = false;
    public string CostMethod { get; set; } = "SIMPLE";
}

public class UpdateProductDto
{
    public string? Barcode { get; set; }
    public string? Name { get; set; }
    public string? Description { get; set; }
    public Guid? CategoryId { get; set; }
    public Guid? UnitId { get; set; }
    public Guid? BaseUnitId { get; set; }
    public decimal? ConversionRate { get; set; }
    public decimal? CostPrice { get; set; }
    public decimal? SalePrice { get; set; }
    public decimal? WholesalePrice { get; set; }
    public int? MinStock { get; set; }
    public string? ImageUrl { get; set; }
    public bool? IsActive { get; set; }
    public bool? IsCombo { get; set; }
    public string? CostMethod { get; set; }
}

