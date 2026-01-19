import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from "@/hooks/useDepartmentsMutations";
import { useLocations } from "@/hooks/useSettingsMutations";

interface DepartmentData {
  id: string;
  name: string;
  color: string | null;
  location_id: string | null;
}

function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as DepartmentData[];
    },
  });
}

const PRESET_COLORS = [
  { name: "Rød", value: "#EF4444" },
  { name: "Oransje", value: "#F59E0B" },
  { name: "Gul", value: "#EAB308" },
  { name: "Grønn", value: "#22C55E" },
  { name: "Turkis", value: "#14B8A6" },
  { name: "Blå", value: "#3B82F6" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Lilla", value: "#8B5CF6" },
  { name: "Rosa", value: "#EC4899" },
];

export function DepartmentsSettingsPanel() {
  const { data: departments, isLoading: depsLoading } = useDepartments();
  const { data: locations } = useLocations();
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const deleteMutation = useDeleteDepartment();

  const [isOpen, setIsOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentData | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    color: "#3B82F6",
    location_id: "none",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      color: "#3B82F6",
      location_id: "none",
    });
    setEditingDept(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsOpen(true);
  };

  const handleOpenEdit = (dept: DepartmentData) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      color: dept.color || "#3B82F6",
      location_id: dept.location_id || "none",
    });
    setIsOpen(true);
  };

  const handleSave = () => {
    const data = {
      name: formData.name,
      color: formData.color,
      location_id: formData.location_id === "none" ? null : formData.location_id,
    };

    if (editingDept) {
      updateMutation.mutate({ id: editingDept.id, ...data }, {
        onSuccess: () => {
          setIsOpen(false);
          resetForm();
        },
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          setIsOpen(false);
          resetForm();
        },
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Er du sikker på at du vil slette denne avdelingen? Alle ansatte knyttet til avdelingen vil miste tilknytningen.")) {
      deleteMutation.mutate(id);
    }
  };

  if (depsLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Avdelinger</CardTitle>
            <CardDescription>
              Organisasjonsstruktur og avdelinger
            </CardDescription>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Ny avdeling
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingDept ? "Rediger avdeling" : "Ny avdeling"}
                </DialogTitle>
                <DialogDescription>
                  {editingDept ? "Oppdater avdelingsinformasjon" : "Opprett en ny avdeling"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Navn *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="F.eks. Kjøkken"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Farge</Label>
                  <div className="flex gap-2 flex-wrap">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setFormData({ ...formData, color: color.value })}
                        className={`w-8 h-8 rounded-full border-2 ${
                          formData.color === color.value ? "border-foreground" : "border-transparent"
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Lokasjon</Label>
                  <Select
                    value={formData.location_id}
                    onValueChange={(value) => setFormData({ ...formData, location_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Velg lokasjon" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ingen lokasjon</SelectItem>
                      {locations?.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Knytter avdelingen til en fysisk lokasjon for GPS-stempling
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Avbryt
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!formData.name || createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingDept ? "Oppdater" : "Opprett"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {departments?.map((dept) => {
              const location = locations?.find((l) => l.id === dept.location_id);
              return (
                <div
                  key={dept.id}
                  className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: (dept.color || "#3B82F6") + "20" }}
                    >
                      <Building2 className="h-5 w-5" style={{ color: dept.color || "#3B82F6" }} />
                    </div>
                    <div>
                      <div className="font-medium">{dept.name}</div>
                      {location && (
                        <div className="text-sm text-muted-foreground">{location.name}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(dept)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(dept.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {(!departments || departments.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                Ingen avdelinger definert ennå
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
