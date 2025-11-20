import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Types for our database
export interface User {
  id: string;
  email: string;
  name: string;
  bio?: string;
  avatar_url?: string;
  role: 'student' | 'mentor';
  university?: string;
  major?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  domain?: string;
  description?: string;
  abstract?: string;
  problem_statement?: string;
  solution_approach?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'ADMIN' | 'MEMBER';
  joined_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  assignee_id?: string;
  due_date?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface Note {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface File {
  id: string;
  project_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type?: string;
  uploaded_by: string;
  created_at: string;
}

export interface Portfolio {
  id: string;
  user_id: string;
  display_name: string;
  title?: string;
  bio?: string;
  location?: string;
  github_url?: string;
  linkedin_url?: string;
  website_url?: string;
  created_at: string;
  updated_at: string;
}



