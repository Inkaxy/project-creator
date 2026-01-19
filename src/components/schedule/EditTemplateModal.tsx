import { useState, useMemo, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useShiftTemplate,
  useUpdateShiftTemplate,
  useAddTemplateShift,
  useUpdateTemplateShift,
  useDeleteTemplateShift,
  TemplateShift,
} from "@/hooks/useShiftTemplates";
import { useFunctions } from "@/hooks/useFunctions";
import { useEmployees } from "@/hooks/useEmployees";
import { Pencil, Plus, Trash2, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
}

const DAY_NAMES = ["Søn", "Man", "Tir", "Ons", "Tor", "Fre", "Lør"];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun

const CATEGORIES = [
  { value: "standard", label: "Standard" },
  { value: "hoysesong", label: "Høysesong" },
  { value: "lavsesong", label: "Lavsesong" },
  { value: "ferie", label: "Ferie" },
  { value: "helg", label: "Helg" },
];

export function EditTemplateModal({ 
  open, 
  onOpenChange, 
  templateId 
}: EditTemplateModalProps) {
  const { data: template, isLoading } = useShiftTemplate(templateId);
  const { data: functions = [] } = useFunctions();
  const { data: employees = [] } = useEmployees();
  
  const updateTemplate = useUpdateShiftTemplate();
  const addShift = useAddTemplateShift();
  const updateShift = useUpdateTemplateShift();
  const deleteShift = useDeleteTemplateShift();

  // Local state for template info
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  // Popover states
  const [editingShift, setEditingShift] = useState<TemplateShift | null>(null);
  const [addingToCell, setAddingToCell] = useState<{
    dayOfWeek: number;
    functionId: string;
  } | null>(null);

  // New shift form state
  const [newShiftStart, setNewShiftStart] = useState("08:00");
  const [newShiftEnd, setNewShiftEnd] = useState("16:00");
  const [newShiftBreak, setNewShiftBreak] = useState(30);
  const [newShiftEmployee, setNewShiftEmployee] = useState<string | null>(null);
  const [newShiftFunction, setNewShiftFunction] = useState<string>("");

  // Initialize form when template loads
  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || "");
      setCategory(template.category || "");
    }
  }, [template]);

  // Group shifts by function and day
  const shiftGrid = useMemo(() => {
    if (!template?.template_shifts) return {};
    
    const grid: Record<string, Record<number, TemplateShift[]>> = {};
    
    // Initialize grid for all functions
    for (const func of functions) {
      grid[func.id] = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    }
    
    // Populate with shifts
    for (const shift of template.template_shifts) {
      if (!grid[shift.function_id]) {
        grid[shift.function_id] = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
      }
      grid[shift.function_id][shift.day_of_week].push(shift);
    }
    
    return grid;
  }, [template, functions]);

  // Calculate totals
  const totals = useMemo(() => {
    if (!template?.template_shifts) return { shifts: 0, hours: 0, cost: 0 };
    
    let totalHours = 0;
    for (const shift of template.template_shifts) {
      const [startH, startM] = shift.start_time.split(":").map(Number);
      const [endH, endM] = shift.end_time.split(":").map(Number);
      let hours = (endH * 60 + endM - startH * 60 - startM) / 60;
      if (hours < 0) hours += 24; // Overnight shift
      hours -= shift.break_minutes / 60;
      totalHours += hours;
    }
    
    return {
      shifts: template.template_shifts.length,
      hours: Math.round(totalHours),
      cost: Math.round(totalHours * 220),
    };
  }, [template]);

  // Save template info
  const handleSaveInfo = async () => {
    if (!template) return;
    await updateTemplate.mutateAsync({
      id: template.id,
      name: name.trim(),
      description: description.trim() || undefined,
      category: category || undefined,
    });
  };

  // Add new shift
  const handleAddShift = async () => {
    if (!addingToCell || !templateId) return;
    
    const functionId = newShiftFunction || addingToCell.functionId;
    
    await addShift.mutateAsync({
      template_id: templateId,
      day_of_week: addingToCell.dayOfWeek,
      function_id: functionId,
      start_time: newShiftStart,
      end_time: newShiftEnd,
      break_minutes: newShiftBreak,
      employee_id: newShiftEmployee,
    });
    
    setAddingToCell(null);
    resetNewShiftForm();
  };

  // Update existing shift
  const handleUpdateShift = async () => {
    if (!editingShift) return;
    
    await updateShift.mutateAsync({
      id: editingShift.id,
      template_id: templateId,
      start_time: newShiftStart,
      end_time: newShiftEnd,
      break_minutes: newShiftBreak,
      employee_id: newShiftEmployee,
    });
    
    setEditingShift(null);
    resetNewShiftForm();
  };

  // Delete shift
  const handleDeleteShift = async () => {
    if (!editingShift) return;
    
    await deleteShift.mutateAsync({
      id: editingShift.id,
      template_id: templateId,
    });
    
    setEditingShift(null);
    resetNewShiftForm();
  };

  // Start editing a shift
  const startEditShift = (shift: TemplateShift) => {
    setEditingShift(shift);
    setNewShiftStart(shift.start_time.slice(0, 5));
    setNewShiftEnd(shift.end_time.slice(0, 5));
    setNewShiftBreak(shift.break_minutes);
    setNewShiftEmployee(shift.employee_id);
  };

  // Reset form
  const resetNewShiftForm = () => {
    setNewShiftStart("08:00");
    setNewShiftEnd("16:00");
    setNewShiftBreak(30);
    setNewShiftEmployee(null);
    setNewShiftFunction("");
  };

  // Get functions that have shifts in the template
  const functionsWithShifts = useMemo(() => {
    return functions.filter(f => 
      shiftGrid[f.id] && 
      Object.values(shiftGrid[f.id]).some(shifts => shifts.length > 0)
    );
  }, [functions, shiftGrid]);

  // Get functions without shifts (for adding new rows)
  const functionsWithoutShifts = useMemo(() => {
    return functions.filter(f => 
      !shiftGrid[f.id] || 
      Object.values(shiftGrid[f.id]).every(shifts => shifts.length === 0)
    );
  }, [functions, shiftGrid]);

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl">
          <div className="flex items-center justify-center py-8">
            Laster mal...
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Rediger mal
          </DialogTitle>
          <DialogDescription>
            Endre navn, legg til eller fjern vakter fra malen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template info */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Navn</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleSaveInfo}
              />
            </div>
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={category || "_none"} onValueChange={(v) => {
                setCategory(v === "_none" ? "" : v);
                setTimeout(handleSaveInfo, 100);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Ingen kategori</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Beskrivelse</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleSaveInfo}
                placeholder="Valgfri beskrivelse"
              />
            </div>
          </div>

          {/* Shift grid */}
          <ScrollArea className="h-[400px] border rounded-lg">
            <div className="min-w-[700px]">
              {/* Header */}
              <div className="grid grid-cols-8 bg-muted/50 border-b sticky top-0 z-10">
                <div className="p-2 font-medium border-r">Funksjon</div>
                {DAY_ORDER.map((dayIndex) => (
                  <div 
                    key={dayIndex} 
                    className={cn(
                      "p-2 text-center text-sm font-medium border-r last:border-r-0",
                      (dayIndex === 0 || dayIndex === 6) && "bg-muted/30"
                    )}
                  >
                    {DAY_NAMES[dayIndex]}
                  </div>
                ))}
              </div>

              {/* Function rows */}
              {functionsWithShifts.map((func) => (
                <div key={func.id} className="grid grid-cols-8 border-b">
                  <div className="p-2 border-r flex items-center gap-2 bg-muted/20">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: func.color || '#6b7280' }}
                    />
                    <span className="text-sm font-medium truncate">{func.name}</span>
                  </div>
                  
                  {DAY_ORDER.map((dayIndex) => {
                    const dayShifts = shiftGrid[func.id]?.[dayIndex] || [];
                    
                    return (
                      <div 
                        key={dayIndex} 
                        className={cn(
                          "p-1 border-r last:border-r-0 min-h-[80px]",
                          (dayIndex === 0 || dayIndex === 6) && "bg-muted/10"
                        )}
                      >
                        {/* Existing shifts */}
                        {dayShifts.map((shift) => (
                          <Popover 
                            key={shift.id}
                            open={editingShift?.id === shift.id}
                            onOpenChange={(openState) => {
                              if (!openState) setEditingShift(null);
                            }}
                          >
                            <PopoverTrigger asChild>
                              <button
                                onClick={() => startEditShift(shift)}
                                className={cn(
                                  "w-full text-left text-xs p-1.5 rounded mb-1",
                                  "bg-primary/10 hover:bg-primary/20 transition-colors",
                                  "border border-primary/20"
                                )}
                              >
                                <div className="font-medium">
                                  {shift.start_time.slice(0, 5)}-{shift.end_time.slice(0, 5)}
                                </div>
                                {shift.profiles?.full_name && (
                                  <div className="text-xs opacity-70 truncate">
                                    {shift.profiles.full_name}
                                  </div>
                                )}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64" align="start">
                              <div className="space-y-3">
                                <h4 className="font-medium">Rediger vakt</h4>
                                
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <Label className="text-xs">Start</Label>
                                    <Input
                                      type="time"
                                      value={newShiftStart}
                                      onChange={(e) => setNewShiftStart(e.target.value)}
                                      className="h-8"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Slutt</Label>
                                    <Input
                                      type="time"
                                      value={newShiftEnd}
                                      onChange={(e) => setNewShiftEnd(e.target.value)}
                                      className="h-8"
                                    />
                                  </div>
                                </div>
                                
                                <div className="space-y-1">
                                  <Label className="text-xs">Pause (min)</Label>
                                  <Select
                                    value={String(newShiftBreak)}
                                    onValueChange={(v) => setNewShiftBreak(Number(v))}
                                  >
                                    <SelectTrigger className="h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="0">Ingen</SelectItem>
                                      <SelectItem value="15">15 min</SelectItem>
                                      <SelectItem value="30">30 min</SelectItem>
                                      <SelectItem value="45">45 min</SelectItem>
                                      <SelectItem value="60">60 min</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div className="space-y-1">
                                  <Label className="text-xs">Ansatt (valgfritt)</Label>
                                  <Select
                                    value={newShiftEmployee || "_none"}
                                    onValueChange={(v) => setNewShiftEmployee(v === "_none" ? null : v)}
                                  >
                                    <SelectTrigger className="h-8">
                                      <SelectValue placeholder="Ikke tildelt" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="_none">Ikke tildelt</SelectItem>
                                      {employees.map((emp) => (
                                        <SelectItem key={emp.id} value={emp.id}>
                                          {emp.full_name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div className="flex gap-2 pt-2">
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleDeleteShift}
                                    disabled={deleteShift.isPending}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingShift(null)}
                                    className="flex-1"
                                  >
                                    Avbryt
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={handleUpdateShift}
                                    disabled={updateShift.isPending}
                                    className="flex-1"
                                  >
                                    Lagre
                                  </Button>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        ))}
                        
                        {/* Add button */}
                        <Popover
                          open={addingToCell?.dayOfWeek === dayIndex && addingToCell?.functionId === func.id}
                          onOpenChange={(openState) => {
                            if (!openState) setAddingToCell(null);
                          }}
                        >
                          <PopoverTrigger asChild>
                            <button
                              onClick={() => {
                                setAddingToCell({ dayOfWeek: dayIndex, functionId: func.id });
                                setNewShiftFunction(func.id);
                                resetNewShiftForm();
                              }}
                              className={cn(
                                "w-full p-1 rounded border border-dashed border-muted-foreground/30",
                                "hover:border-primary/50 hover:bg-primary/5 transition-colors",
                                "flex items-center justify-center"
                              )}
                            >
                              <Plus className="h-3 w-3 text-muted-foreground" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64" align="start">
                            <div className="space-y-3">
                              <h4 className="font-medium">
                                Ny vakt - {DAY_NAMES[dayIndex]}
                              </h4>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-xs">Start</Label>
                                  <Input
                                    type="time"
                                    value={newShiftStart}
                                    onChange={(e) => setNewShiftStart(e.target.value)}
                                    className="h-8"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Slutt</Label>
                                  <Input
                                    type="time"
                                    value={newShiftEnd}
                                    onChange={(e) => setNewShiftEnd(e.target.value)}
                                    className="h-8"
                                  />
                                </div>
                              </div>
                              
                              <div className="space-y-1">
                                <Label className="text-xs">Pause</Label>
                                <Select
                                  value={String(newShiftBreak)}
                                  onValueChange={(v) => setNewShiftBreak(Number(v))}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="0">Ingen</SelectItem>
                                    <SelectItem value="15">15 min</SelectItem>
                                    <SelectItem value="30">30 min</SelectItem>
                                    <SelectItem value="45">45 min</SelectItem>
                                    <SelectItem value="60">60 min</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="space-y-1">
                                <Label className="text-xs">Ansatt (valgfritt)</Label>
                                <Select
                                  value={newShiftEmployee || "_none"}
                                  onValueChange={(v) => setNewShiftEmployee(v === "_none" ? null : v)}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Ikke tildelt" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="_none">Ikke tildelt</SelectItem>
                                    {employees.map((emp) => (
                                      <SelectItem key={emp.id} value={emp.id}>
                                        {emp.full_name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="flex gap-2 pt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setAddingToCell(null)}
                                  className="flex-1"
                                >
                                  Avbryt
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={handleAddShift}
                                  disabled={addShift.isPending}
                                  className="flex-1"
                                >
                                  Legg til
                                </Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Empty state / Add new function row */}
              {functionsWithoutShifts.length > 0 && (
                <div className="p-4 text-center border-b">
                  <p className="text-sm text-muted-foreground mb-2">
                    Legg til vakter for flere funksjoner:
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {functionsWithoutShifts.slice(0, 5).map((func) => (
                      <Button
                        key={func.id}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAddingToCell({ dayOfWeek: 1, functionId: func.id });
                          setNewShiftFunction(func.id);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {func.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Totals */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{totals.shifts}</div>
                <div className="text-xs text-muted-foreground">Vakter</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{totals.hours}t</div>
                <div className="text-xs text-muted-foreground">Timer</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {totals.cost.toLocaleString("nb-NO")} kr
                </div>
                <div className="text-xs text-muted-foreground">Est. kostnad/uke</div>
              </div>
            </div>
            
            {template?.is_default && (
              <Badge variant="secondary">
                <Star className="h-3 w-3 mr-1" />
                Standard mal
              </Badge>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Lukk
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
