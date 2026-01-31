import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const url = new URL(req.url);
        const path = url.pathname.replace("/functions/v1/google-calendar-oauth", ""); // Adjust based on actual deployment path

        // 1. GET /auth-url
        if (path === "/auth-url" || url.searchParams.get("action") === "auth-url") {
            const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
            const redirectUri = Deno.env.get("GOOGLE_REDIRECT_URI");

            if (!clientId || !redirectUri) {
                throw new Error("Missing Google Credentials in Environment Secrets");
            }

            const scopes = [
                "https://www.googleapis.com/auth/calendar",
                "https://www.googleapis.com/auth/calendar.events"
            ];

            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
                `client_id=${clientId}&` +
                `redirect_uri=${redirectUri}&` +
                `response_type=code&` +
                `scope=${scopes.join(" ")}&` +
                `access_type=offline&` + // Critical for refresh token
                `prompt=consent`;       // Force consent to ensure refresh token is returned

            return new Response(JSON.stringify({ url: authUrl }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // 2. POST /callback
        if (path === "/callback" || (req.method === "POST" && (await req.clone().json()).action === "callback")) {
            const { code, cabinet_id } = await req.json();

            if (!code || !cabinet_id) {
                throw new Error("Missing code or cabinet_id");
            }

            const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
            const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
            const redirectUri = Deno.env.get("GOOGLE_REDIRECT_URI");

            // Exchange code for tokens
            const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    client_id: clientId!,
                    client_secret: clientSecret!,
                    code,
                    grant_type: "authorization_code",
                    redirect_uri: redirectUri!,
                }),
            });

            const tokens = await tokenResponse.json();

            if (tokens.error) {
                throw new Error(`Google Error: ${tokens.error_description || tokens.error}`);
            }

            // Save to Supabase (using Service Role to write to protected columns)
            const supabaseAdmin = createClient(
                Deno.env.get("SUPABASE_URL") ?? "",
                Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
            );

            const { error: dbError } = await supabaseAdmin
                .from("cabinets")
                .update({
                    google_access_token: tokens.access_token,
                    google_refresh_token: tokens.refresh_token, // Only sent on first consent or forced prompt
                    google_token_expires_at: Date.now() + (tokens.expires_in * 1000),
                    // We could fetch the user's email to store as well, but not strictly required
                })
                .eq("id", cabinet_id);

            if (dbError) throw dbError;

            return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({ error: "Not Found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
