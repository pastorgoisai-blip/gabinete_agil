import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-agent-token',
};

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            // Supabase API URL - Env var automatically set by Supabase
            Deno.env.get('SUPABASE_URL') ?? '',
            // Supabase Service Role Key - Need broad access to query specific cabinets
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // 1. Authentication
        const agentToken = req.headers.get('x-agent-token');

        if (!agentToken) {
            throw new Error('Missing x-agent-token header');
        }

        const { data: cabinet, error: authError } = await supabaseClient
            .from('cabinets')
            .select('id, name')
            .eq('agent_access_token', agentToken)
            .single();

        if (authError || !cabinet) {
            return new Response(JSON.stringify({ error: 'Invalid Agent Token' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 2. Parse Request
        const { tool, args, agent_name = 'unknown_agent' } = await req.json();

        if (!tool) {
            throw new Error('Missing "tool" in request body');
        }

        let result = null;
        let payload = args || {};

        // 3. Tool Routing
        switch (tool) {
            case 'agenda_list':
                // Args: { date }
                const { data: events, error: eventError } = await supabaseClient
                    .from('events')
                    .select('*')
                    .eq('cabinet_id', cabinet.id)
                    .gte('start_time', `${payload.date}T00:00:00`)
                    .lte('start_time', `${payload.date}T23:59:59`);

                if (eventError) throw eventError;
                result = events;
                break;

            case 'agenda_create':
                // Args: { title, date, start_time, description }
                // Combine date + time for full timestamp
                const fullStart = `${payload.date}T${payload.start_time}:00`;
                // Default 1 hour duration if not specified
                const fullEnd = new Date(new Date(fullStart).getTime() + 60 * 60 * 1000).toISOString();

                const { data: newEvent, error: createError } = await supabaseClient
                    .from('events')
                    .insert([{
                        cabinet_id: cabinet.id,
                        title: payload.title,
                        description: payload.description,
                        start_time: fullStart,
                        end_time: fullEnd,
                        location: 'Agendado via IA'
                    }])
                    .select()
                    .single();

                if (createError) throw createError;
                result = newEvent;
                break;

            case 'demand_create':
                // Args: { title, category, description, citizen_name }
                let voterId = null;

                if (payload.citizen_name) {
                    // Fuzzy search for voter
                    const { data: voters } = await supabaseClient
                        .from('voters')
                        .select('id')
                        .eq('cabinet_id', cabinet.id)
                        .ilike('name', `%${payload.citizen_name}%`)
                        .limit(1);

                    if (voters && voters.length > 0) {
                        voterId = voters[0].id;
                    } else {
                        // Create provisional voter
                        const { data: newVoter, error: voterError } = await supabaseClient
                            .from('voters')
                            .insert([{
                                cabinet_id: cabinet.id,
                                name: payload.citizen_name,
                                tags: ['Criado via Agent'],
                                status: 'Provisório' // Assuming status column exists or is text
                            }])
                            .select()
                            .single();

                        if (!voterError) voterId = newVoter.id;
                    }
                }

                const { data: newDemand, error: demandError } = await supabaseClient
                    .from('demands')
                    .insert([{
                        cabinet_id: cabinet.id,
                        title: payload.title,
                        description: payload.description,
                        category: payload.category || 'Outros',
                        voter_id: voterId,
                        status: 'Pendente',
                        priority: 'Média',
                        origin: 'IA/WhatsApp' // Assuming 'origin' column exists, otherwise remove or verify
                    }])
                    .select()
                    .single();

                if (demandError) throw demandError;
                result = newDemand;
                break;

            case 'copilot_query':
                // Args: { query }
                // Simple search in embeddings
                const { data: docs, error: searchError } = await supabaseClient.rpc('match_documents', {
                    query_embedding: [], // In real implementation, we need to generate embedding first. 
                    // For now, allow simple text search if match_documents supports it, 
                    // OR just return a mock response saying Embeddings not generated in Edge Function yet.
                    match_threshold: 0.7,
                    match_count: 5,
                    filter_cabinet_id: cabinet.id
                }).catch(() => ({ data: [], error: 'Vector search not fully implemented in this simplified gateway' }));

                // Fallback to simple ILIKE if vector search fails or simpler query needed
                if (!docs || (Array.isArray(docs) && docs.length === 0)) {
                    const { data: textDocs } = await supabaseClient
                        .from('system_docs')
                        .select('title, content')
                        .ilike('content', `%${payload.query}%`)
                        .limit(3);
                    result = textDocs;
                } else {
                    result = docs;
                }
                break;

            case 'simulate_response':
                // Args: { message }
                // 1. Fetch Configuration & Credentials
                const { data: config, error: configError } = await supabaseClient
                    .from('agent_configurations')
                    .select('system_prompt, tone, agent_name')
                    .eq('cabinet_id', cabinet.id)
                    .single();

                // Fetch encrypted keys from cabinet (assuming RLS allows service role reading it)
                const { data: cabinetKeys, error: keysError } = await supabaseClient
                    .from('cabinets')
                    .select('gemini_api_key, official_name')
                    .eq('id', cabinet.id)
                    .single();

                if (configError || keysError) throw new Error('Failed to fetch agent configuration or credentials');
                if (!cabinetKeys.gemini_api_key) throw new Error('Gemini API Key not configured for this cabinet');

                // 2. Build System Prompt
                let systemPrompt = config.system_prompt || "Você é um assistente útil.";
                const currentDate = new Date().toLocaleDateString('pt-BR');
                systemPrompt = systemPrompt
                    .replace('{{politician_name}}', cabinetKeys.official_name || 'Parlamentar')
                    .replace('{{tone}}', config.tone || 'Neutro')
                    .replace('{{current_date}}', currentDate)
                    .replace('{{agent_name}}', config.agent_name || 'Assistente');

                // 3. Save User Message
                await supabaseClient.from('simulation_messages').insert({
                    cabinet_id: cabinet.id,
                    role: 'user',
                    content: payload.message
                });

                // 4. Call Gemini AI
                // We use raw fetch to avoid heavy dependencies if possible, or import GoogleGenerativeAI if allowed.
                // Using raw REST API for simplicity in Deno Edge
                // Updated to gemini-2.5-flash-lite as explicitly requested by user
                const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${cabinetKeys.gemini_api_key}`;

                const response = await fetch(GEMINI_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [
                            { role: 'user', parts: [{ text: systemPrompt + "\n\nUser: " + payload.message }] }
                        ]
                    })
                });

                const aiData = await response.json();

                if (!response.ok) {
                    const errorMsg = aiData.error?.message || 'Error calling Gemini API';
                    throw new Error(errorMsg);
                }

                const aiText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "Desculpe, não consegui processar sua resposta.";

                // 5. Save AI Response
                const { data: aiMessage } = await supabaseClient.from('simulation_messages').insert({
                    cabinet_id: cabinet.id,
                    role: 'assistant',
                    content: aiText
                }).select().single();

                result = aiMessage;
                break;

            default:
                throw new Error(`Unknown tool: ${tool}`);
        }

        // 4. Log Success
        await supabaseClient.from('agent_logs').insert({
            cabinet_id: cabinet.id,
            agent_name: agent_name,
            action: tool,
            status: 'success',
            payload: payload,
            response_summary: { result_count: Array.isArray(result) ? result.length : 1 }
        });

        return new Response(JSON.stringify({ success: true, data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        // 5. Log Error (Try to capture cabinet_id if possible, otherwise null)
        // Note: If authentication failed, we might not have cabinet_id.

        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 200, // Return 200 so client can parse the error message in body
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
