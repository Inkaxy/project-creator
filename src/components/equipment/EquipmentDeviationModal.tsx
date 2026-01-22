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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useCreateEquipmentDeviation } from "@/hooks/useEquipmentDeviations";
import { useAuth } from "@/contexts/AuthContext";
import { Camera, X } from "lucide-react";

interface EquipmentDeviationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentId: string;
}

export function EquipmentDeviationModal({
  open,
  onOpenChange,
  equipmentId,
}: EquipmentDeviationModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const createDeviation = useCreateEquipmentDeviation();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    severity: "medium",
  });
  const [images, setImages] = useState<string[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // For now, just create local URLs. In production, you'd upload to storage
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [...prev.slice(0, 4), reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({
        title: "Feil",
        description: "Tittel er påkrevd",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Feil",
        description: "Du må være logget inn",
        variant: "destructive",
      });
      return;
    }

    try {
      await createDeviation.mutateAsync({
        equipment_id: equipmentId,
        reported_by: user.id,
        title: formData.title,
        description: formData.description || undefined,
        severity: formData.severity,
        images: images.length > 0 ? images : undefined,
      });

      toast({
        title: "Avvik meldt",
        description: "Avviket ble registrert",
      });
      onOpenChange(false);
      
      // Reset form
      setFormData({ title: "", description: "", severity: "medium" });
      setImages([]);
    } catch (error) {
      toast({
        title: "Feil",
        description: "Kunne ikke melde avvik",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Meld avvik</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Tittel *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Kort beskrivelse av avviket"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detaljert beskrivelse av hva som er galt..."
              rows={4}
            />
          </div>

          <div className="space-y-3">
            <Label>Alvorlighetsgrad</Label>
            <RadioGroup
              value={formData.severity}
              onValueChange={(value) => setFormData({ ...formData, severity: value })}
              className="grid grid-cols-2 gap-2"
            >
              <div className="flex items-center space-x-2 rounded-md border p-3">
                <RadioGroupItem value="low" id="low" />
                <Label htmlFor="low" className="flex-1 cursor-pointer">
                  <span className="font-medium">Lav</span>
                  <p className="text-xs text-muted-foreground">Mindre problem</p>
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-md border p-3">
                <RadioGroupItem value="medium" id="medium" />
                <Label htmlFor="medium" className="flex-1 cursor-pointer">
                  <span className="font-medium">Medium</span>
                  <p className="text-xs text-muted-foreground">Bør fikses snart</p>
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-md border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-950">
                <RadioGroupItem value="high" id="high" />
                <Label htmlFor="high" className="flex-1 cursor-pointer">
                  <span className="font-medium">Høy</span>
                  <p className="text-xs text-muted-foreground">Påvirker drift</p>
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
                <RadioGroupItem value="critical" id="critical" />
                <Label htmlFor="critical" className="flex-1 cursor-pointer">
                  <span className="font-medium">Kritisk</span>
                  <p className="text-xs text-muted-foreground">Stopp i drift</p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Bilder</Label>
            <div className="flex flex-wrap gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative">
                  <img
                    src={img}
                    alt={`Bilde ${i + 1}`}
                    className="h-20 w-20 rounded-md object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-md border-2 border-dashed hover:bg-muted">
                  <Camera className="h-6 w-6 text-muted-foreground" />
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Maks 5 bilder. Trykk på kamera for å ta bilde.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={createDeviation.isPending}>
              Meld avvik
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
