# FILON Core – Architecture (Updated November 2025)

## Overview

FILON Core is an **offline-first, AI-augmented knowledge graph application** built with Next.js 16, React 19, TypeScript, and Automerge. The architecture emphasizes local-first data persistence, queue-based synchronization, and modular state management.

### Core Principles

- **Offline-First**: All data persists locally (IndexedDB via Dexie/localforage) before syncing to cloud
- **Type Safety**: Centralized domain schema shared across Automerge, Prisma, and Zustand
- **Modular Design**: Swappable adapters for cloud services (AWS-ready, filesystem fallback)
- **Event-Driven**: Pub/sub pattern via event bus for decoupled communication
- **Progressive Enhancement**: Feature flags, graceful degradation, and developer tools

### Major Refactors (v2 → v3)

**v2 Refactors**:

- ✅ Centralized Graph Domain Schema (`src/types/graph.ts`)
- ✅ Typed Automerge adapters with coercion safeguards
- ✅ Swappable Sync Layer with AWS-ready adapters
- ✅ SessionStore consolidation (GraphStore merged)
- ✅ GraphCanvas mutations emit typed metadata

**v3 Feedback & Micro-Fixes**:

- ✅ Metadata normalization refined (stable versioning, `randomId` reuse)
- ✅ Prisma adapter emits full typed node/edge data
- ✅ Sync adapter lint-cleaned (removed unused imports)
- 🟡 API still emits partial data (needs `normaliseGraphData` utility)
- 🟡 AWS adapters need dependency injection before production
- 🔴 GraphCanvas monolith not yet split (SRP violations persist)
- 🟡 AI provider registry not yet implemented

---

## Frameworks and Dependencies

### Core Stack

- **Next.js 16.0.1** – App Router with Server/Client Components
- **React 19.2.0** – UI framework with hooks and context
- **TypeScript 5** – Strict type checking enabled
- **Tailwind CSS v4.1.16** – Utility-first styling with PostCSS
- **Zustand 5.0.8** – Lightweight state management with persistence middleware
- **ReactFlow 11.11.4** – Graph visualization library
- **Framer Motion 12.23.24** – Animation library

### Data & Sync Layer

- **Automerge 3.2.0** – CRDT for conflict-free collaborative editing
- **localforage 1.10.0** – IndexedDB wrapper for client-side persistence
- **Dexie 4.2.1** – IndexedDB abstraction layer (used in `src/store/db.ts`)
- **Prisma 6.18.0** – ORM with SQLite/PostgreSQL support

### AI & Utilities

- **react-markdown 10.1.0** – Markdown rendering
- **next-themes 0.4.6** – Theme management
- **lucide-react 0.469.0** – Icon library

### Development Tools

- **Jest 30.2.0** – Testing framework
- **ESLint 9** – Code linting
- **ts-jest** – TypeScript support for Jest

---

## Layer by Layer

### UI Layer

**Status**: 🟡 **In Progress** (GraphCanvas split planned)

**Structure**:

- `src/components/shell/` – AppShell, HeaderBar, Sidebar (layout)
- `src/components/ui/` – SyncIndicator, Tooltip (primitives)
- `src/components/graph/` – **Planned**: GraphCanvas submodules
- `src/components/` – ComposerPanel, ThoughtPanel, SnapshotPanel, etc.

**Key Components**:

1. **GraphCanvas.client.tsx** (2,630+ lines) – **Core graph visualization**

   - **Status**: 🔴 **Needs Refactoring**
   - Manages ReactFlow instance, nodes/edges state, autosave, snapshots, branches, playback
   - Integrates with Automerge, sync queue, feedback system
   - **Issue**: Violates SRP (should be split into submodules)
   - **Planned Split**:
     ```
     src/components/graph/
       ├── CanvasSurface.tsx (ReactFlow rendering)
       ├── InteractionLayer.tsx (node/edge handlers)
       ├── GraphToolbar.tsx (toolbar UI)
       └── GraphCanvas.tsx (orchestrator, ~200 lines)
     ```

2. **ComposerPanel.tsx** – Input panel for creating thoughts
3. **ThoughtPanel.tsx** – Side panel for node editing
4. **SnapshotPanel.tsx**, **BranchPanel.tsx** – Version control UI
5. **ContextStream.tsx** – AI summary stream display

