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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDepartments } from "@/hooks/useEmployees";
import {
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from "@/hooks/useDepartmentsMutations";
import { Edit2, Plus, Trash2, X, Building2 } from "lucide-react";

interface DepartmentsManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Department {
  id: string;
  name: string;
  color: string | null;
}

const COLOR_OPTIONS = [
  { value: "#DC2626", label: "Mørk rød" },
  { value: "#EF4444", label: "Rød" },
  { value: "#F97316", label: "Oransje" },
  { value: "#F59E0B", label: "Gul-oransje" },
  { value: "#EAB308", label: "Gul" },
  { value: "#22C55E", label: "Grønn" },
  { value: "#10B981", label: "Smaragd" },
  { value: "#06B6D4", label: "Cyan" },
  { value: "#3B82F6", label: "Blå" },
  { value: "#8B5CF6", label: "Lilla" },
  { value: "#EC4899", label: "Rosa" },
];

export function DepartmentsManagementModal({
  open,
  onOpenChange,
}: DepartmentsManagementModalProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

  const { data: departments, isLoading } = useDepartments();
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const deleteDepartment = useDeleteDepartment();

  // Form state
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3B82F6");

  const resetForm = () => {
    setName("");
    setColor("#3B82F6");
    setEditingDepartment(null);
    setShowForm(false);
  };

  const startEditing = (dept: Department) => {
    setEditingDepartment(dept);
    setName(dept.name);
    setColor(dept.color || "#3B82F6");
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;

    const data = {
      name: name.trim(),
      color,
    };

    if (editingDepartment) {
      await updateDepartment.mutateAsync({ id: editingDepartment.id, ...data });
    } else {
      await createDepartment.mutateAsync(data);
    }

    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Er du sikker på at du vil slette denne avdelingen? Funksjoner og ansatte knyttet til avdelingen vil miste tilknytningen.")) {
      await deleteDepartment.mutateAsync(id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Behandle Avdelinger
          </DialogTitle>
        </DialogHeader>

        {showForm ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">
                {editingDepartment ? "Rediger avdeling" : "Ny avdeling"}
              </h3>
              <Button variant="ghost" size="icon" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Navn *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="f.eks. Produksjon"
                />
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
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={resetForm}>
                Avbryt
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!name.trim() || createDepartment.isPending || updateDepartment.isPending}
              >
                {editingDepartment ? "Lagre endringer" : "Opprett avdeling"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between">
              <p className="text-sm text-muted-foreground">
                {departments?.length || 0} avdelinger
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Ny avdeling
              </Button>
            </div>

            <ScrollArea className="h-[300px] pr-4">
              {isLoading ? (
                <p className="text-center text-muted-foreground">Laster...</p>
              ) : !departments || departments.length === 0 ? (
                <p className="text-center text-muted-foreground">
                  Ingen avdelinger ennå. Klikk "Ny avdeling" for å opprette.
                </p>
              ) : (
                <div className="space-y-2">
                  {departments.map((dept) => (
                    <div
                      key={dept.id}
                      className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div
                        className="h-4 w-4 rounded-full shrink-0"
                        style={{ backgroundColor: dept.color || "#3B82F6" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{dept.name}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEditing(dept)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(dept.id)}
                          disabled={deleteDepartment.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
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
