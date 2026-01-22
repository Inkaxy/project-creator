import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Map, 
  Plus, 
  Upload, 
  Trash2, 
  Download, 
  Maximize2,
  Building2,
  MapPin
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface BuildingMap {
  id: string;
  name: string;
  description: string | null;
  floor: string | null;
  map_type: string;
  file_url: string;
  created_at: string;
}

const mapTypeLabels: Record<string, string> = {
  floor_plan: "Etasjeplan",
  evacuation: "Rømningsvei",
  fire_equipment: "Brannutstyr",
  meeting_point: "Møteplass",
  other: "Annet",
};

export function BuildingMapsPanel() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewingMap, setViewingMap] = useState<BuildingMap | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    floor: "",
    map_type: "floor_plan",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const queryClient = useQueryClient();

  const { data: maps = [], isLoading } = useQuery({
    queryKey: ["building-maps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("building_maps")
        .select("*")
        .order("floor", { ascending: true });

      if (error) throw error;
      return data as BuildingMap[];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error("Ingen fil valgt");

      setUploading(true);

      // Upload file to storage
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `building-maps/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("fire-safety")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("fire-safety")
        .getPublicUrl(filePath);

      // Save to database
      const { error: dbError } = await supabase
        .from("building_maps")
        .insert({
          name: formData.name,
          description: formData.description || null,
          floor: formData.floor || null,
          map_type: formData.map_type,
          file_url: urlData.publicUrl,
        });

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      toast.success("Kart lastet opp");
      queryClient.invalidateQueries({ queryKey: ["building-maps"] });
      setIsAddOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Kunne ikke laste opp kart: " + error.message);
    },
    onSettled: () => {
      setUploading(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("building_maps")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Kart slettet");
      queryClient.invalidateQueries({ queryKey: ["building-maps"] });
    },
    onError: () => {
      toast.error("Kunne ikke slette kart");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      floor: "",
      map_type: "floor_plan",
    });
    setSelectedFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
      if (!validTypes.includes(file.type)) {
        toast.error("Ugyldig filtype. Bruk PNG, JPG, WebP eller PDF.");
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Filen er for stor. Maks 10MB.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const groupedMaps = maps.reduce((acc, map) => {
    const floor = map.floor || "Uspesifisert";
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(map);
    return acc;
  }, {} as Record<string, BuildingMap[]>);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Laster kart...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Bygningskart</h2>
          <p className="text-sm text-muted-foreground">
            Etasjeplaner, rømningsveier og plasseringskart
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Last opp kart
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Last opp bygningskart</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Navn *</Label>
                <Input
                  id="name"
                  placeholder="F.eks. Etasjeplan 1. etasje"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="floor">Etasje</Label>
                <Input
                  id="floor"
                  placeholder="F.eks. 1. etasje, Kjeller, Loft"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="map_type">Type kart</Label>
                <Select
                  value={formData.map_type}
                  onValueChange={(value) => setFormData({ ...formData, map_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="floor_plan">Etasjeplan</SelectItem>
                    <SelectItem value="evacuation">Rømningsvei</SelectItem>
                    <SelectItem value="fire_equipment">Brannutstyr</SelectItem>
                    <SelectItem value="meeting_point">Møteplass</SelectItem>
                    <SelectItem value="other">Annet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beskrivelse</Label>
                <Textarea
                  id="description"
                  placeholder="Valgfri beskrivelse..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Fil *</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  {selectedFile ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm truncate">{selectedFile.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Klikk for å velge fil
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG, WebP eller PDF (maks 10MB)
                      </p>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/png,image/jpeg,image/webp,application/pdf"
                        onChange={handleFileChange}
                      />
                    </label>
                  )}
                </div>
              </div>

              <Button
                className="w-full"
                disabled={!formData.name || !selectedFile || uploading}
                onClick={() => uploadMutation.mutate()}
              >
                {uploading ? "Laster opp..." : "Last opp kart"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {maps.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Map className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-medium mb-1">Ingen kart lastet opp</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Last opp etasjeplaner, rømningsveier og oversiktskart for bygget
            </p>
            <Button variant="outline" onClick={() => setIsAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Last opp første kart
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedMaps).map(([floor, floorMaps]) => (
            <div key={floor}>
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">{floor}</h3>
                <Badge variant="secondary">{floorMaps.length}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {floorMaps.map((map) => (
                  <Card key={map.id} className="overflow-hidden">
                    <div 
                      className="aspect-video bg-muted relative cursor-pointer group"
                      onClick={() => setViewingMap(map)}
                    >
                      {map.file_url.endsWith(".pdf") ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <Map className="h-12 w-12 mx-auto text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mt-2">PDF-fil</p>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={map.file_url}
                          alt={map.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-medium truncate">{map.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {mapTypeLabels[map.map_type] || map.map_type}
                            </Badge>
                          </div>
                          {map.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {map.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(map.file_url, "_blank");
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Slett kart?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Er du sikker på at du vil slette "{map.name}"? Denne handlingen kan ikke angres.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(map.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Slett
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full-screen map viewer */}
      <Dialog open={!!viewingMap} onOpenChange={() => setViewingMap(null)}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Map className="h-5 w-5" />
              {viewingMap?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {viewingMap?.file_url.endsWith(".pdf") ? (
              <iframe
                src={viewingMap.file_url}
                className="w-full h-full min-h-[60vh]"
                title={viewingMap.name}
              />
            ) : (
              <img
                src={viewingMap?.file_url}
                alt={viewingMap?.name}
                className="w-full h-auto"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
