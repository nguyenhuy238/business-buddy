using BusinessBuddy.Application.Mapping;
using BusinessBuddy.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace BusinessBuddy.Application.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // AutoMapper
        services.AddAutoMapper(typeof(MappingProfile));

        // Services
        services.AddScoped<IProductService, ProductService>();
        services.AddScoped<IDashboardService, DashboardService>();

        return services;
    }
}

