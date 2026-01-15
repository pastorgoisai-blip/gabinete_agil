# SLICE_PLAN: Funcionalidade Agenda Real

## 1. Database Schema
**Tabela**: `events` (Atualização)
- `notes` TEXT
- `notify_politician` BOOLEAN DEFAULT FALSE
- `notify_media` BOOLEAN DEFAULT FALSE
- `notify_staff` BOOLEAN DEFAULT FALSE

## 2. API / Hooks (The Bridge)
**Hook**: `hooks/useAgenda.ts`
- **Actions**:
  - `fetchEvents()`: GET /events
  - `createEvent(data)`: POST /events
  - `updateEvent(id, data)`: PUT /events
  - `deleteEvent(id)`: DELETE /events
- **Validation (Zod)**:
  - Validar datas e campos obrigatórios antes de enviar.
- **Transformation**:
  - DB `start_time` <-> UI `startTime`
  - DB `end_time` <-> UI `endTime`
  - DB `notify_politician` <-> UI `notifyPolitician`
  - (etc)

## 3. UI Component (The Face)
**Arquivo**: `pages/Agenda.tsx`
- Remover `initialEvents`.
- Integrar `useAgenda`.
- Mostrar Loading State.
- Conectar formulários às funções do hook.
