-- Add payout_status to account_transactions for tracking payouts/deductions
ALTER TABLE public.account_transactions 
ADD COLUMN IF NOT EXISTS payout_status VARCHAR(20) CHECK (payout_status IN ('pending', 'approved', 'exported', 'paid', 'cancelled')),
ADD COLUMN IF NOT EXISTS payout_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update reference_type check constraint to include 'payout' and 'deduction'
ALTER TABLE public.account_transactions 
DROP CONSTRAINT IF EXISTS account_transactions_reference_type_check;

ALTER TABLE public.account_transactions 
ADD CONSTRAINT account_transactions_reference_type_check 
CHECK (reference_type IN ('absence', 'overtime', 'adjustment', 'carryover', 'payout', 'deduction'));