# 🤖 Claude AI Context - DBSmart AI System

> **קובץ זה מיועד לסנכרן את Claude Code בין מחשבים שונים**
> פשוט אמור ל-Claude: "קרא את CLAUDE-CONTEXT.md" והוא יבין את כל ההקשר!

---

## 📌 Quick Start for Claude

**למשתמש:** כשאתה פותח conversation חדש עם Claude ממחשב אחר, אמור:
> "היי Claude, אני עובד על פרויקט DBSmart-AI-System. קרא את CLAUDE-CONTEXT.md ואת BUILD-STATUS.md כדי להבין את המצב הנוכחי."

**ל-Claude:** קרא את הקבצים הבאים כדי להבין את ההקשר המלא:
1. `CLAUDE-CONTEXT.md` (זה!) - סקירה מהירה
2. `BUILD-STATUS.md` - מצב פיתוח מפורט
3. `HIGH-LEVEL-DESIGN.md` - ארכיטקטורה מלאה (אם צריך פרטים)

---

## 🎯 מה זה הפרויקט?

**DBSmart AI Ticket Analysis System v2.0**

**תיאור בקצרה:** מערכת אוטומטית מלאה שמנתחת טיקטי תמיכה של Zendesk באמצעות AI, מחפשת טיקטים דומים היסטוריים, מנתחת מטריקות ביצועים מ-SQL Sentry, ומפרסמת ניתוחי DBA מקצועיים בחזרה לטיקטים - **ללא התערבות אנושית**.

**טכנולוגיות עיקריות:**
- Azure Functions (.NET 8 Isolated) - 3 functions
- Azure GraphRAG (Cosmos DB + AI Search) - Knowledge graph
- Azure OpenAI GPT-4o - AI analysis
- Azure SQL Database - SQL Sentry metrics replica
- Zendesk API - Ticket source/destination

**ROI:** $2,300/month חיסכון נטו (159% ROI, payback ב-11.5 ימים)

---

## 📊 מצב נוכחי (Status)

**גרסה:** 2.0 (Fully Automated Architecture)
**שלב:** Design Complete, Implementation Starting
**התקדמות כללית:** ~10%

### ✅ הושלם:
1. **High-Level Design v2.0** (100%) - קובץ: `HIGH-LEVEL-DESIGN.md`
2. **Project Structure** (100%)
3. **Database Schemas** (100%) - ⚠️ Deprecated (v1.0), נשמר לרפרנס בלבד
4. **Frontend Apps** (100%) - ⚠️ Deprecated (v1.0), נשמר לרפרנס בלבד
5. **Backend API Structure** (30%) - ⚠️ Deprecated (v1.0), נשמר לרפרנס בלבד

### 🚧 בתהליך:
- **Azure Functions** (0%) - הצעד הבא!

### 📋 ממתין:
- Infrastructure as Code (Bicep templates)
- SQL Sentry data replication setup
- Testing & validation

**קובץ מפורט:** `BUILD-STATUS.md`

---

## 🗺️ Quick File Map - איפה מה נמצא?

### 📚 תיעוד (Documentation)
```
README.md                    → סקירת פרויקט כללית
HIGH-LEVEL-DESIGN.md         → ארכיטקטורה מלאה (200+ עמודים)
BUILD-STATUS.md              → סטטוס פיתוח מפורט + TODO list
QUICK-START.md               → מדריך מהיר למפתחים
CLAUDE-CONTEXT.md            → הקובץ הזה!
.gitignore                   → התעלמות מ-secrets ו-build files
```

### 🗄️ Database (Deprecated v1.0)
```
src/database/schemas/
├── 01-core-tables.sql       → 8 טבלאות (review queue - לא נדרש ב-v2.0)
├── 02-indexes.sql           → 25+ indexes + triggers
└── 03-views.sql             → 12 views
```
**⚠️ שימו לב:** הסכמות האלה היו ל-v1.0 (עם review queue). ב-v2.0 לא צריך SQL schemas כי אין review queue.

### 💻 Backend API (Deprecated v1.0)
```
src/backend/API/DBSmartAI.API/
├── DBSmartAI.API.csproj     → .NET 8 project
├── Program.cs               → Entry point
├── Controllers/             → Empty (not implemented)
├── Services/                → Empty (not implemented)
└── Models/                  → Empty (not implemented)
```
**⚠️ שימו לב:** ה-API הזה היה ל-v1.0. ב-v2.0 משתמשים רק ב-Azure Functions.

