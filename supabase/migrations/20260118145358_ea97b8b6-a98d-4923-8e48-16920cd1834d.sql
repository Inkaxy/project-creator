-- Extend functions table with additional columns
ALTER TABLE public.functions 
ADD COLUMN IF NOT EXISTS short_name TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS icon TEXT,
ADD COLUMN IF NOT EXISTS default_break_minutes INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS min_staff INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_staff INTEGER,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create shifts table
CREATE TABLE public.shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  function_id UUID REFERENCES public.functions(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  planned_start TIME NOT NULL,
  planned_end TIME NOT NULL,
  planned_break_minutes INTEGER DEFAULT 30,
  actual_start TIME,
  actual_end TIME,
  actual_break_minutes INTEGER,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'completed', 'cancelled')),
  shift_type TEXT NOT NULL DEFAULT 'normal' CHECK (shift_type IN ('normal', 'overtime', 'oncall', 'training')),
  is_night_shift BOOLEAN DEFAULT false,
  is_weekend BOOLEAN DEFAULT false,
  is_holiday BOOLEAN DEFAULT false,
  notes TEXT,
  internal_notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES public.profiles(id)
);

-- Create employee_functions table (links employees to functions they can work)
CREATE TABLE public.employee_functions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  function_id UUID NOT NULL REFERENCES public.functions(id) ON DELETE CASCADE,
  proficiency_level TEXT NOT NULL DEFAULT 'competent' CHECK (proficiency_level IN ('learning', 'competent', 'expert')),
  certified_date DATE,
  certified_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, function_id)
);

-- Enable RLS on new tables
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_functions ENABLE ROW LEVEL SECURITY;

-- RLS policies for shifts
CREATE POLICY "Admins can manage all shifts"
ON public.shifts FOR ALL
USING (is_admin_or_manager(auth.uid()))
WITH CHECK (is_admin_or_manager(auth.uid()));

CREATE POLICY "Department leaders can manage department shifts"
ON public.shifts FOR ALL
USING (
  has_role(auth.uid(), 'avdelingsleder') AND 
  EXISTS (
    SELECT 1 FROM public.functions f
    WHERE f.id = function_id AND f.department_id = get_user_department_id(auth.uid())
  )
)
WITH CHECK (
  has_role(auth.uid(), 'avdelingsleder') AND 
  EXISTS (
    SELECT 1 FROM public.functions f
    WHERE f.id = function_id AND f.department_id = get_user_department_id(auth.uid())
  )
);

CREATE POLICY "Employees can view own shifts"
ON public.shifts FOR SELECT
USING (employee_id = auth.uid());

-- RLS policies for employee_functions
CREATE POLICY "Admins can manage all employee_functions"
ON public.employee_functions FOR ALL
USING (is_admin_or_manager(auth.uid()))
WITH CHECK (is_admin_or_manager(auth.uid()));

CREATE POLICY "Department leaders can manage department employee_functions"
ON public.employee_functions FOR ALL
USING (
  has_role(auth.uid(), 'avdelingsleder') AND 
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = employee_id AND p.department_id = get_user_department_id(auth.uid())
  )
)
WITH CHECK (
  has_role(auth.uid(), 'avdelingsleder') AND 
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = employee_id AND p.department_id = get_user_department_id(auth.uid())
  )
);

CREATE POLICY "Employees can view own employee_functions"
ON public.employee_functions FOR SELECT
USING (employee_id = auth.uid());

-- Create triggers for updated_at
CREATE TRIGGER update_shifts_updated_at
  BEFORE UPDATE ON public.shifts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_functions_updated_at
  BEFORE UPDATE ON public.employee_functions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_shifts_date ON public.shifts(date);
CREATE INDEX idx_shifts_function_id ON public.shifts(function_id);
CREATE INDEX idx_shifts_employee_id ON public.shifts(employee_id);
CREATE INDEX idx_shifts_status ON public.shifts(status);
CREATE INDEX idx_employee_functions_employee_id ON public.employee_functions(employee_id);
CREATE INDEX idx_employee_functions_function_id ON public.employee_functions(function_id);