**Patterns**:

- Heavy use of Framer Motion for animations
- Zustand stores accessed via hooks
- Context API for active node and mind progress state
- Client components marked with `"use client"`

**Issues**:

- GraphCanvas monolith needs modularization
- Some components mix inline styles with Tailwind
- Missing prop validation in some places

---

### State Layer

**Status**: ✅ **Stable** (SessionStore consolidation complete)

**Stores** (`src/store/`):

1. **SessionStore.ts** (382 lines) – **Consolidated**

   - **Status**: ✅ **Stable**
   - Manages sessions (workspaces), active session, pending thoughts
   - **Now includes**: `graphLoadedOnce` flag (previously in GraphStore)
   - Persists to localforage with custom storage adapter
   - Handles session CRUD, metadata updates, thought queuing
   - **Pattern**: Zustand persist middleware with custom storage
   - **Metadata**: Includes `syncStatus`, `pendingOps`, `lastSyncedAt` for sync tracking

2. **UIShellStore.ts** (50 lines)

   - Sidebar open/closed state
   - Hydrates from localStorage
   - **Pattern**: Separate UI state from domain state

3. **FeedbackStore.ts** (129 lines)

   - Feedback events, insights, scoring
   - Persists feedback history
   - **Issue**: TODO comments indicate cloud sync not implemented

4. **MemoryStore.ts** (31 lines)

   - Snapshot history with trend analysis
   - Keeps last 10 snapshots

5. **ExplainCache.ts** (33 lines)

   - Caches AI explanations in localforage
   - Simple key-value cache

6. **ContextStreamStore.ts** (52 lines)

   - AI summaries with confidence decay
   - Periodic decay timer (10s intervals)

7. **PanelFocusStore.ts**, **PanelRegistry.ts**, **QAStore.ts** – Panel management

8. **db.ts** (64 lines)
   - Dexie database schema
   - Tables: sessions, snapshots, assets, kv, telemetry
   - **Pattern**: IndexedDB abstraction for structured data

**Patterns**:

- Zustand with persist middleware for offline-first
- Custom storage adapters for localforage integration
- Separation of UI state vs. domain state
- **Consolidation**: GraphStore merged into SessionStore (v2 refactor)

**Issues**:

- Some stores are too small and could be consolidated further
- No store-level error handling
- Missing TypeScript strict types in some store actions

---

### Data Layer

**Status**: ✅ **Stable** (Centralized schema, typed Automerge)

**Core Files**:

1. **types/graph.ts** (112 lines) – **Centralized Domain Schema**

   - **Status**: ✅ **Stable**
   - Defines `GraphDoc`, `GraphNode`, `GraphEdge`, `GraphMetadata`, `GraphHistory`
   - Shared between Automerge, Prisma, and Zustand
   - **Key Types**:
     ```typescript
     interface GraphDoc {
       nodes: GraphNode[];
       edges: GraphEdge[];
       metadata: GraphMetadata;
       history: GraphHistory;
     }
     ```
   - **Helper**: `createEmptyGraphDoc()` for consistent initialization

2. **lib/automergeAdapter.ts** (148 lines) – **Typed Automerge Operations**

   - **Status**: ✅ **Stable**
   - `initGraphDoc()` – Creates or loads Automerge document with coercion
   - `persistGraphDoc()` – Saves document with metadata updates
   - `mergeRemoteDoc()` – Merges remote binary with local document
   - **Coercion**: `coerceLegacyDoc()` normalizes old documents to new schema
   - **Type Safety**: Uses `Doc<GraphDoc>` from Automerge, no more `any`

3. **sync/automergeAdapter.ts** (95 lines) – **Sync-Specific Adapter**

   - **Status**: ✅ **Stable**
   - `applyChange()`, `getBinary()`, `loadBinary()` – Typed operations
   - `createAutomergeGraphDoc()` – Creates empty document with defaults
   - `onCommit()` – Triggers sync to Lambda handler
   - **Type Safety**: `AutomergeGraphDoc = Doc<GraphDoc>`, `GraphChangeFn` type

