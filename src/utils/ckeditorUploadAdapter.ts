import { supabase } from '../../lib/supabase';

export class SupabaseUploadAdapter {
    loader: any;

    constructor(loader: any) {
        this.loader = loader;
    }

    // Starts the upload process.
    upload() {
        return this.loader.file
            .then((file: File) => new Promise(async (resolve, reject) => {
                try {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                    const filePath = `${fileName}`;

                    const { data, error } = await supabase.storage
                        .from('legislative-images')
                        .upload(filePath, file, {
                            cacheControl: '3600',
                            upsert: false
                        });

                    if (error) {
                        throw error;
                    }

                    const { data: { publicUrl } } = supabase.storage
                        .from('legislative-images')
                        .getPublicUrl(filePath);

                    resolve({
                        default: publicUrl
                    });
                } catch (error) {
                    console.error('Upload error:', error);
                    reject(error);
                }
            }));
    }

    // Aborts the upload process.
    abort() {
        if (this.loader.file) {
            // Not implemented: Supabase storage cancellation if needed
        }
    }
}

export function MyCustomUploadAdapterPlugin(editor: any) {
    editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
        return new SupabaseUploadAdapter(loader);
    };
}
