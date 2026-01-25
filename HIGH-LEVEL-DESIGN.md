# DBSmart AI Ticket Analysis System
## High-Level Design Document

**Version:** 2.0
**Date:** January 25, 2026
**Author:** Engineering Team
**Status:** Design Review

---

## 1. Executive Summary

### 1.1 Purpose
This document describes the high-level architecture and design for the DBSmart AI Ticket Analysis System - a fully automated intelligent platform that leverages Azure GraphRAG, Azure OpenAI, and SQL Sentry data to automatically analyze Zendesk support tickets and post expert-level DBA recommendations directly to tickets.

### 1.2 Business Problem
DBChief and DBNinja teams currently spend 25-30 minutes per ticket manually analyzing database performance issues, correlating SQL Sentry monitoring data, and researching similar historical cases. This manual process:
- Consumes significant expert resources
- Lacks consistency across analysts
- Doesn't leverage institutional knowledge effectively
- Scales poorly as ticket volume increases
- Creates response time delays

### 1.3 Solution Overview
A **fully automated** AI-powered analysis system that:
- **Automatically ingests** new/updated Zendesk tickets every 24 hours into Azure storage
- **Indexes all data** (tickets + Knowledge Base articles) in Azure GraphRAG for semantic search
- **Syncs SQL Sentry metrics** to Azure SQL Database for correlation analysis
- **Identifies similar patterns** using GraphRAG semantic search and graph relationships
- **Correlates performance data** from SQL Sentry with ticket symptoms
- **Generates comprehensive analysis** using Azure OpenAI with custom AI agent
- **Posts responses automatically** back to Zendesk tickets via API
- **No human intervention required** - fully autonomous operation

### 1.4 Key Architectural Principles
1. **Event-Driven**: Daily batch processing triggered by Azure Timer Functions
2. **Knowledge Graph-First**: All tickets, KB articles, and resolutions indexed in GraphRAG
3. **Data Correlation**: SQL Sentry metrics synchronized to Azure SQL for temporal analysis
4. **AI Agent-Based**: Azure OpenAI agent with structured system prompt for consistent output
5. **Fully Automated**: Zero-touch operation from ticket creation to response posting

### 1.5 Expected Benefits
- **95% time reduction** per ticket (30 min manual → 1-2 min automated)
- **Consistent analysis quality** across all tickets
- **24/7 operation** with daily batch processing
- **Knowledge retention** through GraphRAG embeddings of tickets + KB articles
- **Scalable operations** handles 100+ tickets/day with no additional headcount
- **Immediate insights** leveraging institutional knowledge automatically

---

## 2. System Architecture

### 2.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           ZENDESK (SOURCE)                               │
│  • New/Updated Tickets                                                   │
│  • Knowledge Base Articles (KB)                                          │
│  • Customer Information                                                  │
└────────────────────────────┬────────────────────────────────────────────┘
                             │ Daily Sync (00:00 UTC)
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              AZURE INGESTION LAYER (Timer Function 1)                    │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │  Zendesk Data Ingestion Function                              │     │
│  │  • Fetch new/updated tickets (last 24 hours)                  │     │
│  │  • Fetch KB articles (if updated)                             │     │
│  │  • Store as JSON in Azure Blob Storage / Cosmos DB            │     │
│  └───────────────────────┬───────────────────────────────────────┘     │
└────────────────────────────┼────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    AZURE DATA STORAGE LAYER                              │
│  ┌──────────────────────────────┐   ┌──────────────────────────────┐  │
│  │  Azure Cosmos DB / Blob      │   │  Azure SQL Database          │  │
│  │  (JSON Document Store)       │   │  (SQL Sentry Replica)        │  │
│  │  ───────────────────────     │   │  ──────────────────────      │  │
│  │  • Ticket JSON documents     │   │  • Performance Metrics       │  │
│  │  • KB Article JSON docs      │   │  • Query Execution Stats     │  │
│  │  • Customer metadata         │   │  • Deadlock Information      │  │
│  │  • Historical resolutions    │   │  • Alert History             │  │
│  └──────────┬───────────────────┘   └────────┬─────────────────────┘  │
└─────────────┼──────────────────────────────────┼────────────────────────┘
              │                                  │
              │ Triggers GraphRAG Indexing       │ Queried by Analysis Engine
              ▼                                  │
┌─────────────────────────────────────────────────────────────────────────┐
│              AZURE GRAPHRAG INDEXING (Timer Function 2)                  │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │  GraphRAG Indexing Function (runs after ingestion)            │     │
│  │  • Reads new JSON documents from Cosmos DB/Blob               │     │
│  │  • Extracts entities (servers, databases, error codes)        │     │
│  │  • Generates vector embeddings (Azure OpenAI)                 │     │
│  │  • Builds knowledge graph relationships                       │     │
│  │  • Updates similarity connections (SIMILAR_TO edges)          │     │
│  └───────────────────────┬───────────────────────────────────────┘     │
└────────────────────────────┼────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    AZURE GRAPHRAG KNOWLEDGE GRAPH                        │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │  Cosmos DB (Graph) + Azure AI Search (Vector Search)          │     │
│  │  ────────────────────────────────────────────────────         │     │
│  │  NODES:                                                        │     │
│  │    • Ticket (id, title, description, embeddings)              │     │
│  │    • Customer (id, name, environment)                         │     │
│  │    • Server (name, customer_id)                               │     │
│  │    • Database (name, server)                                  │     │
│  │    • KBArticle (id, title, content, embeddings)               │     │
│  │    • Resolution (text, ticket_id, resolution_date)            │     │
│  │                                                                │     │
│  │  RELATIONSHIPS:                                                │     │
│  │    • Customer -HAS_TICKET-> Ticket                            │     │
│  │    • Ticket -AFFECTS-> Server/Database                        │     │
│  │    • Ticket -SIMILAR_TO-> Ticket (similarity score >0.85)     │     │
│  │    • Ticket -RESOLVED_BY-> Resolution                         │     │
│  │    • Ticket -RELATES_TO-> KBArticle (semantic relevance)      │     │
│  │    • KBArticle -APPLIES_TO-> Server/Database                  │     │
│  └───────────────────────┬───────────────────────────────────────┘     │
└────────────────────────────┼────────────────────────────────────────────┘
                             │
                             │ Queried by AI Analysis Engine
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│            AZURE AI ANALYSIS ENGINE (Timer Function 3)                   │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │  AI Analysis Orchestrator Function                             │     │
│  │  ──────────────────────────────────                            │     │
│  │  FOR EACH new ticket:                                          │     │
│  │                                                                 │     │
│  │  1. DATA COLLECTION:                                           │     │
│  │     ├─ GraphRAG Query: Get ticket details + entities           │     │
│  │     ├─ GraphRAG Semantic Search: Find similar tickets          │     │
│  │     ├─ GraphRAG Graph Traversal: Same customer+server tickets  │     │
│  │     ├─ GraphRAG KB Search: Find relevant KB articles           │     │
│  │     └─ SQL Sentry Query: Get metrics (±2hrs from ticket time)  │     │
│  │                                                                 │     │
│  │  2. CONTEXT ASSEMBLY:                                          │     │
│  │     ├─ Ticket: description, customer, servers, DBs, errors     │     │
│  │     ├─ Similar Cases: Top 5 similar tickets + resolutions      │     │
│  │     ├─ KB Articles: Relevant articles for this issue type      │     │
│  │     ├─ SQL Sentry: Performance metrics, alerts, queries        │     │
│  │     └─ Baselines: 7-day/30-day averages for comparison         │     │
│  │                                                                 │     │
│  │  3. AI AGENT INVOCATION:                                       │     │
│  │     ├─ Call Azure OpenAI API (GPT-4o model)                    │     │
│  │     ├─ System Prompt: DBA expert persona + output structure    │     │
│  │     ├─ User Prompt: Assembled context package (JSON)           │     │
│  │     └─ Response: Structured analysis (JSON format)             │     │
│  │                                                                 │     │
│  │  4. ANALYSIS VALIDATION:                                       │     │
│  │     ├─ Parse JSON response                                     │     │
│  │     ├─ Validate structure completeness                         │     │
│  │     ├─ Calculate confidence score                              │     │
│  │     └─ Format for Zendesk posting                              │     │
│  │                                                                 │     │
│  │  5. POST TO ZENDESK:                                           │     │
│  │     ├─ Format analysis as internal comment (markdown)          │     │
│  │     ├─ POST to Zendesk API: /tickets/{id}/comments             │     │
│  │     ├─ Tag ticket: "ai-analyzed", confidence level             │     │
│  │     └─ Log results to Azure Application Insights              │     │
│  └─────────────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     ZENDESK API (DESTINATION)                            │
│  • Ticket updated with AI analysis comment                              │
│  • Tags added: ai-analyzed, confidence-high/medium/low                  │
│  • DBChief/DBNinja can review and take action                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow Sequence

