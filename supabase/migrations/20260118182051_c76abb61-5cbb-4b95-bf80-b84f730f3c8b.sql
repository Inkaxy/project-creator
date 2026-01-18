
-- Create wage_ladders table for seniority progression
CREATE TABLE public.wage_ladders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  competence_level TEXT NOT NULL DEFAULT 'ufaglaert' CHECK (competence_level IN ('ufaglaert', 'faglaert', 'laerling')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wage_ladder_levels table
CREATE TABLE public.wage_ladder_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ladder_id UUID NOT NULL REFERENCES public.wage_ladders(id) ON DELETE CASCADE,
  level INTEGER NOT NULL,
  min_hours INTEGER NOT NULL DEFAULT 0,
  max_hours INTEGER,
  hourly_rate NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ladder_id, level)
);

-- Create employee_details table for extended employment information
CREATE TABLE public.employee_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  
  -- Employment dates
  end_date DATE,
  probation_end_date DATE,
  
  -- Working hours
  contracted_hours_per_week NUMERIC(5,2) DEFAULT 37.5,
  full_time_hours NUMERIC(5,2) DEFAULT 37.5,
  employment_percentage NUMERIC(5,2) GENERATED ALWAYS AS ((contracted_hours_per_week / NULLIF(full_time_hours, 0)) * 100) STORED,
  
  -- Salary
  salary_type TEXT NOT NULL DEFAULT 'hourly' CHECK (salary_type IN ('hourly', 'fixed')),
  wage_ladder_id UUID REFERENCES public.wage_ladders(id),
  current_seniority_level INTEGER DEFAULT 1,
  accumulated_hours NUMERIC(10,2) DEFAULT 0,
  
  -- Fixed salary fields
  fixed_monthly_salary NUMERIC(10,2),
  included_night_hours NUMERIC(5,2),
  contracted_hours_per_month NUMERIC(6,2),
  
  -- Competence
  competence_level TEXT DEFAULT 'ufaglaert' CHECK (competence_level IN ('ufaglaert', 'faglaert', 'laerling')),
  
  -- Clock settings
  allow_mobile_clock BOOLEAN DEFAULT true,
  gps_required BOOLEAN DEFAULT false,
  
  -- HMS roles
  is_safety_representative BOOLEAN DEFAULT false,
  is_fire_safety_leader BOOLEAN DEFAULT false,
  is_food_safety_responsible BOOLEAN DEFAULT false,
  has_first_aid_course BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employee_documents table for personnel files
CREATE TABLE public.employee_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('employment', 'salary', 'leave', 'training', 'reviews', 'disciplinary', 'termination')),
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  is_signed BOOLEAN DEFAULT false,
  signed_at TIMESTAMP WITH TIME ZONE,
  signed_by UUID REFERENCES public.profiles(id),
  uploaded_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add emergency contact and address fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_relation TEXT,
ADD COLUMN IF NOT EXISTS employee_number TEXT;

-- Enable RLS
ALTER TABLE public.wage_ladders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wage_ladder_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wage_ladders
CREATE POLICY "Anyone can view wage ladders" ON public.wage_ladders FOR SELECT USING (true);
CREATE POLICY "Admins can manage wage ladders" ON public.wage_ladders FOR ALL USING (is_admin_or_manager(auth.uid()));

-- RLS Policies for wage_ladder_levels
CREATE POLICY "Anyone can view wage ladder levels" ON public.wage_ladder_levels FOR SELECT USING (true);
CREATE POLICY "Admins can manage wage ladder levels" ON public.wage_ladder_levels FOR ALL USING (is_admin_or_manager(auth.uid()));

-- RLS Policies for employee_details
CREATE POLICY "Users can view own details" ON public.employee_details FOR SELECT USING (auth.uid() = employee_id);
CREATE POLICY "Admins can view all details" ON public.employee_details FOR SELECT USING (is_admin_or_manager(auth.uid()));
CREATE POLICY "Admins can manage details" ON public.employee_details FOR ALL USING (is_admin_or_manager(auth.uid()));

-- RLS Policies for employee_documents
CREATE POLICY "Users can view own documents" ON public.employee_documents FOR SELECT USING (auth.uid() = employee_id);
CREATE POLICY "Admins can view all documents" ON public.employee_documents FOR SELECT USING (is_admin_or_manager(auth.uid()));
CREATE POLICY "Admins can manage documents" ON public.employee_documents FOR ALL USING (is_admin_or_manager(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_wage_ladders_updated_at BEFORE UPDATE ON public.wage_ladders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employee_details_updated_at BEFORE UPDATE ON public.employee_details FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employee_documents_updated_at BEFORE UPDATE ON public.employee_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_employee_details_employee_id ON public.employee_details(employee_id);
CREATE INDEX idx_employee_details_wage_ladder ON public.employee_details(wage_ladder_id);
CREATE INDEX idx_employee_documents_employee_id ON public.employee_documents(employee_id);
CREATE INDEX idx_employee_documents_category ON public.employee_documents(category);
CREATE INDEX idx_wage_ladder_levels_ladder_id ON public.wage_ladder_levels(ladder_id);
