# PROJECT CODENEXUS: Gabinete Ágil

> **"Bíblia do Projeto"** — Documento vivo para onboarding de LLMs e desenvolvedores.
> Última atualização: 2026-02-09

---

## 1. Visão Geral & Domínio

**Resumo:** SaaS de **Gestão de Gabinete Político** focado em digitalização e automação de processos legislativos municipais.

**Problema Principal:** Gabinetes de vereadores usam planilhas Excel, WhatsApp pessoal e processos manuais para gerenciar demandas, eleitores, eventos e documentos oficiais.

**Solução:** Plataforma centralizada com:
- CRM de Eleitores (categorização, histórico)
- Gestão de Demandas (fluxo kanban-like)
- Agenda Integrada (Google Calendar sync)
- Geração de Ofícios (templates + assinatura digital)
- Assistente IA (Copilot + Agente WhatsApp)

**Modelo de Negócio:** Multi-tenant SaaS (cada gabinete = 1 tenant isolado por RLS)

**Público-Alvo:** Gabinetes de vereadores, assessorias parlamentares, câmaras municipais.

---

## 2. Tech Stack & Constraints

### **Frontend (Client-Heavy)**
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| React | 18.3.1 | UI Library |
| Vite | 6.2.0 | Build Tool & Dev Server |
| TypeScript | 5.8.2 | Type Safety |
| Tailwind CSS | 3.4.17 | Utility-First Styling |
| React Router | 6.23.1 | Client-side Routing |
| React Hook Form | 7.71.1 | Form State Management |
| Zod | 4.3.5 | Schema Validation |
| Lucide React | 0.378.0 | Icon Library |
| Recharts | 2.12.7 | Data Visualization |
| CKEditor 5 | 47.4.0 | Rich Text Editor |

### **Backend (Supabase as BaaS)**
| Componente | Tecnologia | Propósito |
|------------|------------|-----------|
| Database | PostgreSQL 15+ | Dados estruturados |
| Auth | Supabase Auth | JWT + OAuth2 |
| Storage | Supabase Storage | Arquivos (templates, docs) |
| Edge Functions | Deno Runtime | Serverless Logic |
| Realtime | Supabase Realtime | WebSocket subscriptions |

### **AI/LLM Stack**
| Componente | Tecnologia |
|------------|------------|
| Copilot | Google Gemini (via Edge Function) |
| Agent Gateway | Google Gemini + Tool Calling |
| Embeddings | *(Planejado: Sentence Transformers + pgvector)* |

### **Infraestrutura**
- **Hosting Frontend:** Vercel (implícito, padrão Vite)
- **Database:** Supabase Cloud (projeto externo)
- **CI/CD:** *(Não configurado - manual deploy)*

---

## 3. Estrutura de Diretórios

```
/gabinete_agil
├── .agent/                    # Configurações do Antigravity Agent
│   ├── rules/                 # Prompt rules
│   ├── skills/                # Skill modules
│   └── workflows/             # Automation workflows
├── components/                # React Components (26 files)
│   ├── AdminRoute.tsx         # Route guard: admin-only
│   ├── ProtectedRoute.tsx     # Route guard: authenticated
│   ├── CopilotWidget.tsx      # Floating AI Assistant
│   ├── Sidebar.tsx            # Main navigation
│   ├── Header.tsx             # Top bar
│   ├── *Form.tsx              # Entity forms (Demand, Event, Voter, Project)
│   ├── *Modal.tsx             # Import modals (Voters, Offices, Legislative)
│   └── RichTextEditor.tsx     # CKEditor wrapper
├── contexts/                  # React Context Providers
│   ├── AuthContext.tsx        # Auth state + Supabase client
│   └── ProfileContext.tsx     # User profile state
├── hooks/                     # Custom React Hooks (13 files)
│   ├── useAgenda.ts           # Events CRUD
│   ├── useDemands.ts          # Demands CRUD
│   ├── useVoters.ts           # Voters CRUD
│   ├── useDashboard.ts        # Dashboard metrics
│   └── useGoogleCalendar.ts   # Calendar OAuth + Sync
├── pages/                     # Page Components (22 files)
│   ├── Dashboard.tsx          # Main dashboard
│   ├── Voters.tsx             # Voter management
│   ├── Demands.tsx            # Demand management
│   ├── Agenda.tsx             # Calendar view
│   ├── Settings.tsx           # Cabinet settings (49KB!)
│   ├── Agent.tsx              # WhatsApp Agent console
│   └── admin/                 # Super Admin pages
├── supabase/
│   ├── functions/             # Edge Functions (5 functions)
│   │   ├── agent-gateway/     # WhatsApp AI Agent backend
│   │   ├── query-copilot/     # In-app Copilot backend
│   │   ├── google-calendar-oauth/
│   │   ├── google-calendar-sync/
│   │   └── create-document-from-template/
│   └── migrations/            # SQL Migrations (44 files)
│       └── schema.sql         # Core schema definition
├── docs/                      # Internal documentation
│   ├── DESIGN_SYSTEM.md       # UI/UX guidelines
│   └── n8n_*.md               # n8n integration guides
├── lib/                       # Shared utilities
├── types.ts                   # TypeScript definitions (261 lines)
├── App.tsx                    # Root component + Router
├── index.tsx                  # React entry point
├── index.css                  # Global styles
└── package.json               # Dependencies
```

