# ARCHITECTURE PLAN V2 - Monolito Modular (Clean Architecture)

> Gerado em: 2026-03-09
> Status: Estrutura base criada (somente pastas vazias)
> Regra: Nenhum arquivo legado foi modificado ou apagado.

---

## 1. Diagnóstico do Sistema Legado

### 1.1 Estrutura Atual

```
gabinete_agil/
├── App.tsx                  # Roteamento principal
├── types.ts                 # Tipos globais (Cabinet, User, Voter, Demand, Event...)
├── lib/supabase.ts          # Cliente Supabase (singleton)
├── contexts/
│   ├── AuthContext.tsx       # Autenticação, sessão, segurança (295 linhas)
│   └── ProfileContext.tsx   # Perfil do gabinete
├── hooks/
│   ├── useDemands.ts        # CRUD demandas + regras de negócio
│   ├── useVoters.ts         # CRUD eleitores
│   ├── useDashboard.ts      # Agregação de stats
│   ├── useProjects.ts       # Projetos legislativos
│   ├── useAgenda.ts         # Eventos/agenda
│   ├── useReports.ts        # Geração de relatórios
│   ├── useTeam.ts           # Operações de equipe
│   ├── useProductivity.ts   # Métricas de produtividade
│   ├── useGoogleCalendar.ts # Integração Google Calendar
│   ├── useAdminOps.ts       # Operações admin
│   └── admin/
│       ├── useAdminCabinets.ts  # Gestão gabinetes + audit log
│       ├── useAdminStats.ts     # Estatísticas admin
│       └── useAdminUsers.ts     # Gestão de usuários/roles
├── pages/                   # 20+ páginas React
├── components/              # 25+ componentes
├── src/utils/               # Exportação DOCX, impressão, conversão
└── supabase/functions/      # Edge Functions (agent-gateway, copilot, calendar)
```

### 1.2 Problemas Identificados

| # | Problema | Arquivos Afetados | Severidade |
|---|---------|-------------------|------------|
| 1 | **Queries Supabase em Pages** | `Dashboard.tsx` (linhas 79-152), `Voters.tsx` (linhas 32-69) | Alta |
| 2 | **Lógica duplicada entre Hooks e Pages** | `useDashboard.ts` + `Dashboard.tsx` fazem agregação | Alta |
| 3 | **Regras de negócio em componentes UI** | `DemandForm.tsx`, `ImportVotersModal.tsx`, `VoterForm.tsx` | Média |
| 4 | **Drag-and-drop com lógica de status** | `Demands.tsx` (linhas 38-63) - update otimista misturado com UI | Média |
| 5 | **Tipos globais em arquivo monolítico** | `types.ts` na raiz com todas as entidades | Média |
| 6 | **Sem camada de domínio explícita** | Entidades são interfaces TS puras sem comportamento | Alta |
| 7 | **Sem inversão de dependência** | Hooks dependem diretamente do Supabase client | Alta |

### 1.3 Padrões Bons (Preservar)

| Padrão | Onde | Comentário |
|--------|------|------------|
| Custom Hooks como camada de dados | `hooks/` | Boa separação, servem como base para use cases |
| AuthContext como camada de segurança | `contexts/AuthContext.tsx` | Bem estruturado, completo |
| Supabase client centralizado | `lib/supabase.ts` | Single source of truth |
| Edge Functions isoladas | `supabase/functions/` | Backend bem separado |
| Hooks admin agrupados | `hooks/admin/` | Boa organização por domínio |

---

## 2. Nova Estrutura - Monolito Modular

### 2.1 Bounded Contexts

```
src/modules/
├── iam/            # Identity & Access Management
├── crm/            # Customer Relationship Management
├── legislative/    # Projetos, Eventos, Ofícios
└── ai_core/        # Agentes IA, Embeddings, LLM
```

### 2.2 Taxonomia Clean Architecture (por módulo)

```
src/modules/{module}/
├── domain/           # Entidades, Value Objects, Domain Events, Interfaces de repositório
├── use_cases/        # Casos de uso (Application Services)
├── infrastructure/   # Implementações concretas (Supabase, APIs externas, adapters)
└── presentation/     # Hooks React, componentes, páginas específicas do módulo
```

---

## 3. Detalhamento dos Módulos

### 3.1 `iam/` - Identity & Access Management

**Responsabilidade:** Autenticação, autorização, gestão de gabinetes, convites e equipe.

