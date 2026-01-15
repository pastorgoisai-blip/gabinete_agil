---
description: Guia completo de onboarding para o sistema Gabinete Ágil
---

# 🎯 Workflow de Onboarding - Gabinete Ágil

Bem-vindo ao **Gabinete Ágil**, um sistema SaaS multi-tenant de gestão política para gabinetes parlamentares.

## 📋 Visão Geral do Projeto

O Gabinete Ágil é uma plataforma completa que permite:
- Gerenciamento de eleitores e demandas
- Controle de agenda de eventos
- Projetos legislativos
- Sistema de homenagens
- Notificações e relatórios
- Painel administrativo
- Assistente inteligente (Copilot)

## 🏗️ Arquitetura

- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Roteamento**: React Router DOM (HashRouter)
- **Estilo**: CSS customizado
- **Automação**: Integração com N8N (via webhooks)

## 🚀 Primeiros Passos

### 1. Pré-requisitos

Certifique-se de ter instalado:
- **Node.js** (versão 18 ou superior)
- **npm** (gerenciador de pacotes)
- Conta no **Supabase** (gratuita)
- (Opcional) Conta no **N8N** para automações

### 2. Instalação de Dependências

```bash
npm install
```

### 3. Configuração do Supabase

#### 3.1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote a **URL do projeto** e a **chave anon**

#### 3.2. Configurar Variáveis de Ambiente

Edite o arquivo `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
```

#### 3.3. Executar Migrações do Banco

Execute os seguintes scripts SQL no **SQL Editor** do Supabase, **nesta ordem**:

1. `schema.sql` - Cria tabelas principais e políticas RLS
2. `setup_offices_table.sql` - Configura tabela de gabinetes
3. `fix_onboarding_final.sql` - Correções do fluxo de onboarding
4. `setup_agent_tables.sql` - Tabelas para o sistema de agentes
5. `setup_admin_infrastructure.sql` - Infraestrutura de administração

### 4. Executar o Projeto Localmente

```bash
npm run dev
```

O projeto estará disponível em `http://localhost:5173`

### 5. Primeiro Acesso

1. **Registrar-se**: Acesse a página de login e crie uma nova conta
2. **Onboarding**: Você será automaticamente redirecionado para criar seu gabinete
3. **Preencher Dados**: Complete as informações do seu gabinete:
   - Nome do Gabinete
   - Plano (Free/Pro/Enterprise)
4. **Pronto!** Você será redirecionado para o Dashboard

## 📦 Estrutura do Projeto

```
gabinete_agil/
├── .agent/
│   └── workflows/          # Workflows e automações
├── components/             # Componentes React reutilizáveis
│   ├── Sidebar.tsx        # Menu lateral
│   ├── Header.tsx         # Cabeçalho
│   ├── CopilotWidget.tsx  # Assistente IA
│   └── ...
├── contexts/              # Contextos React
│   ├── AuthContext.tsx    # Autenticação
│   └── ProfileContext.tsx # Perfil do usuário
├── pages/                 # Páginas da aplicação
│   ├── Dashboard.tsx      # Painel principal
│   ├── Voters.tsx         # Gestão de eleitores
│   ├── Demands.tsx        # Gestão de demandas
│   ├── Onboarding.tsx     # Tela de cadastro inicial
│   └── ...
├── hooks/                 # Custom hooks
├── lib/                   # Bibliotecas e utilidades
├── App.tsx                # Componente principal
├── *.sql                  # Scripts de migração
└── package.json           # Dependências
```

## 🔐 Sistema de Autenticação e Multi-Tenancy

O sistema utiliza **Row Level Security (RLS)** do Supabase para isolamento de dados:

- Cada gabinete (`cabinet`) é um tenant isolado
- Usuários (`profiles`) pertencem a um gabinete específico
- Todas as tabelas possuem RLS configurada
- Dados são filtrados automaticamente por `cabinet_id`

### Roles (Funções)

- **super_admin**: Acesso total ao sistema
- **admin**: Administrador do gabinete
- **manager**: Gerente com permissões intermediárias
- **staff**: Equipe com acesso limitado
- **volunteer**: Voluntário com acesso básico

## 🎨 Principais Funcionalidades

### 1. Dashboard
- Visão geral de métricas
- Gráficos e estatísticas
- Atalhos rápidos

### 2. Eleitores (Voters)
- Cadastro e gerenciamento de eleitores
- Categorização e status
- Histórico de interações

### 3. Demandas (Demands)
- Registro de solicitações
- Priorização e categorização
- Acompanhamento de status

### 4. Agenda (Events)
- Calendário de eventos
- Agendamento de compromissos
- Notificações

### 5. Projetos Legislativos
- Gestão de projetos de lei
- Tramitação e status
- Documentos anexados

### 6. Homenageados (Honored)
- Registro de homenageados
- Biografias e justificativas
- Cerimônias e eventos

### 7. Assistente IA (Copilot)
- Widget flutuante
- Integração com N8N
- Respostas contextuais

## 🔧 Desenvolvimento

### Build para Produção

```bash
npm run build
```

Os arquivos otimizados estarão em `dist/`

### Preview da Build

```bash
npm run preview
```

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório GitHub
2. Configure as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy automático!

### Outras Plataformas

- **Netlify**: Configuração similar ao Vercel
- **GitHub Pages**: Compatível com HashRouter
- **Firebase Hosting**: Suporte total

## 🤝 Integrações

### N8N (Automação)

O sistema possui integração com N8N para:
- Envio de notificações WhatsApp
- Lembretes de eventos
- Relatórios automáticos
- Webhooks personalizados

**Configuração**:
1. Configure sua instância N8N
2. Crie workflows com webhooks
3. Configure as URLs no componente `CopilotWidget.tsx`

## 📚 Recursos Adicionais

- **Documentação Supabase**: [docs.supabase.com](https://docs.supabase.com)
- **Documentação React**: [react.dev](https://react.dev)
- **Documentação Vite**: [vitejs.dev](https://vitejs.dev)
- **N8N Docs**: [docs.n8n.io](https://docs.n8n.io)

## 🆘 Solução de Problemas

### Erro: "White Screen" após login

**Causa**: Usuário sem `cabinet_id` no perfil

**Solução**: Execute o script `fix_onboarding_final.sql` no Supabase

### Erro: RLS Policy Violation

**Causa**: Políticas RLS mal configuradas

**Solução**: Execute `fix_recursive_rls.sql` para corrigir políticas

### Dados não aparecem na interface

**Causa**: Problemas de isolamento multi-tenant

**Solução**: Verifique se o `cabinet_id` está correto na tabela `profiles`

## 📝 Checklist de Onboarding

- [ ] Node.js instalado
- [ ] Projeto clonado
- [ ] Dependências instaladas (`npm install`)
- [ ] Conta Supabase criada
- [ ] Variáveis de ambiente configuradas (`.env.local`)
- [ ] Migrações SQL executadas
- [ ] Servidor de desenvolvimento rodando (`npm run dev`)
- [ ] Conta de usuário criada
- [ ] Gabinete configurado via Onboarding
- [ ] Dashboard acessível

## 🎉 Próximos Passos

Após concluir o onboarding:

1. **Explore o Dashboard**: Familiarize-se com as métricas
2. **Adicione Dados**: Cadastre eleitores e demandas de teste
3. **Configure o Perfil**: Acesse Settings e personalize
4. **Convide a Equipe**: Adicione usuários ao seu gabinete
5. **Configure Automações**: Integre com N8N (opcional)
6. **Personalize**: Ajuste cores e branding conforme necessário

---

**Desenvolvido com ❤️ para gestão política eficiente**
