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
        const { event_id, action } = await req.json(); // action: 'create' | 'update' | 'delete'

        if (!event_id || !action) {
            throw new Error("Missing event_id or action");
        }

        // 1. Authenticate Request
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
        );

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) throw new Error("Unauthorized");

        // 2. Get Safe Admin Client for Token Access
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // 3. Fetch Cabinet Tokens
        const { data: cabinet, error: cabinetError } = await supabaseAdmin
            .from("cabinets")
            .select("id, google_access_token, google_refresh_token, google_token_expires_at, google_calendar_id")
            .eq("id", user.user_metadata.cabinet_id) // Assuming metadata has cabinet_id, or fetch via user relation
            .single();

        if (cabinetError || !cabinet || !cabinet.google_refresh_token) {
            return new Response(JSON.stringify({ skipped: true, reason: "Google Calendar not connected" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // 4. Token Refresh Logic
        let accessToken = cabinet.google_access_token;
        if (Date.now() > (cabinet.google_token_expires_at || 0)) {
            console.log("Refreshing Google Token...");
            const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
            const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

            const refreshResp = await fetch("https://oauth2.googleapis.com/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    client_id: clientId!,
                    client_secret: clientSecret!,
                    refresh_token: cabinet.google_refresh_token,
                    grant_type: "refresh_token",
                }),
            });

            const refreshData = await refreshResp.json();
            if (refreshData.error) {
                // Token revoked? Disconnect.
                await supabaseAdmin.from("cabinets").update({
                    google_access_token: null,
                    google_refresh_token: null
                }).eq("id", cabinet.id);
                throw new Error("Google Token Expired/Revoked. Please reconnect.");
            }

            accessToken = refreshData.access_token;
            await supabaseAdmin.from("cabinets").update({
                google_access_token: accessToken,
                google_token_expires_at: Date.now() + (refreshData.expires_in * 1000)
            }).eq("id", cabinet.id);
        }

        // 5. Perform Sync Action
        let googleEventId = null;

        if (action === "delete") {
            // Logic to delete using stored google_event_id
            // Need to fetch event first to get google_id, but event might be deleted in DB already if not careful.
            // Usually we pass the google_id if the DB record is already gone, or we mark as deleted.
            // For simplicity, let's assume the event exists but we want to remove from Google, OR we pass google_id in payload.
            // Let's assume we fetch the event from DB.
            const { data: event } = await supabaseAdmin.from("events").select("google_event_id").eq("id", event_id).single();
            if (event?.google_event_id) {
                await fetch(`https://www.googleapis.com/calendar/v3/calendars/${cabinet.google_calendar_id}/events/${event.google_event_id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
            }
        } else {
            // Create or Update
            const { data: event } = await supabaseAdmin.from("events").select("*").eq("id", event_id).single();
            if (!event) throw new Error("Event not found");

            const googleEventPayload = {
                summary: event.title,
                description: event.description,
                start: { dateTime: new Date(event.start_time).toISOString() }, // Ensure proper ISO format
                end: { dateTime: new Date(event.end_time || event.start_time).toISOString() },
                // Add location etc if needed
            };

            let response;
            if (event.google_event_id) {
                // Update
                response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${cabinet.google_calendar_id}/events/${event.google_event_id}`, {
                    method: "PATCH", // Patch is safer
                    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
                    body: JSON.stringify(googleEventPayload)
                });
            } else {
                // Create
                response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${cabinet.google_calendar_id}/events`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
                    body: JSON.stringify(googleEventPayload)
                });
            }

            const data = await response.json();
            if (data.error) throw new Error(JSON.stringify(data.error));

            googleEventId = data.id;

            // Update DB
            await supabaseAdmin.from("events").update({
                google_event_id: googleEventId,
                last_synced_at: new Date().toISOString()
            }).eq("id", event_id);
        }

        return new Response(JSON.stringify({ success: true, google_event_id: googleEventId }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