**Daily Batch Processing (3-Phase Pipeline)**

#### Phase 1: Data Ingestion (00:00 UTC)
```
Timer Trigger → Zendesk Ingestion Function
├─ Query Zendesk API:
│  ├─ GET /api/v2/tickets.json?updated_at>=last_24h
│  └─ GET /api/v2/help_center/articles.json (if KB updated)
├─ For each ticket/article:
│  ├─ Extract JSON payload
│  ├─ Parse custom fields (server_name, db_name, error_code)
│  └─ Store to Azure Cosmos DB / Blob Storage
└─ Trigger: GraphRAG Indexing Function
```

#### Phase 2: GraphRAG Indexing (00:30 UTC)
```
Event Trigger (after ingestion) → GraphRAG Indexing Function
├─ Read new/updated JSON docs from Cosmos DB/Blob
├─ For each document:
│  ├─ Entity Extraction (NER):
│  │  ├─ Server names (regex patterns)
│  │  ├─ Database names
│  │  ├─ Error codes/messages
│  │  └─ Customer identifiers
│  ├─ Generate Vector Embeddings:
│  │  ├─ Call Azure OpenAI: text-embedding-ada-002
│  │  ├─ Input: ticket description + KB article content
│  │  └─ Output: 1536-dim vectors
│  ├─ Create/Update Graph Nodes:
│  │  ├─ Ticket node with metadata + embeddings
│  │  ├─ Customer, Server, Database nodes
│  │  └─ KBArticle nodes
│  ├─ Create Relationships:
│  │  ├─ Customer -HAS_TICKET-> Ticket
│  │  ├─ Ticket -AFFECTS-> Server/Database
│  │  ├─ Ticket -RELATES_TO-> KBArticle (if semantic match >0.80)
│  │  └─ Ticket -RESOLVED_BY-> Resolution (for closed tickets)
│  └─ Compute Similarity Edges:
│     ├─ Cosine similarity on embeddings
│     ├─ Create SIMILAR_TO edge if score >0.85
│     └─ Store relevance score as edge property
└─ Trigger: AI Analysis Function
```

