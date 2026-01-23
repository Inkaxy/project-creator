-- Create routines table for daily/weekly operational routines
CREATE TABLE public.routines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL DEFAULT 'daily', -- daily, weekly, monthly, shift
  icon TEXT DEFAULT 'clipboard', -- Icon name from lucide
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  function_id UUID REFERENCES public.functions(id) ON DELETE SET NULL, -- Responsible shift type
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create routine items (tasks within a routine)
CREATE TABLE public.routine_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_critical BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create routine completions (tracking when routines are done)
CREATE TABLE public.routine_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  completed_by UUID NOT NULL REFERENCES auth.users(id),
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completion_date DATE NOT NULL DEFAULT CURRENT_DATE, -- For easy querying by day
  notes TEXT,
  shift_id UUID REFERENCES public.shifts(id) ON DELETE SET NULL
);

-- Create routine item responses (individual item completions)
CREATE TABLE public.routine_item_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  completion_id UUID NOT NULL REFERENCES public.routine_completions(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.routine_items(id) ON DELETE CASCADE,
  checked BOOLEAN DEFAULT false,
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_item_responses ENABLE ROW LEVEL SECURITY;

-- Policies for routines (viewable by all authenticated, managed by admins)
CREATE POLICY "Routines are viewable by authenticated users"
ON public.routines FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Routines can be created by authenticated users"
ON public.routines FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Routines can be updated by authenticated users"
ON public.routines FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Routines can be deleted by authenticated users"
ON public.routines FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Policies for routine items
CREATE POLICY "Routine items are viewable by authenticated users"
ON public.routine_items FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Routine items can be created by authenticated users"
ON public.routine_items FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Routine items can be updated by authenticated users"
ON public.routine_items FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Routine items can be deleted by authenticated users"
ON public.routine_items FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Policies for routine completions
CREATE POLICY "Routine completions are viewable by authenticated users"
ON public.routine_completions FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Routine completions can be created by authenticated users"
ON public.routine_completions FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Routine completions can be updated by the creator"
ON public.routine_completions FOR UPDATE
USING (auth.uid() = completed_by);

-- Policies for routine item responses
CREATE POLICY "Routine item responses are viewable by authenticated users"
ON public.routine_item_responses FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Routine item responses can be created by authenticated users"
ON public.routine_item_responses FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Routine item responses can be updated by authenticated users"
ON public.routine_item_responses FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Create indexes for performance
CREATE INDEX idx_routines_department ON public.routines(department_id);
CREATE INDEX idx_routines_function ON public.routines(function_id);
CREATE INDEX idx_routine_completions_date ON public.routine_completions(completion_date);
CREATE INDEX idx_routine_completions_routine ON public.routine_completions(routine_id);

-- Create updated_at trigger for routines
CREATE TRIGGER update_routines_updated_at
BEFORE UPDATE ON public.routines
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();