import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Initializing Supabase client for Coming Soon App...');
console.log('📍 URL:', supabaseUrl);
console.log('🔑 Key present:', !!supabaseAnonKey);

let client = null;

try {
    if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
        console.log('✅ Creating Supabase client...');
        client = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                persistSession: false, // No session persistence for coming soon app
                autoRefreshToken: false,
                detectSessionInUrl: false
            },
            db: {
                schema: 'public',
            }
        });
        console.log('✅ Supabase client created successfully!');
    } else {
        console.warn("⚠️ Supabase configuration missing. Using localStorage fallback.");
    }
} catch (error) {
    console.error("❌ Error initializing Supabase client:", error);
}

export const supabase = client;