### 🎨 Frontend Apps (Deprecated v1.0)
```
src/frontend/
├── review-dashboard/        → React + TypeScript (Review Queue UI)
│   ├── src/components/      → QueueView, AnalysisReview, etc.
│   ├── src/store/           → Redux slices
│   ├── src/services/        → API client
│   └── package.json
│
└── admin-panel/             → React + TypeScript (Admin UI)
    ├── src/pages/           → Dashboard, Config, Triggers, Monitoring, etc.
    ├── src/store/           → Redux slices
    ├── src/services/        → API client
    └── package.json
```
**⚠️ שימו לב:** הfrontends האלה היו ל-v1.0 (עם review queue). ב-v2.0 אין UI - הכל אוטומטי.

### ⚙️ Azure Functions (To Be Created)
```
src/backend/Functions/       → 📋 טרם נוצר!
├── DBSmartAI.Functions.csproj
├── host.json
├── local.settings.json (template)
├── Functions/
│   ├── ZendeskIngestionFunction.cs
│   ├── GraphRAGIndexingFunction.cs
│   └── AIAnalysisFunction.cs
└── Services/
    ├── ZendeskClient.cs
    ├── CosmosDbRepository.cs
    ├── GraphRAGClient.cs
    ├── SqlSentryRepository.cs
    ├── OpenAIClient.cs
    └── ... (more services)
```

### 🏗️ Infrastructure (To Be Created)
```
infrastructure/bicep/        → 📋 טרם נוצר!
├── main.bicep
├── parameters.dev.json
├── parameters.prod.json
└── modules/
    ├── cosmos-db.bicep
    ├── ai-search.bicep
    ├── openai.bicep
    ├── sql-database.bicep
    ├── functions.bicep
    └── ... (more modules)
```

---

## 🔄 Data Flow - זרימת הנתונים (v2.0)

```
┌────────────────┐
│ Zendesk Tickets│ (טיקטים חדשים/מעודכנים)
└────────┬───────┘
         │ Daily 00:00 UTC
         ▼
┌────────────────────────────┐
│ Function 1: Ingestion      │ (טעינה ל-Cosmos DB)
│ ZendeskIngestionFunction   │
└────────┬───────────────────┘
         │ Event Grid
         ▼
┌────────────────────────────┐
│ Function 2: GraphRAG       │ (אינדוקס + embeddings)
│ GraphRAGIndexingFunction   │
└────────┬───────────────────┘
         │ Event Grid
         ▼
┌────────────────────────────┐
│ Function 3: AI Analysis    │ (ניתוח + פרסום)
│ AIAnalysisFunction         │
└────────┬───────────────────┘
         │ POST to Zendesk
         ▼
┌────────────────┐
│ Zendesk Ticket │ (תגובת AI מפורסמת אוטומטית)
└────────────────┘
```

**Key Point:** 100% אוטומטי - אין review queue, אין UI, אין אישור אנושי.

---

## 🎯 המשימה הבאה (Next Task)

**יצירת Azure Functions Project**

### שלב 1: Initialize Project (זה מה שצריך לעשות עכשיו!)
```bash
cd src/backend
mkdir Functions
cd Functions
func init --worker-runtime dotnet-isolated --target-framework net8.0
```

### שלב 2: Create 3 Functions
1. **ZendeskIngestionFunction** - Timer trigger (daily 00:00)
2. **GraphRAGIndexingFunction** - Event Grid trigger
3. **AIAnalysisFunction** - Event Grid trigger

### שלב 3: Implement Shared Services
- ZendeskClient (GET tickets, POST comments)
- CosmosDbRepository (CRUD for JSON docs)
- GraphRAGClient (vector search + graph queries)
- SqlSentryRepository (query metrics)
- OpenAIClient (GPT-4o analysis)
- EntityExtractor (regex-based entity extraction)
- ConfidenceScorer (calculate confidence)
- MarkdownFormatter (format for Zendesk)

**פרטים מלאים:** `BUILD-STATUS.md` → "🚧 In Progress" → "Azure Functions"

---

## 💡 טיפים לעבודה עם Claude

### 📖 שאלות נפוצות:

**"איפה מסמך הארכיטקטורה?"**
→ `HIGH-LEVEL-DESIGN.md` (15 sections, ~200 pages)

**"מה המצב הנוכחי של הפרויקט?"**
→ `BUILD-STATUS.md`

**"איך אני מתחיל לעבוד על Azure Functions?"**
→ `BUILD-STATUS.md` → חפש "Azure Functions (0% - Starting Now)"

**"מה הטכנולוגיות שבשימוש?"**
→ .NET 8, Azure Functions, Cosmos DB, GraphRAG, OpenAI GPT-4o, Zendesk API

