-- Create storage bucket for equipment documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('equipment-documents', 'equipment-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for equipment-documents bucket
CREATE POLICY "Anyone can view equipment documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'equipment-documents');

CREATE POLICY "Authenticated users can upload equipment documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'equipment-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete equipment documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'equipment-documents' AND auth.uid() IS NOT NULL);

-- Add department_id to equipment_categories for category-department association
ALTER TABLE equipment_categories 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;

-- Add description column to equipment_categories
ALTER TABLE equipment_categories 
ADD COLUMN IF NOT EXISTS description TEXT;