#### Phase 3: AI Analysis & Posting (01:00 UTC)
```
Event Trigger (after indexing) → AI Analysis Function
├─ Query GraphRAG: Get new tickets (created in last 24h)
├─ FOR EACH new ticket:
│  │
│  ├─ Step 1: DATA COLLECTION
│  │  ├─ GraphRAG Queries:
│  │  │  ├─ Get ticket details (description, entities, metadata)
│  │  │  ├─ Semantic search: SIMILAR_TO tickets (top 5, score >0.85)
│  │  │  ├─ Graph traversal: Same customer + same server tickets
│  │  │  └─ KB article search: Semantic match to ticket description
│  │  └─ SQL Sentry Queries:
│  │     ├─ Time window: ticket_created_at ± 2 hours
│  │     ├─ Filter: server_name from ticket entities
│  │     ├─ Fetch:
│  │     │  ├─ Performance metrics (CPU, memory, I/O, waits)
│  │     │  ├─ Query stats (slow queries, execution plans, blocking)
│  │     │  ├─ Deadlock graphs (if error mentions deadlock)
│  │     │  └─ Alert history (alerts fired around incident time)
│  │     └─ Baselines: 7-day and 30-day averages
│  │
│  ├─ Step 2: CONTEXT ASSEMBLY
│  │  └─ Build JSON context package:
│  │     {
│  │       "ticket": {
│  │         "id": "ZD-12345",
│  │         "title": "...",
│  │         "description": "...",
│  │         "customer_id": "...",
│  │         "entities": {
│  │           "servers": ["SERVER-01"],
│  │           "databases": ["ProductionDB"],
│  │           "error_codes": ["1205 (deadlock)"]
│  │         }
│  │       },
│  │       "similar_tickets": [
│  │         {
│  │           "ticket_id": "ZD-11234",
│  │           "similarity_score": 0.92,
│  │           "resolution": "Resolved by rebuilding index IX_Orders...",
│  │           "relevance": "Same customer, same error, same DB"
│  │         }
│  │       ],
│  │       "kb_articles": [
│  │         {
│  │           "article_id": "KB-456",
│  │           "title": "Resolving Deadlocks in High-Volume OLTP",
│  │           "relevance_score": 0.88,
│  │           "key_recommendations": ["..."]
│  │         }
│  │       ],
│  │       "sql_sentry_metrics": {
│  │         "time_window": "2026-01-25 09:00 - 13:00",
│  │         "performance": {
│  │           "cpu_percent": {"current": 98, "baseline_7d": 35},
│  │           "memory_mb": {"current": 15800, "baseline_7d": 8200},
│  │           "disk_io_ms": {"current": 250, "baseline_7d": 45}
│  │         },
│  │         "query_analysis": {
│  │           "slow_queries": [
│  │             {"query_hash": "0x...", "avg_duration_ms": 8500, ...}
│  │           ],
│  │           "blocking_chains": [...]
│  │         },
│  │         "deadlocks": [
│  │           {"deadlock_graph": "...", "victim": "..."}
│  │         ],
│  │         "alerts": [
│  │           {"alert_name": "High CPU", "fired_at": "09:45"}
│  │         ]
│  │       }
│  │     }
│  │
│  ├─ Step 3: AI AGENT INVOCATION
│  │  ├─ Call Azure OpenAI API:
│  │  │  ├─ Model: GPT-4o
│  │  │  ├─ System Prompt:
│  │  │  │  """
│  │  │  │  You are an expert Microsoft SQL Server DBA with 15+ years
│  │  │  │  of experience analyzing performance issues, deadlocks, and
│  │  │  │  high-availability scenarios. You provide clear, actionable
│  │  │  │  analysis following this structure:
│  │  │  │
│  │  │  │  1. Executive Summary (2-3 sentences)
│  │  │  │  2. Symptom Analysis (what is happening)
│  │  │  │  3. Data Correlations (SQL Sentry metrics analysis)
│  │  │  │  4. Root Cause Analysis (why it happened)
│  │  │  │  5. Immediate Remediation (how to fix now)
│  │  │  │  6. Prevention Recommendations (avoid recurrence)
│  │  │  │  7. Related KB Articles (if applicable)
│  │  │  │  8. Similar Historical Cases (reference ticket IDs)
│  │  │  │
│  │  │  │  CRITICAL: Output ONLY valid JSON matching this schema:
│  │  │  │  {
│  │  │  │    "confidence_level": "High|Medium|Low",
│  │  │  │    "confidence_score": 0-100,
│  │  │  │    "executive_summary": "...",
│  │  │  │    "symptom_analysis": {...},
│  │  │  │    "data_correlations": [...],
│  │  │  │    "root_cause_analysis": {...},
│  │  │  │    "immediate_remediation": {...},
│  │  │  │    "prevention_recommendations": {...},
│  │  │    "kb_articles_referenced": [...],
│  │  │    "similar_tickets_referenced": [...]
│  │  │  }
│  │  │  │  """
│  │  │  ├─ User Prompt: JSON context package from Step 2
│  │  │  └─ Parameters:
│  │  │     ├─ temperature: 0.3 (consistent, factual)
│  │  │     ├─ max_tokens: 2500
│  │  │     └─ response_format: { "type": "json_object" }
│  │  └─ Receive: Structured JSON analysis
│  │
│  ├─ Step 4: VALIDATION & CONFIDENCE SCORING
│  │  ├─ Parse JSON response
│  │  ├─ Validate schema completeness
│  │  ├─ Calculate confidence score (if not provided):
│  │  │  ├─ Data completeness (40%): All data sources available?
│  │  │  ├─ Correlation strength (30%): Clear SQL Sentry correlation?
│  │  │  └─ Similar ticket availability (30%): Found similar cases?
│  │  ├─ Assign confidence level:
│  │  │  ├─ High: >80% (strong evidence, clear resolution path)
│  │  │  ├─ Medium: 50-80% (partial data, weaker correlation)
│  │  │  └─ Low: <50% (insufficient data, unclear cause)
│  │  └─ Format for Zendesk:
│  │     └─ Convert JSON to markdown with proper formatting
│  │
│  └─ Step 5: POST TO ZENDESK
│     ├─ Format markdown comment:
│     │  """
│     │  ## 🤖 AI Analysis Report
│     │  **Confidence Level:** {confidence_level} ({confidence_score}%)
│     │  **Analyzed:** {timestamp}
│     │
│     │  ### Executive Summary
│     │  {executive_summary}
│     │
│     │  ### Symptom Analysis
│     │  {symptom_analysis formatted}
│     │
│     │  ### Data Correlations (SQL Sentry)
│     │  {data_correlations formatted as table}
│     │
│     │  ### Root Cause Analysis
│     │  {root_cause_analysis formatted}
│     │
│     │  ### Immediate Remediation Steps
│     │  {immediate_remediation formatted as checklist}
│     │
│     │  ### Prevention Recommendations
│     │  {prevention_recommendations formatted}
│     │
│     │  ### Related Resources
│     │  - KB Articles: {kb_articles_referenced}
│     │  - Similar Cases: {similar_tickets_referenced}
│     │
│     │  ---
│     │  *Generated by DBSmart AI Analysis System*
│     │  *For questions or feedback, contact the DBA team*
│     │  """
│     ├─ POST to Zendesk API:
│     │  ├─ Endpoint: /api/v2/tickets/{ticket_id}/comments
│     │  ├─ Payload:
│     │  │  {
│     │  │    "comment": {
│     │  │      "body": "{formatted_markdown}",
│     │  │      "public": false  // internal note
│     │  │    }
│     │  │  }
│     │  └─ Authentication: API token
│     ├─ Tag ticket:
│     │  ├─ POST /api/v2/tickets/{ticket_id}/tags
│     │  └─ Tags: ["ai-analyzed", "confidence-{level}"]
│     └─ Log to Azure Application Insights:
│        ├─ Success/failure status
│        ├─ Processing time
│        ├─ Token usage (input/output)
│        └─ Confidence score
│
└─ Analysis Complete for All Tickets
```

---

## 3. Component Details

### 3.1 Azure Timer Functions

#### Function 1: Zendesk Data Ingestion
**Trigger:** Timer (daily at 00:00 UTC)
**Runtime:** .NET 8 Isolated
**Responsibility:**
- Fetch new/updated tickets from Zendesk (last 24 hours)
- Fetch KB articles (if updated)
- Store JSON documents in Azure Cosmos DB or Blob Storage

**Implementation:**
```csharp
[Function("ZendeskIngestion")]
public async Task RunIngestion(
    [TimerTrigger("0 0 0 * * *")] TimerInfo timer,
    FunctionContext context)
{
    // 1. Query Zendesk API
    var tickets = await _zendeskClient.GetTickets(
        startDate: DateTime.UtcNow.AddDays(-1),
        endDate: DateTime.UtcNow
    );

    var kbArticles = await _zendeskClient.GetKBArticles(
        updatedSince: DateTime.UtcNow.AddDays(-1)
    );

    // 2. Store to Cosmos DB / Blob
    foreach (var ticket in tickets)
    {
        await _cosmosClient.UpsertDocument(
            collectionName: "tickets",
            document: ticket,
            partitionKey: ticket.CustomerId
        );
    }

    foreach (var article in kbArticles)
    {
        await _cosmosClient.UpsertDocument(
            collectionName: "kb_articles",
            document: article,
            partitionKey: article.CategoryId
        );
    }

    // 3. Trigger GraphRAG Indexing
    await _eventGridClient.PublishEvent(new {
        EventType = "ZendeskIngestionCompleted",
        Data = new { TicketCount = tickets.Count, KBCount = kbArticles.Count }
    });
}
```

#### Function 2: GraphRAG Indexing
**Trigger:** Event Grid (after ingestion completes)
**Runtime:** .NET 8 Isolated
**Responsibility:**
- Read new JSON documents from Cosmos DB/Blob
- Extract entities (servers, databases, error codes)
- Generate vector embeddings via Azure OpenAI
- Build/update GraphRAG knowledge graph
- Compute similarity relationships

**Implementation:**
```csharp
[Function("GraphRAGIndexing")]
public async Task RunIndexing(
    [EventGridTrigger] EventGridEvent eventGridEvent,
    FunctionContext context)
{
    // 1. Get new documents
    var newTickets = await _cosmosClient.QueryDocuments(
        collectionName: "tickets",
        filter: $"_ts >= {DateTime.UtcNow.AddDays(-1).Ticks}"
    );

    foreach (var ticket in newTickets)
    {
        // 2. Entity Extraction
        var entities = _entityExtractor.Extract(ticket);

        // 3. Generate Embeddings
        var embedding = await _openAIClient.GetEmbedding(
            text: $"{ticket.Title} {ticket.Description}",
            model: "text-embedding-ada-002"
        );

        // 4. Create Graph Nodes & Relationships
        await _graphRAGClient.UpsertNode(
            nodeType: "Ticket",
            id: ticket.Id,
            properties: new {
                title = ticket.Title,
                description = ticket.Description,
                customerId = ticket.CustomerId,
                createdAt = ticket.CreatedAt,
                embedding = embedding
            }
        );

        foreach (var server in entities.Servers)
        {
            await _graphRAGClient.CreateRelationship(
                from: $"Ticket:{ticket.Id}",
                to: $"Server:{server}",
                type: "AFFECTS"
            );
        }

        // 5. Compute Similarities
        var similarTickets = await _graphRAGClient.VectorSearch(
            embedding: embedding,
            topK: 10,
            similarityThreshold: 0.85
        );

        foreach (var similar in similarTickets)
        {
            await _graphRAGClient.CreateRelationship(
                from: $"Ticket:{ticket.Id}",
                to: $"Ticket:{similar.Id}",
                type: "SIMILAR_TO",
                properties: new { score = similar.Score }
            );
        }
    }

    // Trigger AI Analysis
    await _eventGridClient.PublishEvent(new {
        EventType = "GraphRAGIndexingCompleted"
    });
}
```