**"למה יש frontend apps אם זה fully automated?"**
→ זה deprecated מ-v1.0. ב-v2.0 החלטנו על automation מלא ללא UI.

### 🔍 פקודות שימושיות ל-Claude:

```plaintext
"קרא את HIGH-LEVEL-DESIGN.md סעיף 3" - ארכיטקטורה
"קרא את BUILD-STATUS.md" - מצב נוכחי
"הראה לי את מבנה התיקיות של Azure Functions" - תכנון
"מה הצעד הבא?" - המשימה הנוכחית
"צור Azure Function עבור Zendesk Ingestion" - יישום
```

### 📝 פקודות Git לסנכרון:

**במחשב הנוכחי - שמור עבודה:**
```bash
git add .
git commit -m "תיאור מה שעשיתי"
git push
```

**במחשב אחר - קבל עדכונים:**
```bash
git pull
```

---

## 🔐 Security Notes - חשוב!

### ❌ אל תעלה ל-GitHub:
- API Keys (Zendesk, OpenAI, Azure)
- Connection Strings
- Passwords
- קבצים: `local.settings.json`, `appsettings.json`, `.env`

### ✅ כבר מוגדר ב-.gitignore:
- `*.env`
- `**/local.settings.json`
- `**/appsettings.json`
- `secrets.json`
- `node_modules/`
- `bin/`, `obj/`, `build/`

### 💡 טיפ:
השתמש ב-template files:
- `local.settings.template.json` ✅ (עולה ל-GitHub)
- `local.settings.json` ❌ (לא עולה)

---

## 📦 Dependencies Summary

### Azure Functions (.NET 8)
```xml
Microsoft.Azure.Functions.Worker
Microsoft.Azure.Functions.Worker.Extensions.Timer
Microsoft.Azure.Functions.Worker.Extensions.EventGrid
Azure.AI.OpenAI
Azure.Search.Documents
Microsoft.Azure.Cosmos
Microsoft.Data.SqlClient
Azure.Identity
Azure.Security.KeyVault.Secrets
```

### Frontend (Deprecated - but in repo)
```json
react@18, typescript@5, antd@6
@reduxjs/toolkit@2, react-router-dom@7
axios@1, @microsoft/signalr@10, recharts@3
```

---

## 💰 Cost Estimate

**Monthly:** $1,060-$1,450
- Azure Functions: $50
- Cosmos DB: $100-200
- AI Search: $75
- SQL Database: $300
- OpenAI (GPT-4o + embeddings): $350-500
- Storage + AppInsights + KeyVault: $70

**ROI:** 159% ($2,300 net savings/month)

---

## 🔗 Important Links

- **GitHub Repo:** https://github.com/ShalevBartal/DBSmart-AI-System
- **Main Branch:** `main`

---

## 📞 Contact

**Developer:** Shalev Bartal
**Email:** shalevbartal@gmail.com
**Git User:** Shalev Bartal

---

## 🤖 For Claude: Quick Summary

**Project:** Fully automated AI ticket analysis system
**Tech Stack:** Azure Functions + GraphRAG + OpenAI GPT-4o + Zendesk
**Current Phase:** Design complete (v2.0), starting Azure Functions implementation
**Next Task:** Create Azure Functions project with 3 functions
**Architecture:** Event-driven batch pipeline (daily processing)
**No UI:** Fully automated - posts directly to Zendesk

**Important Files to Read:**
1. `CLAUDE-CONTEXT.md` (this file)
2. `BUILD-STATUS.md` (current status + TODO)
3. `HIGH-LEVEL-DESIGN.md` (full architecture - read if need details)

**Deprecated (v1.0 - kept for reference):**
- Frontend apps (review-dashboard, admin-panel)
- Backend API (ASP.NET Core)
- Database schemas (SQL Server tables for review queue)

**v2.0 Architecture:**
- 3 Azure Functions (serverless)
- No review queue
- No human approval
- 100% autonomous

---

**Last Updated:** January 25, 2026
**Version:** 2.0
**Status:** Implementation Phase

---

## 🎬 Usage Example

**במחשב חדש:**
```bash
git clone https://github.com/ShalevBartal/DBSmart-AI-System.git
cd DBSmart-AI-System

# פתח Claude Code
# אמור ל-Claude:
```

> "היי Claude! אני עובד על פרויקט DBSmart-AI-System.
> קרא את CLAUDE-CONTEXT.md ואת BUILD-STATUS.md.
> בוא נמשיך לעבוד על יצירת Azure Functions."

**Claude יבין מיד את כל ההקשר ויוכל להמשיך מאיפה שעצרת! 🚀**

---

**End of Context File**
