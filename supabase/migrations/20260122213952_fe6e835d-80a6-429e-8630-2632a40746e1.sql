-- Add weather display setting to timesheet_settings
ALTER TABLE public.timesheet_settings
ADD COLUMN IF NOT EXISTS show_weather_forecast BOOLEAN DEFAULT true;