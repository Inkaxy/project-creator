import { useState } from "react";
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
import { Loader2, Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { useLocations, useLocationsMutations, Location } from "@/hooks/useSettingsMutations";

export function LocationsPanel() {
  const { data: locations, isLoading } = useLocations();
  const { createMutation, updateMutation, deleteMutation } = useLocationsMutations();

  const [isOpen, setIsOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    gps_lat: "",
    gps_lng: "",
    gps_radius: "100",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      gps_lat: "",
      gps_lng: "",
      gps_radius: "100",
    });
    setEditingLocation(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsOpen(true);
  };

  const handleOpenEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      address: location.address || "",
      gps_lat: location.gps_lat?.toString() || "",
      gps_lng: location.gps_lng?.toString() || "",
      gps_radius: location.gps_radius?.toString() || "100",
    });
    setIsOpen(true);
  };

  const handleSave = () => {
    const data = {
      name: formData.name,
      address: formData.address || null,
      gps_lat: formData.gps_lat ? parseFloat(formData.gps_lat) : null,
      gps_lng: formData.gps_lng ? parseFloat(formData.gps_lng) : null,
      gps_radius: formData.gps_radius ? parseFloat(formData.gps_radius) : null,
    };

    if (editingLocation) {
      updateMutation.mutate({ id: editingLocation.id, ...data }, {
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
    if (confirm("Er du sikker på at du vil slette denne lokasjonen?")) {
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
            <CardTitle>Lokasjoner</CardTitle>
            <CardDescription>
              Arbeidslokasjoner for GPS-basert stempling
            </CardDescription>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Ny lokasjon
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingLocation ? "Rediger lokasjon" : "Ny lokasjon"}
                </DialogTitle>
                <DialogDescription>
                  {editingLocation ? "Oppdater lokasjonsinformasjon" : "Legg til en ny arbeidslokasjon"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Navn *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="F.eks. Hovedkontor"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Adresse</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="F.eks. Storgata 1, 0000 Oslo"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>GPS Breddegrad</Label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.gps_lat}
                      onChange={(e) => setFormData({ ...formData, gps_lat: e.target.value })}
                      placeholder="59.9139"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>GPS Lengdegrad</Label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.gps_lng}
                      onChange={(e) => setFormData({ ...formData, gps_lng: e.target.value })}
                      placeholder="10.7522"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>GPS-radius (meter)</Label>
                  <Input
                    type="number"
                    value={formData.gps_radius}
                    onChange={(e) => setFormData({ ...formData, gps_radius: e.target.value })}
                    placeholder="100"
                  />
                  <p className="text-xs text-muted-foreground">
                    Avstanden fra GPS-punkt hvor stempling tillates
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
                  {editingLocation ? "Oppdater" : "Opprett"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {locations?.map((location) => (
              <div
                key={location.id}
                className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{location.name}</div>
                    {location.address && (
                      <div className="text-sm text-muted-foreground">{location.address}</div>
                    )}
                    {location.gps_lat && location.gps_lng && (
                      <div className="text-xs text-muted-foreground mt-1">
                        GPS: {location.gps_lat.toFixed(4)}, {location.gps_lng.toFixed(4)} 
                        {location.gps_radius && ` (${location.gps_radius}m radius)`}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(location)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(location.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {(!locations || locations.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                Ingen lokasjoner definert ennå
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
