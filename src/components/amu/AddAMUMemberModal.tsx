import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useEmployees } from "@/hooks/useEmployees";
import { useAddAMUMember, useAMUMembers } from "@/hooks/useAMU";
import { AMU_MEMBER_TYPE_LABELS, type AMUMemberType } from "@/types/amu";
import { Loader2 } from "lucide-react";

interface AddAMUMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAMUMemberModal({ open, onOpenChange }: AddAMUMemberModalProps) {
  const { data: employees, isLoading: loadingEmployees } = useEmployees();
  const { data: existingMembers } = useAMUMembers();
  const addMember = useAddAMUMember();

  const [profileId, setProfileId] = useState("");
  const [memberType, setMemberType] = useState<AMUMemberType>("member");
  const [notes, setNotes] = useState("");

  // Filter out employees who are already AMU members
  const availableEmployees = employees?.filter(
    (emp) => !existingMembers?.some((m) => m.profile_id === emp.id)
  );

  const handleSubmit = async () => {
    if (!profileId) return;

    await addMember.mutateAsync({
      profile_id: profileId,
      member_type: memberType,
      title: AMU_MEMBER_TYPE_LABELS[memberType],
      notes: notes || undefined,
    });

    // Reset form
    setProfileId("");
    setMemberType("member");
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Legg til AMU-medlem</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="employee">Velg ansatt</Label>
            <Select value={profileId} onValueChange={setProfileId}>
              <SelectTrigger id="employee">
                <SelectValue placeholder="Velg fra liste..." />
              </SelectTrigger>
              <SelectContent>
                {loadingEmployees ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : availableEmployees && availableEmployees.length > 0 ? (
                  availableEmployees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.email})
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    Ingen tilgjengelige ansatte
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rolle i AMU</Label>
            <Select value={memberType} onValueChange={(v) => setMemberType(v as AMUMemberType)}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(AMU_MEMBER_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notater (valgfritt)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="F.eks. representerer produksjonsavdelingen..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSubmit} disabled={!profileId || addMember.isPending}>
            {addMember.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Legg til
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
