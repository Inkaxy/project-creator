-- Table for open shift applications
CREATE TABLE public.shift_applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  note TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  UNIQUE(shift_id, employee_id)
);

-- Table for shift swap requests
CREATE TABLE public.shift_swap_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  original_shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  swap_type TEXT NOT NULL CHECK (swap_type IN ('swap', 'giveaway', 'cover')),
  target_shift_id UUID REFERENCES public.shifts(id) ON DELETE CASCADE,
  target_employee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending_colleague' CHECK (status IN ('pending_colleague', 'pending_manager', 'approved', 'rejected', 'cancelled')),
  colleague_approved_at TIMESTAMPTZ,
  manager_approved_at TIMESTAMPTZ,
  manager_approved_by UUID REFERENCES public.profiles(id),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shift_applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_swap_requests ENABLE ROW LEVEL SECURITY;

-- RLS for shift_applicants
CREATE POLICY "Users can view their own applications"
  ON public.shift_applicants FOR SELECT TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY "Managers can view all applications"
  ON public.shift_applicants FOR SELECT TO authenticated
  USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Users can apply to open shifts"
  ON public.shift_applicants FOR INSERT TO authenticated
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Users can update their own pending applications"
  ON public.shift_applicants FOR UPDATE TO authenticated
  USING (employee_id = auth.uid() AND status = 'pending');

CREATE POLICY "Managers can update all applications"
  ON public.shift_applicants FOR UPDATE TO authenticated
  USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Users can delete their own pending applications"
  ON public.shift_applicants FOR DELETE TO authenticated
  USING (employee_id = auth.uid() AND status = 'pending');

-- RLS for shift_swap_requests
CREATE POLICY "Users can view swap requests they're involved in"
  ON public.shift_swap_requests FOR SELECT TO authenticated
  USING (
    requester_id = auth.uid() OR 
    target_employee_id = auth.uid() OR
    public.is_admin_or_manager(auth.uid())
  );

CREATE POLICY "Users can create swap requests for their own shifts"
  ON public.shift_swap_requests FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Involved parties can update swap requests"
  ON public.shift_swap_requests FOR UPDATE TO authenticated
  USING (
    requester_id = auth.uid() OR 
    target_employee_id = auth.uid() OR
    public.is_admin_or_manager(auth.uid())
  );

CREATE POLICY "Requesters can cancel their own requests"
  ON public.shift_swap_requests FOR DELETE TO authenticated
  USING (requester_id = auth.uid() AND status IN ('pending_colleague', 'pending_manager'));

-- Triggers for updated_at
CREATE TRIGGER update_shift_swap_requests_updated_at
  BEFORE UPDATE ON public.shift_swap_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();