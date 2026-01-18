-- Create absence_types table
CREATE TABLE public.absence_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  affects_salary BOOLEAN DEFAULT false,
  requires_documentation BOOLEAN DEFAULT false,
  from_account VARCHAR(20), -- 'vacation', 'time_bank', 'night_bank', null
  color VARCHAR(7) DEFAULT '#6B7280',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create absence_requests table
CREATE TABLE public.absence_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  absence_type_id UUID NOT NULL REFERENCES public.absence_types(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days DECIMAL(4,1) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  overlapping_shift_action VARCHAR(20) CHECK (overlapping_shift_action IN ('keep', 'delete', 'open')),
  comment TEXT,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create employee_accounts table
CREATE TABLE public.employee_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('vacation', 'time_bank', 'night_bank')),
  year INTEGER NOT NULL,
  balance DECIMAL(8,2) DEFAULT 0,
  used DECIMAL(8,2) DEFAULT 0,
  carried_over DECIMAL(8,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, account_type, year)
);

-- Create account_transactions table
CREATE TABLE public.account_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.employee_accounts(id) ON DELETE CASCADE,
  amount DECIMAL(8,2) NOT NULL,
  description TEXT,
  reference_type VARCHAR(30) CHECK (reference_type IN ('absence', 'overtime', 'adjustment', 'carryover')),
  reference_id UUID,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.absence_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absence_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_transactions ENABLE ROW LEVEL SECURITY;

-- RLS for absence_types (everyone can read, only admins can modify)
CREATE POLICY "Anyone can view active absence types"
  ON public.absence_types FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage absence types"
  ON public.absence_types FOR ALL
  USING (public.is_admin_or_manager(auth.uid()));

-- RLS for absence_requests
CREATE POLICY "Users can view their own absence requests"
  ON public.absence_requests FOR SELECT
  USING (auth.uid() = employee_id);

CREATE POLICY "Managers can view all absence requests in their department"
  ON public.absence_requests FOR SELECT
  USING (
    public.is_admin_or_manager(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = absence_requests.employee_id
      AND p.department_id = public.get_user_department_id(auth.uid())
    )
  );

CREATE POLICY "Users can create their own absence requests"
  ON public.absence_requests FOR INSERT
  WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "Users can update their own pending requests"
  ON public.absence_requests FOR UPDATE
  USING (auth.uid() = employee_id AND status = 'pending');

CREATE POLICY "Managers can update absence requests"
  ON public.absence_requests FOR UPDATE
  USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Users can delete their own pending requests"
  ON public.absence_requests FOR DELETE
  USING (auth.uid() = employee_id AND status = 'pending');

-- RLS for employee_accounts
CREATE POLICY "Users can view their own accounts"
  ON public.employee_accounts FOR SELECT
  USING (auth.uid() = employee_id);

CREATE POLICY "Managers can view all accounts"
  ON public.employee_accounts FOR SELECT
  USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Managers can manage accounts"
  ON public.employee_accounts FOR ALL
  USING (public.is_admin_or_manager(auth.uid()));

-- RLS for account_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.account_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.employee_accounts ea
      WHERE ea.id = account_transactions.account_id
      AND ea.employee_id = auth.uid()
    )
  );

CREATE POLICY "Managers can view all transactions"
  ON public.account_transactions FOR SELECT
  USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Managers can create transactions"
  ON public.account_transactions FOR INSERT
  WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_absence_requests_employee ON public.absence_requests(employee_id);
CREATE INDEX idx_absence_requests_status ON public.absence_requests(status);
CREATE INDEX idx_absence_requests_dates ON public.absence_requests(start_date, end_date);
CREATE INDEX idx_employee_accounts_employee_year ON public.employee_accounts(employee_id, year);
CREATE INDEX idx_account_transactions_account ON public.account_transactions(account_id);

-- Create updated_at triggers
CREATE TRIGGER update_absence_types_updated_at
  BEFORE UPDATE ON public.absence_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_absence_requests_updated_at
  BEFORE UPDATE ON public.absence_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_accounts_updated_at
  BEFORE UPDATE ON public.employee_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default absence types
INSERT INTO public.absence_types (name, affects_salary, requires_documentation, from_account, color) VALUES
  ('Ferie', false, false, 'vacation', '#10B981'),
  ('Avspasering', false, false, 'time_bank', '#3B82F6'),
  ('Natt-avspasering', false, false, 'night_bank', '#8B5CF6'),
  ('Egenmelding', true, false, NULL, '#F59E0B'),
  ('Sykmeldt', true, true, NULL, '#EF4444'),
  ('Permisjon med lønn', false, true, NULL, '#EC4899'),
  ('Permisjon uten lønn', true, true, NULL, '#6B7280');