---

## 4. Arquitetura Multi-Tenant

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐│
│  │ Dashboard│ │ Voters   │ │ Demands  │ │ CopilotWidget    ││
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬─────────┘│
│       │            │            │                 │          │
│       └────────────┴────────────┴─────────────────┘          │
│                              │                                │
│                    ┌─────────▼─────────┐                      │
│                    │   AuthContext     │                      │
│                    │  (cabinet_id)     │                      │
│                    └─────────┬─────────┘                      │
└──────────────────────────────┼──────────────────────────────┘
                               │
           ┌───────────────────┴───────────────────┐
           │         Supabase Client SDK           │
           └───────────────────┬───────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────┐
│                    Supabase Backend                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                  PostgreSQL + RLS                        ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐ ││
│  │  │ cabinets │ │ profiles │ │ voters   │ │ demands     │ ││
│  │  │ (tenant) │ │ (users)  │ │          │ │             │ ││
│  │  └──────────┘ └──────────┘ └──────────┘ └─────────────┘ ││
│  │                                                          ││
│  │  RLS Policy: cabinet_id = get_user_cabinet_id()          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                  Edge Functions (Deno)                   ││
│  │  ┌────────────────┐ ┌────────────────┐                  ││
│  │  │ query-copilot  │ │ agent-gateway  │                  ││
│  │  │ (Gemini LLM)   │ │ (WhatsApp AI)  │                  ││
│  │  └────────────────┘ └────────────────┘                  ││
│  └─────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

### **Isolamento de Dados (RLS)**
```sql
-- Função auxiliar: retorna o cabinet_id do usuário logado
CREATE FUNCTION get_user_cabinet_id() RETURNS UUID AS $$
  SELECT cabinet_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Política aplicada em TODAS as tabelas de dados
CREATE POLICY "Tenant Isolation" ON public.voters
FOR ALL USING (cabinet_id = get_user_cabinet_id());
```

---

## 5. Módulos & Features Implementadas

| Módulo | Status | Descrição Técnica |
|--------|--------|-------------------|
| **Auth** | ✅ OK | Supabase Auth + JWT, roles (admin/manager/staff/volunteer/super_admin) |
| **Onboarding** | ✅ OK | Criação de gabinete + convites por email |
| **Dashboard** | ✅ OK | Métricas agregadas (voters, demands, events) |
| **Voters (Eleitores)** | ✅ OK | CRUD + importação XLSX/CSV + categorização |
| **Demands (Demandas)** | ✅ OK | CRUD + status workflow + atribuição |
| **Agenda (Eventos)** | ✅ OK | CRUD + Google Calendar sync bidirectional |
| **Honorees (Homenagens)** | ✅ OK | CRUD + cerimoniais |
| **Legislative (Ofícios)** | ✅ OK | Importação externa + templates + assinatura |
| **Projects (Projetos de Lei)** | ✅ OK | Acompanhamento de tramitação |
| **Agent (WhatsApp)** | ⚠️ WIP | Console de conversas + regras automáticas |
| **Copilot** | ✅ OK | Widget flutuante com Gemini LLM |
| **Super Admin** | ✅ OK | God Mode para gestão de todos os tenants |
| **Permissions** | ✅ OK | Granular per-module (view/edit/delete) |

