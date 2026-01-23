import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Loader2, Boxes } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useEquipmentCategories,
  useCreateEquipmentCategory,
  useUpdateEquipmentCategory,
  useDeleteEquipmentCategory,
} from "@/hooks/useEquipmentCategories";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Department {
  id: string;
  name: string;
  color: string | null;
}

function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("id, name, color")
        .order("name");
      if (error) throw error;
      return data as Department[];
    },
  });
}

const CATEGORY_ICONS = [
  { value: "🍳", label: "Koketopp" },
  { value: "❄️", label: "Kjøl/frys" },
  { value: "🔥", label: "Ovn" },
  { value: "🧊", label: "Iskrem/kald" },
  { value: "🥤", label: "Drikkeutstyr" },
  { value: "🍽️", label: "Servering" },
  { value: "🧹", label: "Rengjøring" },
  { value: "⚡", label: "Elektrisk" },
  { value: "💨", label: "Ventilasjon" },
  { value: "🔧", label: "Verktøy" },
  { value: "📦", label: "Oppbevaring" },
  { value: "🚿", label: "Vask" },
];

const CATEGORY_COLORS = [
  { value: "#3B82F6", label: "Blå" },
  { value: "#10B981", label: "Grønn" },
  { value: "#F59E0B", label: "Oransje" },
  { value: "#EF4444", label: "Rød" },
  { value: "#8B5CF6", label: "Lilla" },
  { value: "#EC4899", label: "Rosa" },
  { value: "#6B7280", label: "Grå" },
];

interface CategoryFormData {
  name: string;
  icon: string;
  color: string;
  description: string;
  department_id: string;
  requires_temp_monitoring: boolean;
  requires_certification: boolean;
  default_service_interval_days: number | null;
}

const defaultFormData: CategoryFormData = {
  name: "",
  icon: "📦",
  color: "#3B82F6",
  description: "",
  department_id: "",
  requires_temp_monitoring: false,
  requires_certification: false,
  default_service_interval_days: null,
};

export function EquipmentCategoriesPanel() {
  const { toast } = useToast();
  const { data: categories, isLoading } = useEquipmentCategories();
  const { data: departments } = useDepartments();
  const createCategory = useCreateEquipmentCategory();
  const updateCategory = useUpdateEquipmentCategory();
  const deleteCategory = useDeleteEquipmentCategory();

  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(defaultFormData);

  const handleOpenCreate = () => {
    setFormData(defaultFormData);
    setEditingCategory(null);
    setShowDialog(true);
  };

  const handleOpenEdit = (category: any) => {
    setFormData({
      name: category.name,
      icon: category.icon || "📦",
      color: category.color || "#3B82F6",
      description: category.description || "",
      department_id: category.department_id || "",
      requires_temp_monitoring: category.requires_temp_monitoring || false,
      requires_certification: category.requires_certification || false,
      default_service_interval_days: category.default_service_interval_days,
    });
    setEditingCategory(category.id);
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Feil",
        description: "Navn er påkrevd",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        icon: formData.icon,
        color: formData.color,
        description: formData.description || null,
        department_id: formData.department_id || null,
        requires_temp_monitoring: formData.requires_temp_monitoring,
        requires_certification: formData.requires_certification,
        default_service_interval_days: formData.default_service_interval_days,
      };

      if (editingCategory) {
        await updateCategory.mutateAsync({ id: editingCategory, ...payload });
        toast({ title: "Oppdatert", description: "Kategorien ble oppdatert" });
      } else {
        await createCategory.mutateAsync(payload);
        toast({ title: "Opprettet", description: "Ny kategori ble lagt til" });
      }
      setShowDialog(false);
    } catch (error) {
      toast({
        title: "Feil",
        description: "Kunne ikke lagre kategori",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Er du sikker på at du vil slette denne kategorien?")) return;

    try {
      await deleteCategory.mutateAsync(id);
      toast({ title: "Slettet", description: "Kategorien ble fjernet" });
    } catch (error) {
      toast({
        title: "Feil",
        description: "Kunne ikke slette kategorien. Den kan ha tilknyttet utstyr.",
        variant: "destructive",
      });
    }
  };

  const getDepartmentName = (deptId: string | null) => {
    if (!deptId) return null;
    return departments?.find((d) => d.id === deptId)?.name;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Boxes className="h-5 w-5" />
                Utstyrskategorier
              </CardTitle>
              <CardDescription>
                Administrer kategorier for utstyr og maskiner
              </CardDescription>
            </div>
            <Button onClick={handleOpenCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Ny kategori
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {categories && categories.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Avdeling</TableHead>
                  <TableHead>Egenskaper</TableHead>
                  <TableHead>Serviceintervall</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-lg"
                          style={{ backgroundColor: (category.color || "#3B82F6") + "20" }}
                        >
                          {category.icon || "📦"}
                        </span>
                        <span className="font-medium">{category.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getDepartmentName(category.department_id) ? (
                        <Badge variant="outline">
                          {getDepartmentName(category.department_id)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">Alle</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {category.requires_temp_monitoring && (
                          <Badge variant="secondary" className="text-xs">
                            🌡️ Temp
                          </Badge>
                        )}
                        {category.requires_certification && (
                          <Badge variant="secondary" className="text-xs">
                            📜 Sertifikat
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {category.default_service_interval_days ? (
                        <span>{category.default_service_interval_days} dager</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(category.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center">
              <Boxes className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Ingen kategorier opprettet ennå</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Rediger kategori" : "Ny utstyrskategori"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Navn *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="F.eks. Kjøleutstyr"
              />
            </div>

            {/* Icon & Color */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ikon</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) => setFormData({ ...formData, icon: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_ICONS.map((icon) => (
                      <SelectItem key={icon.value} value={icon.value}>
                        <span className="flex items-center gap-2">
                          <span>{icon.value}</span>
                          <span>{icon.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Farge</Label>
                <Select
                  value={formData.color}
                  onValueChange={(value) => setFormData({ ...formData, color: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_COLORS.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <span className="flex items-center gap-2">
                          <span
                            className="h-4 w-4 rounded-full"
                            style={{ backgroundColor: color.value }}
                          />
                          <span>{color.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label>Avdeling</Label>
              <Select
                value={formData.department_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, department_id: value === "all" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Alle avdelinger" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle avdelinger</SelectItem>
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Begrenser kategorien til en spesifikk avdeling
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Beskrivelse</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Kort beskrivelse av kategorien..."
                rows={2}
              />
            </div>

            {/* Service Interval */}
            <div className="space-y-2">
              <Label htmlFor="service_interval">Standard serviceintervall (dager)</Label>
              <Input
                id="service_interval"
                type="number"
                min={0}
                value={formData.default_service_interval_days || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    default_service_interval_days: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  })
                }
                placeholder="F.eks. 90"
              />
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Krever temperaturovervåking</Label>
                  <p className="text-xs text-muted-foreground">
                    For kjøle- og fryseutstyr
                  </p>
                </div>
                <Switch
                  checked={formData.requires_temp_monitoring}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, requires_temp_monitoring: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Krever sertifisering</Label>
                  <p className="text-xs text-muted-foreground">
                    Ansatte må være sertifisert for å bruke
                  </p>
                </div>
                <Switch
                  checked={formData.requires_certification}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, requires_certification: checked })
                  }
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Avbryt
              </Button>
              <Button
                onClick={handleSave}
                disabled={createCategory.isPending || updateCategory.isPending}
              >
                {createCategory.isPending || updateCategory.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {editingCategory ? "Oppdater" : "Opprett"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
