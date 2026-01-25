# DBSmart AI Ticket Analysis System - Quick Start Guide

## What's Been Built So Far

### ✅ Completed (Ready to Use)

1. **Complete Database Layer**
   - All tables, indexes, views, triggers, and constraints
   - Production-ready SQL schemas
   - Located in: `src/database/schemas/`

2. **Backend API Project Structure**
   - ASP.NET Core 8.0 Web API initialized
   - Required NuGet packages added:
     - Entity Framework Core SQL Server
     - JWT Bearer Authentication
     - Microsoft Identity Web
     - Swagger/OpenAPI
   - Folder structure created (Models, Controllers, Services, etc.)
   - Located in: `src/backend/API/DBSmartAI.API/`

3. **Project Documentation**
   - Main README with architecture overview
   - BUILD-STATUS.md with detailed completion tracking
   - This QUICK-START guide

### ⏳ Next Steps (To Continue Building)

The following need to be implemented:

1. **Backend API Implementation** (~8-12 hours)
2. **React Frontend Apps** (~28-40 hours total)
3. **Azure Functions** (~8-12 hours)
4. **Infrastructure as Code** (~4-6 hours)
5. **Configuration & Testing** (~16-22 hours)

**Total Remaining Effort**: ~64-92 hours (8-12 development days)

## Getting Started with Development

### Prerequisites

Ensure you have these installed:
- ✅ .NET 9.0 SDK (you have this installed)
- Node.js 20.x or later
- SQL Server (local instance or Azure SQL)
- Visual Studio 2022 or VS Code
- Azure Functions Core Tools (for Functions development)

### Step 1: Set Up the Database

1. Create a new database:
   ```sql
   CREATE DATABASE DBSmartAI;
   GO
   ```

2. Run the schema scripts in order:
   ```bash
   cd /c/Users/shale/DBSmart-AI-System/src/database/schemas

   # Run each script in order
   sqlcmd -S localhost -d DBSmartAI -E -i 01-core-tables.sql
   sqlcmd -S localhost -d DBSmartAI -E -i 02-indexes.sql
   sqlcmd -S localhost -d DBSmartAI -E -i 03-views.sql
   ```

3. Verify the tables were created:
   ```sql
   USE DBSmartAI;
   GO
   SELECT TABLE_NAME
   FROM INFORMATION_SCHEMA.TABLES
   WHERE TABLE_TYPE = 'BASE TABLE'
   ORDER BY TABLE_NAME;
   GO
   ```

   You should see these tables:
   - ai_analyses
   - analysis_metrics
   - audit_log
   - feedback_log
   - graphrag_sync_status
   - job_history
   - review_queue
   - system_config

### Step 2: Configure the Backend API

1. Update the connection string in `appsettings.json`:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=localhost;Database=DBSmartAI;Trusted_Connection=True;TrustServerCertificate=True;"
     }
   }
   ```

2. The API currently has these packages installed:
   - Microsoft.AspNetCore.OpenApi
   - Swashbuckle.AspNetCore
   - Microsoft.EntityFrameworkCore.SqlServer
   - Microsoft.AspNetCore.Authentication.JwtBearer
   - Microsoft.Identity.Web

### Step 3: Build the Backend API (Next Task)

Create these files to make the API functional:

#### A. Create Entity Models (`src/backend/API/DBSmartAI.API/Models/`)

Create `Analysis.cs`:
```csharp
namespace DBSmartAI.API.Models
{
    public class Analysis
    {
        public long Id { get; set; }
        public string TicketId { get; set; } = null!;
        public DateTime AnalysisTimestamp { get; set; } = DateTime.UtcNow;
        public string ConfidenceLevel { get; set; } = null!;
        public decimal? ConfidenceScore { get; set; }
        public string? IssueType { get; set; }
        public string? SeverityAssessment { get; set; }
        public string? ExecutiveSummary { get; set; }

        // JSON fields
        public string? SymptomAnalysisJson { get; set; }
        public string? DataCorrelationsJson { get; set; }
        public string? RootCauseAnalysisJson { get; set; }
        public string? ImmediateRemediationJson { get; set; }
        public string? PreventionRecommendationsJson { get; set; }
        public string? SimilarTicketsJson { get; set; }

        // Metadata
        public int? ProcessingTimeMs { get; set; }
        public int? InputTokens { get; set; }
        public int? OutputTokens { get; set; }
        public int? TotalTokens { get; set; }

