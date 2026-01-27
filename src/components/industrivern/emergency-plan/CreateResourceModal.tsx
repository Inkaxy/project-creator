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
import { useCreateEmergencyResource } from "@/hooks/useEmergencyResources";
import { useActiveEmergencyPlan } from "@/hooks/useEmergencyPlans";

interface CreateResourceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateResourceModal({ open, onOpenChange }: CreateResourceModalProps) {
  const { data: activePlan } = useActiveEmergencyPlan();
  const createResource = useCreateEmergencyResource();

  const [resourceType, setResourceType] = useState<string>("internal");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [location, setLocation] = useState("");
  const [responseTime, setResponseTime] = useState("");
  const [availability, setAvailability] = useState("24/7");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !activePlan?.id) return;

    createResource.mutate(
      {
        emergency_plan_id: activePlan.id,
        resource_type: resourceType,
        name,
        description: description || undefined,
        location: location || undefined,
        contact_info: {
          name: contactName,
          phone: contactPhone,
          email: contactEmail,
        },
        response_time_minutes: responseTime ? parseInt(responseTime) : undefined,
        availability: availability || "24/7",
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          resetForm();
        },
      }
    );
  };

  const resetForm = () => {
    setResourceType("internal");
    setName("");
    setDescription("");
    setContactName("");
    setContactPhone("");
    setContactEmail("");
    setLocation("");
    setResponseTime("");
    setAvailability("24/7");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Legg til ressurs</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Ressurstype</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="resource-type"
                  value="internal"
                  checked={resourceType === "internal"}
                  onChange={(e) => setResourceType(e.target.value)}
                  className="h-4 w-4"
                />
                Intern ressurs
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="resource-type"
                  value="external"
                  checked={resourceType === "external"}
                  onChange={(e) => setResourceType(e.target.value)}
                  className="h-4 w-4"
                />
                Ekstern ressurs
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Navn *</Label>
            <Input
              id="name"
              placeholder={resourceType === "internal" ? "F.eks. 'Førstehjelpsutstyr lager'" : "F.eks. 'Brannvesenet'"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              placeholder="Beskriv ressursen..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Kontaktperson</Label>
              <Input
                id="contact-name"
                placeholder="Navn"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Telefon</Label>
              <Input
                id="contact-phone"
                placeholder="Telefonnummer"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-email">E-post</Label>
            <Input
              id="contact-email"
              type="email"
              placeholder="E-postadresse"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Lokasjon</Label>
              <Input
                id="location"
                placeholder="Hvor er ressursen"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="response-time">Responstid (min)</Label>
              <Input
                id="response-time"
                type="number"
                placeholder="Estimert responstid"
                value={responseTime}
                onChange={(e) => setResponseTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="availability">Tilgjengelighet</Label>
            <Input
              id="availability"
              placeholder="F.eks. '24/7' eller 'Hverdager 08-16'"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={createResource.isPending || !activePlan}>
              {createResource.isPending ? "Legger til..." : "Legg til ressurs"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
