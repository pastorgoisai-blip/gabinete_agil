import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ... (Interface CreateDocumentRequest - lines 7-15 unchanged)

serve(async (req) => {
    // CORS Headers (lines 19-27 unchanged)
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
        console.log("[DEBUG] Request Received");

        // 1. Authenticate user (User Context)
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            console.error("[DEBUG] Missing Authorization header");
            throw new Error("Missing Authorization header");
        }

        // Limit logs to avoid leaking secrets, but verify structure
        console.log("[DEBUG] Auth Header length:", authHeader.length);

        const token = authHeader.replace("Bearer ", "");

        // Use Anon Key for user validation
        const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: authHeader } },
        });

        // Explicitly pass token to getUser
        const { data: { user }, error: authError } = await supabaseUser.auth.getUser(token);

        if (authError) {
            console.error("[DEBUG] Auth Error details:", authError);
            throw new Error(`Unauthorized: ${authError.message}`);
        }
        if (!user) {
            console.error("[DEBUG] No user found");
            throw new Error("Unauthorized: No user found");
        }

        console.log("[DEBUG] User authenticated:", user.id);

        // 2. Initialize Admin Client (Service Role Context)
        // Used for accessing global templates and writing to protected storage
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        // 3. Get user profile
        const { data: profile, error: profileError } = await supabaseUser
            .from("profiles")
            .select("cabinet_id")
            .eq("id", user.id)
            .single();

        if (profileError || !profile) throw new Error("Profile not found");

        // 4. Parse request
        const { template_id, metadata }: CreateDocumentRequest = await req.json();

        if (!template_id || !metadata?.number || !metadata?.year) {
            throw new Error("Missing required fields: template_id, number, year");
        }

        // 5. Get template (Use Admin Client to likely bypass RLS on global templates)
        const { data: template, error: templateError } = await supabaseAdmin
            .from("doc_templates")
            .select("*")
            .eq("id", template_id)
            .single();

        if (templateError || !template) {
            throw new Error("Template not found");
        }

        // 6. Security: Verify template access manually
        // Global templates (cabinet_id = null) OR templates from user's cabinet
        if (template.cabinet_id !== null && template.cabinet_id !== profile.cabinet_id) {
            throw new Error("Access Denied: Template belongs to another cabinet");
        }

        // 7. Verify storage_path exists
        if (!template.storage_path) {
            throw new Error("Template does not have a storage_path");
        }

        // 8. Download template DOCX (Use Admin Client)
        console.log(`Downloading template from: ${template.storage_path} (Bucket: templates)`);
        const { data: templateFile, error: downloadError } = await supabaseAdmin.storage
            .from("templates") // Source bucket confirmed by user
            .download(template.storage_path);

        if (downloadError) {
            throw new Error(`Template file not found: ${downloadError.message}`);
        }

        // 9. Generate destination path
        const timestamp = Date.now();
        const sanitizedType = template.type
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "_");

        // Path: cabinet_id/filename.docx
        const fileName = `${sanitizedType}_${metadata.number}_${metadata.year}_${timestamp}.docx`;
        const destinationPath = `${profile.cabinet_id}/${fileName}`;

        console.log(`Uploading to: ${destinationPath}`);

        // 10. Upload COPY (Use Admin Client to fail-safe write)
        const { error: uploadError } = await supabaseAdmin.storage
            .from("legislative-documents")
            .upload(destinationPath, templateFile, {
                contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                upsert: false,
            });

        if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // 11. Create database record (Use User Client to maintain RLS ownership/audit if needed, or Admin for certainty)
        // Using Admin here ensures no RLS blockage, but we must manually set cabinet_id (which we do)
        const { data: newOffice, error: insertError } = await supabaseAdmin
            .from("offices")
            .insert({
                cabinet_id: profile.cabinet_id,
                type: template.type,
                number: metadata.number,
                year: metadata.year,
                recipient: metadata.recipient || "",
                subject: metadata.subject || `${template.type} em Edição`,
                status: "Pendente",
                document_url: destinationPath,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (insertError) {
            // Rollback
            await supabaseAdmin.storage.from("legislative-documents").remove([destinationPath]);
            throw new Error(`Database insert failed: ${insertError.message}`);
        }

        return new Response(
            JSON.stringify({
                success: true,
                document: newOffice,
                file_path: destinationPath,
                file_name: fileName,
                message: `${template.type} criado com sucesso!`,
            }),
            {
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            }
        );

    } catch (error: any) {
        console.error("Create From Template Error:", error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || "Internal server error",
            }),
            {
                status: 200, // Return 200 even on error so client can parse the message
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            }
        );
    }
});
