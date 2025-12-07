-- Check if the specific user exists
-- Run this to see if the user you're trying to assign exists

-- Check if this specific user exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM users WHERE id = 'f055315e-9113-4a9b-b4d2-d4c7ef9e915e')
        THEN '✓ User EXISTS in users table'
        ELSE '✗ User DOES NOT EXIST in users table - THIS IS THE PROBLEM!'
    END as result;

-- Show the user if they exist
SELECT * FROM users WHERE id = 'f055315e-9113-4a9b-b4d2-d4c7ef9e915e';

-- Check all project members and see which ones don't have matching users
SELECT 
    pm.id,
    pm.project_id,
    p.name as project_name,
    pm.user_id,
    u.name as user_name,
    CASE 
        WHEN u.id IS NULL THEN '✗ BROKEN - User does not exist'
        ELSE '✓ Valid'
    END as status
FROM project_members pm
LEFT JOIN users u ON pm.user_id = u.id
LEFT JOIN projects p ON pm.project_id = p.id
ORDER BY status DESC, p.name;

-- Count how many broken entries exist
SELECT 
    COUNT(*) as total_members,
    COUNT(u.id) as valid_members,
    COUNT(*) - COUNT(u.id) as broken_members
FROM project_members pm
LEFT JOIN users u ON pm.user_id = u.id;

