using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BusinessBuddy.Infrastructure.Migrations
{
    public partial class AddProductThumbnail : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ThumbnailUrl",
                table: "Products",
                type: "nvarchar(max)",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ThumbnailUrl",
                table: "Products");
        }
    }
}
