# DBSmart AI Ticket Analysis System

An AI-powered system that automatically analyzes Zendesk support tickets by correlating ticket data with SQL Server monitoring data from SQL Sentry using Azure GraphRAG and Azure OpenAI.

## Project Structure

```
DBSmart-AI-System/
├── src/
│   ├── backend/
│   │   ├── API/              # ASP.NET Core Web API (Review Dashboard & Admin Panel backend)
│   │   └── Functions/        # Azure Functions (GraphRAG indexing & AI analysis)
│   ├── frontend/
│   │   ├── review-dashboard/ # React app for DBChief to review AI analyses
│   │   └── admin-panel/      # React app for system administrators
│   └── database/
│       ├── schemas/          # SQL schema definitions
│       └── migrations/       # Database migration scripts
├── infrastructure/
│   └── bicep/               # Azure infrastructure as code
├── config/                  # Configuration templates
├── docs/                    # Additional documentation
└── tests/                   # Integration and end-to-end tests
```

## Technology Stack

### Backend
- **API**: ASP.NET Core 8.0 Web API
- **Functions**: Azure Functions v4 (.NET 8 Isolated)
- **Database**: Azure SQL Database
- **Authentication**: Azure AD with role-based access control

### Frontend
- **Framework**: React 18 with TypeScript
- **UI Library**: Ant Design Pro
- **State Management**: Redux Toolkit
- **Charting**: Recharts
- **Real-time**: SignalR

### Azure Services (Required but not yet connected)
- Azure GraphRAG (Cosmos DB + AI Search)
- Azure OpenAI Service (GPT-4o)
- Azure Functions
- Azure SQL Database
- Azure Key Vault
- Azure Application Insights

## Getting Started

### Prerequisites
- .NET 8.0 SDK
- Node.js 20.x or later
- Visual Studio 2022 or VS Code
- SQL Server (local) or Azure SQL Database

### Local Development Setup

1. **Clone and navigate to the project:**
   ```bash
   cd DBSmart-AI-System
   ```

2. **Backend API Setup:**
   ```bash
   cd src/backend/API
   dotnet restore
   dotnet build
   dotnet run
   ```

3. **Review Dashboard Frontend:**
   ```bash
   cd src/frontend/review-dashboard
   npm install
   npm start
   ```

4. **Admin Panel Frontend:**
   ```bash
   cd src/frontend/admin-panel
   npm install
   npm start
   ```

5. **Azure Functions (local development):**
   ```bash
   cd src/backend/Functions
   dotnet restore
   dotnet build
   func start
   ```

## Configuration

Configuration templates are provided in the `config/` directory. Copy and customize them for your environment:

- `appsettings.template.json` - Backend API configuration
- `local.settings.template.json` - Azure Functions local settings
- `.env.template` - Frontend environment variables

## Database Setup

Run the database schema scripts in order:

```bash
# Apply schemas
sqlcmd -S your-server -d DBSmartAI -i src/database/schemas/01-core-tables.sql
sqlcmd -S your-server -d DBSmartAI -i src/database/schemas/02-indexes.sql
```

## Deployment

Deployment is managed through Azure Bicep templates in `infrastructure/bicep/`:

```bash
az deployment group create \
  --resource-group dbsmart-ai-rg \
  --template-file infrastructure/bicep/main.bicep \
  --parameters @infrastructure/bicep/parameters.json
```

## Features

### Review Queue Dashboard (DBChief)
- View pending AI-generated ticket analyses
- Edit analyses before posting to Zendesk
- Approve/reject analyses
- Side-by-side view of ticket, analysis, and raw data

### Admin Control Panel (System Administrators)
- **System Configuration**: Adjust GraphRAG settings, AI parameters, schedules
- **Manual Triggers**: On-demand indexing, re-analysis, test connections
- **Monitoring & Analytics**: Real-time system health, performance metrics, cost tracking
- **Data Management**: GraphRAG index management, entity management, backups
- **Logs & Audit Trail**: Real-time log viewing, audit logging
- **Alerts & Notifications**: Configure alerts and notification channels

### AI Analysis Engine
- Automated symptom analysis
- Root cause analysis (RCA)
- Immediate remediation recommendations
- Prevention strategies
- Similar ticket pattern matching via GraphRAG

## Architecture

The system follows a three-tier architecture:

1. **Data Layer**: Azure GraphRAG + Azure SQL Database
2. **Application Layer**: Azure Functions (batch processing) + ASP.NET Core API
3. **Presentation Layer**: React SPAs (Review Dashboard + Admin Panel)

## Development Status

✅ Project structure created
⏳ Database schemas (in progress)
⏳ Backend API (pending)
⏳ Frontend applications (pending)
⏳ Azure Functions (pending)
⏳ Infrastructure templates (pending)

## Documentation

- [High-Level Design](/.claude/plans/mutable-tickling-jellyfish.md)
- [Database Schema](docs/database-schema.md) (coming soon)
- [API Documentation](docs/api-documentation.md) (coming soon)
- [Deployment Guide](docs/deployment-guide.md) (coming soon)

## License

Proprietary - DBSmart Internal Use Only

## Contact

For questions or support, contact the DBSmart development team.
