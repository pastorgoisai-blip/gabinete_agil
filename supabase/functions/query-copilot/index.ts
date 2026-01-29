
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.2.0'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('Missing Authorization Header')
        const token = authHeader.replace('Bearer ', '')

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        // 1. Auth & Context
        const {
            data: { user },
            error: authError
        } = await supabaseClient.auth.getUser(token)

        if (authError || !user) {
            console.error('Auth Error:', authError)
            throw new Error(`Unauthorized: ${authError?.message || 'User not found'}`)
        }

        // Get User Profile to find Cabinet ID
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('cabinet_id')
            .eq('id', user.id)
            .single()

        if (!profile?.cabinet_id) {
            throw new Error('User has no cabinet assigned')
        }

        const cabinetId = profile.cabinet_id

        // 2. Get Config (Gemini Key)
        const { data: cabinet } = await supabaseClient
            .from('cabinets')
            .select('gemini_api_key, openai_api_key')
            .eq('id', cabinetId)
            .single()

        if (!cabinet?.gemini_api_key) {
            return new Response(
                JSON.stringify({ error: 'Gemini API Key not configured in Settings' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const { query, history } = await req.json()

        if (!query) {
            throw new Error('Query is required')
        }

        // Initialize OpenAI client
        const openai = new OpenAI({ apiKey: cabinet.openai_api_key });

        const systemPrompt = `You are the AI Assistant for "Gabinete Ágil", a specialized political storage system.
Answer based on context. Always answer in Portuguese (Brazil).
Be executive and precise. Cite names and process numbers when available.

# CONTEXT DICTIONARY (DATABASE STRUCTURE):
- **VOTERS** ('voters'): Citizens info, birthdays, address, and who indicated them ('indicated_by').
- **LEGAL_NORMS** ('legal_norms'): Municipal laws synchronized from SAPL.
- **LEGISLATIVE_MATTERS** ('legislative_matters'): Bills (Projetos de Lei) and requests (Requerimentos) in official tramitation.
- **DEMANDS** ('demands'): Population requests/tickets (Status: Pending, Done).
- **OFFICES** ('offices'): Official documents/letters sent by the cabinet.

# TOOLS STRATEGY:
1. Use 'query_voters' for questions about people (birthdays, location, contact).
2. Use 'query_database' for lists of items ("What's new?", "List demands", "Find office X").
3. Use 'search_documents' for generic text search or analyzing content of Laws/Decrees.
`;

        // Define Tools
        const tools = [
            {
                type: "function",
                function: {
                    name: "search_documents",
                    description: "Search internal legislative documents (PDFs, DOCs). Use for questions about 'leis', 'projetos', 'regimento', 'texto', or generic content queries.",
                    parameters: {
                        type: "object",
                        properties: {
                            search_term: { type: "string", description: "Termo de busca" }
                        },
                        required: ["search_term"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "query_voters",
                    description: "Search the Voters database. Questions: 'citizens', 'birthdays' (aniversariantes), 'neighborhood' (bairro).",
                    parameters: {
                        type: "object",
                        properties: {
                            name: { type: "string", description: "Filter by name" },
                            city: { type: "string", description: "Filter by city" },
                            neighborhood: { type: "string", description: "Filter by neighborhood" },
                            birth_month: { type: "integer", description: "Month number (1=Jan, 2=Feb)" }
                        }
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "query_database",
                    description: "General SQL Query for Gabinete Tables. Questions: 'What is new?' (legislative_matters), 'List demands', 'Find Office'.",
                    parameters: {
                        type: "object",
                        properties: {
                            target_table: {
                                type: "string",
                                enum: ["legislative_matters", "demands", "offices", "legal_norms"],
                                description: "The table to query."
                            },
                            search_term: { type: "string", description: "Optional text filter (title/subject)" }
                        },
                        required: ["target_table"]
                    }
                }
            }
        ];

        // 1. Initial Call
        const messages = [
            { role: "system", content: systemPrompt },
            ...history.map((msg: any) => ({ role: msg.role === 'model' ? 'assistant' : 'user', content: msg.content })),
            { role: "user", content: query }
        ];

        const initialResp = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages,
            tools: tools,
            tool_choice: "auto",
        });

        const choice = initialResp.choices[0];
        const toolCalls = choice.message.tool_calls;
        let finalContext = "";

        // 2. Execute Tools
        if (toolCalls && toolCalls.length > 0) {
            for (const toolCall of toolCalls) {
                const fnName = toolCall.function.name;
                const args = JSON.parse(toolCall.function.arguments);
                console.log(`Tool Call: ${fnName}`, args);

                if (fnName === 'search_documents') {
                    const embResp = await openai.embeddings.create({ model: "text-embedding-3-small", input: args.search_term || query });
                    const { data: docs } = await supabaseClient.rpc('match_documents_openai', {
                        query_embedding: embResp.data[0].embedding, match_threshold: 0.4, match_count: 5, filter_cabinet_id: cabinetId
                    });
                    finalContext += `\n[DOCUMENTS]:\n${docs?.map((d: any) => d.content).join('\n') || 'None.'}\n`;
                }

                if (fnName === 'query_voters') {
                    const { data: voters } = await supabaseClient.rpc('query_voters_smart', {
                        filter_cabinet_id: cabinetId,
                        filter_name: args.name || null,
                        filter_city: args.city || null,
                        filter_neighborhood: args.neighborhood || null,
                        filter_birth_month: args.birth_month || null
                    });
                    finalContext += `\n[DATABASE - VOTERS]:\n${JSON.stringify(voters, null, 2) || 'None.'}\n`;
                }

                if (fnName === 'query_database') {
                    const { data: records } = await supabaseClient.rpc('query_database_smart', {
                        filter_cabinet_id: cabinetId,
                        target_table: args.target_table,
                        search_term: args.search_term || null,
                        limit_count: 10
                    });
                    finalContext += `\n[DATABASE - ${args.target_table}]:\n${JSON.stringify(records, null, 2) || 'None.'}\n`;
                }
            }
            messages.push(choice.message);
            messages.push({ role: "tool", content: finalContext, tool_call_id: toolCalls[0].id });
        }

        // 3. Generate Response (Stream)
        const result = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages,
            stream: true,
        });

        // Create a readable stream for the response
        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder()
                try {
                    for await (const chunk of result) {
                        const text = chunk.choices[0]?.delta?.content || ''
                        if (text) {
                            controller.enqueue(encoder.encode(text))
                        }
                    }
                } catch (e) {
                    console.error(e)
                    controller.error(e)
                } finally {
                    controller.close()
                }
            },
        })

        return new Response(stream, {
            headers: {
                ...corsHeaders,
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        })

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
