# Secretária WhatsApp do Vereador - Workflows n8n

Este documento contém os workflows n8n para automatizar a agenda do vereador via WhatsApp.

## Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Workflow 1: Receptor de Mensagens](#workflow-1-receptor-de-mensagens)
4. [Workflow 2: Resumo Matinal](#workflow-2-resumo-matinal)
5. [Workflow 3: Lembretes Automáticos](#workflow-3-lembretes-automáticos)
6. [Configuração](#configuração)
7. [Troubleshooting](#troubleshooting)

---

## Visão Geral

```
┌─────────────────┐
│   WhatsApp      │
│  (Vereador)     │
└───────┬─────────┘
        │
        ▼
┌─────────────────┐     ┌─────────────────┐
│  Workflow 1     │────▶│   Agent         │
│  Receptor       │     │   Gateway       │
└─────────────────┘     └───────┬─────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │   Supabase      │
                        │   (events)      │
                        └───────┬─────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Workflow 2     │     │  Workflow 3     │     │  Google         │
│  Resumo 7h      │     │  Lembretes      │     │  Calendar       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## Pré-requisitos

| Item | Onde Obter |
|------|------------|
| Evolution API (ou Z-API) | Servidor próprio ou SaaS |
| Supabase Service Key | Dashboard Supabase > Settings > API |
| Agent Access Token | Gabinete Ágil > Configurações > IA > Conexão Externa |
| OpenAI API Key | platform.openai.com (para Whisper) |

---

## Workflow 1: Receptor de Mensagens

### Função
Recebe mensagens de texto ou áudio via WhatsApp, usa IA para extrair dados do evento e salva no sistema.

### JSON do Workflow

```json
{
  "name": "Secretaria WhatsApp - Receptor",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "whatsapp-agenda",
        "responseMode": "responseNode",
        "options": {}
      },
      "id": "webhook-entry",
      "name": "Webhook WhatsApp",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [240, 300]
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict"
          },
          "conditions": [
            {
              "id": "audio-check",
              "leftValue": "={{ $json.body.message.audioMessage }}",
              "rightValue": "",
              "operator": {
                "type": "object",
                "operation": "notEmpty"
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "id": "if-audio",
      "name": "É Áudio?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [460, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://api.openai.com/v1/audio/transcriptions",
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "openAiApi",
        "sendBody": true,
        "contentType": "multipart-form-data",
        "bodyParameters": {
          "parameters": [
            {
              "name": "file",
              "value": "={{ $json.body.message.audioMessage.base64 }}",
              "parameterType": "formBinaryData"
            },
            {
              "name": "model",
              "value": "whisper-1"
            },
            {
              "name": "language",
              "value": "pt"
            }
          ]
        },
        "options": {}
      },
      "id": "whisper-transcribe",
      "name": "Transcrever Áudio",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [680, 200]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.SUPABASE_URL }}/functions/v1/agent-gateway",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Content-Type",
              "value": "application/json"
            },
            {
              "name": "x-agent-token",
              "value": "={{ $env.AGENT_ACCESS_TOKEN }}"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "tool",
              "value": "extract_event_from_message"
            },
            {
              "name": "agent_name",
              "value": "secretaria-whatsapp"
            },
            {
              "name": "args",
              "value": "={{ JSON.stringify({ message: $json.transcribedText || $json.body.message.conversation, sender_phone: $json.body.key.remoteJid }) }}"
            }
          ]
        },
        "options": {}
      },
      "id": "agent-gateway",
      "name": "Agent Gateway - Extrair Evento",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [900, 300]
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict"
          },
          "conditions": [
            {
              "id": "has-event",
              "leftValue": "={{ $json.data.event }}",
              "rightValue": "",
              "operator": {
                "type": "object",
                "operation": "notEmpty"
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "id": "if-event-extracted",
      "name": "Evento Extraído?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [1120, 300]
    },
    {
      "parameters": {
        "operation": "insert",
        "schema": {
          "__rl": true,
          "value": "public",
          "mode": "list"
        },
        "table": {
          "__rl": true,
          "value": "events",
          "mode": "list"
        },
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "title": "={{ $json.data.event.title }}",
            "date": "={{ $json.data.event.date }}",
            "start_time": "={{ $json.data.event.start_time }}",
            "end_time": "={{ $json.data.event.end_time }}",
            "location": "={{ $json.data.event.location }}",
            "description": "={{ $json.data.event.description }}",
            "cabinet_id": "={{ $env.CABINET_ID }}",
            "source": "whatsapp",
            "type": "compromisso",
            "status": "confirmado"
          }
        },
        "options": {}
      },
      "id": "supabase-insert",
      "name": "Supabase - Inserir Evento",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [1340, 200]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.EVOLUTION_API_URL }}/message/sendText/{{ $env.EVOLUTION_INSTANCE }}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "={{ $env.EVOLUTION_API_KEY }}"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "number",
              "value": "={{ $json.body.key.remoteJid.replace('@s.whatsapp.net', '') }}"
            },
            {
              "name": "text",
              "value": "✅ *Evento agendado com sucesso!*\n\n📅 *{{ $json.data.event.title }}*\n🗓️ {{ $json.data.event.date }}\n⏰ {{ $json.data.event.start_time }}\n📍 {{ $json.data.event.location || 'Local não especificado' }}\n\n_Você receberá lembretes 2h e 30min antes._"
            }
          ]
        },
        "options": {}
      },
      "id": "whatsapp-confirm",
      "name": "WhatsApp - Confirmar",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1560, 200]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ JSON.stringify({ success: true }) }}",
        "options": {}
      },
      "id": "respond-webhook",
      "name": "Respond Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.1,
      "position": [1780, 300]
    }
  ],
  "connections": {
    "Webhook WhatsApp": {
      "main": [
        [{"node": "É Áudio?", "type": "main", "index": 0}]
      ]
    },
    "É Áudio?": {
      "main": [
        [{"node": "Transcrever Áudio", "type": "main", "index": 0}],
        [{"node": "Agent Gateway - Extrair Evento", "type": "main", "index": 0}]
      ]
    },
    "Transcrever Áudio": {
      "main": [
        [{"node": "Agent Gateway - Extrair Evento", "type": "main", "index": 0}]
      ]
    },
    "Agent Gateway - Extrair Evento": {
      "main": [
        [{"node": "Evento Extraído?", "type": "main", "index": 0}]
      ]
    },
    "Evento Extraído?": {
      "main": [
        [{"node": "Supabase - Inserir Evento", "type": "main", "index": 0}],
        [{"node": "Respond Webhook", "type": "main", "index": 0}]
      ]
    },
    "Supabase - Inserir Evento": {
      "main": [
        [{"node": "WhatsApp - Confirmar", "type": "main", "index": 0}]
      ]
    },
    "WhatsApp - Confirmar": {
      "main": [
        [{"node": "Respond Webhook", "type": "main", "index": 0}]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1"
  }
}
```

---

## Workflow 2: Resumo Matinal

### Função
Às 7h da manhã, busca todos os eventos do dia e envia resumo via WhatsApp.

### JSON do Workflow

```json
{
  "name": "Secretaria WhatsApp - Resumo Matinal",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "cronExpression",
              "expression": "0 7 * * *"
            }
          ]
        }
      },
      "id": "schedule-7am",
      "name": "Cron 7h",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.2,
      "position": [240, 300]
    },
    {
      "parameters": {
        "operation": "getAll",
        "schema": {
          "__rl": true,
          "value": "public",
          "mode": "list"
        },
        "table": {
          "__rl": true,
          "value": "events",
          "mode": "list"
        },
        "returnAll": true,
        "filterType": "string",
        "filterString": "cabinet_id=eq.{{ $env.CABINET_ID }}&date=eq.{{ $now.format('yyyy-MM-dd') }}&status=neq.cancelado",
        "options": {
          "orderBy": "start_time"
        }
      },
      "id": "supabase-get-events",
      "name": "Supabase - Eventos do Dia",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [460, 300]
    },
    {
      "parameters": {
        "jsCode": "const events = $input.all();\n\nif (events.length === 0) {\n  return [{ json: { message: '📅 *Bom dia, Vereador!*\\n\\nVocê não tem compromissos agendados para hoje. Aproveite o dia! ☀️' } }];\n}\n\nlet msg = '📅 *Bom dia, Vereador!*\\n\\nSeus compromissos de hoje:\\n\\n';\n\nevents.forEach((e, i) => {\n  const ev = e.json;\n  msg += `*${i + 1}. ${ev.title}*\\n`;\n  msg += `⏰ ${ev.start_time.slice(0,5)}${ ev.end_time ? ' - ' + ev.end_time.slice(0,5) : '' }\\n`;\n  if (ev.location) msg += `📍 ${ev.location}\\n`;\n  msg += '\\n';\n});\n\nmsg += `_Total: ${events.length} compromisso(s)_`;\n\nreturn [{ json: { message: msg } }];"
      },
      "id": "format-message",
      "name": "Formatar Mensagem",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [680, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.EVOLUTION_API_URL }}/message/sendText/{{ $env.EVOLUTION_INSTANCE }}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "={{ $env.EVOLUTION_API_KEY }}"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "number",
              "value": "={{ $env.VEREADOR_PHONE }}"
            },
            {
              "name": "text",
              "value": "={{ $json.message }}"
            }
          ]
        },
        "options": {}
      },
      "id": "whatsapp-send",
      "name": "WhatsApp - Enviar Resumo",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [900, 300]
    }
  ],
  "connections": {
    "Cron 7h": {
      "main": [
        [{"node": "Supabase - Eventos do Dia", "type": "main", "index": 0}]
      ]
    },
    "Supabase - Eventos do Dia": {
      "main": [
        [{"node": "Formatar Mensagem", "type": "main", "index": 0}]
      ]
    },
    "Formatar Mensagem": {
      "main": [
        [{"node": "WhatsApp - Enviar Resumo", "type": "main", "index": 0}]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1",
    "timezone": "America/Sao_Paulo"
  }
}
```

---

## Workflow 3: Lembretes Automáticos

### Função
A cada 5 minutos, verifica eventos próximos e envia lembretes 2h e 30min antes.

### JSON do Workflow

```json
{
  "name": "Secretaria WhatsApp - Lembretes",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "minutes",
              "minutesInterval": 5
            }
          ]
        }
      },
      "id": "schedule-5min",
      "name": "Cron 5min",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.2,
      "position": [240, 300]
    },
    {
      "parameters": {
        "jsCode": "const now = new Date();\nconst in2h = new Date(now.getTime() + 2 * 60 * 60 * 1000);\nconst in30m = new Date(now.getTime() + 30 * 60 * 1000);\n\nreturn [{\n  json: {\n    today: now.toISOString().split('T')[0],\n    check_2h: in2h.toTimeString().slice(0, 5),\n    check_30m: in30m.toTimeString().slice(0, 5),\n    now_time: now.toTimeString().slice(0, 5)\n  }\n}];"
      },
      "id": "calculate-times",
      "name": "Calcular Horários",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [460, 300]
    },
    {
      "parameters": {
        "operation": "getAll",
        "schema": {
          "__rl": true,
          "value": "public",
          "mode": "list"
        },
        "table": {
          "__rl": true,
          "value": "events",
          "mode": "list"
        },
        "returnAll": true,
        "filterType": "string",
        "filterString": "cabinet_id=eq.{{ $env.CABINET_ID }}&date=eq.{{ $json.today }}&status=neq.cancelado",
        "options": {}
      },
      "id": "supabase-get-events",
      "name": "Supabase - Eventos Hoje",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [680, 300]
    },
    {
      "parameters": {
        "jsCode": "const times = $('Calcular Horários').first().json;\nconst events = $input.all();\nconst reminders = [];\n\nevents.forEach(e => {\n  const ev = e.json;\n  const eventTime = ev.start_time.slice(0, 5);\n  \n  // Lembrete 2h antes\n  if (eventTime === times.check_2h) {\n    reminders.push({\n      event: ev,\n      type: '2h',\n      message: `⏰ *Lembrete: 2 horas para seu compromisso!*\\n\\n📅 *${ev.title}*\\n🕐 ${eventTime}\\n📍 ${ev.location || 'Local não especificado'}`\n    });\n  }\n  \n  // Lembrete 30min antes\n  if (eventTime === times.check_30m) {\n    reminders.push({\n      event: ev,\n      type: '30m',\n      message: `🚨 *Atenção: 30 minutos para seu compromisso!*\\n\\n📅 *${ev.title}*\\n🕐 ${eventTime}\\n📍 ${ev.location || 'Local não especificado'}`\n    });\n  }\n});\n\nreturn reminders.map(r => ({ json: r }));"
      },
      "id": "filter-reminders",
      "name": "Filtrar Lembretes",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [900, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.EVOLUTION_API_URL }}/message/sendText/{{ $env.EVOLUTION_INSTANCE }}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "={{ $env.EVOLUTION_API_KEY }}"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "number",
              "value": "={{ $env.VEREADOR_PHONE }}"
            },
            {
              "name": "text",
              "value": "={{ $json.message }}"
            }
          ]
        },
        "options": {}
      },
      "id": "whatsapp-send-reminder",
      "name": "WhatsApp - Enviar Lembrete",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1120, 300]
    }
  ],
  "connections": {
    "Cron 5min": {
      "main": [
        [{"node": "Calcular Horários", "type": "main", "index": 0}]
      ]
    },
    "Calcular Horários": {
      "main": [
        [{"node": "Supabase - Eventos Hoje", "type": "main", "index": 0}]
      ]
    },
    "Supabase - Eventos Hoje": {
      "main": [
        [{"node": "Filtrar Lembretes", "type": "main", "index": 0}]
      ]
    },
    "Filtrar Lembretes": {
      "main": [
        [{"node": "WhatsApp - Enviar Lembrete", "type": "main", "index": 0}]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1",
    "timezone": "America/Sao_Paulo"
  }
}
```

---

## Configuração

### Variáveis de Ambiente no n8n

Vá em **Settings > Variables** e adicione:

| Variável | Exemplo | Descrição |
|----------|---------|-----------|
| `SUPABASE_URL` | `https://xxx.supabase.co` | URL do projeto Supabase |
| `SUPABASE_SERVICE_KEY` | `eyJ...` | Service Role Key (Dashboard > Settings > API) |
| `AGENT_ACCESS_TOKEN` | `abc-123...` | Token do Gateway (Configurações > IA) |
| `CABINET_ID` | `4558c53a-...` | UUID do gabinete |
| `EVOLUTION_API_URL` | `https://evolution.seuserver.com` | URL da Evolution API |
| `EVOLUTION_API_KEY` | `sua-api-key` | API Key da Evolution |
| `EVOLUTION_INSTANCE` | `vereador` | Nome da instância WhatsApp |
| `VEREADOR_PHONE` | `5511999998888` | Número do vereador (sem +) |

### Credenciais Necessárias

1. **Supabase** - Configure com Service Role Key
2. **OpenAI** - Para transcrição de áudio (Whisper)

---

## Troubleshooting

### "Mensagem não chega no n8n"
- Verifique se o webhook da Evolution API está apontando para a URL correta
- Confirme que o n8n está acessível publicamente (ou use ngrok para testes)

### "Evento não é salvo"
- Verifique se `CABINET_ID` está correto
- Confira se o Agent Gateway está retornando o evento extraído

### "Lembretes não chegam"
- Confirme que o timezone está `America/Sao_Paulo`
- Verifique se o workflow está ativo (toggle verde)

---

## Adaptando para Outros Provedores

### Z-API
Troque os nodes de HTTP Request por:
```
URL: https://api.z-api.io/instances/{instance}/token/{token}/send-text
Body: { "phone": "5511...", "message": "texto" }
```

### Twilio
Use o node nativo `Twilio` do n8n:
- Account SID e Auth Token
- From: `whatsapp:+14155238886`
- To: `whatsapp:+5511...`
