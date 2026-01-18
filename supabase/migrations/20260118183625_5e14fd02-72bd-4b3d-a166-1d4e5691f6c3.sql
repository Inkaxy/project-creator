-- Add effective_from to wage_ladder_levels
ALTER TABLE wage_ladder_levels 
ADD COLUMN effective_from DATE DEFAULT CURRENT_DATE;

-- Create wage_ladder_history table for tracking rate changes
CREATE TABLE wage_ladder_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ladder_id UUID NOT NULL REFERENCES wage_ladders(id) ON DELETE CASCADE,
  level INTEGER NOT NULL,
  old_hourly_rate NUMERIC(10,2),
  new_hourly_rate NUMERIC(10,2) NOT NULL,
  effective_from DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

-- Create wage_adjustments table for back-pay calculations
CREATE TABLE wage_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Calculation details
  total_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  old_rate NUMERIC(10,2) NOT NULL,
  new_rate NUMERIC(10,2) NOT NULL,
  difference_per_hour NUMERIC(10,2) NOT NULL,
  total_adjustment NUMERIC(10,2) NOT NULL,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'exported', 'paid', 'rejected')),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  
  -- Reference to the change that triggered this
  ladder_history_id UUID REFERENCES wage_ladder_history(id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE wage_ladder_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE wage_adjustments ENABLE ROW LEVEL SECURITY;

-- RLS policies for wage_ladder_history (admin/manager only)
CREATE POLICY "Admins and managers can view wage ladder history"
ON wage_ladder_history FOR SELECT
USING (is_admin_or_manager(auth.uid()));

CREATE POLICY "Admins and managers can insert wage ladder history"
ON wage_ladder_history FOR INSERT
WITH CHECK (is_admin_or_manager(auth.uid()));

-- RLS policies for wage_adjustments
CREATE POLICY "Admins and managers can view all wage adjustments"
ON wage_adjustments FOR SELECT
USING (is_admin_or_manager(auth.uid()));

CREATE POLICY "Employees can view own wage adjustments"
ON wage_adjustments FOR SELECT
USING (auth.uid() = employee_id);

CREATE POLICY "Admins and managers can insert wage adjustments"
ON wage_adjustments FOR INSERT
WITH CHECK (is_admin_or_manager(auth.uid()));

CREATE POLICY "Admins and managers can update wage adjustments"
ON wage_adjustments FOR UPDATE
USING (is_admin_or_manager(auth.uid()));

-- Trigger for updated_at on wage_adjustments
CREATE TRIGGER update_wage_adjustments_updated_at
BEFORE UPDATE ON wage_adjustments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();