#### Function 3: AI Analysis & Zendesk Posting
**Trigger:** Event Grid (after indexing completes)
**Runtime:** .NET 8 Isolated
**Responsibility:**
- Query GraphRAG for new tickets
- Collect context (similar tickets, KB articles, SQL Sentry metrics)
- Call Azure OpenAI for analysis
- Post results to Zendesk

**Implementation:**
```csharp
[Function("AIAnalysis")]
public async Task RunAnalysis(
    [EventGridTrigger] EventGridEvent eventGridEvent,
    FunctionContext context)
{
    // 1. Get new tickets from GraphRAG
    var newTickets = await _graphRAGClient.Query(@"
        MATCH (t:Ticket)
        WHERE t.createdAt >= datetime() - duration('P1D')
        RETURN t
    ");

    foreach (var ticket in newTickets)
    {
        // 2. Collect Context
        var context = await CollectContextAsync(ticket);

        // 3. Call Azure OpenAI
        var analysis = await _openAIClient.Chat.CreateChatCompletion(
            model: "gpt-4o",
            messages: new[] {
                new { role = "system", content = DBA_EXPERT_SYSTEM_PROMPT },
                new { role = "user", content = JsonSerializer.Serialize(context) }
            },
            temperature: 0.3,
            responseFormat: new { type = "json_object" }
        );

        var analysisJson = JsonSerializer.Deserialize<AnalysisResult>(
            analysis.Choices[0].Message.Content
        );

        // 4. Validate & Calculate Confidence
        var confidenceScore = CalculateConfidence(context, analysisJson);
        analysisJson.ConfidenceScore = confidenceScore;

        // 5. Format for Zendesk
        var markdown = FormatAsMarkdown(analysisJson);

        // 6. Post to Zendesk
        await _zendeskClient.AddComment(
            ticketId: ticket.Id,
            comment: markdown,
            isPublic: false
        );

        await _zendeskClient.AddTags(
            ticketId: ticket.Id,
            tags: new[] {
                "ai-analyzed",
                $"confidence-{analysisJson.ConfidenceLevel.ToLower()}"
            }
        );

        // 7. Log Metrics
        _telemetry.TrackEvent("AIAnalysisCompleted", new {
            TicketId = ticket.Id,
            ConfidenceLevel = analysisJson.ConfidenceLevel,
            ProcessingTimeMs = stopwatch.ElapsedMilliseconds,
            TokensUsed = analysis.Usage.TotalTokens
        });
    }
}

private async Task<AnalysisContext> CollectContextAsync(Ticket ticket)
{
    var context = new AnalysisContext();

    // GraphRAG queries
    context.SimilarTickets = await _graphRAGClient.Query($@"
        MATCH (t:Ticket {{id: '{ticket.Id}'}})-[r:SIMILAR_TO]->(similar:Ticket)
        WHERE r.score > 0.85
        MATCH (similar)-[:RESOLVED_BY]->(res:Resolution)
        RETURN similar, r.score as score, res
        ORDER BY r.score DESC
        LIMIT 5
    ");

    context.KBArticles = await _graphRAGClient.VectorSearch(
        query: ticket.Description,
        nodeType: "KBArticle",
        topK: 3,
        threshold: 0.80
    );

    // SQL Sentry queries
    var timeWindow = (ticket.CreatedAt.AddHours(-2), ticket.CreatedAt.AddHours(2));
    context.SQLSentryMetrics = await _sqlSentryRepo.GetMetrics(
        serverName: ticket.Entities.Servers[0],
        startTime: timeWindow.Item1,
        endTime: timeWindow.Item2
    );

    return context;
}
```

### 3.2 Azure Cosmos DB (JSON Document Store)

**Purpose:** Store raw ticket and KB article JSON documents

**Collections:**
- `tickets`: All Zendesk tickets
- `kb_articles`: All Knowledge Base articles
- `resolutions`: Closed ticket resolution notes

**Partition Key:** `customerId` (for tickets), `categoryId` (for KB articles)

**Document Schema Example:**
```json
{
  "id": "ZD-12345",
  "customerId": "CUST-001",
  "title": "High CPU on SERVER-01",
  "description": "Customer reports slow queries...",
  "status": "new",
  "priority": "high",
  "createdAt": "2026-01-25T10:00:00Z",
  "updatedAt": "2026-01-25T10:00:00Z",
  "customFields": {
    "serverName": "SERVER-01",
    "databaseName": "ProductionDB",
    "errorCode": "1205"
  },
  "tags": [],
  "_ts": 1737802800
}
```

### 3.3 Azure SQL Database (SQL Sentry Replica)

**Purpose:** Replicate SQL Sentry monitoring data for analysis correlation

**Replication Strategy:**
- **Option A:** Azure Data Factory pipeline (daily sync)
- **Option B:** SQL Server Replication (near real-time)
- **Option C:** Change Data Capture (CDC) + Event Hubs

**Key Tables:**
```sql
-- Performance Metrics
CREATE TABLE performance_metrics (
    id BIGINT IDENTITY PRIMARY KEY,
    server_name NVARCHAR(100) NOT NULL,
    timestamp DATETIME2 NOT NULL,
    cpu_percent DECIMAL(5,2),
    memory_used_mb INT,
    disk_io_ms INT,
    page_life_expectancy INT,
    INDEX IX_server_time (server_name, timestamp)
);

-- Query Execution Stats
CREATE TABLE query_execution_stats (
    id BIGINT IDENTITY PRIMARY KEY,
    server_name NVARCHAR(100) NOT NULL,
    database_name NVARCHAR(100),
    query_hash NVARCHAR(64),
    execution_time DATETIME2 NOT NULL,
    duration_ms INT,
    cpu_time_ms INT,
    logical_reads BIGINT,
    execution_plan_xml NVARCHAR(MAX),
    INDEX IX_server_time (server_name, execution_time)
);

-- Deadlock Events
CREATE TABLE deadlock_events (
    id BIGINT IDENTITY PRIMARY KEY,
    server_name NVARCHAR(100) NOT NULL,
    occurred_at DATETIME2 NOT NULL,
    deadlock_graph_xml NVARCHAR(MAX),
    victim_spid INT,
    victim_query NVARCHAR(MAX),
    INDEX IX_server_time (server_name, occurred_at)
);

-- Alert History
CREATE TABLE alert_history (
    id BIGINT IDENTITY PRIMARY KEY,
    server_name NVARCHAR(100) NOT NULL,
    alert_name NVARCHAR(200) NOT NULL,
    fired_at DATETIME2 NOT NULL,
    severity NVARCHAR(20),
    message NVARCHAR(MAX),
    INDEX IX_server_time (server_name, fired_at)
);
```

