using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BusinessBuddy.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // NOTE: This project previously had the database schema created outside
            // of EF Migrations. Running the original InitialCreate migration against
            // that database fails because the tables already exist ("There is already
            // an object named 'Categories' in the database.").
            //
            // To support existing databases and allow migrations to be recorded
            // without recreating the schema, the Up method is intentionally left
            // as a no-op. This will cause EF to mark the migration as applied
            // without executing CREATE TABLE statements.
            //
            // If you need to apply this migration to a new database, remove the
            // no-op and restore the original CreateTable calls or recreate the
            // migrations properly (e.g., scaffold a baseline migration).

            // No-op to avoid creating tables that already exist in the target DB
            // migrationBuilder operations removed intentionally.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CashbookEntries");

            migrationBuilder.DropTable(
                name: "ComboItems");

            migrationBuilder.DropTable(
                name: "ProductUnitConversions");

            migrationBuilder.DropTable(
                name: "PurchaseOrderItems");

            migrationBuilder.DropTable(
                name: "SaleOrderItems");

            migrationBuilder.DropTable(
                name: "Stocks");

            migrationBuilder.DropTable(
                name: "StockTransactions");

            migrationBuilder.DropTable(
                name: "PurchaseOrders");

            migrationBuilder.DropTable(
                name: "SaleOrders");

            migrationBuilder.DropTable(
                name: "StockBatches");

            migrationBuilder.DropTable(
                name: "Suppliers");

            migrationBuilder.DropTable(
                name: "Customers");

            migrationBuilder.DropTable(
                name: "Products");

            migrationBuilder.DropTable(
                name: "Warehouses");

            migrationBuilder.DropTable(
                name: "Categories");

            migrationBuilder.DropTable(
                name: "UnitOfMeasures");
        }
    }
}
