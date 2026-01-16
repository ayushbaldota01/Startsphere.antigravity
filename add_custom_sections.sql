-- Add custom_sections column to project_reports table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_reports' AND column_name = 'custom_sections') THEN 
        ALTER TABLE project_reports ADD COLUMN custom_sections JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;