### 3.4 Azure GraphRAG Knowledge Graph

**Components:**
- **Cosmos DB (Graph):** Stores nodes and relationships
- **Azure AI Search:** Provides vector search capabilities
- **Azure OpenAI Embeddings:** Generates vector embeddings

**Graph Schema:**

**Nodes:**
```
Ticket {
  id: string (ZD-12345)
  title: string
  description: string
  customerId: string
  createdAt: datetime
  status: string
  embedding: vector[1536]
}

Customer {
  id: string (CUST-001)
  name: string
  environment: string
}

Server {
  name: string (SERVER-01)
  customerId: string
}

Database {
  name: string (ProductionDB)
  serverName: string
}

KBArticle {
  id: string (KB-456)
  title: string
  content: string
  category: string
  embedding: vector[1536]
}

Resolution {
  text: string
  ticketId: string
  resolvedAt: datetime
}
```

**Relationships:**
```
(Customer)-[:HAS_TICKET]->(Ticket)
(Ticket)-[:AFFECTS]->(Server)
(Ticket)-[:AFFECTS]->(Database)
(Ticket)-[:SIMILAR_TO {score: float}]->(Ticket)
(Ticket)-[:RESOLVED_BY]->(Resolution)
(Ticket)-[:RELATES_TO {relevance: float}]->(KBArticle)
(KBArticle)-[:APPLIES_TO]->(Server)
(KBArticle)-[:APPLIES_TO]->(Database)
```

**Query Examples:**

```cypher
// Find similar tickets for analysis
MATCH (t:Ticket {id: 'ZD-12345'})-[r:SIMILAR_TO]->(similar:Ticket)
WHERE r.score > 0.85
MATCH (similar)-[:RESOLVED_BY]->(res:Resolution)
RETURN similar.id, similar.title, r.score, res.text
ORDER BY r.score DESC
LIMIT 5

// Find relevant KB articles
MATCH (t:Ticket {id: 'ZD-12345'})-[r:RELATES_TO]->(kb:KBArticle)
WHERE r.relevance > 0.80
RETURN kb.id, kb.title, kb.content, r.relevance
ORDER BY r.relevance DESC
LIMIT 3

// Find all tickets affecting same server for same customer
MATCH (c:Customer {id: 'CUST-001'})-[:HAS_TICKET]->(t:Ticket)
MATCH (t)-[:AFFECTS]->(s:Server {name: 'SERVER-01'})
WHERE t.createdAt >= datetime() - duration('P30D')
RETURN t.id, t.title, t.createdAt
ORDER BY t.createdAt DESC
```

### 3.5 Azure OpenAI Service

**Models Used:**

1. **text-embedding-ada-002**
   - Purpose: Generate vector embeddings for semantic search
   - Input: Ticket descriptions, KB article content
   - Output: 1536-dimensional vectors
   - Cost: $0.0001 per 1K tokens

2. **gpt-4o**
   - Purpose: Generate DBA-level ticket analysis
   - Input: Context package (ticket + similar cases + KB + SQL Sentry data)
   - Output: Structured JSON analysis
   - Cost: $5/1M input tokens, $15/1M output tokens

**System Prompt for Analysis Agent:**
```
You are an expert Microsoft SQL Server DBA with 15+ years of experience
analyzing performance issues, deadlocks, blocking, availability problems,
and data integrity issues. You have deep knowledge of:

- SQL Server internals (query optimizer, storage engine, transaction log)
- Performance tuning (indexing, query optimization, parameter sniffing)
- High availability (AlwaysOn, failover clustering, replication)
- Troubleshooting (wait stats, execution plans, deadlock graphs)
- Best practices (maintenance, backups, security)

TASK:
Analyze the provided support ticket using:
1. Ticket description and error messages
2. Similar historical tickets and their resolutions
3. Relevant Knowledge Base articles
4. SQL Sentry monitoring data (performance metrics, query stats, alerts)

ANALYSIS STRUCTURE:
Provide a comprehensive analysis in JSON format with these sections:

{
  "confidence_level": "High|Medium|Low",
  "confidence_score": 0-100,
  "executive_summary": "2-3 sentence overview of issue and resolution",
  "symptom_analysis": {
    "issue_type": "Performance|Availability|Deadlock|Data Integrity|Other",
    "affected_components": ["server_name", "database_name"],
    "severity_assessment": "Critical|High|Medium|Low",
    "symptoms_observed": ["symptom 1", "symptom 2"]
  },
  "data_correlations": [
    {
      "metric": "CPU Usage",
      "observation": "Spiked to 98% at 09:45",
      "baseline": "Typical: 35-40%",
      "significance": "Indicates resource exhaustion"
    }
  ],
  "root_cause_analysis": {
    "primary_cause": "Description of root cause",
    "contributing_factors": ["Factor 1", "Factor 2"],
    "evidence": ["Evidence from SQL Sentry", "Evidence from similar tickets"]
  },
  "immediate_remediation": {
    "steps": [
      {
        "step_number": 1,
        "action": "Description of action",
        "sql_command": "SQL to execute (if applicable)",
        "risk_level": "Low|Medium|High",
        "expected_impact": "What will happen"
      }
    ],
    "estimated_downtime": "None|Minutes|Hours"
  },
  "prevention_recommendations": {
    "short_term": ["Recommendation 1", "Recommendation 2"],
    "long_term": ["Strategic recommendation 1"]
  },
  "kb_articles_referenced": [
    {
      "kb_id": "KB-456",
      "title": "...",
      "relevance": "Why this article is relevant"
    }
  ],
  "similar_tickets_referenced": [
    {
      "ticket_id": "ZD-11234",
      "similarity": "What makes it similar",
      "resolution_applied": "How it was resolved"
    }
  ],
  "additional_investigation_queries": [
    "SELECT query to run for more details"
  ]
}

GUIDELINES:
- Be specific and actionable
- Reference evidence from SQL Sentry data
- Cite similar tickets and KB articles
- Provide SQL commands when applicable
- Consider risk and impact for all recommendations
- Be honest about confidence level
- If data is insufficient, say so and suggest what additional info is needed

OUTPUT: JSON object ONLY (no markdown, no extra text)
```

---

## 4. Technology Stack

### 4.1 Azure Services

| Service | Purpose | SKU/Tier |
|---------|---------|----------|
| **Azure Functions** | Serverless compute for batch processing | Premium Plan (EP1) or Consumption |
| **Azure Cosmos DB** | JSON document store for tickets/KB | Serverless or Provisioned (10-20 RU/s) |
| **Azure AI Search** | Vector search for GraphRAG | Basic or Standard S1 |
| **Azure OpenAI** | Embeddings + GPT-4o analysis | Standard |
| **Azure SQL Database** | SQL Sentry replica | Standard S2-S3 |
| **Azure Blob Storage** | Optional: Large document storage | Hot tier |
| **Azure Event Grid** | Event-driven orchestration | Standard |
| **Azure Key Vault** | Secrets management | Standard |
| **Azure Application Insights** | Monitoring and logging | Standard |
| **Azure Monitor** | Alerting and diagnostics | Standard |

### 4.2 Development Stack

