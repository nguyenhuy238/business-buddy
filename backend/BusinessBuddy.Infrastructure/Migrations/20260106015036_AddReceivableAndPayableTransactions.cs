using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BusinessBuddy.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddReceivableAndPayableTransactions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PayableTransactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SupplierId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Type = table.Column<int>(type: "int", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    BalanceBefore = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    BalanceAfter = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PaymentMethod = table.Column<int>(type: "int", nullable: false),
                    DueDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TransactionDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReferenceType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ReferenceId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PurchaseOrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CashbookEntryId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PayableTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PayableTransactions_CashbookEntries_CashbookEntryId",
                        column: x => x.CashbookEntryId,
                        principalTable: "CashbookEntries",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PayableTransactions_PurchaseOrders_PurchaseOrderId",
                        column: x => x.PurchaseOrderId,
                        principalTable: "PurchaseOrders",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PayableTransactions_Suppliers_SupplierId",
                        column: x => x.SupplierId,
                        principalTable: "Suppliers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ReceivableTransactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CustomerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Type = table.Column<int>(type: "int", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    BalanceBefore = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    BalanceAfter = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PaymentMethod = table.Column<int>(type: "int", nullable: false),
                    DueDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TransactionDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReferenceType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ReferenceId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SaleOrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CashbookEntryId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReceivableTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReceivableTransactions_CashbookEntries_CashbookEntryId",
                        column: x => x.CashbookEntryId,
                        principalTable: "CashbookEntries",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ReceivableTransactions_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReceivableTransactions_SaleOrders_SaleOrderId",
                        column: x => x.SaleOrderId,
                        principalTable: "SaleOrders",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_PayableTransactions_CashbookEntryId",
                table: "PayableTransactions",
                column: "CashbookEntryId");

            migrationBuilder.CreateIndex(
                name: "IX_PayableTransactions_PurchaseOrderId",
                table: "PayableTransactions",
                column: "PurchaseOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_PayableTransactions_SupplierId_TransactionDate",
                table: "PayableTransactions",
                columns: new[] { "SupplierId", "TransactionDate" });

            migrationBuilder.CreateIndex(
                name: "IX_ReceivableTransactions_CashbookEntryId",
                table: "ReceivableTransactions",
                column: "CashbookEntryId");

            migrationBuilder.CreateIndex(
                name: "IX_ReceivableTransactions_CustomerId_TransactionDate",
                table: "ReceivableTransactions",
                columns: new[] { "CustomerId", "TransactionDate" });

            migrationBuilder.CreateIndex(
                name: "IX_ReceivableTransactions_SaleOrderId",
                table: "ReceivableTransactions",
                column: "SaleOrderId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PayableTransactions");

            migrationBuilder.DropTable(
                name: "ReceivableTransactions");
        }
    }
}