| Camada | Propósito | O que migrar do legado |
|--------|-----------|----------------------|
| `domain/` | Entidades `User`, `Cabinet`, `TeamMember`; interfaces `IAuthRepository`, `ICabinetRepository` | `types.ts` (tipos User, Cabinet), regras de `AuthContext.tsx` |
| `use_cases/` | `LoginUseCase`, `InviteUserUseCase`, `ManageCabinetUseCase`, `AssignRoleUseCase` | Lógica de `AuthContext.tsx`, `useAdminOps.ts`, `useTeam.ts` |
| `infrastructure/` | `SupabaseAuthRepository`, `SupabaseProfileRepository`, adapter de sessão | `lib/supabase.ts` (auth), `contexts/AuthContext.tsx` (queries), `hooks/admin/useAdminCabinets.ts` |
| `presentation/` | Hooks (`useAuth`, `useProfile`), componentes (`ProtectedRoute`, `AdminRoute`), páginas (`Login`, `AcceptInvite`, `Settings`) | `pages/Login.tsx`, `pages/AcceptInvite.tsx`, `components/ProtectedRoute.tsx`, `components/AdminRoute.tsx` |

### 3.2 `crm/` - Eleitores & Demandas

**Responsabilidade:** Gestão de eleitores, demandas (Kanban), importação de dados, dashboard de relacionamento.

| Camada | Propósito | O que migrar do legado |
|--------|-----------|----------------------|
| `domain/` | Entidades `Voter`, `Demand`, `Category`; Value Objects `CPF`, `Address`; interfaces `IVoterRepository`, `IDemandRepository` | `types.ts` (tipos Voter, Demand), regras de negócio de `useDemands.ts`, `useVoters.ts` |
| `use_cases/` | `CreateDemandUseCase`, `UpdateDemandStatusUseCase`, `ImportVotersUseCase`, `SearchVotersUseCase`, `GenerateDashboardStatsUseCase` | Lógica de `useDemands.ts`, `useVoters.ts`, `useDashboard.ts`, `useReports.ts` |
| `infrastructure/` | `SupabaseVoterRepository`, `SupabaseDemandRepository`, `CSVImportAdapter`, `ExcelImportAdapter` | Queries de `useDemands.ts`, `useVoters.ts`, `ImportVotersModal.tsx` |
| `presentation/` | Hooks (`useVoters`, `useDemands`), páginas (`Voters`, `Demands`, `Dashboard`), componentes (`VoterForm`, `DemandForm`, `ImportVotersModal`) | `pages/Voters.tsx`, `pages/Demands.tsx`, `pages/Dashboard.tsx`, `components/VoterForm.tsx`, `components/DemandForm.tsx` |

### 3.3 `legislative/` - Projetos, Eventos, Ofícios

**Responsabilidade:** Projetos de lei, agenda/eventos, documentos oficiais, integração Google Calendar.

| Camada | Propósito | O que migrar do legado |
|--------|-----------|----------------------|
| `domain/` | Entidades `Project`, `Event`, `OfficialDocument`; interfaces `IProjectRepository`, `IEventRepository`, `IDocumentRepository` | `types.ts` (tipos Project, Event), regras de `useProjects.ts`, `useAgenda.ts` |
| `use_cases/` | `CreateProjectUseCase`, `ScheduleEventUseCase`, `GenerateDocumentUseCase`, `SyncCalendarUseCase`, `ExportDocxUseCase` | Lógica de `useProjects.ts`, `useAgenda.ts`, `useGoogleCalendar.ts` |
| `infrastructure/` | `SupabaseProjectRepository`, `SupabaseEventRepository`, `GoogleCalendarAdapter`, `DocxExportAdapter` | Queries de `useProjects.ts`, `useAgenda.ts`, `src/utils/exportProfessionalDocx.ts`, `supabase/functions/google-calendar-*` |
| `presentation/` | Hooks (`useProjects`, `useAgenda`), páginas (`Projects`, `Legislative`, `Agenda`), componentes (`ProjectForm`, `EventForm`, `LegislativeEditor`, `DocumentPrintView`) | `pages/Projects.tsx`, `pages/Legislative.tsx`, `pages/Agenda.tsx`, componentes relacionados |

### 3.4 `ai_core/` - Agentes IA, Embeddings, LLM

**Responsabilidade:** Gateway de agentes, copilot conversacional, embeddings, integração com modelos LLM.

| Camada | Propósito | O que migrar do legado |
|--------|-----------|----------------------|
| `domain/` | Entidades `Agent`, `Conversation`, `Embedding`; interfaces `ILLMProvider`, `IEmbeddingRepository`, `IAgentGateway` | Tipos inferidos de `agent-gateway/index.ts`, `query-copilot/index.ts` |
| `use_cases/` | `ProcessAgentRequestUseCase`, `QueryCopilotUseCase`, `GenerateEmbeddingUseCase`, `SimulateResponseUseCase` | Lógica de `supabase/functions/agent-gateway/index.ts`, `supabase/functions/query-copilot/index.ts` |
| `infrastructure/` | `GeminiLLMProvider`, `SupabaseEmbeddingRepository`, `AgentToolRouter` | `supabase/functions/agent-gateway/index.ts` (integração Gemini, roteamento de tools), `supabase/functions/query-copilot/index.ts` |
| `presentation/` | Hooks (`useCopilot`, `useAgent`), componentes (`CopilotWidget`, `ChatSimulator`), página (`Agent`) | `components/CopilotWidget.tsx`, `components/ChatSimulator.tsx`, `pages/Agent.tsx` |