### **Legenda:**
- ✅ OK = Produção
- ⚠️ WIP = Em desenvolvimento
- 🔜 TODO = Planejado

---

## 6. Padrões de Código (Style Guide)

### **TypeScript**
```typescript
// ✅ CORRETO: Interfaces em types.ts, strict typing
interface Voter {
  id: number | string;
  name: string;
  category: 'Liderança' | 'Apoiador' | 'Voluntário' | 'Indeciso';
}

// ❌ INCORRETO: any types
const voter: any = fetchVoter(); // NUNCA!
```

### **React Components**
```typescript
// ✅ CORRETO: Functional components + hooks
export function VoterCard({ voter }: { voter: Voter }) {
  const [isEditing, setIsEditing] = useState(false);
  // ...
}

// ❌ INCORRETO: Class components
class VoterCard extends React.Component { ... }
```

### **Supabase Queries**
```typescript
// ✅ CORRETO: Sempre incluir cabinet_id implicitamente (RLS cuida)
const { data } = await supabase
  .from('voters')
  .select('*')
  .eq('category', 'Liderança');

// ❌ INCORRETO: Bypass RLS com service_role key no frontend
```

### **Commits**
```
feat(voters): add bulk import from XLSX
fix(auth): handle expired JWT gracefully
chore(deps): upgrade react-hook-form to 7.71
docs(readme): update deployment instructions
```

---

## 7. Edge Functions Reference

| Function | Endpoint | Propósito |
|----------|----------|-----------|
| `query-copilot` | `/functions/v1/query-copilot` | Processa queries do widget Copilot via Gemini |
| `agent-gateway` | `/functions/v1/agent-gateway` | Webhook para WhatsApp (Evolution API) |
| `google-calendar-oauth` | `/functions/v1/google-calendar-oauth` | OAuth2 flow para Google Calendar |
| `google-calendar-sync` | `/functions/v1/google-calendar-sync` | Sync bidirectional de eventos |
| `create-document-from-template` | `/functions/v1/create-document-from-template` | Gera documentos a partir de templates |

---

## 8. Database Schema (Core Tables)

| Tabela | Descrição | Chave de Isolamento |
|--------|-----------|---------------------|
| `cabinets` | Tenants (gabinetes) | `id` (é o tenant) |
| `profiles` | Usuários vinculados a cabinets | `cabinet_id` |
| `voters` | Base de eleitores | `cabinet_id` |
| `demands` | Demandas/solicitações | `cabinet_id` |
| `events` | Agenda de eventos | `cabinet_id` |
| `honorees` | Homenageados | `cabinet_id` |
| `legislative_projects` | Projetos de lei | `cabinet_id` |
| `notifications` | Notificações in-app | `cabinet_id` |
| `agent_conversations` | Conversas WhatsApp | `cabinet_id` |
| `agent_messages` | Mensagens das conversas | via `conversation_id` |
| `agent_rules` | Regras de automação do agente | `cabinet_id` |

---

## 9. Roadmap & Próximos Passos

### **Curto Prazo (Sprint Atual)**
- [ ] Finalizar console do Agent WhatsApp (real-time messages)
- [ ] Implementar regras de automação (keywords → actions)
- [ ] Testes E2E (Playwright setup)

### **Médio Prazo**
- [ ] RAG: Embeddings de documentos + busca semântica (pgvector)
- [ ] Relatórios avançados (PDF export)
- [ ] App Mobile (React Native ou PWA)

### **Longo Prazo**
- [ ] Integração direta com sistemas da Câmara (API)
- [ ] Multi-idioma (i18n)
- [ ] Marketplace de templates

---

## 10. Troubleshooting & Gotchas

### **RLS não retorna dados**
→ Verificar se o usuário está autenticado e tem `cabinet_id` no profile.

### **Edge Function retorna 401**
→ Verificar se o header `Authorization: Bearer <token>` está presente.

### **Google Calendar não sincroniza**
→ Verificar se `google_access_token` e `google_refresh_token` estão salvos no cabinet.

### **Vite build falha**
→ Executar `npm run build` e verificar erros TypeScript. `types.ts` é a fonte de verdade.

---

> **Para Novos Agentes/LLMs:** Leia este documento antes de qualquer implementação. Todas as decisões arquiteturais estão documentadas aqui.
