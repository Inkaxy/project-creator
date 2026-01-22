-- Utstyrskategorier
CREATE TABLE equipment_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(10),
  color VARCHAR(7),
  requires_temp_monitoring BOOLEAN DEFAULT false,
  requires_certification BOOLEAN DEFAULT false,
  default_service_interval_days INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Leverandører
CREATE TABLE equipment_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  org_number VARCHAR(20),
  address TEXT,
  phone_main VARCHAR(20),
  phone_service VARCHAR(20),
  phone_emergency VARCHAR(20),
  email VARCHAR(255),
  email_service VARCHAR(255),
  website TEXT,
  contact_name VARCHAR(100),
  contact_phone VARCHAR(20),
  customer_number VARCHAR(50),
  sla_response_hours INTEGER,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Hovedtabell for utstyr
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id),
  department_id UUID REFERENCES departments(id),
  category_id UUID REFERENCES equipment_categories(id),
  supplier_id UUID REFERENCES equipment_suppliers(id),
  responsible_employee_id UUID REFERENCES profiles(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  brand VARCHAR(100),
  model VARCHAR(100),
  serial_number VARCHAR(100),
  qr_code VARCHAR(100) UNIQUE,
  status VARCHAR(50) DEFAULT 'in_operation',
  criticality VARCHAR(20) DEFAULT 'medium',
  purchase_date DATE,
  purchase_price DECIMAL(12,2),
  warranty_months INTEGER,
  warranty_expires DATE,
  ownership_type VARCHAR(20) DEFAULT 'owned',
  lease_monthly_cost DECIMAL(10,2),
  lease_expires DATE,
  expected_lifetime_years INTEGER,
  location_description VARCHAR(255),
  image_url TEXT,
  manual_url TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Serviceintervaller
CREATE TABLE equipment_service_intervals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  interval_type VARCHAR(20) NOT NULL,
  interval_value INTEGER NOT NULL,
  last_performed DATE,
  next_due DATE,
  alert_days_before INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Servicehistorikk
CREATE TABLE equipment_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
  service_interval_id UUID REFERENCES equipment_service_intervals(id),
  service_type VARCHAR(50) NOT NULL,
  performed_by_employee_id UUID REFERENCES profiles(id),
  performed_by_external VARCHAR(255),
  supplier_id UUID REFERENCES equipment_suppliers(id),
  performed_date DATE NOT NULL,
  description TEXT,
  parts_replaced TEXT,
  cost_labor DECIMAL(10,2),
  cost_parts DECIMAL(10,2),
  invoice_number VARCHAR(50),
  next_service_date DATE,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Utstyrsavvik
CREATE TABLE equipment_deviations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES profiles(id) NOT NULL,
  assigned_to UUID REFERENCES profiles(id),
  severity VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(30) DEFAULT 'new',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  images JSONB DEFAULT '[]',
  resolution TEXT,
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  cost DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Vedlikeholdssjekklister
CREATE TABLE equipment_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES equipment_categories(id),
  name VARCHAR(255) NOT NULL,
  frequency VARCHAR(20) NOT NULL,
  items JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sjekklistegjennomføringer
CREATE TABLE equipment_checklist_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID REFERENCES equipment_checklists(id),
  equipment_id UUID REFERENCES equipment(id),
  completed_by UUID REFERENCES profiles(id) NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now(),
  results JSONB NOT NULL,
  deviation_ids UUID[] DEFAULT '{}'
);

-- Opplæring på utstyr
CREATE TABLE equipment_training (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  trained_by UUID REFERENCES profiles(id),
  trained_at DATE NOT NULL,
  expires_at DATE,
  certificate_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(equipment_id, employee_id)
);

-- Utstyrsdokumenter
CREATE TABLE equipment_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  expires_at DATE,
  uploaded_by UUID REFERENCES profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_equipment_category ON equipment(category_id);
CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_equipment_qr ON equipment(qr_code);
CREATE INDEX idx_equipment_department ON equipment(department_id);
CREATE INDEX idx_equipment_location ON equipment(location_id);
CREATE INDEX idx_equipment_deviations_equipment ON equipment_deviations(equipment_id);
CREATE INDEX idx_equipment_deviations_status ON equipment_deviations(status);
CREATE INDEX idx_equipment_services_equipment ON equipment_services(equipment_id);

-- Enable RLS
ALTER TABLE equipment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_service_intervals ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_deviations ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_checklist_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow all authenticated users to read
CREATE POLICY "Allow authenticated read equipment_categories" ON equipment_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read equipment_suppliers" ON equipment_suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read equipment" ON equipment FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read equipment_service_intervals" ON equipment_service_intervals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read equipment_services" ON equipment_services FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read equipment_deviations" ON equipment_deviations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read equipment_checklists" ON equipment_checklists FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read equipment_checklist_completions" ON equipment_checklist_completions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read equipment_training" ON equipment_training FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read equipment_documents" ON equipment_documents FOR SELECT TO authenticated USING (true);

-- RLS Policies - Allow authenticated users to insert/update/delete (managers will be filtered in app logic)
CREATE POLICY "Allow authenticated insert equipment_categories" ON equipment_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update equipment_categories" ON equipment_categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete equipment_categories" ON equipment_categories FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert equipment_suppliers" ON equipment_suppliers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update equipment_suppliers" ON equipment_suppliers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete equipment_suppliers" ON equipment_suppliers FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert equipment" ON equipment FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update equipment" ON equipment FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete equipment" ON equipment FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert equipment_service_intervals" ON equipment_service_intervals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update equipment_service_intervals" ON equipment_service_intervals FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete equipment_service_intervals" ON equipment_service_intervals FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert equipment_services" ON equipment_services FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update equipment_services" ON equipment_services FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete equipment_services" ON equipment_services FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert equipment_deviations" ON equipment_deviations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update equipment_deviations" ON equipment_deviations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete equipment_deviations" ON equipment_deviations FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert equipment_checklists" ON equipment_checklists FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update equipment_checklists" ON equipment_checklists FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete equipment_checklists" ON equipment_checklists FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert equipment_checklist_completions" ON equipment_checklist_completions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update equipment_checklist_completions" ON equipment_checklist_completions FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert equipment_training" ON equipment_training FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update equipment_training" ON equipment_training FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete equipment_training" ON equipment_training FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert equipment_documents" ON equipment_documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update equipment_documents" ON equipment_documents FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete equipment_documents" ON equipment_documents FOR DELETE TO authenticated USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_equipment_updated_at
  BEFORE UPDATE ON equipment
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_equipment_deviations_updated_at
  BEFORE UPDATE ON equipment_deviations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default categories
INSERT INTO equipment_categories (name, icon, color, requires_temp_monitoring, default_service_interval_days) VALUES
  ('Kjøkkenutstyr', '🍳', '#f59e0b', true, 365),
  ('Kjøl og frys', '❄️', '#3b82f6', true, 180),
  ('Ventilasjon', '🌬️', '#6366f1', false, 365),
  ('Kjøretøy', '🚗', '#10b981', false, 365),
  ('Rengjøringsutstyr', '🧹', '#8b5cf6', false, 180),
  ('Sikkerhetsutstyr', '🔒', '#ef4444', false, 365),
  ('IT-utstyr', '💻', '#06b6d4', false, 730),
  ('Annet', '📦', '#6b7280', false, 365);