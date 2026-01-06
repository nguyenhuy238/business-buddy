using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace BusinessBuddy.Infrastructure.Data;

/// <summary>
/// Factory class for creating ApplicationDbContext instances at design time.
/// This is used by EF Core migration tools.
/// </summary>
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    /// <summary>
    /// Creates a new instance of ApplicationDbContext for design-time operations.
    /// Reads connection string from environment variable or uses default development connection string.
    /// </summary>
    /// <param name="args">Command line arguments (not used in this implementation).</param>
    /// <returns>A configured ApplicationDbContext instance.</returns>
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        // Get connection string from environment variable or use default
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
            ?? "Server=(localdb)\\mssqllocaldb;Database=BusinessBuddyDB;Trusted_Connection=true;MultipleActiveResultSets=true;TrustServerCertificate=true";

        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        optionsBuilder.UseSqlServer(connectionString);

        return new ApplicationDbContext(optionsBuilder.Options);
    }
}
