
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Manually parse .env
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

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser(email, password, name, role) {
    console.log(`\nCreating user: ${email} (${role})...`);

    try {
        // 1. Sign Up
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name, role }
            }
        });

        if (error) {
            console.error(`❌ Sign up failed for ${email}:`, error.message);
            return;
        }

        if (!data.user) {
            console.error(`❌ No user returned for ${email}`);
            return;
        }

        console.log(`✅ Auth user created! ID: ${data.user.id}`);
        console.log(`   Waiting for trigger to create public profile...`);

        // 2. Wait for Trigger
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 3. Verify Public Profile
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError || !profile) {
            console.error(`❌ Public profile NOT found for ${email}.`);
            console.error(`   Reason: The database trigger 'on_auth_user_created' likely failed or doesn't exist.`);
            console.error(`   Error details:`, profileError?.message);
        } else {
            console.log(`✅ Public profile verified!`);
            console.log(`   Name: ${profile.name}`);
            console.log(`   Role: ${profile.role}`);
        }

    } catch (err) {
        console.error(`❌ Unexpected error for ${email}:`, err.message);
    }
}

async function main() {
    const timestamp = Math.floor(Date.now() / 1000);

    // User 1: Student
    await createTestUser(
        `student_${timestamp}@gmail.com`,
        'Password123!',
        'Test Student',
        'student'
    );

    // User 2: Mentor
    await createTestUser(
        `mentor_${timestamp}@gmail.com`,
        'Password123!',
        'Test Mentor',
        'mentor'
    );
}

main();
