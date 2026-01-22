-- Create storage bucket for training content (videos, images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('training-content', 'training-content', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for training-content bucket
CREATE POLICY "Anyone can view training content"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'training-content');

CREATE POLICY "Authenticated users can upload training content"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'training-content' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update training content"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'training-content' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete training content"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'training-content' AND auth.uid() IS NOT NULL);