# SLICE_PLAN: Dashboard Super Admin

## 1. Objetivo
Criar uma interface administrativa para gestão da plataforma SaaS (Multi-tenant).

## 2. Componente UI
**Arquivo**: `pages/admin/AdminDashboard.tsx`

**Funcionalidades**:
1.  **KPIs Globais**: Total de Gabinetes, Usuários, Receita (Mock inicial).
2.  **Lista de Gabinetes**: Tabela com ID, Nome, Plano, Data de Criação.
3.  **Ação de Criar**: Botão "Novo Gabinete" -> Modal com Nome e Plano.
    *   *Nota*: Usar a policy RLS `RLS_Cabinets_Insert` que já criamos (só super_admin pode).

## 3. Dados (Supabase)
- **Leitura**: `SELECT * FROM cabinets` (Policy já permite Super Admin ver tudo).
- **Escrita**: `INSERT INTO cabinets` (Policy já restringe a Super Admin).

## 4. Segurança
- A rota `/admin` já está protegida por `AdminRoute`.
- Vamos verificar se `AdminRoute` checa a flag `is_super_admin` corretamente.
