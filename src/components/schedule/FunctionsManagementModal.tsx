import { useState, useCallback } from "react";
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
import { useUpdateFunctionOrder } from "@/hooks/useUpdateFunctionOrder";
import { useDepartments } from "@/hooks/useEmployees";
import { Edit2, GripVertical, Plus, Trash2, X, Building2 } from "lucide-react";

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
  { value: "#DC2626", label: "Mørk rød" },
  { value: "#EF4444", label: "Rød" },
  { value: "#F97316", label: "Oransje" },
  { value: "#EAB308", label: "Gul" },
  { value: "#22C55E", label: "Grønn" },
  { value: "#10B981", label: "Smaragd" },
  { value: "#06B6D4", label: "Cyan" },
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
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const { data: functions, isLoading } = useAllFunctions();
  const { data: departments } = useDepartments();
  const createFunction = useCreateFunction();
  const updateFunction = useUpdateFunction();
  const deleteFunction = useDeleteFunction();
  const updateFunctionOrder = useUpdateFunctionOrder();

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
  const [maxStaff, setMaxStaff] = useState(5);
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
    setMaxStaff(5);
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
    setMaxStaff(func.max_staff || 5);
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
      max_staff: maxStaff,
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

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetId: string, departmentId: string | null) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId || !functions) return;

    // Get functions in the same department
    const deptFunctions = functions.filter(f => f.department_id === departmentId);
    const draggedIndex = deptFunctions.findIndex(f => f.id === draggedId);
    const targetIndex = deptFunctions.findIndex(f => f.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Create new order
    const reordered = [...deptFunctions];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    // Update sort_order for all items
    const updates = reordered.map((func, index) => ({
      id: func.id,
      sort_order: index,
    }));

    updateFunctionOrder.mutate(updates);
    setDraggedId(null);
  }, [draggedId, functions, updateFunctionOrder]);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
  }, []);

  // Group functions by department
  const groupedByDepartment = functions?.reduce((acc, func) => {
    const deptId = func.department_id || "no-department";
    const deptName = func.departments?.name || "Uten avdeling";
    if (!acc[deptId]) {
      acc[deptId] = { name: deptName, functions: [], color: func.departments?.name ? (departments?.find(d => d.id === func.department_id)?.color || "#6B7280") : "#6B7280" };
    }
    acc[deptId].functions.push(func);
    return acc;
  }, {} as Record<string, { name: string; functions: FunctionData[]; color: string }>) || {};

  // Sort functions within each department by sort_order
  Object.values(groupedByDepartment).forEach(group => {
    group.functions.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  });

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
                <Label htmlFor="department">Avdeling *</Label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg avdeling" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {departments?.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: dept.color || "#3B82F6" }}
                          />
                          {dept.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg kategori" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {CATEGORY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
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
                  <SelectContent className="bg-popover">
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

              <div className="grid grid-cols-2 gap-2">
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
                <div className="space-y-2">
                  <Label htmlFor="maxStaff">Maks bemanning</Label>
                  <Input
                    id="maxStaff"
                    type="number"
                    value={maxStaff}
                    onChange={(e) => setMaxStaff(parseInt(e.target.value) || 1)}
                    min={1}
                    max={50}
                  />
                </div>
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
                {functions?.length || 0} funksjoner • Dra for å endre rekkefølge
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Ny funksjon
              </Button>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              {isLoading ? (
                <p className="text-center text-muted-foreground">Laster...</p>
              ) : Object.keys(groupedByDepartment).length === 0 ? (
                <p className="text-center text-muted-foreground">
                  Ingen funksjoner ennå. Klikk "Ny funksjon" for å opprette.
                </p>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedByDepartment).map(([deptId, group]) => (
                    <div key={deptId}>
                      <div className="flex items-center gap-2 mb-3">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <h4 className="text-sm font-semibold text-foreground">
                          {group.name}
                        </h4>
                        <Badge variant="secondary" className="ml-auto">
                          {group.functions.length}
                        </Badge>
                      </div>
                      <div className="space-y-2 ml-2 border-l-2 border-muted pl-4">
                        {group.functions.map((func) => (
                          <div
                            key={func.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, func.id)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, func.id, func.department_id)}
                            onDragEnd={handleDragEnd}
                            className={`flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50 cursor-move ${
                              draggedId === func.id ? "opacity-50" : ""
                            }`}
                          >
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <div
                              className="h-4 w-4 rounded"
                              style={{ backgroundColor: func.color || "#3B82F6" }}
                            />
                            {func.icon && (
                              <span className="text-lg">{func.icon}</span>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{func.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {func.default_start?.slice(0, 5)} - {func.default_end?.slice(0, 5)}
                                {func.category && ` • ${func.category}`}
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
