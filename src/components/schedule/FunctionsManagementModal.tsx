import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useAllFunctions,
  useCreateFunction,
  useUpdateFunction,
  useDeleteFunction,
  FunctionData,
} from "@/hooks/useFunctions";
import { useDepartments } from "@/hooks/useEmployees";
import { Edit2, GripVertical, Plus, Trash2, X } from "lucide-react";

interface FunctionsManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_OPTIONS = [
  { value: "Produksjon", label: "Produksjon" },
  { value: "Butikk", label: "Butikk" },
  { value: "Kontor", label: "Kontor" },
  { value: "Lager", label: "Lager" },
];

const COLOR_OPTIONS = [
  { value: "#EF4444", label: "Rød" },
  { value: "#F97316", label: "Oransje" },
  { value: "#EAB308", label: "Gul" },
  { value: "#22C55E", label: "Grønn" },
  { value: "#3B82F6", label: "Blå" },
  { value: "#8B5CF6", label: "Lilla" },
  { value: "#EC4899", label: "Rosa" },
];

export function FunctionsManagementModal({
  open,
  onOpenChange,
}: FunctionsManagementModalProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingFunction, setEditingFunction] = useState<FunctionData | null>(null);

  const { data: functions, isLoading } = useAllFunctions();
  const { data: departments } = useDepartments();
  const createFunction = useCreateFunction();
  const updateFunction = useUpdateFunction();
  const deleteFunction = useDeleteFunction();

  // Form state
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [category, setCategory] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [icon, setIcon] = useState("");
  const [defaultStart, setDefaultStart] = useState("07:00");
  const [defaultEnd, setDefaultEnd] = useState("15:00");
  const [breakMinutes, setBreakMinutes] = useState(30);
  const [minStaff, setMinStaff] = useState(1);
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    setName("");
    setShortName("");
    setCategory("");
    setDepartmentId("");
    setColor("#3B82F6");
    setIcon("");
    setDefaultStart("07:00");
    setDefaultEnd("15:00");
    setBreakMinutes(30);
    setMinStaff(1);
    setIsActive(true);
    setEditingFunction(null);
    setShowForm(false);
  };

  const startEditing = (func: FunctionData) => {
    setEditingFunction(func);
    setName(func.name);
    setShortName(func.short_name || "");
    setCategory(func.category || "");
    setDepartmentId(func.department_id || "");
    setColor(func.color || "#3B82F6");
    setIcon(func.icon || "");
    setDefaultStart(func.default_start?.slice(0, 5) || "07:00");
    setDefaultEnd(func.default_end?.slice(0, 5) || "15:00");
    setBreakMinutes(func.default_break_minutes || 30);
    setMinStaff(func.min_staff || 1);
    setIsActive(func.is_active !== false);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!name) return;

    const data = {
      name,
      short_name: shortName || undefined,
      category: category || undefined,
      department_id: departmentId || undefined,
      color,
      icon: icon || undefined,
      default_start: defaultStart,
      default_end: defaultEnd,
      default_break_minutes: breakMinutes,
      min_staff: minStaff,
      is_active: isActive,
    };

    if (editingFunction) {
      await updateFunction.mutateAsync({ id: editingFunction.id, ...data });
    } else {
      await createFunction.mutateAsync(data);
    }

    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Er du sikker på at du vil slette denne funksjonen?")) {
      await deleteFunction.mutateAsync(id);
    }
  };

  // Group functions by category
  const groupedFunctions = functions?.reduce((acc, func) => {
    const cat = func.category || "Uten kategori";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(func);
    return acc;
  }, {} as Record<string, FunctionData[]>) || {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Behandle Funksjoner</DialogTitle>
        </DialogHeader>

        {showForm ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">
                {editingFunction ? "Rediger funksjon" : "Ny funksjon"}
              </h3>
              <Button variant="ghost" size="icon" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Navn *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="f.eks. Stek Natt"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortName">Kortnavn</Label>
                <Input
                  id="shortName"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  placeholder="f.eks. Stek"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Avdeling</Label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg avdeling" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments?.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Farge</Label>
                <Select value={color} onValueChange={setColor}>
                  <SelectTrigger>
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-4 w-4 rounded"
                          style={{ backgroundColor: color }}
                        />
                        <span>
                          {COLOR_OPTIONS.find((c) => c.value === color)?.label || "Velg farge"}
                        </span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-4 w-4 rounded"
                            style={{ backgroundColor: opt.value }}
                          />
                          <span>{opt.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Ikon (emoji)</Label>
                <Input
                  id="icon"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="f.eks. 🍞"
                  maxLength={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultStart">Standard start</Label>
                <Input
                  id="defaultStart"
                  type="time"
                  value={defaultStart}
                  onChange={(e) => setDefaultStart(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultEnd">Standard slutt</Label>
                <Input
                  id="defaultEnd"
                  type="time"
                  value={defaultEnd}
                  onChange={(e) => setDefaultEnd(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="breakMinutes">Standard pause (min)</Label>
                <Input
                  id="breakMinutes"
                  type="number"
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(parseInt(e.target.value) || 0)}
                  min={0}
                  max={120}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minStaff">Min. bemanning</Label>
                <Input
                  id="minStaff"
                  type="number"
                  value={minStaff}
                  onChange={(e) => setMinStaff(parseInt(e.target.value) || 1)}
                  min={1}
                  max={20}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="isActive">Aktiv</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={resetForm}>
                Avbryt
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!name || createFunction.isPending || updateFunction.isPending}
              >
                {editingFunction ? "Lagre endringer" : "Opprett funksjon"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between">
              <p className="text-sm text-muted-foreground">
                {functions?.length || 0} funksjoner
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Ny funksjon
              </Button>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              {isLoading ? (
                <p className="text-center text-muted-foreground">Laster...</p>
              ) : Object.keys(groupedFunctions).length === 0 ? (
                <p className="text-center text-muted-foreground">
                  Ingen funksjoner ennå. Klikk "Ny funksjon" for å opprette.
                </p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedFunctions).map(([category, funcs]) => (
                    <div key={category}>
                      <h4 className="mb-2 text-sm font-semibold text-muted-foreground">
                        {category}
                      </h4>
                      <div className="space-y-2">
                        {funcs.map((func) => (
                          <div
                            key={func.id}
                            className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                          >
                            <GripVertical className="h-4 w-4 cursor-move text-muted-foreground" />
                            <div
                              className="h-4 w-4 rounded"
                              style={{ backgroundColor: func.color || "#3B82F6" }}
                            />
                            {func.icon && (
                              <span className="text-lg">{func.icon}</span>
                            )}
                            <div className="flex-1">
                              <p className="font-medium">{func.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {func.default_start?.slice(0, 5)} - {func.default_end?.slice(0, 5)}
                                {func.departments?.name && ` • ${func.departments.name}`}
                              </p>
                            </div>
                            {!func.is_active && (
                              <Badge variant="secondary">Inaktiv</Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startEditing(func)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(func.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
