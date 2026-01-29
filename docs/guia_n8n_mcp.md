# Guia de Configuração e Troubleshooting: n8n MCP Server

Este guia orienta como configurar corretamente o servidor MCP para conectar com sua instância do **n8n** e resolver problemas de conexão.

## 1. Pré-requisitos

*   **Instância n8n Ativa**: Você deve ter acesso à interface web do seu n8n (ex: `http://localhost:5678` ou `https://n8n.seu-dominio.com`).
*   **Servidor MCP Instalado**: O binário ou pacote `n8n-mcp` deve estar presente no seu sistema.

## 2. Passo a Passo de Configuração

### Passo 1: Gerar API Key no n8n

O servidor MCP precisa de uma chave de API para se autenticar no n8n.

1.  Abra seu n8n.
2.  Vá em **Settings** (Configurações) > **Developer** (Desenvolvedor).
3.  Clique em **Create New API Key** (Criar Nova API Key).
4.  Dê um nome (ex: "MCP Agent") e copie a chave gerada (ex: `api_key_...`).

### Passo 2: Configurar o Cliente MCP

Dependendo de como você está usando o MCP (Claude Desktop, VS Code Extension, etc.), você precisa editar o arquivo de configuração (geralmente `claude_desktop_config.json` ou similar).

Adicione ou edite a entrada para `n8n-mcp`:

```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "n8n-mcp"
      ],
      "env": {
        "N8N_API_KEY": "sua_api_key_aqui",
        "N8N_HOST": "seu_host_n8n_aqui" 
      }
    }
  }
}
```

> **Atenção aos detalhes:**
> *   `N8N_HOST`: Deve ser a URL base **sem** a barra final `/`.
>     *   Correto: `http://localhost:5678` ou `https://meu-n8n.com`
>     *   Incorreto: `http://localhost:5678/` ou `http://localhost:5678/webhook`

## 3. Verificando a Conexão

Após salvar o arquivo de configuração e reiniciar seu cliente MCP:

1.  Peça ao agente: "Listar meus workflows do n8n".
2.  Se ele retornar a lista, a conexão foi bem sucedida.

## 4. Troubleshooting (Solução de Problemas)

### Erro: "Cannot read properties of undefined" (no n8n)
Isso geralmente **não** é erro do MCP, mas sim do próprio workflow.
*   **Causa**: O nó `Respond to Webhook` foi executado manualmente ou perdeu o contexto da requisição HTTP original.
*   **Solução**: Teste o workflow disparando uma requisição real (via Postman/Curl) para a URL do Webhook de Teste, em vez de clicar em "Execute Node".

### Erro: MCP não encontra workflows (Lista Vazia)
*   **Verifique a API Key**: O usuário dono da chave tem permissão para ver os workflows?
*   **Verifique o Host**: A URL está acessível da máquina onde o agente roda? (tente abrir no navegador).
*   **Firewall/Docker**: Se o n8n roda em Docker e o agente em outro container/host, `localhost` pode não funcionar. Use o IP da rede ou DNS interno.

### Variáveis de Ambiente
Alternativamente, você pode definir as variáveis no seu sistema operacional se não quiser colocá-las no JSON:
*   `N8N_API_KEY`
*   `N8N_HOST`

## 5. Exemplo de Uso com MCP

Uma vez conectado, o agente pode:
*   **Listar workflows**: `mcp_n8n-mcp_search_workflows()`
*   **Ver detalhes**: `mcp_n8n-mcp_get_workflow_details(workflowId=...)`
*   **Executar workflows**: `mcp_n8n-mcp_execute_workflow(workflowId=..., inputs=...)`
