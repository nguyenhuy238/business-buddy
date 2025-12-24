using BusinessBuddy.Infrastructure.Data;
using BusinessBuddy.Application.Extensions;
using BusinessBuddy.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Configure JSON serialization to handle circular references
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { 
        Title = "Business Buddy API", 
        Version = "v1",
        Description = "API for HKD (Household Business) Management System"
    });
});

// Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Application Services
builder.Services.AddApplicationServices();

// Infrastructure Services
builder.Services.AddInfrastructureServices();

// CORS
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseStaticFiles();
app.UseAuthorization();
app.MapControllers();

// Ensure database is created and compatible
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        context.Database.Migrate();
        Log.Information("Database migrated successfully");

        try
        {
            // Ensure ThumbnailUrl column exists for older databases that don't have the migration applied
            var conn = context.Database.GetDbConnection();
            if (conn.State != System.Data.ConnectionState.Open)
                conn.Open();

            using (var cmd = conn.CreateCommand())
            {
                cmd.CommandText = @"IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'ThumbnailUrl' AND Object_id = Object_id(N'dbo.Products'))
BEGIN
    ALTER TABLE dbo.Products ADD ThumbnailUrl nvarchar(max) NULL;
END";
                cmd.ExecuteNonQuery();
            }
        }
        catch (Exception ex)
        {
            // Non-fatal: log and continue. This prevents the app from failing if the DB user lacks ALTER permissions.
            Log.Warning(ex, "Could not ensure ThumbnailUrl column exists; continuing without altering schema.");
        }
    }
    catch (Exception ex)
    {
        Log.Fatal(ex, "An error occurred while migrating the database");
    }
}

app.Run();

