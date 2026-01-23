import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { create__ } from "https://deno.land/x/djwt@v2.8/mod.ts"; // hypothetical import for simpler JWT or use web standard

// We will use standard Web Crypto API for HMAC SHA256 signature if djwt is complex to import in this env
// or stick to a simple JWT library available in Deno.
import { create, getNumericDate, Header, Payload } from "https://deno.land/x/djwt@v2.8/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        // 1. Get User
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) throw new Error('Unauthorized');

        // 2. Parse Request
        const { file_id, file_name, file_ext } = await req.json();

        // 3. Get User Profile for Name
        const { data: profile } = await supabase
            .from('profiles')
            .select('name, cabinet_id')
            .eq('id', user.id)
            .single();

        if (!profile) throw new Error('Profile not found');

        // 4. Generate Signed URL for the file (Read)
        // Assuming file_id is the storage path
        const { data: signedData, error: signError } = await supabase
            .storage
            .from('legislative-documents')
            .createSignedUrl(file_id, 60 * 60 * 24); // 24 hours

        if (signError) throw signError;

        // 5. Generate ONLYOFFICE Token
        const secret = Deno.env.get('ONLYOFFICE_SECRET');
        if (!secret) throw new Error('ONLYOFFICE_SECRET not set');

        const key = `${file_id}_${Date.now()}`; // Unique key to force refresh
        const fileUrl = signedData.signedUrl;

        // Callback URL needs to be publicly accessible. 
        // Assuming Supabase Functions URL pattern.
        const projectRef = Deno.env.get('SUPABASE_URL')?.split('.')[0].split('//')[1];
        const callbackUrl = `https://${projectRef}.supabase.co/functions/v1/onlyoffice-callback?file_id=${encodeURIComponent(file_id)}&user_id=${user.id}`;

        const configPayload = {
            document: {
                fileType: file_ext || 'docx',
                key: key,
                title: file_name || 'Documento',
                url: fileUrl,
            },
            documentType: 'word', // Simplified logic, should detect based on ext
            editorConfig: {
                callbackUrl: callbackUrl,
                user: {
                    id: user.id,
                    name: profile.name,
                },
                mode: 'edit',
            },
        };

        // Sign the token
        const cryptoKey = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(secret),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );

        // Manual JWT creation to ensure compatibility if lib fails, or use lib
        const jwt = await create({ alg: "HS256", typ: "JWT" }, configPayload, cryptoKey);

        return new Response(
            JSON.stringify({
                ...configPayload,
                token: jwt,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
