import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { z } from "https://esm.sh/zod@v3.22.4";

const ONLYOFFICE_SECRET = Deno.env.get("ONLYOFFICE_SECRET") || "aPhy0uaKC088CEiZFfxOGY9ibFgDDy8q";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const RequestSchema = z.object({
    file_id: z.string().min(1, "File ID is required"),
    file_name: z.string().min(1, "File name is required"),
    file_ext: z.string().min(1, "File extension is required"),
});

type RequestBody = z.infer<typeof RequestSchema>;

// Helper: Generate JWT manually (Deno-compatible)
async function generateJWT(payload: any, secret: string): Promise<string> {
    const header = { alg: "HS256", typ: "JWT" };

    const encodedHeader = btoa(JSON.stringify(header))
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

    const encodedPayload = btoa(JSON.stringify(payload))
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

    const message = `${encodedHeader}.${encodedPayload}`;

    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));

    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

    return `${message}.${encodedSignature}`;
}

serve(async (req) => {
    // CORS Headers
    if (req.method === "OPTIONS") {
        return new Response(null, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
            },
        });
    }

    try {
        console.log("[DEBUG] OnlyOffice Auth Request Received");

        // 1. Authenticate user
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) throw new Error("Missing Authorization header");

        const token = authHeader.replace("Bearer ", "");

        // Use Anon Key for user validation
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: authHeader } },
        });

        // Explicitly pass token
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            console.error("[DEBUG] Auth failed:", authError);
            throw new Error("Unauthorized: Invalid Session");
        }

        console.log("[DEBUG] User authenticated:", user.id);

        // 2. Parse request
        const body = await req.json();
        const validation = RequestSchema.safeParse(body);

        if (!validation.success) {
            throw new Error(`Validation Error: ${validation.error.issues.map(i => i.message).join(", ")}`);
        }

        const { file_id, file_name, file_ext } = validation.data;

        // 3. Security: Verify user owns this cabinet
        const cabinet_id = file_id.split('/')[0];

        // Use Service Key for database/storage access to ensure we can read what we need
        // (Though RLS should allow reading own profile, explicit admin client is safer here if policies are complex)
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('cabinet_id')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) throw new Error("Profile not found");
        if (profile.cabinet_id !== cabinet_id) throw new Error("Access Denied: Cabinet mismatch");

        // 4. Generate signed URL for download (OnlyOffice will fetch the file)
        const { data: downloadData, error: downloadError } = await supabaseAdmin.storage
            .from("legislative-documents")
            .createSignedUrl(file_id, 3600); // 1 hour validity

        if (downloadError) throw new Error(`Storage error: ${downloadError.message}`);

        // 5. Generate callback URL
        const callbackUrl = `${SUPABASE_URL}/functions/v1/onlyoffice-callback?file_id=${encodeURIComponent(file_id)}&user_id=${user.id}`;

        // 6. Create unique document key
        const documentKey = `${user.id}_${file_id.replace(/\//g, '_')}_${Date.now()}`;

        // 8. Build Base OnlyOffice config (WITHOUT TOKEN)
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const configPayload = {
            document: {
                fileType: file_ext.replace('.', ''),
                key: documentKey,
                title: file_name,
                url: downloadData.signedUrl,
                permissions: {
                    edit: true,
                    download: true,
                    print: true,
                    review: true,
                },
            },
            documentType: "word",
            editorConfig: {
                callbackUrl: callbackUrl,
                user: {
                    id: user.id,
                    name: user.email || user.user_metadata?.name || "Usuário",
                },
                customization: {
                    autosave: true,
                    forcesave: true,
                    comments: true,
                    chat: false,
                },
                lang: "pt-BR",
            },
            iat: currentTimestamp,
            exp: currentTimestamp + 120, // 2 minutes expiration
        };

        // 9. Generate JWT token covering the entire config
        const tokenOnlyOffice = await generateJWT(configPayload, ONLYOFFICE_SECRET);

        // 10. Return valid config with token
        const finalConfig = {
            ...configPayload,
            token: tokenOnlyOffice,
        };

        return new Response(JSON.stringify(finalConfig), {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        });

    } catch (error: any) {
        console.error("OnlyOffice Auth Error:", error);
        return new Response(
            JSON.stringify({
                error: error.message || "Internal server error",
                details: error.toString()
            }),
            {
                status: 200, // Return 200 to allow client parsing
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            }
        );
    }
});
