
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
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // 1. Auth & Context
        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            throw new Error('Unauthorized')
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

        // 3. Generate Embedding (Gemini)
        const genAI = new GoogleGenerativeAI(cabinet.gemini_api_key)
        const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' })

        const embeddingResult = await embeddingModel.embedContent(query)
        const embedding = embeddingResult.embedding.values

        // 4. Retrieve Documents (RPC)
        const { data: documents, error: searchError } = await supabaseClient.rpc('match_documents', {
            query_embedding: embedding,
            match_threshold: 0.5, // Adjust as needed
            match_count: 5,
            filter_cabinet_id: cabinetId
        })

        if (searchError) {
            console.error('Search Error:', searchError)
            throw new Error('Failed to search documents')
        }

        // 5. Construct Prompt
        const contextText = documents
            ?.map((doc: any) => `Source: ${doc.metadata?.source || 'Unknown'}\nContent: ${doc.content}`)
            .join('\n\n')

        const systemPrompt = `
You are the AI Assistant for "Gabinete Ágil", a political management system.
Your role is to answer questions based STRICTLY on the provided context (Legislative Documents).
If the answer is not in the context, say you don't know based on the documents available.
Be professional, concise, and helpful.

Context:
${contextText || 'No relevant documents found.'}

Chat History:
${history?.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n') || ''}
`

        const userPrompt = `User Question: ${query}`

        // 6. Generate Response (Stream)
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' }) // Or flash

        // We use a simple prompt approach here
        const result = await model.generateContentStream([systemPrompt, userPrompt])

        // Create a readable stream for the response
        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder()
                try {
                    for await (const chunk of result.stream) {
                        const text = chunk.text()
                        if (text) {
                            // Send as SSE format or just raw text? 
                            // Standard fetch stream reading usually allows raw text.
                            // Let's send raw text chunks.
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
