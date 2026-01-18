import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, addDays, getDay } from "date-fns";
import { nb } from "date-fns/locale";
import { useSaveCurrentWeekAsTemplate } from "@/hooks/useShiftTemplates";
import { ShiftData } from "@/hooks/useShifts";
import { Save } from "lucide-react";

interface SaveTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentWeekDate: Date;
  shifts: ShiftData[];
}

const CATEGORIES = [
  { value: "standard", label: "Standard" },
  { value: "hoysesong", label: "Høysesong" },
  { value: "lavsesong", label: "Lavsesong" },
  { value: "ferie", label: "Ferie" },
  { value: "helg", label: "Helg" },
];

const DAY_NAMES = ["Søn", "Man", "Tir", "Ons", "Tor", "Fre", "Lør"];

export function SaveTemplateModal({
  open,
  onOpenChange,
  currentWeekDate,
  shifts,
}: SaveTemplateModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [isDefault, setIsDefault] = useState(false);
  const [includeEmployees, setIncludeEmployees] = useState(false);

  const saveTemplate = useSaveCurrentWeekAsTemplate();

  const weekStart = startOfWeek(currentWeekDate, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);

  // Group shifts by day of week
  const shiftsByDay = shifts.reduce((acc, shift) => {
    const dayOfWeek = getDay(new Date(shift.date));
    if (!acc[dayOfWeek]) acc[dayOfWeek] = [];
    acc[dayOfWeek].push(shift);
    return acc;
  }, {} as Record<number, ShiftData[]>);

  // Order days starting from Monday (1)
  const orderedDays = [1, 2, 3, 4, 5, 6, 0];

  const handleSave = async () => {
    if (!name.trim()) return;

    await saveTemplate.mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
      category: category || undefined,
      is_default: isDefault,
      weekStartDate: currentWeekDate,
      includeEmployees,
    });

    onOpenChange(false);
    setName("");
    setDescription("");
    setCategory("");
    setIsDefault(false);
    setIncludeEmployees(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Lagre uke som mal
          </DialogTitle>
          <DialogDescription>
            Lagre vaktene fra uke {format(weekStart, "w", { locale: nb })} (
            {format(weekStart, "d. MMM", { locale: nb })} -{" "}
            {format(weekEnd, "d. MMM yyyy", { locale: nb })}) som en
            gjenbrukbar mal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Malnavn *</Label>
            <Input
              id="name"
              placeholder="F.eks. Standard uke"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              placeholder="Valgfri beskrivelse av malen..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategori</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Velg kategori (valgfritt)" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isDefault"
              checked={isDefault}
              onCheckedChange={(checked) => setIsDefault(checked === true)}
            />
            <Label htmlFor="isDefault" className="font-normal">
              Sett som standardmal
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeEmployees"
              checked={includeEmployees}
              onCheckedChange={(checked) =>
                setIncludeEmployees(checked === true)
              }
            />
            <Label htmlFor="includeEmployees" className="font-normal">
              Inkluder ansatt-tildelinger
            </Label>
          </div>

          {/* Preview of shifts per day */}
          <div className="space-y-2">
            <Label>Forhåndsvisning</Label>
            <div className="rounded-md border bg-muted/30 p-3">
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {orderedDays.map((day) => {
                  const dayShifts = shiftsByDay[day] || [];
                  return (
                    <div key={day} className="space-y-1">
                      <div className="font-medium">{DAY_NAMES[day]}</div>
                      <Badge
                        variant={dayShifts.length > 0 ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {dayShifts.length}
                      </Badge>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 text-center text-sm text-muted-foreground">
                Totalt {shifts.length} vakter
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || shifts.length === 0 || saveTemplate.isPending}
          >
            {saveTemplate.isPending ? "Lagrer..." : "Lagre mal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
