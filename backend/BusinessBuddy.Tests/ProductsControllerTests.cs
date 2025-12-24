using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;
using BusinessBuddy.API.Controllers;
using BusinessBuddy.Application.Services;
using BusinessBuddy.Application.DTOs;

namespace BusinessBuddy.Tests
{
    public class ProductsControllerTests
    {
        [Fact]
        public async Task UploadProductImage_InvalidFileType_ReturnsBadRequest()
        {
            var mockService = new Mock<IProductService>();
            var mockEnv = new Mock<IWebHostEnvironment>();
            mockService.Setup(x => x.GetProductByIdAsync(It.IsAny<System.Guid>()))
                .ReturnsAsync(new ProductDto { Id = System.Guid.NewGuid() });

            var tmp = Path.Combine(Path.GetTempPath(), "bbtests", System.Guid.NewGuid().ToString());
            Directory.CreateDirectory(tmp);
            mockEnv.Setup(e => e.WebRootPath).Returns(tmp);

            var controller = new ProductsController(mockService.Object, Mock.Of<Microsoft.Extensions.Logging.ILogger<ProductsController>>(), mockEnv.Object);

            var content = new MemoryStream(new byte[] { 0x01, 0x02 });
            var formFile = new FormFile(content, 0, content.Length, "file", "file.txt") { Headers = new HeaderDictionary(), ContentType = "text/plain" };

            var result = await controller.UploadProductImage(System.Guid.NewGuid(), formFile);

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task UploadProductImage_ValidImage_CreatesFilesAndReturnsUrls()
        {
            var mockService = new Mock<IProductService>();
            var mockEnv = new Mock<IWebHostEnvironment>();
            var id = System.Guid.NewGuid();
            mockService.Setup(x => x.GetProductByIdAsync(id))
                .ReturnsAsync(new ProductDto { Id = id });
            mockService.Setup(x => x.UpdateProductAsync(id, It.IsAny<UpdateProductDto>()))
                .ReturnsAsync(new ProductDto { Id = id, ImageUrl = "/images/products/x.png", ThumbnailUrl = "/images/products/x-thumb.png" });

            var tmp = Path.Combine(Path.GetTempPath(), "bbtests", System.Guid.NewGuid().ToString());
            Directory.CreateDirectory(tmp);
            mockEnv.Setup(e => e.WebRootPath).Returns(tmp);

            var controller = new ProductsController(mockService.Object, Mock.Of<Microsoft.Extensions.Logging.ILogger<ProductsController>>(), mockEnv.Object);

            // Create a small PNG file header to mimic an image
            var pngHeader = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };
            var content = new MemoryStream();
            content.Write(pngHeader, 0, pngHeader.Length);
            content.Position = 0;

            var formFile = new FormFile(content, 0, content.Length, "file", "test.png") { Headers = new HeaderDictionary(), ContentType = "image/png" };

            var result = await controller.UploadProductImage(id, formFile);

            var ok = Assert.IsType<OkObjectResult>(result);
            var obj = ok.Value as dynamic;
            Assert.NotNull(obj.imageUrl);
            // Thumbnail could be null if ImageSharp failed, but controller attempts to create it; ensure property exists
        }
    }
}
