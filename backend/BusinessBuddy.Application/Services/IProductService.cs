using BusinessBuddy.Application.DTOs;

namespace BusinessBuddy.Application.Services;

public interface IProductService
{
    Task<IEnumerable<ProductDto>> GetAllProductsAsync(bool includeInactive = false);
    Task<ProductDto?> GetProductByIdAsync(Guid id);
    Task<ProductDto?> GetProductByCodeAsync(string code);
    Task<ProductDto?> GetProductByBarcodeAsync(string barcode);
    Task<ProductDto> CreateProductAsync(CreateProductDto dto);
    Task<ProductDto?> UpdateProductAsync(Guid id, UpdateProductDto dto);
    Task<bool> DeleteProductAsync(Guid id);
    Task<IEnumerable<ProductAvailableUnitDto>> GetAvailableUnitsAsync(Guid productId);
}

