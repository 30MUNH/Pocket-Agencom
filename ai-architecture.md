# AI Architecture

Pocket Agencom uses a focused AI planning pipeline for Vietnamese small businesses.

```mermaid
flowchart LR
  UI[Campaign brief and optional image] --> API[Express plan service]
  API --> RAG[pgvector strategy retrieval]
  RAG --> Gemini[Gemini structured generation]
  Gemini --> Plan[(Marketing plan)]
  Plan --> Review[Staff/admin review]
  Plan --> Schedule[Content schedule and media]
  Plan --> Analytics[Budget and channel analytics]
```

The plan service combines business profile context, the campaign brief, existing resources, deployment channels, and relevant knowledge-base strategies. Gemini returns structured content ideas, scripts, checklists, playbooks, SEO keywords, and a channel-aware budget breakdown. The original generated fields are persisted so historical plans remain auditable.

Text generation and image-aware generation are separate calls. Uploaded campaign assets are persisted through the storage service, while embeddings and similarity search use PostgreSQL pgvector. Retrieval failures return no context; external AI verification must assert the provider response and persistence rather than treating local fallback copy as a successful Gemini check.

Secrets remain server-side. Production validation should cover response shape, ownership checks, persistence, review transitions, embedding dimensions, and retrieval relevance without asserting exact generated wording.
