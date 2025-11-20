// Test Supabase Connection
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aouwtfmtwwvwtcabtioq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvdXd0Zm10d3d2d3RjYWJ0aW9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MTQ0MDUsImV4cCI6MjA3Nzk5MDQwNX0.PrBZV_PZICVWkFAKuao3CteZrCeYIhHljdU55MjUuNw';

console.log('Testing Supabase Connection...');
console.log('URL:', supabaseUrl);
console.log('Key (first 20 chars):', supabaseKey.substring(0, 20) + '...');

const supabase = createClient(supabaseUrl, supabaseKey);

// Test 1: Check if we can query the users table
console.log('\n--- Test 1: Query users table ---');
const { data: users, error: usersError } = await supabase
  .from('users')
  .select('count')
  .limit(1);

if (usersError) {
  console.error('❌ Users table error:', usersError.message);
} else {
  console.log('✅ Users table accessible');
}

// Test 2: Try to sign up
console.log('\n--- Test 2: Test Auth Signup ---');
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: 'test-' + Date.now() + '@example.com',
  password: 'TestPassword123!',
});

if (authError) {
  console.error('❌ Auth error:', authError.message);
  console.error('   Status:', authError.status);
  console.error('   Code:', authError.code);
} else {
  console.log('✅ Auth working! User ID:', authData.user?.id);
}

// Test 3: Check project connectivity
console.log('\n--- Test 3: Project Status ---');
const { data: healthData, error: healthError } = await supabase
  .from('projects')
  .select('count')
  .limit(1);

if (healthError) {
  console.error('❌ Projects table error:', healthError.message);
} else {
  console.log('✅ Projects table accessible');
}

console.log('\n=== Test Complete ===');



