using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace InventoryApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CountsController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public CountsController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public class CountItem
        {
            public string? itemId { get; set; }
            public string? itemName { get; set; }
            public int quantity { get; set; }
            public string? timestamp { get; set; }
        }

        public class CountSession
        {
            public string? id { get; set; }
            public string? locationId { get; set; }
            public List<CountItem> items { get; set; } = new();
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] CountSession session)
        {
            var connectionString = _configuration.GetConnectionString("DefaultConnection");
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                return Problem("Connection string not configured");
            }

            try
            {
                await using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();

                // Example insert logic; adjust to your schema/table names
                foreach (var item in session.items)
                {
                    const string sql = @"INSERT INTO dbo.inventory_count_table (itemId, itemName, quantity, timestamp)
                                          VALUES (@itemId, @itemName, @quantity, @timestamp)";
                    await using var cmd = new SqlCommand(sql, connection);
                    cmd.Parameters.AddWithValue("@itemId", (object?)item.itemId ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@itemName", (object?)item.itemName ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@quantity", item.quantity);
                    cmd.Parameters.AddWithValue("@timestamp", (object?)item.timestamp ?? DBNull.Value);
                    await cmd.ExecuteNonQueryAsync();
                }

                return Ok(new { ok = true });
            }
            catch (Exception ex)
            {
                return Problem($"Database error: {ex.Message}");
            }
        }
    }
}


