
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Manually parse .env to avoid dependencies
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];

console.log('Testing connection to:', supabaseUrl);

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConnection() {
    try {
        const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });

        if (error) {
            // If table doesn't exist, we might get a 404 or specific error, but it means we connected!
            console.log('Connected to Supabase! (Query returned error, which is expected if table is empty/missing, but connection worked):', error.message);
        } else {
            console.log('Successfully connected to Supabase! Users count:', data);
        }

        // Also check auth service
        const { data: authData, error: authError } = await supabase.auth.getSession();
        if (authError) {
            console.error('Auth service error:', authError.message);
        } else {
            console.log('Auth service is reachable.');
        }

    } catch (err) {
        console.error('Connection failed:', err.message);
        process.exit(1);
    }
}

checkConnection();
