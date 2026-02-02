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
        // Triggered via Supabase Client -> Gateway verifies JWT -> Here we trust it.
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) throw new Error("Missing Authorization Header");

        const token = authHeader.replace("Bearer ", "");
        const payloadPart = token.split(".")[1];
        if (!payloadPart) throw new Error("Invalid Token Format");

        // Decode Base64 (Url Safe)
        const normalizedPayload = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(normalizedPayload));

        const userId = payload.sub;


        if (!userId) throw new Error("Unauthorized: No sub in token");

        // 2. Get Safe Admin Client for Token Access
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // 3. Fetch cabinet_id FROM THE EVENT (not from JWT - JWT doesn't have cabinet_id!)
        const { data: eventData, error: eventFetchError } = await supabaseAdmin
            .from("events")
            .select("cabinet_id")
            .eq("id", event_id)
            .single();

        if (eventFetchError || !eventData?.cabinet_id) {
            console.error("Event lookup failed:", eventFetchError);
            throw new Error("Event not found or missing cabinet_id");
        }

        const cabinetId = eventData.cabinet_id;

        // 4. Fetch Cabinet Tokens
        const { data: cabinet, error: cabinetError } = await supabaseAdmin
            .from("cabinets")
            .select("id, google_access_token, google_refresh_token, google_token_expires_at, google_calendar_id")
            .eq("id", cabinetId)
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

        const calendarId = cabinet.google_calendar_id || 'primary';

        // 5. Perform Sync Action
        let googleEventId = null;

        if (action === "delete") {
            const { data: event } = await supabaseAdmin.from("events").select("google_event_id").eq("id", event_id).single();
            if (event?.google_event_id) {
                await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${event.google_event_id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
            }
        } else {
            // Create or Update
            const { data: event } = await supabaseAdmin.from("events").select("*").eq("id", event_id).single();
            if (!event) throw new Error("Event not found");

            // Helper to ensure HH:mm:00
            const formatTime = (t: string) => {
                const parts = t.split(':'); // handle "08:00" or "08:00:00"
                const hh = parts[0].padStart(2, '0');
                const mm = parts[1].padStart(2, '0');
                return `${hh}:${mm}:00`;
            };

            const googleEventPayload = {
                summary: event.title,
                description: `${event.description || ''}\n\nLocal: ${event.location || ''}\nResp: ${event.responsible || ''}`,
                start: { dateTime: `${event.date}T${formatTime(event.start_time)}`, timeZone: 'America/Sao_Paulo' },
                end: { dateTime: `${event.date}T${formatTime(event.end_time || event.start_time)}`, timeZone: 'America/Sao_Paulo' },
            };
            console.log("Google Payload:", JSON.stringify(googleEventPayload));

            let response;
            if (event.google_event_id) {
                // Update
                response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${event.google_event_id}`, {
                    method: "PATCH", // Patch is safer
                    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
                    body: JSON.stringify(googleEventPayload)
                });
            } else {
                // Create
                response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
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
        console.error("Sync Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
