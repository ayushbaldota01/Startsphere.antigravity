-- ============================================================================
-- PORTFOLIO FEATURE - Complete Database Schema (FIXED)
-- Run this in Supabase SQL Editor
-- ============================================================================

-- First, drop any existing objects to start fresh
DROP VIEW IF EXISTS portfolio_complete CASCADE;
DROP TABLE IF EXISTS portfolio_certifications CASCADE;
DROP TABLE IF EXISTS portfolio_projects CASCADE;
DROP TABLE IF EXISTS portfolio_education CASCADE;
DROP TABLE IF EXISTS portfolio_experience CASCADE;
DROP TABLE IF EXISTS portfolio_skills CASCADE;
DROP TABLE IF EXISTS portfolios CASCADE;
DROP FUNCTION IF EXISTS get_portfolio(TEXT);

-- ============================================================================
-- 1. Main Portfolios Table
-- ============================================================================
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  title TEXT,
  bio TEXT,
  location TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  website_url TEXT,
  is_public BOOLEAN DEFAULT true,
  theme TEXT DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. Portfolio Skills Table
-- ============================================================================
CREATE TABLE portfolio_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  skills TEXT[] NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. Portfolio Experience Table
-- ============================================================================
CREATE TABLE portfolio_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,
  company TEXT NOT NULL,
  period TEXT NOT NULL,
  description TEXT,
  achievements TEXT[],
  is_current BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. Portfolio Education Table
-- ============================================================================
CREATE TABLE portfolio_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
  degree TEXT NOT NULL,
  institution TEXT NOT NULL,
  period TEXT NOT NULL,
  gpa TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. Portfolio Projects Table
-- ============================================================================
CREATE TABLE portfolio_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
  source_project_id UUID,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  technologies TEXT[] NOT NULL DEFAULT '{}',
  github_url TEXT,
  demo_url TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'completed',
  featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. Portfolio Certifications Table
-- ============================================================================
CREATE TABLE portfolio_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  issue_date TEXT,
  credential_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Create indexes for performance
-- ============================================================================
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_portfolio_skills_portfolio_id ON portfolio_skills(portfolio_id);
CREATE INDEX idx_portfolio_experience_portfolio_id ON portfolio_experience(portfolio_id);
CREATE INDEX idx_portfolio_education_portfolio_id ON portfolio_education(portfolio_id);
CREATE INDEX idx_portfolio_projects_portfolio_id ON portfolio_projects(portfolio_id);
CREATE INDEX idx_portfolio_projects_featured ON portfolio_projects(featured);
CREATE INDEX idx_portfolio_certifications_portfolio_id ON portfolio_certifications(portfolio_id);

-- ============================================================================
-- Row Level Security Policies
-- ============================================================================

ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_certifications ENABLE ROW LEVEL SECURITY;

-- Portfolios: Public read if is_public, Owner full access
CREATE POLICY "Public portfolios are viewable" ON portfolios
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert own portfolio" ON portfolios
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolio" ON portfolios
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolio" ON portfolios
  FOR DELETE USING (auth.uid() = user_id);

-- Portfolio Skills policies
CREATE POLICY "Portfolio skills public read" ON portfolio_skills
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM portfolios p WHERE p.id = portfolio_id AND (p.is_public = true OR p.user_id = auth.uid()))
  );

CREATE POLICY "Portfolio skills insert" ON portfolio_skills
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid()));

CREATE POLICY "Portfolio skills update" ON portfolio_skills
  FOR UPDATE USING (EXISTS (SELECT 1 FROM portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid()));

CREATE POLICY "Portfolio skills delete" ON portfolio_skills
  FOR DELETE USING (EXISTS (SELECT 1 FROM portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid()));

-- Portfolio Experience policies
CREATE POLICY "Portfolio experience public read" ON portfolio_experience
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM portfolios p WHERE p.id = portfolio_id AND (p.is_public = true OR p.user_id = auth.uid()))
  );

CREATE POLICY "Portfolio experience insert" ON portfolio_experience
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid()));

CREATE POLICY "Portfolio experience update" ON portfolio_experience
  FOR UPDATE USING (EXISTS (SELECT 1 FROM portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid()));

CREATE POLICY "Portfolio experience delete" ON portfolio_experience
  FOR DELETE USING (EXISTS (SELECT 1 FROM portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid()));

-- Portfolio Education policies
CREATE POLICY "Portfolio education public read" ON portfolio_education
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM portfolios p WHERE p.id = portfolio_id AND (p.is_public = true OR p.user_id = auth.uid()))
  );

CREATE POLICY "Portfolio education insert" ON portfolio_education
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid()));

CREATE POLICY "Portfolio education update" ON portfolio_education
  FOR UPDATE USING (EXISTS (SELECT 1 FROM portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid()));

