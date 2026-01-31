# Guia de Integração n8n - VoxDei Agent Gateway 🧠

Este guia explica como conectar o seu fluxo do n8n (WhatsApp/Instagram) ao **Cérebro Centralizado** do Gabinete Ágil.

Isso garante que todos os canais usem a mesma "personalidade" e as mesmas ferramentas (Agenda, Demandas, etc).

---

## 1. Conceito Chave

❌ **NÃO** coloque prompts complexos ("Você é um assistente...") dentro do n8n.
✅ **SIM**, apenas repasse a mensagem do usuário para o Gateway.

O Supabase (Admin) cuida de:
- Personalidade (Prompt do Sistema)
- Contexto (Data, Histórico)
- Ferramentas (Banco de Dados)

---

## 2. Configuração no n8n

### Passo 1: Obter Credenciais
No painel do Gabinete Ágil, vá em **Configurações > Inteligência Artificial > 1.5 Conexão Externa**.
Copie:
- **URL do Gateway**: `https://[REF].supabase.co/functions/v1/agent-gateway`
- **Agent Access Token**: `xxxxxxxx-xxxx-xxxx...`

### Passo 2: Nó HTTP Request
No seu fluxo n8n, adicione um nó **HTTP Request** com a seguinte configuração:

- **Method**: `POST`
- **URL**: Cole a URL do Gateway.
- **Authentication**: `None` (usaremos Headers).
- **Headers**:
    - `Content-Type`: `application/json`
    - `x-agent-token`: Cole o seu Token de Acesso.
- **Body Parameters**:
    ```json
    {
      "tool": "simulate_response",
      "agent_name": "n8n-whatsapp-bot",
      "args": {
        "message": "{{ $json.message }}"
      }
    }
    ```
    *(Substitua `{{ $json.message }}` pela variável que contém o texto recebido do WhatsApp)*

### Passo 3: Tratar a Resposta
O Gateway retornará um JSON:
```json
{
  "success": true,
  "data": {
    "role": "assistant",
    "content": "Olá! Sou o assistente virtual do vereador. Como posso ajudar?",
    "created_at": "..."
  }
}
```

Use a propriedade `content` para enviar a resposta de volta ao WhatsApp.

---

## 3. Boas Práticas

### Erros Comuns
- **401 Unauthorized**: Seu Token está errado ou revogado.
- **500 Internal Error**: Geralmente significa que a chave do Google Gemini (IA) não está configurada no painel do Gabinete.

### Timeout
A IA pode demorar de 2 a 5 segundos para responder. Aumente o timeout do nó HTTP no n8n se necessário.