        public string Status { get; set; } = "pending";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public ReviewQueue? ReviewQueue { get; set; }
    }
}
```

Create similar models for:
- `ReviewQueue.cs`
- `AnalysisMetrics.cs`
- `FeedbackLog.cs`
- `SystemConfig.cs`
- `AuditLog.cs`
- `JobHistory.cs`

#### B. Create DbContext (`src/backend/API/DBSmartAI.API/Data/`)

Create `DBSmartAIDbContext.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using DBSmartAI.API.Models;

namespace DBSmartAI.API.Data
{
    public class DBSmartAIDbContext : DbContext
    {
        public DBSmartAIDbContext(DbContextOptions<DBSmartAIDbContext> options)
            : base(options)
        {
        }

        public DbSet<Analysis> Analyses { get; set; }
        public DbSet<ReviewQueue> ReviewQueues { get; set; }
        public DbSet<AnalysisMetrics> AnalysisMetrics { get; set; }
        public DbSet<FeedbackLog> FeedbackLogs { get; set; }
        public DbSet<SystemConfig> SystemConfigs { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<JobHistory> JobHistories { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Configure entities
            modelBuilder.Entity<Analysis>(entity =>
            {
                entity.ToTable("ai_analyses");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.TicketId).HasMaxLength(50).IsRequired();
                entity.Property(e => e.ConfidenceLevel).HasMaxLength(20).IsRequired();
                // ... configure all properties ...
            });

            // Similar configuration for other entities
        }
    }
}
```

#### C. Update Program.cs

```csharp
using Microsoft.EntityFrameworkCore;
using DBSmartAI.API.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add DbContext
builder.Services.AddDbContext<DBSmartAIDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontends", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:3001")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Add SignalR
builder.Services.AddSignalR();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontends");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

#### D. Create Controllers

Create `AnalysesController.cs`:
```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DBSmartAI.API.Data;
using DBSmartAI.API.Models;

namespace DBSmartAI.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AnalysesController : ControllerBase
    {
        private readonly DBSmartAIDbContext _context;

        public AnalysesController(DBSmartAIDbContext context)
        {
            _context = context;
        }

        // GET: api/Analyses
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Analysis>>> GetAnalyses(
            [FromQuery] string? status = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var query = _context.Analyses.AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(a => a.Status == status);
            }

            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(a => a.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            Response.Headers.Append("X-Total-Count", total.ToString());
            return Ok(items);
        }

        // GET: api/Analyses/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Analysis>> GetAnalysis(long id)
        {
            var analysis = await _context.Analyses
                .Include(a => a.ReviewQueue)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (analysis == null)
            {
                return NotFound();
            }

            return Ok(analysis);
        }

        // Add POST, PUT, DELETE methods as needed
    }
}
```

Create similar controllers for:
- `ReviewQueueController.cs`
- `MetricsController.cs`
- `SystemConfigController.cs`
- `AuditController.cs`

### Step 4: Run the Backend API

```bash
cd /c/Users/shale/DBSmart-AI-System/src/backend/API/DBSmartAI.API
dotnet build
dotnet run
```

The API will start at `https://localhost:5001` (or the port shown in the console).

Access Swagger UI at: `https://localhost:5001/swagger`

### Step 5: Create Frontend Applications

#### Review Dashboard (Port 3000)

1. Create React app:
   ```bash
   cd /c/Users/shale/DBSmart-AI-System/src/frontend
   npx create-react-app review-dashboard --template typescript
   cd review-dashboard
   npm install antd @reduxjs/toolkit react-redux react-router-dom axios @microsoft/signalr recharts
   ```

2. Update `package.json` to add proxy:
   ```json
   "proxy": "https://localhost:5001"
   ```

3. Start development:
   ```bash
   npm start
   ```

#### Admin Panel (Port 3001)

1. Create React app:
   ```bash
   cd /c/Users/shale/DBSmart-AI-System/src/frontend
   npx create-react-app admin-panel --template typescript
   cd admin-panel
   npm install antd @reduxjs/toolkit react-redux react-router-dom axios @microsoft/signalr recharts
   ```

2. Update `package.json`:
   ```json
   "proxy": "https://localhost:5001",
   "scripts": {
     "start": "PORT=3001 react-scripts start",
     ...
   }
   ```

3. Start development:
   ```bash
   npm start
   ```

### Step 6: Create Azure Functions (for batch processing)