4. **lib/sessionStorage.ts** (24 lines)

   - Session-scoped graph storage (localforage)
   - Functions: `saveGraphToSession()`, `loadGraphFromSession()`, `clearSessionGraph()`

5. **lib/automergeHelper.ts** (86 lines)
   - Helper functions for Automerge binary operations
   - `getAutomergeBinary()`, `updateAutomergeBinary()`

**Patterns**:

- **Centralized Schema**: Single source of truth in `types/graph.ts`
- **Type Coercion**: Legacy documents automatically upgraded to new schema
- **Binary-First**: Automerge documents stored as `Uint8Array` for efficient sync
- **Metadata Tracking**: Version, sync status, timestamps in document metadata

**Issues**:

- API route (`src/app/api/graph/route.ts`) still emits partial node/edge data
- **Planned**: `normaliseGraphData()` utility to ensure full typed data across layers

---

### Sync Layer

**Status**: 🟡 **AWS Integration Pending** (Adapters ready, dependency injection needed)

**Core Files**:

1. **sync/automergeAdapter.ts** (95 lines)

   - **Status**: ✅ **Stable**
   - Typed Automerge operations for sync
   - See Data Layer section above

2. **sync/syncLambdaHandler.ts** (115 lines) – **Main Sync Orchestration**

   - **Status**: 🟡 **In Progress**
   - Validates auth (mock), writes to DynamoDB, saves to S3
   - Emits `sync:success` event via eventBus
   - **Swappable Adapters**: Uses `createMetadataStore()` and `createSnapshotStorage()`
   - **Environment**: `FILON_USE_AWS` flag controls adapter selection
   - **Issues**:
     - Mock authentication (TODO: real JWT)
     - Mock document creation (creates `mockDoc` instead of using actual binary)
     - AWS adapters need dependency injection (DynamoDBClient, S3Client)

3. **sync/dynamoAdapter.ts** (97 lines) – **Swappable Metadata Store**

   - **Status**: 🟡 **AWS Integration Pending**
   - **Interface**: `MetadataStore` with `write()`, `readAll()`, `readByUser()`
   - **Implementations**:
     - `FileMetadataStore` – Filesystem mock (`/tmp/dynamoMock.json`)
     - `AwsMetadataStore` – Placeholder (throws error, needs AWS SDK wiring)
   - **Factory**: `createMetadataStore(config)` – Switches based on `useAws` flag
   - **Config**: `tableName`, `useAws` from environment

4. **sync/s3Adapter.ts** (102 lines) – **Swappable Snapshot Storage**

   - **Status**: 🟡 **AWS Integration Pending**
   - **Interface**: `SnapshotStorage` with `saveSnapshot()`, `loadSnapshot()`, `listSnapshots()`
   - **Implementations**:
     - `FilesystemSnapshotStore` – Filesystem mock (`/tmp/snapshots/`)
     - `AwsSnapshotStore` – Placeholder (throws error, needs AWS SDK wiring)
   - **Factory**: `createSnapshotStorage(config)` – Switches based on `useAws` flag
   - **Config**: `bucketName`, `useAws` from environment

5. **sync/syncSchema.ts** (36 lines)
   - TypeScript interfaces for sync events, metadata, responses
   - `SyncStatus` enum (PENDING, SYNCED, FAILED)

**Patterns**:

- **Adapter Pattern**: Swappable implementations (filesystem fallback, AWS production)
- **Event-Driven**: Commit → Lambda → Dynamo/S3 → eventBus
- **Binary-First**: Automerge Uint8Array stored in S3
- **Environment-Based**: `FILON_USE_AWS` flag controls adapter selection

**Issues**:

- AWS adapters are placeholders (need dependency injection)
- Mock authentication (TODO: JWT validation)
- Mock document creation (should use actual Automerge binary)
- No retry/backoff logic in sync handler (TODO comment)

**Next Steps**:

1. Inject `DynamoDBClient` and `S3Client` into adapters
2. Implement real AWS SDK operations in `AwsMetadataStore` and `AwsSnapshotStore`
3. Replace mock authentication with JWT validation
4. Use actual Automerge binary in sync handler

---

### AI Layer

**Status**: 🟡 **In Progress** (Provider contract planned, not yet implemented)