| Component | Technology |
|-----------|------------|
| **Functions Runtime** | .NET 8 Isolated |
| **Language** | C# 12 |
| **GraphRAG SDK** | Azure.AI.Search + Cosmos DB SDK |
| **OpenAI SDK** | Azure.AI.OpenAI |
| **Zendesk API Client** | Custom REST client (HttpClient) |
| **ORM (SQL Sentry DB)** | Entity Framework Core 8 |
| **Dependency Injection** | Microsoft.Extensions.DependencyInjection |
| **Configuration** | Azure App Configuration / Key Vault |
| **Logging** | Microsoft.Extensions.Logging + App Insights |

### 4.3 Infrastructure as Code

- **IaC Tool:** Azure Bicep or Terraform
- **CI/CD:** Azure DevOps or GitHub Actions
- **Secrets Management:** Azure Key Vault references in Bicep

---

## 5. Security & Compliance

### 5.1 Authentication & Authorization

**Azure Functions:**
- Managed Identity for Azure service connections (Cosmos DB, OpenAI, Key Vault)
- No API keys in code - all retrieved from Key Vault at runtime

**Zendesk API:**
- API token stored in Key Vault
- Token rotation supported via Key Vault secret versioning

**SQL Sentry Database:**
- Read-only service account
- Connection string in Key Vault
- SQL Authentication or Azure AD authentication

### 5.2 Data Security

**Encryption:**
- **In Transit:** TLS 1.2+ for all connections
- **At Rest:** Azure Storage Encryption (automatic)

**Data Privacy:**
- Ticket data may contain customer PII
- Azure OpenAI: Data NOT used for model training (enterprise agreement)
- Data residency: Choose Azure region based on compliance requirements

**Access Control:**
- Managed Identity for service-to-service communication
- Least privilege principle (read-only for SQL Sentry)
- Network isolation (optional): VNet integration for Functions

### 5.3 Compliance

**Audit Logging:**
- All API calls logged to Application Insights
- Retention: 90 days in hot storage, 1 year in cold storage

**SOC 2 / ISO 27001:**
- Azure services are compliant
- Document data flows and access controls

---

## 6. Monitoring & Observability

### 6.1 Metrics to Track

**Operational Metrics:**
- Daily batch execution status (success/failure)
- Number of tickets processed per day
- Number of KB articles indexed
- GraphRAG indexing duration
- AI analysis generation time per ticket
- Zendesk API call latency

**Quality Metrics:**
- Confidence score distribution (High/Medium/Low)
- Token usage per analysis (input/output)
- GraphRAG similarity search relevance scores
- KB article match rates

**Business Metrics:**
- Total tickets analyzed per month
- Estimated time saved (tickets × 25 minutes)
- Cost per ticket analysis

### 6.2 Alerting

**Critical Alerts:**
- Daily batch failures (any of 3 functions)
- Zendesk API errors (rate limit, auth failure)
- GraphRAG indexing failures
- OpenAI API errors or quota exceeded
- SQL Sentry connection failures

**Warning Alerts:**
- High processing time (>5 min per ticket)
- Low confidence score rate (>50% Low confidence)
- GraphRAG similarity search returns <3 results
- Token usage spike (>10K tokens per ticket)

**Alert Channels:**
- Email to DBA team
- Slack/Teams webhook
- Azure Monitor action groups

### 6.3 Logging Strategy

**Structured Logging:**
```csharp
_logger.LogInformation(
    "AI analysis completed for ticket {TicketId}. " +
    "Confidence: {ConfidenceLevel} ({ConfidenceScore}%). " +
    "Processing time: {ProcessingTimeMs}ms. " +
    "Tokens: {TotalTokens}",
    ticketId, confidenceLevel, confidenceScore,
    processingTimeMs, totalTokens
);
```

**Log Levels:**
- **Information:** Normal operations, ticket processing
- **Warning:** Retries, degraded performance, low confidence
- **Error:** API failures, parsing errors, unhandled exceptions
- **Critical:** Complete batch failure, service outages

---

## 7. Scalability & Performance

### 7.1 Current Scale Assumptions

- **Tickets per day:** 50-100
- **Total tickets in GraphRAG:** 50,000+
- **KB articles:** 500-1,000
- **SQL Sentry queries per ticket:** 3-5
- **GraphRAG semantic searches per ticket:** 1-2
- **OpenAI tokens per ticket:** 3,000-5,000

### 7.2 Scaling Strategies

**Azure Functions:**
- **Consumption Plan:** Auto-scales to 200 instances max
- **Premium Plan:** Pre-warmed instances, VNet integration, unlimited duration
- **Recommendation:** Start with Consumption, upgrade to Premium if cold start is issue

**Azure Cosmos DB:**
- **Serverless:** Good for <10K RU/s, unpredictable workload
- **Provisioned:** Better for consistent workload, autoscale enabled
- **Partitioning:** Partition by `customerId` for even distribution

**Azure AI Search:**
- **Basic:** 15M docs, 3 replicas max
- **Standard S1:** 25M docs, 12 replicas max
- **Scaling:** Add replicas for query throughput, partitions for storage

**GraphRAG Query Optimization:**
- Cache frequent queries (e.g., customer→tickets)
- Limit vector search to last 12 months (configurable)
- Pre-compute common relationship paths
- Batch similarity calculations (run weekly for old tickets)

**SQL Sentry Database:**
- **Scaling:** Azure SQL can scale up to Premium tier
- **Optimization:** Partition tables by month, archive old data (>6 months)
- **Caching:** Use Redis for frequently accessed baselines (7-day/30-day averages)

**OpenAI Rate Limits:**
- **TPM (Tokens Per Minute):** Request increase from Azure support
- **Parallelization:** Process max 10 tickets concurrently
- **Retry Logic:** Exponential backoff with jitter

---

## 8. Cost Estimation

### 8.1 Monthly Cost Breakdown

**Azure Functions (Premium EP1):**
- Compute: $150/month (1 instance, always on)
- Alternative (Consumption): $50/month (6,000 executions)

**Azure Cosmos DB:**
- Serverless: $100-200/month (depends on RU/s consumption)
- Provisioned (10 RU/s autoscale): $50-100/month

**Azure AI Search (Basic):**
- $75/month (fixed)

**Azure SQL Database (Standard S3):**
- $300/month (100 DTUs, 250 GB storage)

**Azure OpenAI:**
- Embeddings (ada-002): $15/month
  - 100 tickets/day × 500 tokens × $0.0001/1K × 30 days
- GPT-4o: $350-500/month
  - Input: 100 tickets × 3,500 tokens × $5/1M × 30 = $52.50
  - Output: 100 tickets × 2,000 tokens × $15/1M × 30 = $90
  - GraphRAG context increases to ~$350-500/month

**Azure Storage (Blob/Table):**
- $10/month (minimal usage)

**Azure Application Insights:**
- $50-100/month (log ingestion + retention)

**Azure Key Vault:**
- $5/month (secrets storage)

**Azure Event Grid:**
- $5/month (event publishing)

**Total Monthly Cost:** ~$1,060 - $1,450/month

### 8.2 ROI Analysis

**Time Savings:**
- Tickets per day: 100
- Manual analysis time: 30 minutes per ticket
- Automated analysis time: 0 minutes (fully automated)
- **Time saved:** 100 × 30 min × 30 days = **50 hours/month**

**Cost Savings:**
- DBA hourly rate: $75/hour (blended DBChief/DBNinja rate)
- **Monthly savings:** 50 hours × $75 = **$3,750/month**

