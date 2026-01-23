-- Add icon column to departments table
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'building-2';