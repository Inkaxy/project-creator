-- Insert Faglært Bakeri/Konditori lønnsstige
INSERT INTO public.wage_ladders (id, name, description, competence_level, is_active)
VALUES (
  'a1111111-1111-1111-1111-111111111111',
  'Faglært Bakeri/Konditori',
  'Lønnsstige for faglærte bakere og konditorer iht. tariffavtale. *Nivå 5-7 krever ansiennitet opptjent i bedriften.',
  'faglaert',
  true
)
ON CONFLICT (id) DO NOTHING;

-- Insert Faglært nivåer (år konvertert til timer: 1 år = 1950 timer)
INSERT INTO public.wage_ladder_levels (ladder_id, level, min_hours, max_hours, hourly_rate) VALUES
  ('a1111111-1111-1111-1111-111111111111', 1, 0, 1949, 238.46),
  ('a1111111-1111-1111-1111-111111111111', 2, 1950, 5849, 241.46),
  ('a1111111-1111-1111-1111-111111111111', 3, 5850, 11699, 245.96),
  ('a1111111-1111-1111-1111-111111111111', 4, 11700, 19499, 250.46),
  ('a1111111-1111-1111-1111-111111111111', 5, 19500, 29249, 254.96),
  ('a1111111-1111-1111-1111-111111111111', 6, 29250, 38999, 255.96),
  ('a1111111-1111-1111-1111-111111111111', 7, 39000, NULL, 259.66)
ON CONFLICT (ladder_id, level) DO UPDATE SET
  min_hours = EXCLUDED.min_hours,
  max_hours = EXCLUDED.max_hours,
  hourly_rate = EXCLUDED.hourly_rate;

-- Insert Ufaglært Bakeri/Konditori lønnsstige
INSERT INTO public.wage_ladders (id, name, description, competence_level, is_active)
VALUES (
  'a2222222-2222-2222-2222-222222222222',
  'Ufaglært Bakeri/Konditori',
  'Lønnsstige for ufaglærte i bakeri, konditori, pakking og distribusjon iht. tariffavtale.',
  'ufaglaert',
  true
)
ON CONFLICT (id) DO NOTHING;

-- Insert Ufaglært nivåer
INSERT INTO public.wage_ladder_levels (ladder_id, level, min_hours, max_hours, hourly_rate) VALUES
  ('a2222222-2222-2222-2222-222222222222', 1, 0, 1949, 225.96),
  ('a2222222-2222-2222-2222-222222222222', 2, 1950, 5849, 228.96),
  ('a2222222-2222-2222-2222-222222222222', 3, 5850, 11699, 233.46),
  ('a2222222-2222-2222-2222-222222222222', 4, 11700, 19499, 237.96),
  ('a2222222-2222-2222-2222-222222222222', 5, 19500, 29249, 242.46),
  ('a2222222-2222-2222-2222-222222222222', 6, 29250, 38999, 243.46),
  ('a2222222-2222-2222-2222-222222222222', 7, 39000, NULL, 247.16)
ON CONFLICT (ladder_id, level) DO UPDATE SET
  min_hours = EXCLUDED.min_hours,
  max_hours = EXCLUDED.max_hours,
  hourly_rate = EXCLUDED.hourly_rate;

-- Insert Lærling lønnsstige (unge arbeidere med aldersbasert lønn)
INSERT INTO public.wage_ladders (id, name, description, competence_level, is_active)
VALUES (
  'a3333333-3333-3333-3333-333333333333',
  'Unge Arbeidere',
  'Aldersbasert lønn for arbeidere under 18 år.',
  'laerling',
  true
)
ON CONFLICT (id) DO NOTHING;

-- Insert Unge arbeidere nivåer (bruker level som alder-indikator)
INSERT INTO public.wage_ladder_levels (ladder_id, level, min_hours, max_hours, hourly_rate) VALUES
  ('a3333333-3333-3333-3333-333333333333', 1, 0, NULL, 161.50),      -- 16 år
  ('a3333333-3333-3333-3333-333333333333', 2, 0, NULL, 171.50),      -- 17 år  
  ('a3333333-3333-3333-3333-333333333333', 3, 0, NULL, 181.50)       -- 18 år
ON CONFLICT (ladder_id, level) DO UPDATE SET
  hourly_rate = EXCLUDED.hourly_rate;