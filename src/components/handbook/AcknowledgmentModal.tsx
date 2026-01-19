import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAcknowledgeHandbook, HandbookChapter } from "@/hooks/useHandbook";
import { CheckCircle, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface AcknowledgmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  handbookId: string;
  version: string;
  effectiveDate?: string | null;
  chapters: HandbookChapter[];
}

export function AcknowledgmentModal({
  open,
  onOpenChange,
  handbookId,
  version,
  effectiveDate,
  chapters,
}: AcknowledgmentModalProps) {
  const [signatureMethod, setSignatureMethod] = useState<"click" | "pin">("pin");
  const [pinCode, setPinCode] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  
  const acknowledgeHandbook = useAcknowledgeHandbook();
  
  const chaptersRequiringAck = chapters.filter(c => c.requires_acknowledgment);
  
  const handleSign = async () => {
    if (!confirmed) return;
    if (signatureMethod === "pin" && pinCode.length !== 4) return;
    
    await acknowledgeHandbook.mutateAsync({
      handbookId,
      version,
      signatureMethod,
    });
    
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Bekreft lesing
          </DialogTitle>
          <DialogDescription>
            Du bekrefter at du har lest og forstått følgende:
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <Checkbox checked disabled />
            <span>
              Personalhåndbok versjon {version}
              {effectiveDate && (
                <span className="text-muted-foreground ml-1">
                  (Gyldig fra: {format(new Date(effectiveDate), "d. MMMM yyyy", { locale: nb })})
                </span>
              )}
            </span>
          </div>
          
          {chaptersRequiringAck.length > 0 && (
            <div>
              <Label className="text-sm text-muted-foreground">
                Kapitler som krever bekreftelse:
              </Label>
              <ScrollArea className="h-32 mt-2 border rounded-md p-3">
                <div className="space-y-2">
                  {chaptersRequiringAck.map(chapter => (
                    <div key={chapter.id} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{chapter.title}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
          
          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            Ved å signere bekrefter jeg at jeg har lest og forstått innholdet i 
            personalhåndboken, og at jeg vil følge bedriftens regler og retningslinjer.
          </div>
          
          <div className="space-y-3">
            <Label>Signeringsmetode:</Label>
            <RadioGroup
              value={signatureMethod}
              onValueChange={(v) => setSignatureMethod(v as "click" | "pin")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pin" id="pin" />
                <Label htmlFor="pin" className="font-normal">PIN-kode</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="click" id="click" />
                <Label htmlFor="click" className="font-normal">Klikk-bekreftelse</Label>
              </div>
            </RadioGroup>
          </div>
          
          {signatureMethod === "pin" && (
            <div className="space-y-2">
              <Label htmlFor="pin-input">PIN:</Label>
              <Input
                id="pin-input"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
                placeholder="• • • •"
                className="text-center tracking-widest text-lg"
              />
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Checkbox
              id="confirm"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked === true)}
            />
            <Label htmlFor="confirm" className="text-sm font-normal">
              Jeg har lest og forstått innholdet
            </Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button
            onClick={handleSign}
            disabled={
              !confirmed || 
              (signatureMethod === "pin" && pinCode.length !== 4) ||
              acknowledgeHandbook.isPending
            }
          >
            {acknowledgeHandbook.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Signer og bekreft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
