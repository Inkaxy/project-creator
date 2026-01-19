-- Migration: add_department_to_templates.sql

-- Add department_id to shift_templates
ALTER TABLE public.shift_templates 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_shift_templates_department ON public.shift_templates(department_id);

-- Comment
COMMENT ON COLUMN public.shift_templates.department_id IS 'NULL = global template available to all departments';

-- Create rotation groups table
CREATE TABLE IF NOT EXISTS public.template_rotation_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  rotation_length INTEGER NOT NULL CHECK (rotation_length >= 2 AND rotation_length <= 6),
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add rotation fields to shift_templates
ALTER TABLE public.shift_templates
ADD COLUMN IF NOT EXISTS is_rotating BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS rotation_group_id UUID REFERENCES public.template_rotation_groups(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS rotation_sequence INTEGER CHECK (rotation_sequence >= 1 AND rotation_sequence <= 6),
ADD COLUMN IF NOT EXISTS rotation_name VARCHAR(10);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_templates_rotation_group ON public.shift_templates(rotation_group_id);
CREATE INDEX IF NOT EXISTS idx_rotation_groups_department ON public.template_rotation_groups(department_id);

-- Enable RLS on rotation groups
ALTER TABLE public.template_rotation_groups ENABLE ROW LEVEL SECURITY;

-- RLS policies for rotation groups
CREATE POLICY "Authenticated users can view rotation groups"
  ON public.template_rotation_groups
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can create rotation groups"
  ON public.template_rotation_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update rotation groups"
  ON public.template_rotation_groups
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete rotation groups"
  ON public.template_rotation_groups
  FOR DELETE
  TO authenticated
  USING (true);

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER update_rotation_groups_updated_at
  BEFORE UPDATE ON public.template_rotation_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.template_rotation_groups IS 'Groups of templates that rotate (e.g., 2-week A/B rotation)';
COMMENT ON COLUMN public.shift_templates.rotation_sequence IS 'Order in rotation: 1=A, 2=B, 3=C, etc.';
COMMENT ON COLUMN public.shift_templates.rotation_name IS 'Display name for rotation week: A, B, C, etc.';