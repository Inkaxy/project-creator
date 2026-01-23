import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useDepartments } from "@/hooks/useEmployees";
import { useCreateControlTemplate, useManageControlItems } from "@/hooks/useIKControls";

interface CreateControlTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ControlItemInput {
  title: string;
  description: string;
  item_type: string;
  min_value: string;
  max_value: string;
  unit: string;
  is_critical: boolean;
}

export function CreateControlTemplateModal({
  open,
  onOpenChange,
}: CreateControlTemplateModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [frequency, setFrequency] = useState("daily");
  const [timeOfDay, setTimeOfDay] = useState("");
  const [isCritical, setIsCritical] = useState(false);
  const [items, setItems] = useState<ControlItemInput[]>([
    {
      title: "",
      description: "",
      item_type: "checkbox",
      min_value: "",
      max_value: "",
      unit: "",
      is_critical: false,
    },
  ]);

  const { data: departments = [] } = useDepartments();
  const createTemplate = useCreateControlTemplate();
  const manageItems = useManageControlItems();

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategory("general");
    setDepartmentId(null);
    setFrequency("daily");
    setTimeOfDay("");
    setIsCritical(false);
    setItems([
      {
        title: "",
        description: "",
        item_type: "checkbox",
        min_value: "",
        max_value: "",
        unit: "",
        is_critical: false,
      },
    ]);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        title: "",
        description: "",
        item_type: "checkbox",
        min_value: "",
        max_value: "",
        unit: "",
        is_critical: false,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, updates: Partial<ControlItemInput>) => {
    setItems(items.map((item, i) => (i === index ? { ...item, ...updates } : item)));
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;

    const validItems = items.filter((item) => item.title.trim());
    if (validItems.length === 0) return;

    try {
      const template = await createTemplate.mutateAsync({
        name,
        description: description || null,
        category,
        department_id: departmentId,
        frequency,
        time_of_day: timeOfDay || null,
        is_critical: isCritical,
        is_active: true,
        sort_order: 0,
        created_by: null,
      });

      // Create items
      await manageItems.mutateAsync({
        templateId: template.id,
        items: validItems.map((item, index) => ({
          title: item.title,
          description: item.description || null,
          item_type: item.item_type,
          min_value: item.min_value ? parseFloat(item.min_value) : null,
          max_value: item.max_value ? parseFloat(item.max_value) : null,
          unit: item.unit || null,
          is_critical: item.is_critical,
          sort_order: index,
          is_active: true,
        })),
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create template:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nytt kontrollpunkt</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Navn *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="F.eks. Temperaturkontroll kjøleskap"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Beskrivelse</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Valgfri beskrivelse av kontrollen..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Generell</SelectItem>
                  <SelectItem value="temperature">Temperatur</SelectItem>
                  <SelectItem value="hygiene">Hygiene</SelectItem>
                  <SelectItem value="safety">Sikkerhet</SelectItem>
                  <SelectItem value="equipment">Utstyr</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Avdeling</Label>
              <Select
                value={departmentId || "none"}
                onValueChange={(v) => setDepartmentId(v === "none" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Velg avdeling" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ingen (alle)</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Frekvens</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daglig</SelectItem>
                  <SelectItem value="weekly">Ukentlig</SelectItem>
                  <SelectItem value="monthly">Månedlig</SelectItem>
                  <SelectItem value="shift">Per vakt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Tidspunkt (valgfritt)</Label>
              <Input
                id="time"
                type="time"
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between sm:col-span-2">
              <div>
                <Label>Kritisk kontroll</Label>
                <p className="text-xs text-muted-foreground">
                  Markerer kontrollen som kritisk for mattrygghet
                </p>
              </div>
              <Switch checked={isCritical} onCheckedChange={setIsCritical} />
            </div>
          </div>

          {/* Control items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Kontrollpunkter</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-1 h-3 w-3" />
                Legg til punkt
              </Button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1 sm:col-span-2">
                      <Label>Tittel *</Label>
                      <Input
                        value={item.title}
                        onChange={(e) => updateItem(index, { title: e.target.value })}
                        placeholder="F.eks. Kjøleskap 1 temperatur"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>Type</Label>
                      <Select
                        value={item.item_type}
                        onValueChange={(v) => updateItem(index, { item_type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checkbox">Avkrysning</SelectItem>
                          <SelectItem value="number">Tall</SelectItem>
                          <SelectItem value="temperature">Temperatur</SelectItem>
                          <SelectItem value="text">Tekst</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {(item.item_type === "number" || item.item_type === "temperature") && (
                      <>
                        <div className="space-y-1">
                          <Label>Enhet</Label>
                          <Input
                            value={item.unit}
                            onChange={(e) => updateItem(index, { unit: e.target.value })}
                            placeholder={item.item_type === "temperature" ? "°C" : ""}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Min verdi</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={item.min_value}
                            onChange={(e) => updateItem(index, { min_value: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Max verdi</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={item.max_value}
                            onChange={(e) => updateItem(index, { max_value: e.target.value })}
                          />
                        </div>
                      </>
                    )}

                    <div className="flex items-center gap-2 sm:col-span-2">
                      <Switch
                        checked={item.is_critical}
                        onCheckedChange={(v) => updateItem(index, { is_critical: v })}
                      />
                      <Label>Kritisk punkt</Label>
                    </div>
                  </div>

                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              createTemplate.isPending ||
              !name.trim() ||
              !items.some((i) => i.title.trim())
            }
          >
            {createTemplate.isPending ? "Oppretter..." : "Opprett kontrollpunkt"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
