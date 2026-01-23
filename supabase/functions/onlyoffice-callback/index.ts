import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
    // CORS Headers
    if (req.method === "OPTIONS") {
        return new Response(null, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        });
    }

    try {
        const urlObj = new URL(req.url); // Parse URL to get search params
        const fileIdParam = urlObj.searchParams.get('file_id');
        const userIdParam = urlObj.searchParams.get('user_id');

        const body = await req.json();
        const { status, url, key } = body;

        console.log("OnlyOffice Callback:", { status, key, fileIdParam });

        // Status codes:
        // 0 - No document with the key identifier could be found
        // 1 - Document is being edited
        // 2 - Document is ready for saving
        // 3 - Document saving error has occurred
        // 4 - Document is closed with no changes
        // 6 - Document is being edited, but the current document state is saved
        // 7 - Error has occurred while force saving the document

        // Only save on status 2 (ready for saving) or status 6 (force save while editing)
        if (status !== 2 && status !== 6) {
            return new Response(JSON.stringify({ error: 0 }), {
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            });
        }

        let file_id = fileIdParam;

        if (!file_id) {
            console.warn("file_id param missing, attempting to parse key (legacy mode)");
            // Fallback: Extract file_id from key (format: "user_id_cabinet_id_filename_timestamp")
            // NOTE: This fallback logic is fragile if filenames have underscores!
            // We strongly prefer the query param method.
            const keyParts = key.split('_');
            // const userId = keyParts[0];
            const filePathParts = keyParts.slice(1, -1); // Remove user_id and timestamp
            file_id = filePathParts.join('/').replace(/_/g, '/');
        }

        console.log("Saving document:", { file_id, url });

        // Download edited file from OnlyOffice
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to download from OnlyOffice: ${response.statusText}`);
        }

        const fileBlob = await response.blob();
        // User code used .arrayBuffer() but .blob() is often safer for upload, using blob as per standard deno pattern, 
        // actually arrayBuffer is fine too. Let's stick closer to user code but ensure content type is preserved.

        // Save to Supabase Storage
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        const { error: uploadError } = await supabase.storage
            .from("legislative-documents") // FIXED: 'documents' -> 'legislative-documents'
            .upload(file_id!, fileBlob, { // using blob
                upsert: true,
                contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            });

        if (uploadError) {
            console.error("Upload error:", uploadError);
            throw new Error(`Storage upload failed: ${uploadError.message}`);
        }

        // Update document timestamp in database (optional)
        // We comment this out as 'offices' table likely doesn't match 'legislative_projects'
        // and we don't have the exact row ID here, only the file path.
        // If we wanted to update, we'd need to find the project by pdf_url or similar.
        /*
        const { error: updateError } = await supabase
          .from('offices') // CAUTION: Likely wrong table
          .update({ updated_at: new Date().toISOString() })
          .eq('document_url', file_id);
    
        if (updateError) {
          console.warn("Failed to update timestamp:", updateError);
        }
        */

        console.log("Document saved successfully:", file_id);

        return new Response(JSON.stringify({ error: 0 }), {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        });

    } catch (error: any) {
        console.error("Callback Error:", error);
        return new Response(
            JSON.stringify({
                error: 1,
                message: error.message
            }),
            {
                status: 200, // OnlyOffice expects 200 even on error to stop retries sometimes, referencing previous knowledge
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            }
        );
    }
});