**Net Savings:**
- $3,750 (savings) - $1,450 (cost) = **$2,300/month net savings**
- **ROI:** ($2,300 / $1,450) × 100 = **159% ROI**
- **Payback Period:** ~11.5 days

**Annual Savings:**
- **$27,600/year** net savings
- Enables DBA team to focus on proactive improvements vs. reactive ticket work

---

## 9. Risk Analysis & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **AI generates incorrect recommendations** | High | - Calculate and display confidence score<br>- DBChief/DBNinja reviews AI comments before acting<br>- Log all analyses for feedback loop<br>- Collect feedback to improve prompts |
| **GraphRAG indexing failures** | High | - Implement retry logic with exponential backoff<br>- Alert on failed syncs<br>- Maintain indexing status table<br>- Validate data integrity post-indexing |
| **GraphRAG returns poor similarity matches** | Medium | - Tune similarity threshold (0.85 default)<br>- Periodically re-train embeddings with domain examples<br>- A/B test different embedding models<br>- Collect DBChief feedback on relevance |
| **SQL Sentry data replication lag** | Medium | - Monitor replication latency<br>- Alert if lag >1 hour<br>- Graceful degradation: analyze with partial data<br>- Document data freshness in analysis |
| **OpenAI API outage or rate limits** | High | - Implement exponential backoff retry<br>- Queue tickets for retry (max 3 attempts)<br>- Request TPM increase from Azure support<br>- Alert on API errors |
| **Zendesk API rate limits** | Low | - Respect rate limits (700 req/min typical)<br>- Implement pagination with delays<br>- Spread indexing across available time window<br>- Cache unchanged tickets |
| **GraphRAG costs exceed budget** | Medium | - Monitor Cosmos DB RU/s consumption daily<br>- Implement auto-scaling limits<br>- Archive old tickets (>2 years) to cold storage<br>- Optimize queries (caching, partitioning) |
| **Data privacy concerns** | High | - Use Azure OpenAI (data NOT used for training)<br>- Document data flows for compliance<br>- Implement PII detection/masking if required<br>- Ensure SOC 2/ISO 27001 compliance |
| **Knowledge drift (outdated KB)** | Low | - Re-index KB articles when updated<br>- Monitor KB update frequency<br>- Periodic full re-indexing (quarterly) |

---

## 10. Implementation Plan

### Phase 1: Foundation (Weeks 1-3)

**Deliverables:**
1. Azure environment setup:
   - Provision: Functions, Cosmos DB, AI Search, SQL Database, OpenAI, Key Vault
   - Configure networking (VNets, private endpoints if required)
   - Set up CI/CD pipelines (Azure DevOps or GitHub Actions)

2. Zendesk integration:
   - Develop Zendesk API client library
   - Implement ticket/KB article retrieval
   - Test pagination and rate limiting

3. Azure Cosmos DB setup:
   - Create collections (tickets, kb_articles, resolutions)
   - Define partition keys
   - Implement CRUD operations

4. SQL Sentry replication:
   - Choose replication strategy (ADF, CDC, or Replication)
   - Set up Azure SQL Database schema
   - Test data sync (historical backfill + incremental)

**Validation:**
- Successfully retrieve 100+ tickets from Zendesk
- Store tickets in Cosmos DB with correct partition key
- SQL Sentry data syncs to Azure SQL (verify row counts)

---

### Phase 2: GraphRAG Implementation (Weeks 4-6)

**Deliverables:**
1. GraphRAG infrastructure:
   - Configure Cosmos DB graph API
   - Set up Azure AI Search service
   - Deploy embedding model (text-embedding-ada-002)

2. Entity extraction:
   - Develop regex patterns for server/DB/error extraction
   - Test on 100 sample tickets
   - Achieve >90% accuracy

3. Indexing function:
   - Implement Function 2 (GraphRAG Indexing)
   - Generate embeddings for tickets + KB articles
   - Create graph nodes and relationships
   - Compute similarity edges (SIMILAR_TO)

4. Historical backfill:
   - Index last 6-12 months of tickets
   - Index all KB articles
   - Validate graph integrity

**Validation:**
- GraphRAG contains 10,000+ indexed tickets
- Vector search returns relevant results (manual review of 20 samples)
- Graph relationships correctly established (test Cypher queries)

---

### Phase 3: AI Analysis Engine (Weeks 7-9)

**Deliverables:**
1. Azure OpenAI integration:
   - Deploy GPT-4o model
   - Develop system prompt (DBA expert persona)
   - Test prompt with 10 sample contexts
   - Validate JSON output schema

2. Context collection logic:
   - GraphRAG queries (similar tickets, KB articles)
   - SQL Sentry queries (performance metrics, alerts)
   - Baseline calculation (7-day/30-day averages)

3. Analysis function:
   - Implement Function 3 (AI Analysis)
   - Assemble context package
   - Call OpenAI API
   - Parse and validate response

4. Confidence scoring:
   - Implement scoring algorithm
   - Test on 20 sample tickets
   - Tune thresholds

**Validation:**
- Generate 20 sample analyses manually reviewed by DBChief
- 80%+ of analyses rated "useful" (quality feedback)
- Confidence scores align with human assessment

---

### Phase 4: Zendesk Posting & Integration (Weeks 10-11)

**Deliverables:**
1. Zendesk posting logic:
   - Format analysis as markdown
   - Implement POST to /tickets/{id}/comments
   - Add tags (ai-analyzed, confidence level)

2. End-to-end testing:
   - Run full pipeline: Ingestion → Indexing → Analysis → Posting
   - Test with 10 real tickets
   - Verify analyses appear in Zendesk

3. Error handling & retry logic:
   - Implement exponential backoff for API calls
   - Dead-letter queue for failed tickets
   - Alert on failures

**Validation:**
- 10 test tickets successfully processed end-to-end
- Analyses posted to Zendesk within 2 hours of ticket creation
- No data loss (all tickets processed or queued for retry)

---

### Phase 5: Monitoring, Optimization & Launch (Weeks 12-14)

**Deliverables:**
1. Monitoring & alerting:
   - Set up Application Insights dashboards
   - Configure alerts (failures, high latency, quota warnings)
   - Create runbooks for common issues

2. Performance optimization:
   - GraphRAG query tuning (caching, indexing)
   - Function concurrency tuning (parallel ticket processing)
   - Cost optimization (review RU/s, token usage)

3. Documentation:
   - Technical documentation (architecture, runbooks)
   - User guide for DBChief/DBNinja (how to interpret AI analyses)
   - Operational procedures (troubleshooting, backfill)

4. Pilot launch:
   - Start with 1-2 customers (limited scope)
   - Monitor quality of analyses
   - Collect feedback from DBA team
   - Gradual rollout to all customers

**Validation:**
- 95%+ uptime during pilot
- 70%+ of analyses rated "High" or "Medium" confidence
- Average processing time <3 minutes per ticket
- No security incidents

---

### Phase 6: Production & Continuous Improvement (Ongoing)

**Activities:**
1. Monitor KPIs:
   - Daily batch success rate
   - Confidence score distribution
   - Token usage trends
   - Cost tracking

2. Feedback loop:
   - Collect DBChief ratings on analysis quality
   - Identify common failure patterns
   - Refine prompts and entity extraction

3. Enhancements:
   - Add support for new issue types
   - Expand KB article coverage
   - Improve similarity matching algorithm
   - Consider real-time analysis (vs. daily batch)

---

## 11. Success Criteria