---

## 4. Regra de Dependência (Dependency Rule)

```
presentation → use_cases → domain ← infrastructure
     ↓              ↓          ↑           ↑
  (hooks,        (app       (entities,   (supabase,
   pages,       services)   interfaces)   adapters)
   components)
```

**Regras invioláveis:**

1. `domain/` **NIO importa nada** de outras camadas
2. `use_cases/` importa **somente** de `domain/`
3. `infrastructure/` implementa interfaces de `domain/`
4. `presentation/` orquestra via `use_cases/`
5. **Nenhum módulo importa diretamente de outro módulo** (comunicação via eventos ou shared kernel)

---

## 5. Estratégia de Migração Incremental

### Fase 1: Estrutura Base (CONCLUÍDA)
- [x] Criar árvore `src/modules/` com 4 bounded contexts
- [x] Criar taxonomia Clean Architecture por módulo
- [x] Gerar este relatório de arquitetura

### Fase 2: Domínio (Próxima)
- [ ] Extrair entidades de `types.ts` para `domain/` de cada módulo
- [ ] Definir interfaces de repositório em `domain/`
- [ ] Criar Value Objects onde aplicável (CPF, Email, Address)

### Fase 3: Use Cases
- [ ] Migrar lógica de negócio dos hooks para `use_cases/`
- [ ] Cada hook atual vira um ou mais Use Cases
- [ ] Garantir que use cases não dependem de Supabase diretamente

### Fase 4: Infrastructure
- [ ] Implementar repositórios Supabase que satisfazem interfaces do domínio
- [ ] Migrar adapters (Google Calendar, Gemini, DOCX export)

### Fase 5: Presentation
- [ ] Criar novos hooks que orquestram use cases (não Supabase direto)
- [ ] Migrar páginas e componentes para `presentation/` dos módulos
- [ ] Remover código legado gradualmente

### Fase 6: Limpeza
- [ ] Remover hooks legados quando todos os consumidores migrarem
- [ ] Remover `types.ts` global quando entidades estiverem nos módulos
- [ ] Atualizar imports em `App.tsx`

---

## 6. Árvore Final Criada

```
src/modules/
├── iam/
│   ├── domain/           # Entities: User, Cabinet, TeamMember
│   ├── use_cases/        # Login, Invite, ManageCabinet, AssignRole
│   ├── infrastructure/   # SupabaseAuthRepo, SupabaseProfileRepo
│   └── presentation/     # useAuth, Login, ProtectedRoute, Settings
│
├── crm/
│   ├── domain/           # Entities: Voter, Demand, Category
│   ├── use_cases/        # CreateDemand, ImportVoters, SearchVoters
│   ├── infrastructure/   # SupabaseVoterRepo, SupabaseDemandRepo, CSVAdapter
│   └── presentation/     # useVoters, useDemands, Voters, Demands, Dashboard
│
├── legislative/
│   ├── domain/           # Entities: Project, Event, OfficialDocument
│   ├── use_cases/        # CreateProject, ScheduleEvent, ExportDocx
│   ├── infrastructure/   # SupabaseProjectRepo, GoogleCalendarAdapter, DocxAdapter
│   └── presentation/     # useProjects, useAgenda, Projects, Agenda, Legislative
│
└── ai_core/
    ├── domain/           # Entities: Agent, Conversation, Embedding
    ├── use_cases/        # ProcessAgentRequest, QueryCopilot, GenerateEmbedding
    ├── infrastructure/   # GeminiLLMProvider, SupabaseEmbeddingRepo, AgentToolRouter
    └── presentation/     # useCopilot, useAgent, CopilotWidget, Agent
```

---

## 7. Convenções de Nomenclatura

| Elemento | Convenção | Exemplo |
|----------|-----------|---------|
| Entidades | PascalCase, substantivo | `Voter.ts`, `Demand.ts` |
| Use Cases | PascalCase, verbo + substantivo | `CreateDemandUseCase.ts` |
| Repositórios (interface) | I + PascalCase | `IVoterRepository.ts` |
| Repositórios (impl) | Provider + PascalCase | `SupabaseVoterRepository.ts` |
| Hooks | camelCase, use + substantivo | `useVoters.ts` |
| Componentes | PascalCase | `VoterForm.tsx` |
| Value Objects | PascalCase | `CPF.ts`, `Email.ts` |

---

> **Nota:** Nenhum arquivo do sistema legado foi modificado ou excluido. A estrutura nova coexiste com o código atual para permitir migração incremental e segura.
