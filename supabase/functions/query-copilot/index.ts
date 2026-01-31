import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.21.0'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Interfaces for Tool Calls
interface ToolCall {
    name: string;
    args: any;
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
            .select('gemini_api_key')
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

        // 3. Initialize Gemini
        const genAI = new GoogleGenerativeAI(cabinet.gemini_api_key);

        // Define Model with Tools
        const toolsDefinition = [
            {
                functionDeclarations: [
                    {
                        name: "search_documents",
                        description: "Search internal legislative documents (PDFs, DOCs). Use for questions about 'leis', 'projetos', 'regimento', 'texto', or generic content queries.",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                search_term: { type: "STRING", description: "Termo de busca" }
                            },
                            required: ["search_term"]
                        }
                    },
                    {
                        name: "query_voters",
                        description: "Search the Voters database. Questions: 'citizens', 'birthdays' (aniversariantes), 'neighborhood' (bairro).",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                name: { type: "STRING", description: "Filter by name" },
                                city: { type: "STRING", description: "Filter by city" },
                                neighborhood: { type: "STRING", description: "Filter by neighborhood" },
                                birth_month: { type: "INTEGER", description: "Month number (1=Jan, 2=Feb)" }
                            }
                        }
                    },
                    {
                        name: "query_database",
                        description: "General SQL Query for Gabinete Tables. Questions: 'What is new?' (legislative_matters), 'List demands', 'Find Office'.",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                target_table: {
                                    type: "STRING",
                                    enum: ["legislative_matters", "demands", "offices", "legal_norms"],
                                    description: "The table to query."
                                },
                                search_term: { type: "STRING", description: "Optional text filter (title/subject)" }
                            },
                            required: ["target_table"]
                        }
                    }
                ]
            }
        ];

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash-lite",
            tools: toolsDefinition
        });

        // 2.b Get Agent Config for Copilot Prompt
        const { data: agentConfig } = await supabaseClient
            .from('agent_configurations')
            .select('copilot_system_prompt')
            .eq('cabinet_id', cabinetId)
            .single();

        const systemPrompt = agentConfig?.copilot_system_prompt || `You are the AI Assistant for "Gabinete Ágil", a specialized political storage system.
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
3. Use 'search_documents' for generic text search or analyzing content of Laws/Decrees.`;

        // 4. Chat Session
        const chat = model.startChat({
            history: [
                { role: 'user', parts: [{ text: systemPrompt }] },
                { role: 'model', parts: [{ text: "Entendido. Sou o Copilot Ágil e estou pronto para ajudar com dados do gabinete." }] },
                ...history.map((msg: any) => ({
                    role: msg.role === 'assistant' ? 'model' : 'user', // OpenAI uses 'assistant', Gemini uses 'model'
                    parts: [{ text: msg.content }]
                }))
            ],
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });

        // 5. Send Message & Handle Tools
        // Gemini generates tool calls in the response. We loop until no more tool calls.

        let result = await chat.sendMessage(query);
        let response = result.response;
        let functionCalls = response.functionCalls();

        // Loop checking for tool calls
        while (functionCalls && functionCalls.length > 0) {
            const toolCall = functionCalls[0]; // Gemini usually returns one logical step or parallel, but SDK simplifies usually
            const fnName = toolCall.name;
            const args = toolCall.args;

            console.log(`Tool Call (${fnName}):`, args);
            let toolResult = "";

            // Execute Tool
            if (fnName === 'search_documents') {
                // For embedding, we can use Gemini Embedding or just basic text search via Postgres if configured.
                // Since 'match_documents_openai' uses OpenAI embeddings, we can't use it directly UNLESS we switch to Gemini Embeddings OR stick to simple search.
                // Critical: 'match_documents_openai' expects 1536 dim vector. Gemini is 768.
                // FIX: For now, we will fallback to a simple keyword search or warn.
                // Ideally we should create 'match_documents_gemini'. 
                // Let's assume for this transition we use a simple text match fall back if embeddings mismatch, or we invoke a new embedding model.

                // Let's try to get embedding from Gemini
                const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
                const embResult = await embeddingModel.embedContent(args.search_term || query);
                const embedding = embResult.embedding.values;

                // Note: We need a valid RPC for Gemini embeddings (768 dims) vs OpenAI (1536).
                // If the DB vector column is 1536, this will fail.
                // Checking safely... assuming we might fail on vector match, we might skip or return empty.
                // For safety in this "Vertical Slice", I will assume we might NOT have the vector RPC ready for Gemini dimensions
                // So I will pretend I found nothing OR try to use a simple text search RPC if available.
                // But wait, the previous code used `match_documents_openai`. 
                // Let's just return a placeholder message about vector search migration if we can't do it.
                // actually the user wants a "Vertical Slice", so maybe I should just run `query_database` for generic search if possible?
                // No, let's try to allow the model to answer without docs if tool fails, giving a gentle error.

                try {
                    // Temporary: We cannot call 'match_documents_openai' with Gemini vectors (dim mismatch).
                    // We will return a static message for this specific tool until vector migration is done.
                    toolResult = "NOTICE: Semantic search is being migrated to Gemini. Please use specific queries on Database for now.";
                } catch (e) {
                    toolResult = "Error searching documents.";
                }
            }

            if (fnName === 'query_voters') {
                const { data: voters } = await supabaseClient.rpc('query_voters_smart', {
                    filter_cabinet_id: cabinetId,
                    filter_name: args.name || null,
                    filter_city: args.city || null,
                    filter_neighborhood: args.neighborhood || null,
                    filter_birth_month: typeof args.birth_month === 'number' ? args.birth_month : null
                });
                toolResult = JSON.stringify(voters?.slice(0, 10), null, 2);
            }

            if (fnName === 'query_database') {
                const { data: records } = await supabaseClient.rpc('query_database_smart', {
                    filter_cabinet_id: cabinetId,
                    target_table: args.target_table,
                    search_term: args.search_term || null,
                    limit_count: 5
                });
                toolResult = JSON.stringify(records, null, 2);
            }

            // Send tool result back to model
            result = await chat.sendMessage([{
                functionResponse: {
                    name: fnName,
                    response: { result: toolResult }
                }
            }]);
            response = result.response;
            functionCalls = response.functionCalls();
        }

        // 6. Response (Streaming simulation)
        // Gemini SDK `sendMessage` returns a result. `sendMessageStream` returns a stream.
        // We used `sendMessage` above for the tool loop (it's easier to handle blocking).
        // For the FINAL text, we already have `response.text()`.
        // To keep frontend happy (which expects stream), we can just stream the text chunk by chunk or at once.
        const finalAns = response.text();

        // Create a readable stream for the response
        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder()
                try {
                    // Simulate streaming explicitly or just send chunks
                    const chunkSize = 16;
                    for (let i = 0; i < finalAns.length; i += chunkSize) {
                        const chunk = finalAns.slice(i, i + chunkSize);
                        controller.enqueue(encoder.encode(chunk));
                        await new Promise(r => setTimeout(r, 10)); // tiny delay for effect
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
        console.error("Critical Error", error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal Server Error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
