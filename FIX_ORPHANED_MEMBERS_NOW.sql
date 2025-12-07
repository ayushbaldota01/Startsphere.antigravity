-- ============================================================================
-- FIX ORPHANED MEMBERS - RUN THIS NOW
-- ============================================================================

-- Step 1: Show orphaned project_members (users that don't exist)
SELECT 'ORPHANED MEMBERS (will be deleted):' as info;

SELECT 
    pm.id,
    pm.project_id,
    p.name as project_name,
    pm.user_id as broken_user_id,
    pm.role
FROM project_members pm
LEFT JOIN users u ON pm.user_id = u.id
LEFT JOIN projects p ON pm.project_id = p.id
WHERE u.id IS NULL;

-- Step 2: Delete orphaned project_members
DELETE FROM project_members pm
WHERE NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = pm.user_id
);

-- Step 3: Verify cleanup
DO $$
DECLARE
    remaining_orphans INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_orphans
    FROM project_members pm
    LEFT JOIN users u ON pm.user_id = u.id
    WHERE u.id IS NULL;
    
    IF remaining_orphans = 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '✓✓✓ SUCCESS! All orphaned members deleted! ✓✓✓';
        RAISE NOTICE '';
        RAISE NOTICE 'NEXT STEPS:';
        RAISE NOTICE '1. Hard refresh your app (Ctrl+Shift+R)';
        RAISE NOTICE '2. The broken members will no longer appear in dropdown';
        RAISE NOTICE '3. Task assignment should work now!';
        RAISE NOTICE '';
    ELSE
        RAISE NOTICE '✗ Still have % orphaned members', remaining_orphans;
    END IF;
END $$;

-- Step 4: Show remaining valid members
SELECT 'VALID MEMBERS (these will still work):' as info;

SELECT 
    pm.project_id,
    p.name as project_name,
    u.id as user_id,
    u.name as user_name,
    u.email,
    pm.role as project_role
FROM project_members pm
INNER JOIN users u ON pm.user_id = u.id
INNER JOIN projects p ON pm.project_id = p.id
ORDER BY p.name, u.name;

