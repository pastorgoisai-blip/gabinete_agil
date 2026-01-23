import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";
// Import djwt verify
import { verify } from "https://deno.land/x/djwt@v2.8/mod.ts";

serve(async (req) => {
    // OnlyOffice expects 200 OK with specific JSON even on error sometimes to stop retrying, but let's stick to standard 200 {error:0}

    try {
        const url = new URL(req.url);
        const file_id = url.searchParams.get('file_id');
        const user_id = url.searchParams.get('user_id'); // Who triggered the save originally (implied)

        if (!file_id) throw new Error('Missing file_id');

        const body = await req.json();
        const { status, url: downloadUrl, actions, users } = body;

        // 0 - no document with the key found,
        // 1 - document is being edited,
        // 2 - document is ready for saving,
        // 3 - document saving error has occurred,
        // 4 - document is closed with no changes,
        // 6 - document is being edited, but the current document state is saved,
        // 7 - error has occurred while forcing the document saving.

        if (status === 2 || status === 6) {
            console.log(`Saving file ${file_id}...`);

            // 1. Download file from OnlyOffice
            const response = await fetch(downloadUrl);
            if (!response.ok) throw new Error('Failed to download file from OnlyOffice');
            const fileBlob = await response.blob();

            // 2. Upload to Supabase Storage (Service Role needed to bypass RLS if triggered by system, 
            // but here we are unauthenticated callback usually. 
            // Security: OnlyOffice signs the request? Usually yes, via Authorization header with "Bearer <token>"
            // The token is the one we generated in auth? Or one configured in OnlyOffice?
            // For simplicity, we assume we trust the secret signature if present.

            // Verify Token (TODO: robustness)
            // const authHeader = req.headers.get('Authorization');

            const supabaseAdmin = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            );

            const { error: uploadError } = await supabaseAdmin
                .storage
                .from('legislative-documents')
                .upload(file_id, fileBlob, {
                    upsert: true,
                    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // Force docx for now
                });

            if (uploadError) throw uploadError;

            console.log('File updated successfully.');
        }

        return new Response(JSON.stringify({ error: 0 }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 1, message: error.message }), {
            status: 200, // OnlyOffice likes 200 even for logic errors sometimes
            headers: { 'Content-Type': 'application/json' }
        });
    }
});