**Core Files**:

1. **ai/summarizerCore.ts** (38 lines)

   - **Status**: 🟡 **Mocked**
   - `generatePanelSummary()` – Mock AI response (800ms delay)
   - Returns `AISummary` with confidence score
   - **Issue**: Currently mocked (TODO: real LLM call)

2. **Planned: ai/providers/** – **Provider Registry Structure**
   - **Status**: 🔴 **Not Yet Implemented**
   - **Planned Structure**:
     ```
     src/ai/providers/
       ├── base.ts (AIProvider interface)
       ├── mock.ts (MockProvider implementation)
       └── openai.ts (OpenAIProvider implementation)
     ```
   - **Contract**: `AIProvider` interface with `generateSummary()`, `explainNode()`, etc.
   - **Registry**: Environment-based switching (`FILON_AI_PROVIDER=openai|mock`)

**Patterns**:

- Async functions with confidence scoring
- Thread ID generation from context
- **Planned**: Provider pattern for swappable AI backends

**Issues**:

- No real AI integration (all mocked)
- Missing error handling for API failures
- No rate limiting or caching strategy
- Provider registry not yet implemented

**Next Steps**:

1. Implement `AIProvider` interface
2. Create `MockProvider` and `OpenAIProvider` implementations
3. Add provider registry with environment-based switching
4. Integrate with `summarizerCore.ts`

---

### Core & Utilities

**Core** (`src/core/`):

- `eventBus.ts` (60 lines) – Singleton event bus for pub/sub
  - Used by sync layer for `sync:success` events
  - **Pattern**: Observer pattern for decoupled communication

**Hooks** (`src/hooks/`):

- `useAutosaveQueue.ts` (400 lines) – **Critical hook**
  - Manages sync queue with debouncing (1s), retry logic (max 5), exponential backoff
  - Integrates with Dexie for offline persistence
  - Uses `requestIdleCallback` for low-priority sync
  - Registers online event listener for automatic sync on reconnect
  - **Pattern**: Queue-based sync with offline-first design

**Utils** (`src/utils/`):

- `network.ts` – Online/offline detection
- `telemetryLogger.ts` – Telemetry logging to Dexie
- `qaLogger.ts` – QA logging utilities
- `hotkeys.ts` – Keyboard shortcut registration
- `exportGraph.ts` – Graph export functionality
- `confidenceDecay.ts` – Confidence score decay
- `env.ts` – Environment variable helpers
- `rfDebug.ts` – ReactFlow debugging utilities

**Lib** (`src/lib/`):

- `syncAdapter.ts` – Graph sync with conflict resolution
- `sessionManager.ts` – Session state management
- `versionManager.ts` – Snapshot/version control
- `branchManager.ts` – Branch management
- `diffEngine.ts` – Graph diffing
- `aiSummarizer.ts` – AI summary generation
- `prisma.ts` – Prisma client singleton
- `visual/GraphMoodEngine.ts` – Visual mood presets
- `feedback/FeedbackStore.ts` – Feedback event logging
- `silverbullet/core.ts` – Event logging system

---

## Data Flow Diagram (Textual)

```
┌─────────────────────────────────────────────────────────────────┐
│                         UI Layer (React)                        │
│  GraphCanvas.client.tsx → ComposerPanel → ThoughtPanel         │
│  (2,630+ lines, needs split)                                     │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼ (typed mutations)
┌─────────────────────────────────────────────────────────────────┐
│                    State Layer (Zustand)                        │
│  SessionStore (consolidated) → FeedbackStore → MemoryStore    │
│  graphLoadedOnce flag merged into SessionStore                 │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼ (GraphDoc schema)
┌─────────────────────────────────────────────────────────────────┐
│              Data Layer (Automerge + Local Storage)            │
│  types/graph.ts (centralized schema)                           │
│  lib/automergeAdapter.ts (typed operations)                    │
│  Automerge Doc<GraphDoc> → localforage → Dexie (IndexedDB)     │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼ (binary Uint8Array)
┌─────────────────────────────────────────────────────────────────┐
│              Sync Layer (Offline-First Queue)                  │
│  useAutosaveQueue → syncLambdaHandler                          │
│  → createMetadataStore() / createSnapshotStorage()             │
│  → FileMetadataStore (mock) or AwsMetadataStore (pending)      │
│  → FilesystemSnapshotStore (mock) or AwsSnapshotStore (pending)│
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼ (eventBus)
┌─────────────────────────────────────────────────────────────────┐
│                    AI Layer (Mocked)                            │
│  summarizerCore.ts → ExplainCache → ContextStreamStore         │
│  (Provider registry planned)                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Detailed Flow Example: Creating a Node

1. **UI**: User clicks "Add Node" → `GraphCanvas.client.tsx.addNode()`
2. **State**: `setNodes()` updates React state → triggers `onNodesChange`
3. **Metadata**: Mutation emits typed metadata (sessionId, timestamp, etc.)
4. **Save**: `saveGraph()` debounced (800ms) → calls `saveGraphRemote()`
5. **Automerge**: `updateAutomergeBinary()` creates/updates Automerge `Doc<GraphDoc>` → returns `Uint8Array`
6. **Queue**: `useAutosaveQueue` receives binary → debounces (1s) → adds to queue
7. **Persistence**: Queue job saved to Dexie `snapshots` table (offline-first)
8. **Sync**: If online → `syncNextJob()` → `syncLambdaHandler()`
9. **Adapter**: `createMetadataStore()` / `createSnapshotStorage()` → FileMetadataStore (mock) or AwsMetadataStore (pending)
10. **Event**: `eventBus.emit("sync:success")` → FeedbackStore updates
11. **AI**: Periodic snapshot → `generateSnapshotSummary()` → MemoryStore

---

## Testing & QA Notes

**Current Test Coverage**:

- `src/__tests__/GraphCanvas.test.tsx` – Basic component test
- `src/tests/testSyncFlow.ts` – Sync flow integration test
- `src/tests/testFeedbackLoop.ts` – Feedback loop test

**Lint Goals**:

- ✅ Sync adapter lint-cleaned (removed unused `GraphDoc` import)
- 🟡 Type safety validated (minor inconsistencies remain: metadata regeneration, timestamp churn)
- 🟡 API route needs full typed data emission

**Planned Tests**:

- Unit tests for stores (SessionStore, FeedbackStore)
- Unit tests for hooks (useAutosaveQueue)
- Integration tests for sync flow (with mock adapters)
- E2E tests for graph operations

---

## Environment Configuration

**Required Environment Variables** (`.env.local`):

### AWS Integration (Optional, for production)

```bash
# Enable AWS adapters (default: false, uses filesystem mocks)
FILON_USE_AWS=true

# DynamoDB configuration
FILON_DYNAMO_TABLE=filon-sync-metadata

# S3 configuration
FILON_S3_BUCKET=filon-snapshots

# AWS credentials (via AWS SDK default chain or explicit)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

### AI Provider (Planned)

```bash
# AI provider selection (default: mock)
FILON_AI_PROVIDER=openai|mock

# OpenAI configuration (if using OpenAI provider)
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4
```

### Development

```bash
# Debug mode
DEBUG_MODE=true

# Feature flags (optional, defaults in config/featureFlags.ts)
FEATURE_AI_SUMMARIZER=true
FEATURE_CONTEXT_STREAM=true
FEATURE_SESSION_FEEDBACK=false
```

**Note**: Without AWS credentials, the app uses filesystem mocks (`/tmp/dynamoMock.json`, `/tmp/snapshots/`). This is suitable for local development but not production.

---

## Current Architecture Status

### Core Domain Types

**Status**: ✅ **Stable**

- `src/types/graph.ts` – Centralized schema shared across Automerge, Prisma, Zustand
- Typed Automerge operations with `Doc<GraphDoc>`
- Coercion safeguards for legacy documents
- Metadata normalization refined (stable versioning, `randomId` reuse)

### Sync Layer

**Status**: 🟡 **AWS Integration Pending**

- Swappable adapters implemented (`MetadataStore`, `SnapshotStorage` interfaces)
- Factory functions (`createMetadataStore()`, `createSnapshotStorage()`) with environment-based switching
- Filesystem mocks working (`FileMetadataStore`, `FilesystemSnapshotStore`)
- AWS placeholders exist but need dependency injection (`DynamoDBClient`, `S3Client`)
- **Next**: Inject AWS clients, implement real SDK operations

### GraphCanvas Split

**Status**: 🔴 **Not Yet Implemented**

- Monolith remains at 2,630+ lines
- SRP violations persist (graph rendering, sync, snapshots, branches, playback all in one file)
- **Planned**: Split into `CanvasSurface`, `InteractionLayer`, `GraphToolbar` submodules
- **Next**: Extract submodules, reduce orchestrator to ~200 lines

### AI Provider Registry

**Status**: 🟡 **In Progress**

- Provider contract planned (`AIProvider` interface)
- Structure scaffolded (`src/ai/providers/{base,mock,openai}.ts`)
- Registry not yet implemented (environment-based switching)
- **Next**: Implement provider interface, create registry, integrate with `summarizerCore.ts`

### Offline-First Flow

**Status**: ✅ **Stable**

- Queue-based sync with retry logic (`useAutosaveQueue`)
- Dexie persistence for offline jobs
- Automatic sync on network reconnect
- Event-driven feedback loop (`eventBus`)

### SessionStore Consolidation

**Status**: ✅ **Stable**

- GraphStore merged into SessionStore (`graphLoadedOnce` flag)
- Metadata includes sync tracking (`syncStatus`, `pendingOps`, `lastSyncedAt`)
- Simplified state management

### API Data Normalization

**Status**: 🟡 **In Progress**

- API route (`src/app/api/graph/route.ts`) still emits partial node/edge data
- **Planned**: `normaliseGraphData()` utility to ensure full typed data
- Prisma adapter emits full typed data, but API needs normalization layer

---

## Next Implementation Goals

### Immediate (Week 1-2)

1. **Extract GraphCanvas Submodules**

   - Create `src/components/graph/CanvasSurface.tsx`
   - Create `src/components/graph/InteractionLayer.tsx`
   - Create `src/components/graph/GraphToolbar.tsx`
   - Reduce `GraphCanvas.client.tsx` to orchestrator (~200 lines)

2. **Implement Graph Data Normalization**
   - Create `src/lib/normaliseGraphData.ts` utility
   - Ensure API, session, and Automerge layers use full typed data
   - Update `src/app/api/graph/route.ts` to use normalization

### Short-Term (Week 3-4)

3. **AWS Adapter Dependency Injection**

   - Inject `DynamoDBClient` into `AwsMetadataStore`
   - Inject `S3Client` into `AwsSnapshotStore`
   - Implement real AWS SDK operations
   - Update `syncLambdaHandler.ts` to use actual Automerge binary

4. **AI Provider Registry**
   - Implement `AIProvider` interface
   - Create `MockProvider` and `OpenAIProvider` implementations
   - Add registry with environment-based switching
   - Integrate with `summarizerCore.ts`

### Medium-Term (Week 5-6)

5. **Authentication**

   - Replace mock token validation with JWT validation
   - Add authentication middleware to API routes
   - Secure sync handler

6. **Error Boundaries**
   - Add React error boundaries at route and component levels
   - Graceful error handling for sync failures
   - User-friendly error messages

---

## Summary

FILON Core has undergone significant architectural improvements in v2/v3 refactors:

**Completed**:

- ✅ Centralized domain schema (`types/graph.ts`)
- ✅ Typed Automerge adapters with coercion
- ✅ Swappable sync layer (AWS-ready adapters)
- ✅ SessionStore consolidation
- ✅ Metadata normalization

**In Progress**:

- 🟡 AWS adapter dependency injection
- 🟡 API data normalization
- 🟡 AI provider registry

**Planned**:

- 🔴 GraphCanvas modularization
- 🔴 Authentication implementation
- 🔴 Error boundaries

The architecture is **solid for an MVP** with clear paths to production readiness. The swappable adapter pattern allows development with mocks while preparing for AWS integration. The centralized schema ensures type safety across all layers.

**Recommended Priority**:

1. **Immediate**: GraphCanvas split, API normalization
2. **Short-term**: AWS dependency injection, AI provider registry
3. **Medium-term**: Authentication, error boundaries, comprehensive testing
