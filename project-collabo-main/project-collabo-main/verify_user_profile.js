
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Parse .env
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

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyUserProfile() {
    const email = 'student_1763575164@gmail.com';
    const password = 'Password123!';

    console.log('\n=== Verifying User Profile ===\n');

    // Step 1: Sign in
    console.log('1. Signing in...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) {
        console.error('❌ Sign in failed:', authError.message);
        return;
    }

    console.log('✅ Signed in successfully');
    console.log(`   User ID: ${authData.user.id}`);
    console.log(`   Email: ${authData.user.email}`);

    // Step 2: Try to fetch user profile
    console.log('\n2. Fetching user profile from public.users...');
    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

    if (profileError) {
        console.error('❌ Failed to fetch profile:', profileError.message);
        console.error('   Code:', profileError.code);
        console.error('   Details:', profileError.details);
        console.error('   Hint:', profileError.hint);
    } else if (!profile) {
        console.error('❌ Profile not found (returned null)');
    } else {
        console.log('✅ Profile found!');
        console.log('   Profile data:', JSON.stringify(profile, null, 2));
    }

    // Step 3: Check if row exists at all (bypassing RLS)
    console.log('\n3. Checking if ANY user with this ID exists...');
    const { count, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('id', authData.user.id);

    if (countError) {
        console.error('❌ Count query failed:', countError.message);
    } else {
        console.log(`   Count: ${count}`);
        if (count === 0) {
            console.error('❌ NO USER PROFILE EXISTS IN public.users FOR THIS ID');
            console.error('   This means the trigger did not create the profile!');
        }
    }

    // Sign out
    await supabase.auth.signOut();
}

verifyUserProfile();
