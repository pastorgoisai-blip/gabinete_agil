# Changelog: Reformulação IA e Console do Agente
**Data:** 31 de Janeiro de 2026
**Autor:** Antigravity (Via solicitação do Usuário)

## Resumo
Este documento registra as alterações significativas realizadas no sistema "Gabinete Ágil" focadas na reestruturação da Inteligência Artificial, criação de um Simulador de Chat e reformulação completa da interface de monitoramento do Agente (Console WhatsApp).

---

## 1. Banco de Dados (Supabase)
### Migrations
- **`20260201_ai_brain_setup.sql`**:
    - Adicionada coluna `system_prompt` na tabela `agent_configurations` para personalizar a personalidade da IA.
    - Adicionada coluna `copilot_system_prompt` na tabela `agent_configurations` para personalizar o assistente interno (Copilot).
    - Criada tabela `simulation_messages` para suportar o histórico do simulador sem poluir as conversas reais.

---

## 2. Backend (Edge Functions)
### `agent-gateway`
- **Atualização de Modelo**: Migrado para `gemini-2.5-flash-lite` (Google) para maior rapidez e estabilidade.
- **Prompt Dinâmico**: A função agora busca o `system_prompt` do banco de dados antes de processar a mensagem no Gemini.
- **Simulação**: Adicionado suporte a flag `simulate: true` para processar mensagens de teste sem enviar via WhatsApp API.

### `query-copilot`
- **Contexto Personalizado**: A função agora busca o `copilot_system_prompt` do banco de dados, permitindo que o usuário defina regras específicas para o assistente interno (diferentes do agente de atendimento).

---

## 3. Frontend (Interface de Usuário)
### Novo Console do Agente (`pages/Agent.tsx`)
- **Reformulação Total**: Substituído o layout antigo de cards por uma interface **"WhatsApp Web Style"**.
- **Split-View**:
    - **Sidebar Esquerda**: Lista de conversas ativas com busca, fotos de perfil e status.
    - **Painel Principal**: Janela de chat com histórico rolável, balões de mensagem estilizados e input de resposta rápida.
- **Realtime**: Implementado `Supabase Realtime` para que novas mensagens apareçam instantaneamente sem recarregar a página.

### Configurações de IA (`pages/Settings.tsx`)
- **Aba Inteligência Artificial**:
    - **Editor de Cérebro (Externo)**: Campo para editar o prompt do agente que fala com o cidadão.
    - **Editor de Cérebro (Interno)**: Campo para editar o prompt do Copilot que auxilia a equipe.
    - **Simulador Integrado**: Adicionado o componente `ChatSimulator` diretamente na tela de configurações para testar prompts rapidamente.

### Componentes
- **`components/ChatSimulator.tsx`**: Novo componente isolado para testes de IA com UI otimista (resposta imediata).

---

## 4. Documentação
- Criado **`docs/n8n_integration.md`**: Guia para integração com n8n (Webhooks).
- Atualizado **`task.md`**: Controle de tarefas e progresso.

---

## Próximos Passos Sugeridos
1.  **Testes de Carga**: Verificar comportamento do Realtime com múltiplas conversas simultâneas.
2.  **Integração de Mídia**: Permitir envio de áudio/imagem pelo Console do Agente.
3.  **Filtros Avançados**: Implementar filtros por status (Pendente/Resolvido) na Sidebar do Agente.
