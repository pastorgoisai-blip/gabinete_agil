# SLICE_PLAN: Native RAG Implementation (Gemini + Supabase)

## Goal
Implement a native Vector Search & Chat system (RAG) for "Gabinete Ágil" using Supabase (pgvector) and Gemini API, removing external dependencies like n8n.

## 1. Database & Schema
- **Extension**: Enable `vector` extension.
- **Table**: `document_chunks`
  - `id`: uuid (PK)
  - `content`: text
  - `embedding`: vector(768) (Compatible with Gemini `text-embedding-004`)
  - `metadata`: jsonb (page number, source url, original file name)
  - `cabinet_id`: uuid (FK to cabinets) - **CRITICAL FOR RLS**
  - `created_at`: timestamptz
- **Function**: `match_documents` (RPC)
  - Search by cosine similarity.
  - Filter by `cabinet_id` to enforce data isolation.
- **Table Update**: `cabinets`
  - Add column `gemini_api_key` (text) to store the customer's own key.

## 2. API (Supabase Edge Function)
- **Name**: `query-copilot`
- **Workflow**:
  1. **Auth**: Verify JWT user. Get `cabinet_id`.
  2. **Config**: Fetch `gemini_api_key` from `cabinets` table.
  3. **Embedding**: Call Gemini API to embed the user's query.
  4. **Retrieval**: Call `rpc('match_documents')` with the query embedding.
  5. **Generation**: Construct a prompt with the retrieved chunks + user query.
  6. **Streaming**: Call Gemini `streamGenerateContent` and pipe results to client.

## 3. Frontend Integration
- **Settings Page (`Settings.tsx`)**:
  - Implement the "Integrações" tab.
  - Add Input field to save `gemini_api_key` to the cabinet record.
- **Copilot Widget (`CopilotWidget.tsx`)**:
  - Replace hardcoded/n8n logic.
  - Use `supabase.functions.invoke('query-copilot', { body: { query, history } })`.
  - Handle streaming response.

## 4. Verification
- Add a document via existing flow (needs an ingestion trigger, but for this slice we might need to simulate chunking or creates an ingest function).
- **Wait**: The user request didn't explicitly ask for the *ingestion* pipeline (PDF -> Chunks), only the RAG infrastructure.
- **Assumption**: We will focus on the *Query/Search* infrastructure. If time permits, we'll need a way to insert chunks.
- **Self-Correction**: RAG is useless without data. I must at least provide a script or function to chunk existing documents, or assumes the user will populate it. I will prioritize the Search Infrastructure first as requested.

