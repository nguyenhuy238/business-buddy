using BusinessBuddy.Application.DTOs;
using BusinessBuddy.Application.Services;
using Microsoft.AspNetCore.Http;
using System.IO;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;

namespace BusinessBuddy.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly ILogger<ProductsController> _logger;
    private readonly IWebHostEnvironment _env;

    public ProductsController(IProductService productService, ILogger<ProductsController> logger, IWebHostEnvironment env)
    {
        _productService = productService;
        _logger = logger;
        _env = env;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetProducts([FromQuery] bool includeInactive = false)
    {
        try
        {
            var products = await _productService.GetAllProductsAsync(includeInactive);
            return Ok(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting products");
            return StatusCode(500, "An error occurred while retrieving products");
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDto>> GetProduct(Guid id)
    {
        try
        {
            var product = await _productService.GetProductByIdAsync(id);
            if (product == null)
                return NotFound($"Product with ID {id} not found");

            return Ok(product);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting product {ProductId}", id);
            return StatusCode(500, "An error occurred while retrieving the product");
        }
    }

    [HttpGet("code/{code}")]
    public async Task<ActionResult<ProductDto>> GetProductByCode(string code)
    {
        try
        {
            var product = await _productService.GetProductByCodeAsync(code);
            if (product == null)
                return NotFound($"Product with code {code} not found");

            return Ok(product);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting product by code {Code}", code);
            return StatusCode(500, "An error occurred while retrieving the product");
        }
    }

    [HttpGet("barcode/{barcode}")]
    public async Task<ActionResult<ProductDto>> GetProductByBarcode(string barcode)
    {
        try
        {
            var product = await _productService.GetProductByBarcodeAsync(barcode);
            if (product == null)
                return NotFound($"Product with barcode {barcode} not found");

            return Ok(product);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting product by barcode {Barcode}", barcode);
            return StatusCode(500, "An error occurred while retrieving the product");
        }
    }

    [HttpPost]
    public async Task<ActionResult<ProductDto>> CreateProduct([FromBody] CreateProductDto dto)
    {
        try
        {
            var product = await _productService.CreateProductAsync(dto);
            return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating product");
            return StatusCode(500, "An error occurred while creating the product");
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ProductDto>> UpdateProduct(Guid id, [FromBody] UpdateProductDto dto)
    {
        try
        {
            var product = await _productService.UpdateProductAsync(id, dto);
            if (product == null)
                return NotFound($"Product with ID {id} not found");

            return Ok(product);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating product {ProductId}", id);
            return StatusCode(500, "An error occurred while updating the product");
        }
    }

    [HttpPost("{id}/image")]
    public async Task<IActionResult> UploadProductImage(Guid id, [FromForm] IFormFile file, [FromForm] bool createThumbnail = true)
    {
        try
        {
            var product = await _productService.GetProductByIdAsync(id);
            if (product == null)
                return NotFound($"Product with ID {id} not found");

            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            // Validate size (<= 5MB)
            if (file.Length > 5 * 1024 * 1024)
                return BadRequest("File too large. Max size is 5 MB.");

            var allowedExt = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExt.Contains(ext))
                return BadRequest("Invalid file type. Allowed: jpg, jpeg, png, webp");

            var allowedContentTypes = new[] { "image/jpeg", "image/png", "image/webp" };
            if (!allowedContentTypes.Contains(file.ContentType))
                return BadRequest("Invalid content type");

            var wwwroot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var dir = Path.Combine(wwwroot, "images", "products");
            Directory.CreateDirectory(dir);

            var fileName = $"{id}-{Guid.NewGuid()}{ext}";
            var path = Path.Combine(dir, fileName);
            using (var stream = System.IO.File.Create(path))
            {
                await file.CopyToAsync(stream);
            }

            var imageUrl = $"/images/products/{fileName}";
            string? thumbnailUrl = null;

            if (createThumbnail)
            {
                try
                {
                    using (var image = SixLabors.ImageSharp.Image.Load(path))
                    {
                        image.Mutate(x => x.Resize(new SixLabors.ImageSharp.Processing.ResizeOptions
                        {
                            Size = new SixLabors.ImageSharp.Size(200, 200),
                            Mode = SixLabors.ImageSharp.Processing.ResizeMode.Crop
                        }));

                        var thumbName = $"{id}-{Guid.NewGuid()}-thumb{ext}";
                        var thumbPath = Path.Combine(dir, thumbName);
                        switch (ext)
                        {
                            case ".jpg":
                            case ".jpeg":
                                image.SaveAsJpeg(thumbPath);
                                break;
                            case ".png":
                                image.SaveAsPng(thumbPath);
                                break;
                            case ".webp":
                                image.SaveAsWebp(thumbPath);
                                break;
                            default:
                                image.SaveAsJpeg(thumbPath);
                                break;
                        }
                        thumbnailUrl = $"/images/products/{thumbName}";
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to create thumbnail for product {ProductId}", id);
                    // continue without thumbnail
                }
            }

            // Save URLs to product
            var updateDto = new BusinessBuddy.Application.DTOs.UpdateProductDto { ImageUrl = imageUrl, ThumbnailUrl = thumbnailUrl };
            var updated = await _productService.UpdateProductAsync(id, updateDto);
            if (updated == null)
                return NotFound($"Product with ID {id} not found");

            return Ok(new { imageUrl, thumbnailUrl });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading image for product {ProductId}", id);
            return StatusCode(500, "An error occurred while uploading the image");
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProduct(Guid id)
    {
        try
        {
            var deleted = await _productService.DeleteProductAsync(id);
            if (!deleted)
                return NotFound($"Product with ID {id} not found");

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting product {ProductId}", id);
            return StatusCode(500, "An error occurred while deleting the product");
        }
    }

    /// <summary>
    /// Get all available units for a product (default unit, base unit, and conversions)
    /// </summary>
    [HttpGet("{id}/available-units")]
    public async Task<ActionResult<IEnumerable<ProductAvailableUnitDto>>> GetAvailableUnits(Guid id)
    {
        try
        {
            var units = await _productService.GetAvailableUnitsAsync(id);
            return Ok(units);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting available units for product {ProductId}", id);
            return StatusCode(500, "An error occurred while retrieving available units");
        }
    }
}

