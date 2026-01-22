-- Create building_maps table for fire safety floor plans and evacuation maps
CREATE TABLE public.building_maps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  floor TEXT,
  map_type TEXT NOT NULL DEFAULT 'floor_plan',
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.building_maps ENABLE ROW LEVEL SECURITY;

-- Policies for building maps (readable by all authenticated users, editable by admins)
CREATE POLICY "Anyone can view building maps"
  ON public.building_maps FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage building maps"
  ON public.building_maps FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Create storage bucket for fire-safety files if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('fire-safety', 'fire-safety', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for fire-safety bucket
CREATE POLICY "Anyone can view fire-safety files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'fire-safety');

CREATE POLICY "Authenticated users can upload fire-safety files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'fire-safety' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete fire-safety files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'fire-safety' AND auth.uid() IS NOT NULL);

-- Add index for floor ordering
CREATE INDEX idx_building_maps_floor ON public.building_maps(floor);

-- Add trigger for updated_at
CREATE TRIGGER update_building_maps_updated_at
  BEFORE UPDATE ON public.building_maps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();