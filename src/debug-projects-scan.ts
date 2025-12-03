import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oigsvstqnpmjopxebptw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pZ3N2c3RxbnBtam9weGVicHR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NzA5NzQsImV4cCI6MjA3OTE0Njk3NH0.sGegG6wURPoQ-455Qa5_F_hk2QLBpw-bvSuUOhjgZfI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Scanning for users with projects...');

    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, email');

    if (userError) {
        console.error('Error fetching users:', userError);
        return;
    }

    console.log(`Found ${users?.length || 0} users.`);

    for (const user of users || []) {
        // Check project memberships
        const { count, error } = await supabase
            .from('project_members')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        if (count && count > 0) {
            console.log(`\nUser ${user.email} (${user.id}) has ${count} projects.`);

            // Try to fetch details for one project
            const { data: memberships } = await supabase
                .from('project_members')
                .select('project_id')
                .eq('user_id', user.id)
                .limit(1);

            if (memberships && memberships.length > 0) {
                const projectId = memberships[0].project_id;
                console.log(`Testing fetchProjectDetail for project ${projectId}...`);

                // Test RPC
                const { data: rpcData, error: rpcError } = await supabase.rpc('get_project_detail', {
                    project_uuid: projectId,
                    user_uuid: user.id
                });

                if (rpcError) {
                    console.error('RPC get_project_detail FAILED:', rpcError.message);
                } else {
                    console.log('RPC get_project_detail SUCCESS');
                }
            }
        }
    }
}

run();