### 11.1 Phase 1 (MVP - 14 weeks)

**Operational:**
- ✓ System processes 100% of new tickets daily
- ✓ 95%+ uptime (batch executions succeed)
- ✓ Average processing time <3 minutes per ticket

**Quality:**
- ✓ 60%+ of analyses rated "High" or "Medium" confidence
- ✓ GraphRAG similarity search returns relevant results (>70% relevance per DBChief review)
- ✓ Zero critical errors in analyses (incorrect server names, wrong KB references)

**Cost:**
- ✓ Monthly cost <$1,500
- ✓ Positive ROI (cost savings exceed infrastructure cost)

### 11.2 Phase 2 (Maturity - 6 months)

**Operational:**
- ✓ 98%+ uptime
- ✓ Average processing time <2 minutes per ticket
- ✓ Handle 200+ tickets/day without degradation

**Quality:**
- ✓ 80%+ of analyses rated "High" or "Medium" confidence
- ✓ GraphRAG similarity: >80% relevance
- ✓ DBA team satisfaction: 4+/5 rating on usefulness

**Cost:**
- ✓ Monthly cost optimized to <$1,200 (through caching, archival)
- ✓ ROI >200%

### 11.3 Long-Term (12 months)

**Advanced Capabilities:**
- ✓ Real-time analysis (ticket analyzed within 15 minutes of creation)
- ✓ Proactive issue detection (analyze SQL Sentry trends before tickets created)
- ✓ Auto-categorization of tickets by issue type
- ✓ Predictive alerts based on pattern recognition

**Optimization:**
- ✓ 90%+ of analyses rated "High" confidence (minimal human intervention needed)
- ✓ GraphRAG index: 100,000+ tickets
- ✓ Monthly cost <$1,000 (economies of scale)

---

## 12. Assumptions & Dependencies

### 12.1 Assumptions

1. **Zendesk Access:**
   - API access with sufficient rate limits (700 req/min minimum)
   - Permissions to read tickets, KB articles, and post comments
   - Custom fields exist for server_name, database_name, error_code

2. **SQL Sentry:**
   - Read-only access to SQL Sentry repository database
   - Data retention: At least 7 days of performance metrics
   - Schema stability (tables/views won't change frequently)

3. **Azure Subscription:**
   - Sufficient quota for OpenAI (TPM, RPM)
   - Budget approved for estimated costs (~$1,500/month)
   - Regional availability for all required services

4. **Knowledge Base:**
   - KB articles exist in Zendesk and are kept up-to-date
   - Articles contain actionable DBA guidance
   - Coverage for common issue types (deadlocks, performance, availability)

5. **DBA Team:**
   - DBChief/DBNinja will review AI analyses in Zendesk
   - Feedback provided to improve prompt/logic
   - Trust in AI recommendations (with verification)

### 12.2 Dependencies

**External:**
- Zendesk API availability and stability
- Azure OpenAI API availability (GPT-4o model)
- SQL Sentry database uptime

**Internal:**
- Azure subscription approval and provisioning
- Network connectivity (if VNets required)
- Compliance approval for data processing
- DBA team training on interpreting AI analyses

---

## 13. Future Enhancements

### 13.1 Near-Term (6-12 months)

1. **Real-Time Analysis:**
   - Move from daily batch to event-driven (Zendesk webhook → instant analysis)
   - Reduces response time from hours to minutes

2. **Feedback Loop:**
   - DBChief rates analysis quality (1-5 stars)
   - Store feedback in database
   - Use feedback to fine-tune prompts and improve accuracy

3. **Multi-Language Support:**
   - Analyze tickets in languages other than English
   - Translate KB articles as needed

4. **Advanced Correlation:**
   - Correlate multiple tickets for the same customer/server
   - Identify systemic issues (e.g., "5 tickets this week, all CPU-related on SERVER-01")

### 13.2 Long-Term (12+ months)

1. **Proactive Analysis:**
   - Monitor SQL Sentry trends to predict issues before tickets created
   - Generate proactive recommendations ("CPU trending up, consider scaling")

2. **Auto-Remediation:**
   - For known, low-risk issues, automatically execute fixes
   - Example: Rebuild fragmented index if fragmentation >80%
   - Requires approval workflow and guardrails

3. **Customer-Facing Summaries:**
   - Generate customer-friendly explanations (separate from internal analysis)
   - Post as public comment to keep customers informed

4. **Natural Language Interface:**
   - DBChief can ask AI follow-up questions via chat
   - Example: "What else should I check for this deadlock?"

5. **Integration with Runbooks:**
   - Link recommendations to existing DBSmart runbooks/procedures
   - Auto-execute runbook steps (with approval)

6. **Anomaly Detection:**
   - Use ML to detect unusual patterns in SQL Sentry data
   - Flag anomalies for investigation (e.g., "CPU spike doesn't match normal pattern")

---

## 14. Appendix

### 14.1 Glossary

| Term | Definition |
|------|------------|
| **GraphRAG** | Graph + Retrieval-Augmented Generation - combines knowledge graph with LLM for contextual AI responses |
| **Vector Embedding** | Numerical representation of text (1536-dim array) used for semantic similarity |
| **Cosine Similarity** | Measure of similarity between vectors (0-1 scale, 1 = identical) |
| **Semantic Search** | Search based on meaning, not keywords (uses embeddings) |
| **Knowledge Graph** | Graph database storing entities (nodes) and relationships (edges) |
| **Confidence Score** | 0-100% score indicating AI's confidence in its analysis |
| **RU/s** | Request Units per second - Cosmos DB throughput measure |
| **TPM** | Tokens Per Minute - OpenAI API rate limit |
| **RPM** | Requests Per Minute - API rate limit |
| **Deadlock** | SQL Server concurrency issue where two transactions block each other |
| **Wait Stats** | SQL Server metrics showing what queries are waiting for (disk, CPU, locks, etc.) |
| **Execution Plan** | SQL Server's query optimization plan |

### 14.2 References

**Azure Documentation:**
- [Azure OpenAI Service](https://learn.microsoft.com/azure/ai-services/openai/)
- [Azure Cosmos DB](https://learn.microsoft.com/azure/cosmos-db/)
- [Azure AI Search](https://learn.microsoft.com/azure/search/)
- [Azure Functions](https://learn.microsoft.com/azure/azure-functions/)

**GraphRAG:**
- [Microsoft GraphRAG](https://microsoft.github.io/graphrag/)
- [Retrieval-Augmented Generation](https://arxiv.org/abs/2005.11401)

**Zendesk API:**
- [Zendesk API Documentation](https://developer.zendesk.com/api-reference/)

**SQL Server:**
- [SQL Server Wait Statistics](https://learn.microsoft.com/sql/relational-databases/system-dynamic-management-views/sys-dm-os-wait-stats-transact-sql)
- [Deadlock Graphs](https://learn.microsoft.com/sql/relational-databases/sql-server-deadlocks-guide)

---

## 15. Approval & Sign-Off

**Document Status:** Ready for Review

**Reviewers:**
- [ ] Engineering Lead
- [ ] DBA Team Lead (DBChief)
- [ ] System Architect
- [ ] Security/Compliance Officer
- [ ] Finance (Budget Approval)

**Approval Date:** _________________

**Next Steps:**
1. Review and approve this design document
2. Obtain budget approval (~$1,500/month)
3. Provision Azure environment
4. Begin Phase 1 implementation

---

**End of Document**
