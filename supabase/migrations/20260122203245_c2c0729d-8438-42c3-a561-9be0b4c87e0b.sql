-- Create auto_approvals_log table for tracking auto-approved time entries
CREATE TABLE public.auto_approvals_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_entry_id UUID NOT NULL REFERENCES public.time_entries(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  approver_id UUID,
  deviation_minutes INTEGER NOT NULL DEFAULT 0,
  auto_approved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  summary_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for efficient querying of unsent summaries
CREATE INDEX idx_auto_approvals_log_summary_sent ON public.auto_approvals_log(summary_sent, auto_approved_at);
CREATE INDEX idx_auto_approvals_log_employee ON public.auto_approvals_log(employee_id);
CREATE INDEX idx_auto_approvals_log_time_entry ON public.auto_approvals_log(time_entry_id);

-- Enable RLS
ALTER TABLE public.auto_approvals_log ENABLE ROW LEVEL SECURITY;

-- Policy: Admins and managers can view all logs
CREATE POLICY "Admins and managers can view auto approval logs"
ON public.auto_approvals_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('superadmin', 'daglig_leder', 'avdelingsleder')
  )
);

-- Policy: Managers can insert auto approval logs
CREATE POLICY "Managers can insert auto approval logs"
ON public.auto_approvals_log
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('superadmin', 'daglig_leder', 'avdelingsleder')
  )
);

-- Policy: Managers can update auto approval logs
CREATE POLICY "Managers can update auto approval logs"
ON public.auto_approvals_log
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('superadmin', 'daglig_leder', 'avdelingsleder')
  )
);