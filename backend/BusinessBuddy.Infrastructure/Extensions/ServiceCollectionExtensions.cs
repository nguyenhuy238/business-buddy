// Added missing using for IServiceCollection
using Microsoft.Extensions.DependencyInjection;
using BusinessBuddy.Infrastructure.Data.UnitOfWork;

namespace BusinessBuddy.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services)
    {
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        return services;
    }
}

