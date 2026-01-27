import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, MapPin, Video, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { LocationType } from '@/types/conversations';

interface ScheduleStepProps {
  scheduledDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  scheduledTime: string;
  onTimeChange: (time: string) => void;
  duration: number;
  onDurationChange: (duration: number) => void;
  locationType: LocationType;
  onLocationTypeChange: (type: LocationType) => void;
  location: string;
  onLocationChange: (location: string) => void;
}

const timeSlots = Array.from({ length: 36 }, (_, i) => {
  const hour = Math.floor(i / 4) + 7;
  const minute = (i % 4) * 15;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});

const durationOptions = [
  { value: 30, label: '30 minutter' },
  { value: 45, label: '45 minutter' },
  { value: 60, label: '1 time' },
  { value: 90, label: '1,5 time' },
];

export function ScheduleStep({
  scheduledDate,
  onDateChange,
  scheduledTime,
  onTimeChange,
  duration,
  onDurationChange,
  locationType,
  onLocationTypeChange,
  location,
  onLocationChange,
}: ScheduleStepProps) {
  return (
    <div className="space-y-6">
      {/* Date */}
      <div className="space-y-2">
        <Label>Dato</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !scheduledDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {scheduledDate ? format(scheduledDate, 'PPP', { locale: nb }) : 'Velg dato'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={scheduledDate}
              onSelect={onDateChange}
              disabled={(date) => date < new Date()}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Time */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Tidspunkt</Label>
          <Select value={scheduledTime} onValueChange={onTimeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeSlots.map(time => (
                <SelectItem key={time} value={time}>{time}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Varighet</Label>
          <Select value={duration.toString()} onValueChange={(v) => onDurationChange(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {durationOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value.toString()}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Location Type */}
      <div className="space-y-3">
        <Label>Type møte</Label>
        <RadioGroup
          value={locationType}
          onValueChange={(v) => onLocationTypeChange(v as LocationType)}
          className="grid grid-cols-3 gap-4"
        >
          <div>
            <RadioGroupItem value="in_person" id="in_person" className="peer sr-only" />
            <label
              htmlFor="in_person"
              className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-muted p-4 transition-colors hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
            >
              <MapPin className="h-6 w-6" />
              <span className="text-sm font-medium">Fysisk</span>
            </label>
          </div>
          <div>
            <RadioGroupItem value="video" id="video" className="peer sr-only" />
            <label
              htmlFor="video"
              className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-muted p-4 transition-colors hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
            >
              <Video className="h-6 w-6" />
              <span className="text-sm font-medium">Video</span>
            </label>
          </div>
          <div>
            <RadioGroupItem value="phone" id="phone" className="peer sr-only" />
            <label
              htmlFor="phone"
              className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-muted p-4 transition-colors hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
            >
              <Phone className="h-6 w-6" />
              <span className="text-sm font-medium">Telefon</span>
            </label>
          </div>
        </RadioGroup>
      </div>

      {/* Location Details */}
      <div className="space-y-2">
        <Label>
          {locationType === 'in_person' ? 'Møterom' : 
           locationType === 'video' ? 'Møtelenke' : 'Telefonnummer'}
        </Label>
        <Input
          placeholder={
            locationType === 'in_person' ? 'F.eks. Møterom 1' :
            locationType === 'video' ? 'F.eks. https://meet.google.com/...' :
            'F.eks. +47 123 45 678'
          }
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
        />
      </div>
    </div>
  );
}