```bash
cd /c/Users/shale/DBSmart-AI-System/src/backend/Functions
func init DBSmartAI.Functions --dotnet-isolated --worker-runtime dotnet-isolated
cd DBSmartAI.Functions
func new --name GraphRAGIndexingFunction --template "Timer trigger"
func new --name AIAnalysisFunction --template "Timer trigger"
```

### Current Project State

```
DBSmart-AI-System/
├── ✅ src/database/schemas/          # COMPLETE - All SQL schemas ready
│   ├── 01-core-tables.sql
│   ├── 02-indexes.sql
│   └── 03-views.sql
├── ⏳ src/backend/API/                # IN PROGRESS - Structure ready, needs implementation
│   └── DBSmartAI.API/
│       ├── Models/                    # Need to create entity models
│       ├── DTOs/                      # Need to create DTOs
│       ├── Controllers/               # Need to create controllers
│       ├── Services/                  # Need to create services
│       ├── Data/                      # Need to create DbContext
│       └── Program.cs                 # Needs updating
├── 📋 src/frontend/                   # PENDING - Ready to create
│   ├── review-dashboard/
│   └── admin-panel/
├── 📋 src/backend/Functions/          # PENDING - Ready to create
├── 📋 infrastructure/bicep/           # PENDING - Ready to create
├── ✅ README.md                       # COMPLETE
├── ✅ BUILD-STATUS.md                 # COMPLETE
└── ✅ QUICK-START.md                  # This file
```

## Testing Without Azure Services

You can develop and test locally without connecting to Azure:

### Mock Services

Create mock implementations for:

1. **GraphRAG Service** - Return hardcoded similar tickets
2. **Zendesk API** - Return sample tickets from JSON files
3. **SQL Sentry Queries** - Return sample performance metrics
4. **OpenAI API** - Return pre-generated analysis responses

This allows full frontend and API development without Azure costs.

## Helpful Commands

```bash
# Backend API
cd src/backend/API/DBSmartAI.API
dotnet build                    # Build
dotnet run                      # Run (development mode)
dotnet watch run                # Run with hot reload
dotnet ef migrations add Initial  # Create migration (after DbContext is ready)
dotnet ef database update       # Apply migrations

# Frontend (Review Dashboard)
cd src/frontend/review-dashboard
npm install                     # Install dependencies
npm start                       # Start development server
npm run build                   # Build for production

# Frontend (Admin Panel)
cd src/frontend/admin-panel
npm install
npm start
npm run build

# Azure Functions
cd src/backend/Functions/DBSmartAI.Functions
func start                      # Run locally
func azure functionapp publish <app-name>  # Deploy (when ready)

# Database
sqlcmd -S localhost -d DBSmartAI -E -Q "SELECT * FROM ai_analyses"
```

## Next Development Priorities

1. **Immediate** (1-2 days):
   - Complete Backend API models and controllers
   - Test API endpoints with Swagger
   - Create basic frontend shell for Review Dashboard

2. **Short-term** (3-7 days):
   - Implement Review Queue functionality
   - Create Admin Panel structure
   - Add mock services for testing

3. **Medium-term** (1-2 weeks):
   - Implement Azure Functions
   - Create Infrastructure as Code templates
   - Add authentication (Azure AD)

4. **Before Azure Deployment**:
   - Complete all unit tests
   - Security review
   - Performance testing
   - Documentation completion

## Support & Resources

- **Database Schema**: See `src/database/schemas/` for complete SQL
- **API Documentation**: Will be at `/swagger` when API is running
- **Build Status**: See `BUILD-STATUS.md` for detailed progress
- **Design Document**: See `.claude/plans/mutable-tickling-jellyfish.md`

## Troubleshooting

### Database Connection Issues
```bash
# Test SQL Server connection
sqlcmd -S localhost -E -Q "SELECT @@VERSION"

# If using Azure SQL, update connection string with password
Server=your-server.database.windows.net;Database=DBSmartAI;User ID=your-user;Password=your-password
```

### Port Conflicts
- Backend API: Default 5001 (HTTPS) or 5000 (HTTP)
- Review Dashboard: 3000
- Admin Panel: 3001

Change ports in `launchSettings.json` (API) or `package.json` (React apps).

### NuGet Package Restore Issues
```bash
dotnet clean
dotnet restore
dotnet build
```

---

## Ready to Continue?

You now have a solid foundation with:
- ✅ Complete database layer (production-ready)
- ✅ Backend API project structure (ready for implementation)
- ✅ Clear roadmap and documentation

**Next step**: Follow "Step 3" above to implement the Backend API models and controllers.

Good luck with the development! 🚀
