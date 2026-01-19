import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { useAbsenceTypes } from "@/hooks/useAbsenceTypes";
import { useAbsenceTypesMutations, AbsenceType } from "@/hooks/useSettingsMutations";

const PRESET_COLORS = [
  { name: "Rød", value: "#EF4444" },
  { name: "Oransje", value: "#F59E0B" },
  { name: "Grønn", value: "#10B981" },
  { name: "Blå", value: "#3B82F6" },
  { name: "Lilla", value: "#8B5CF6" },
  { name: "Rosa", value: "#EC4899" },
  { name: "Grå", value: "#6B7280" },
];

const ACCOUNT_OPTIONS = [
  { value: "none", label: "Ingen konto" },
  { value: "vacation", label: "Feriekonto" },
  { value: "time_bank", label: "Timebank" },
  { value: "night_bank", label: "Nattkonto" },
];

export function AbsenceTypesPanel() {
  const { data: absenceTypes, isLoading } = useAbsenceTypes();
  const { createMutation, updateMutation, deleteMutation } = useAbsenceTypesMutations();

  const [isOpen, setIsOpen] = useState(false);
  const [editingType, setEditingType] = useState<AbsenceType | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    color: "#3B82F6",
    affects_salary: false,
    requires_documentation: false,
    from_account: "none",
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      color: "#3B82F6",
      affects_salary: false,
      requires_documentation: false,
      from_account: "none",
      is_active: true,
    });
    setEditingType(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsOpen(true);
  };

  const handleOpenEdit = (type: AbsenceType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      color: type.color || "#3B82F6",
      affects_salary: type.affects_salary || false,
      requires_documentation: type.requires_documentation || false,
      from_account: type.from_account || "none",
      is_active: type.is_active ?? true,
    });
    setIsOpen(true);
  };

  const handleSave = () => {
    const data = {
      name: formData.name,
      color: formData.color,
      affects_salary: formData.affects_salary,
      requires_documentation: formData.requires_documentation,
      from_account: formData.from_account === "none" ? null : formData.from_account,
      is_active: formData.is_active,
    };

    if (editingType) {
      updateMutation.mutate({ id: editingType.id, ...data }, {
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
    if (confirm("Er du sikker på at du vil slette denne fraværstypen?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
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
            <CardTitle>Fraværstyper</CardTitle>
            <CardDescription>
              Definer hvilke typer fravær som kan registreres
            </CardDescription>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Ny fraværstype
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingType ? "Rediger fraværstype" : "Ny fraværstype"}
                </DialogTitle>
                <DialogDescription>
                  {editingType ? "Oppdater innstillingene for fraværstypen" : "Opprett en ny fraværstype"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Navn</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="F.eks. Sykmeldt"
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
                  <Label>Trekkes fra konto</Label>
                  <Select
                    value={formData.from_account}
                    onValueChange={(value) => setFormData({ ...formData, from_account: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Påvirker lønn</Label>
                    <p className="text-sm text-muted-foreground">Trekk i lønn for dette fraværet</p>
                  </div>
                  <Switch
                    checked={formData.affects_salary}
                    onCheckedChange={(checked) => setFormData({ ...formData, affects_salary: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Krever dokumentasjon</Label>
                    <p className="text-sm text-muted-foreground">F.eks. legeerklæring</p>
                  </div>
                  <Switch
                    checked={formData.requires_documentation}
                    onCheckedChange={(checked) => setFormData({ ...formData, requires_documentation: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Aktiv</Label>
                    <p className="text-sm text-muted-foreground">Vis i nedtrekkslister</p>
                  </div>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
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
                  {editingType ? "Oppdater" : "Opprett"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {absenceTypes?.map((type) => (
              <div
                key={type.id}
                className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: type.color || "#6B7280" }}
                  />
                  <div>
                    <div className="font-medium">{type.name}</div>
                    <div className="flex gap-2 mt-1">
                      {type.affects_salary && (
                        <Badge variant="outline" className="text-xs">Lønnstrekk</Badge>
                      )}
                      {type.requires_documentation && (
                        <Badge variant="outline" className="text-xs">Dokumentasjon</Badge>
                      )}
                      {type.from_account && (
                        <Badge variant="secondary" className="text-xs">
                          {ACCOUNT_OPTIONS.find(o => o.value === type.from_account)?.label}
                        </Badge>
                      )}
                      {!type.is_active && (
                        <Badge variant="destructive" className="text-xs">Inaktiv</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(type)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(type.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {(!absenceTypes || absenceTypes.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                Ingen fraværstyper definert ennå
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