CREATE POLICY "Portfolio education delete" ON portfolio_education
  FOR DELETE USING (EXISTS (SELECT 1 FROM portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid()));

-- Portfolio Projects policies
CREATE POLICY "Portfolio projects public read" ON portfolio_projects
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM portfolios p WHERE p.id = portfolio_id AND (p.is_public = true OR p.user_id = auth.uid()))
  );

CREATE POLICY "Portfolio projects insert" ON portfolio_projects
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid()));

CREATE POLICY "Portfolio projects update" ON portfolio_projects
  FOR UPDATE USING (EXISTS (SELECT 1 FROM portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid()));

CREATE POLICY "Portfolio projects delete" ON portfolio_projects
  FOR DELETE USING (EXISTS (SELECT 1 FROM portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid()));

-- Portfolio Certifications policies
CREATE POLICY "Portfolio certifications public read" ON portfolio_certifications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM portfolios p WHERE p.id = portfolio_id AND (p.is_public = true OR p.user_id = auth.uid()))
  );

CREATE POLICY "Portfolio certifications insert" ON portfolio_certifications
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid()));

CREATE POLICY "Portfolio certifications update" ON portfolio_certifications
  FOR UPDATE USING (EXISTS (SELECT 1 FROM portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid()));

CREATE POLICY "Portfolio certifications delete" ON portfolio_certifications
  FOR DELETE USING (EXISTS (SELECT 1 FROM portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid()));

-- ============================================================================
-- Optimized View for fetching complete portfolio
-- ============================================================================

CREATE VIEW portfolio_complete AS
SELECT 
  p.id,
  p.user_id,
  p.display_name,
  p.title,
  p.bio,
  p.location,
  p.github_url,
  p.linkedin_url,
  p.website_url,
  p.is_public,
  p.theme,
  p.created_at,
  p.updated_at,
  COALESCE(
    (SELECT jsonb_agg(jsonb_build_object(
      'id', ps.id,
      'category', ps.category,
      'skills', ps.skills,
      'display_order', ps.display_order
    ) ORDER BY ps.display_order)
    FROM portfolio_skills ps WHERE ps.portfolio_id = p.id),
    '[]'::jsonb
  ) as skills,
  COALESCE(
    (SELECT jsonb_agg(jsonb_build_object(
      'id', pe.id,
      'role', pe.role,
      'company', pe.company,
      'period', pe.period,
      'description', pe.description,
      'achievements', pe.achievements,
      'is_current', pe.is_current,
      'display_order', pe.display_order
    ) ORDER BY pe.display_order)
    FROM portfolio_experience pe WHERE pe.portfolio_id = p.id),
    '[]'::jsonb
  ) as experience,
  COALESCE(
    (SELECT jsonb_agg(jsonb_build_object(
      'id', ped.id,
      'degree', ped.degree,
      'institution', ped.institution,
      'period', ped.period,
      'gpa', ped.gpa,
      'description', ped.description,
      'display_order', ped.display_order
    ) ORDER BY ped.display_order)
    FROM portfolio_education ped WHERE ped.portfolio_id = p.id),
    '[]'::jsonb
  ) as education,
  COALESCE(
    (SELECT jsonb_agg(jsonb_build_object(
      'id', pp.id,
      'source_project_id', pp.source_project_id,
      'title', pp.title,
      'description', pp.description,
      'technologies', pp.technologies,
      'github_url', pp.github_url,
      'demo_url', pp.demo_url,
      'image_url', pp.image_url,
      'status', pp.status,
      'featured', pp.featured,
      'display_order', pp.display_order
    ) ORDER BY pp.featured DESC, pp.display_order)
    FROM portfolio_projects pp WHERE pp.portfolio_id = p.id),
    '[]'::jsonb
  ) as projects,
  COALESCE(
    (SELECT jsonb_agg(jsonb_build_object(
      'id', pc.id,
      'name', pc.name,
      'issuer', pc.issuer,
      'issue_date', pc.issue_date,
      'credential_url', pc.credential_url,
      'display_order', pc.display_order
    ) ORDER BY pc.display_order)
    FROM portfolio_certifications pc WHERE pc.portfolio_id = p.id),
    '[]'::jsonb
  ) as certifications
FROM portfolios p;

-- Grant access to the view
GRANT SELECT ON portfolio_complete TO authenticated, anon;

-- ============================================================================
-- Helper function to get portfolio by user ID
-- ============================================================================

CREATE OR REPLACE FUNCTION get_portfolio(identifier TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Find by user_id
  SELECT to_jsonb(pc) INTO result
  FROM portfolio_complete pc
  WHERE pc.user_id::text = identifier;
  
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_portfolio(TEXT) TO authenticated, anon;

-- ============================================================================
-- DONE! Portfolio schema is ready.
-- ============================================================================
