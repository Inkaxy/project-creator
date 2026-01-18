-- Create time_entries table for clock in/out tracking
CREATE TABLE public.time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES public.shifts(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  break_minutes INTEGER DEFAULT 0,
  clock_in_location JSONB,
  clock_out_location JSONB,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  deviation_minutes INTEGER DEFAULT 0,
  deviation_reason TEXT,
  manager_notes TEXT,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create approval_requests table for generalized approval workflows
CREATE TABLE public.approval_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_type TEXT NOT NULL CHECK (request_type IN ('timesheet', 'absence', 'shift_swap', 'overtime', 'expense')),
  requestor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  description TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for time_entries
-- Employees can view their own entries
CREATE POLICY "Employees can view own time entries"
  ON public.time_entries FOR SELECT
  USING (auth.uid() = employee_id);

-- Employees can insert their own entries
CREATE POLICY "Employees can create own time entries"
  ON public.time_entries FOR INSERT
  WITH CHECK (auth.uid() = employee_id);

-- Employees can update their own draft entries
CREATE POLICY "Employees can update own draft time entries"
  ON public.time_entries FOR UPDATE
  USING (auth.uid() = employee_id AND status = 'draft');

-- Managers can view all time entries in their department
CREATE POLICY "Managers can view department time entries"
  ON public.time_entries FOR SELECT
  USING (
    public.is_admin_or_manager(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = time_entries.employee_id
      AND p.department_id = public.get_user_department_id(auth.uid())
    )
  );

-- Managers can update time entries (for approval)
CREATE POLICY "Managers can update time entries for approval"
  ON public.time_entries FOR UPDATE
  USING (public.is_admin_or_manager(auth.uid()));

-- RLS policies for approval_requests
-- Users can view their own requests
CREATE POLICY "Users can view own approval requests"
  ON public.approval_requests FOR SELECT
  USING (auth.uid() = requestor_id);

-- Users can create their own requests
CREATE POLICY "Users can create own approval requests"
  ON public.approval_requests FOR INSERT
  WITH CHECK (auth.uid() = requestor_id);

-- Users can update their own pending requests
CREATE POLICY "Users can update own pending requests"
  ON public.approval_requests FOR UPDATE
  USING (auth.uid() = requestor_id AND status = 'pending');

-- Managers can view all approval requests
CREATE POLICY "Managers can view all approval requests"
  ON public.approval_requests FOR SELECT
  USING (public.is_admin_or_manager(auth.uid()));

-- Managers can update approval requests (for reviewing)
CREATE POLICY "Managers can update approval requests"
  ON public.approval_requests FOR UPDATE
  USING (public.is_admin_or_manager(auth.uid()));

-- Create triggers for updated_at
CREATE TRIGGER update_time_entries_updated_at
  BEFORE UPDATE ON public.time_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_approval_requests_updated_at
  BEFORE UPDATE ON public.approval_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_time_entries_employee_id ON public.time_entries(employee_id);
CREATE INDEX idx_time_entries_date ON public.time_entries(date);
CREATE INDEX idx_time_entries_status ON public.time_entries(status);
CREATE INDEX idx_time_entries_shift_id ON public.time_entries(shift_id);
CREATE INDEX idx_approval_requests_requestor_id ON public.approval_requests(requestor_id);
CREATE INDEX idx_approval_requests_status ON public.approval_requests(status);
CREATE INDEX idx_approval_requests_request_type ON public.approval_requests(request_type);