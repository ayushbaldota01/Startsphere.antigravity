import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oigsvstqnpmjopxebptw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pZ3N2c3RxbnBtam9weGVicHR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NzA5NzQsImV4cCI6MjA3OTE0Njk3NH0.sGegG6wURPoQ-455Qa5_F_hk2QLBpw-bvSuUOhjgZfI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Testing Supabase Projects...');

    // 1. Get a user
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, email')
        .limit(1);

    if (userError) {
        console.error('Error fetching users:', userError);
        return;
    }

    if (!users || users.length === 0) {
        console.log('No users found.');
        return;
    }

    const userId = users[0].id;
    console.log(`Testing with User ID: ${userId} (${users[0].email})`);

    // 2. Test RPC get_user_projects
    console.log('\n--- Test RPC: get_user_projects ---');
    const { data: rpcProjects, error: rpcError } = await supabase.rpc('get_user_projects', {
        user_uuid: userId,
    });

    if (rpcError) {
        console.error('RPC Error:', rpcError);
    } else {
        console.log('RPC Success. Projects found:', rpcProjects?.length);
    }

    // 3. Test Fallback Query
    console.log('\n--- Test Fallback Query ---');
    const { data: memberships, error: memberError } = await supabase
        .from('project_members')
        .select('role, project_id, projects(*)')
        .eq('user_id', userId);

    if (memberError) {
        console.error('Fallback Error (memberships):', memberError);
    } else {
        console.log('Fallback Memberships found:', memberships?.length);
        if (memberships && memberships.length > 0) {
            console.log('Sample project data:', JSON.stringify(memberships[0].projects, null, 2));
        }
    }
}

run();
