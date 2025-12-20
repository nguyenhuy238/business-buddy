using AutoMapper;
using BusinessBuddy.Application.DTOs;
using BusinessBuddy.Domain.Entities;
using BusinessBuddy.Infrastructure.Data.UnitOfWork;
using Microsoft.EntityFrameworkCore;

namespace BusinessBuddy.Application.Services;

public class ProductService : IProductService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public ProductService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<IEnumerable<ProductDto>> GetAllProductsAsync(bool includeInactive = false)
    {
        var products = await _unitOfWork.Products.FindAsync(p => includeInactive || p.IsActive);
        
        var productDtos = new List<ProductDto>();
        foreach (var product in products)
        {
            var dto = await MapToDtoAsync(product);
            productDtos.Add(dto);
        }
        
        return productDtos;
    }

    public async Task<ProductDto?> GetProductByIdAsync(Guid id)
    {
        var product = await _unitOfWork.Products.GetByIdAsync(id);
        if (product == null) return null;
        
        return await MapToDtoAsync(product);
    }

    public async Task<ProductDto?> GetProductByCodeAsync(string code)
    {
        var product = await _unitOfWork.Products.FirstOrDefaultAsync(p => p.Code == code);
        if (product == null) return null;
        
        return await MapToDtoAsync(product);
    }

    public async Task<ProductDto?> GetProductByBarcodeAsync(string barcode)
    {
        var product = await _unitOfWork.Products.FirstOrDefaultAsync(p => p.Barcode == barcode);
        if (product == null) return null;
        
        return await MapToDtoAsync(product);
    }

    public async Task<ProductDto> CreateProductAsync(CreateProductDto dto)
    {
        // Check if code or barcode already exists
        if (await _unitOfWork.Products.ExistsAsync(p => p.Code == dto.Code))
            throw new InvalidOperationException($"Product with code {dto.Code} already exists");
        
        if (!string.IsNullOrEmpty(dto.Barcode) && 
            await _unitOfWork.Products.ExistsAsync(p => p.Barcode == dto.Barcode))
            throw new InvalidOperationException($"Product with barcode {dto.Barcode} already exists");

        var product = _mapper.Map<Product>(dto);
        await _unitOfWork.Products.AddAsync(product);
        await _unitOfWork.SaveChangesAsync();
        
        return await MapToDtoAsync(product);
    }

    public async Task<ProductDto?> UpdateProductAsync(Guid id, UpdateProductDto dto)
    {
        var product = await _unitOfWork.Products.GetByIdAsync(id);
        if (product == null) return null;

        // Check barcode uniqueness if changed
        if (!string.IsNullOrEmpty(dto.Barcode) && dto.Barcode != product.Barcode)
        {
            if (await _unitOfWork.Products.ExistsAsync(p => p.Barcode == dto.Barcode && p.Id != id))
                throw new InvalidOperationException($"Product with barcode {dto.Barcode} already exists");
        }

        // Update properties
        if (dto.Barcode != null) product.Barcode = dto.Barcode;
        if (dto.Name != null) product.Name = dto.Name;
        if (dto.Description != null) product.Description = dto.Description;
        if (dto.CategoryId.HasValue) product.CategoryId = dto.CategoryId.Value;
        if (dto.UnitId.HasValue) product.UnitId = dto.UnitId.Value;
        if (dto.BaseUnitId.HasValue) product.BaseUnitId = dto.BaseUnitId;
        if (dto.ConversionRate.HasValue) product.ConversionRate = dto.ConversionRate.Value;
        if (dto.CostPrice.HasValue) product.CostPrice = dto.CostPrice.Value;
        if (dto.SalePrice.HasValue) product.SalePrice = dto.SalePrice.Value;
        if (dto.WholesalePrice.HasValue) product.WholesalePrice = dto.WholesalePrice;
        if (dto.MinStock.HasValue) product.MinStock = dto.MinStock.Value;
        if (dto.ImageUrl != null) product.ImageUrl = dto.ImageUrl;
        if (dto.ThumbnailUrl != null) product.ThumbnailUrl = dto.ThumbnailUrl;
        if (dto.IsActive.HasValue) product.IsActive = dto.IsActive.Value;
        if (dto.IsCombo.HasValue) product.IsCombo = dto.IsCombo.Value;
        if (dto.CostMethod != null) product.CostMethod = dto.CostMethod;
        
        product.UpdatedAt = DateTime.UtcNow;
        
        await _unitOfWork.Products.UpdateAsync(product);
        await _unitOfWork.SaveChangesAsync();
        
        return await MapToDtoAsync(product);
    }

    public async Task<bool> DeleteProductAsync(Guid id)
    {
        var product = await _unitOfWork.Products.GetByIdAsync(id);
        if (product == null) return false;
        
        await _unitOfWork.Products.DeleteAsync(product);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    private async Task<ProductDto> MapToDtoAsync(Product product)
    {
        var dto = _mapper.Map<ProductDto>(product);
        
        // Get category name
        var category = await _unitOfWork.Categories.GetByIdAsync(product.CategoryId);
        dto.CategoryName = category?.Name;
        
        // Get unit names
        var unit = await _unitOfWork.UnitOfMeasures.GetByIdAsync(product.UnitId);
        dto.UnitName = unit?.Name;
        
        if (product.BaseUnitId.HasValue)
        {
            var baseUnit = await _unitOfWork.UnitOfMeasures.GetByIdAsync(product.BaseUnitId.Value);
            dto.BaseUnitName = baseUnit?.Name;
        }
        
        // Calculate current stock (sum from all warehouses)
        var stocks = await _unitOfWork.Stocks.FindAsync(s => s.ProductId == product.Id);
        dto.CurrentStock = stocks.Sum(s => s.Quantity);
        
        return dto;
    }
}

