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
import { useAddPersonnelQualification, useIndustrivernQualifications } from "@/hooks/useIndustrivernQualifications";
import { useIndustrivernPersonnel } from "@/hooks/useIndustrivernPersonnel";

interface AddQualificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedProfileId?: string;
}

export function AddQualificationModal({ 
  open, 
  onOpenChange, 
  preselectedProfileId 
}: AddQualificationModalProps) {
  const { data: qualifications } = useIndustrivernQualifications();
  const { data: personnel } = useIndustrivernPersonnel();
  const addQualification = useAddPersonnelQualification();

  const [profileId, setProfileId] = useState(preselectedProfileId || "");
  const [qualificationId, setQualificationId] = useState("");
  const [achievedDate, setAchievedDate] = useState(new Date().toISOString().split("T")[0]);
  const [expiresDate, setExpiresDate] = useState("");
  const [certificateNumber, setCertificateNumber] = useState("");
  const [notes, setNotes] = useState("");

  const handleQualificationChange = (qualId: string) => {
    setQualificationId(qualId);
    
    // Auto-calculate expiry if qualification has validity period
    const qual = qualifications?.find(q => q.id === qualId);
    if (qual?.validity_months && achievedDate) {
      const achieved = new Date(achievedDate);
      achieved.setMonth(achieved.getMonth() + qual.validity_months);
      setExpiresDate(achieved.toISOString().split("T")[0]);
    } else {
      setExpiresDate("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!profileId || !qualificationId || !achievedDate) return;

    addQualification.mutate(
      {
        profile_id: profileId,
        qualification_id: qualificationId,
        achieved_date: achievedDate,
        expires_date: expiresDate || undefined,
        certificate_number: certificateNumber || undefined,
        notes: notes || undefined,
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
    if (!preselectedProfileId) setProfileId("");
    setQualificationId("");
    setAchievedDate(new Date().toISOString().split("T")[0]);
    setExpiresDate("");
    setCertificateNumber("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrer kvalifikasjon</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!preselectedProfileId && (
            <div className="space-y-2">
              <Label htmlFor="profile">Person *</Label>
              <select
                id="profile"
                value={profileId}
                onChange={(e) => setProfileId(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                required
              >
                <option value="">Velg person...</option>
                {personnel?.map((person) => (
                  <option key={person.profile_id} value={person.profile_id}>
                    {person.profiles?.full_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="qualification">Kvalifikasjon *</Label>
            <select
              id="qualification"
              value={qualificationId}
              onChange={(e) => handleQualificationChange(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background"
              required
            >
              <option value="">Velg kvalifikasjon...</option>
              {qualifications?.map((qual) => (
                <option key={qual.id} value={qual.id}>
                  {qual.name} {qual.code ? `(${qual.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="achieved-date">Oppnådd dato *</Label>
              <Input
                id="achieved-date"
                type="date"
                value={achievedDate}
                onChange={(e) => {
                  setAchievedDate(e.target.value);
                  // Recalculate expiry if qualification selected
                  if (qualificationId) {
                    const qual = qualifications?.find(q => q.id === qualificationId);
                    if (qual?.validity_months) {
                      const achieved = new Date(e.target.value);
                      achieved.setMonth(achieved.getMonth() + qual.validity_months);
                      setExpiresDate(achieved.toISOString().split("T")[0]);
                    }
                  }
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expires-date">Utløpsdato</Label>
              <Input
                id="expires-date"
                type="date"
                value={expiresDate}
                onChange={(e) => setExpiresDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="certificate-number">Sertifikatnummer</Label>
            <Input
              id="certificate-number"
              placeholder="Nummer på sertifikat"
              value={certificateNumber}
              onChange={(e) => setCertificateNumber(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notater</Label>
            <Input
              id="notes"
              placeholder="Eventuelle notater"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={addQualification.isPending}>
              {addQualification.isPending ? "Registrerer..." : "Registrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
