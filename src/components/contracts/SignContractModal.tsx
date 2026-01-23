import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileSignature, Check, Download, AlertCircle, Eye } from "lucide-react";
import { GeneratedContract, useSignContract, useConfirmContractRead } from "@/hooks/useGeneratedContracts";
import { ContractPreview } from "./ContractPreview";

interface SignContractModalProps {
  contract: GeneratedContract;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignContractModal({ contract, open, onOpenChange }: SignContractModalProps) {
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hasConfirmedRead, setHasConfirmedRead] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const signContract = useSignContract();
  const confirmRead = useConfirmContractRead();

  // Track scroll progress
  const handleScroll = () => {
    if (!scrollRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const progress = Math.min((scrollTop / (scrollHeight - clientHeight)) * 100, 100);
    setScrollProgress(progress);
    
    if (progress >= 95) {
      setHasScrolledToEnd(true);
      // Auto-confirm read when scrolled to end
      if (!contract.employee_read_confirmed_at) {
        confirmRead.mutate(contract.id);
      }
    }
  };

  // Get user's IP address
  const getIpAddress = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  };

  const handleSign = async () => {
    if (!hasConfirmedRead) return;
    
    setIsSigning(true);
    try {
      const ip = await getIpAddress();
      await signContract.mutateAsync({
        contract_id: contract.id,
        signature_ip: ip,
      });
      onOpenChange(false);
    } finally {
      setIsSigning(false);
    }
  };

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setHasScrolledToEnd(!!contract.employee_read_confirmed_at);
      setScrollProgress(0);
      setHasConfirmedRead(false);
    }
  }, [open, contract.employee_read_confirmed_at]);

  const canSign = hasScrolledToEnd && hasConfirmedRead;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            {contract.title}
          </DialogTitle>
          <DialogDescription>
            Les gjennom kontrakten og signer digitalt nederst
          </DialogDescription>
        </DialogHeader>

        {/* Scroll progress indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {hasScrolledToEnd ? (
                  <span className="text-success flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Du har lest hele kontrakten
                  </span>
                ) : (
                  "Scroll ned for å lese hele kontrakten"
                )}
              </span>
            </div>
            <Badge variant={hasScrolledToEnd ? "default" : "secondary"}>
              {Math.round(scrollProgress)}%
            </Badge>
          </div>
          <Progress value={scrollProgress} className="h-2" />
        </div>

        {/* Contract content */}
        <ScrollArea 
          className="flex-1 border rounded-lg" 
          ref={scrollRef}
          onScrollCapture={handleScroll}
        >
          <div className="p-6">
            <ContractPreview content={contract.content} />
          </div>
        </ScrollArea>

        {/* Signing section */}
        <div className="space-y-4 pt-4 border-t">
          {!hasScrolledToEnd && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                Du må lese gjennom hele kontrakten før du kan signere
              </span>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="confirm-read"
              checked={hasConfirmedRead}
              onCheckedChange={(checked) => setHasConfirmedRead(checked === true)}
              disabled={!hasScrolledToEnd}
            />
            <Label
              htmlFor="confirm-read"
              className={!hasScrolledToEnd ? "text-muted-foreground" : ""}
            >
              Jeg har lest og forstått innholdet i denne arbeidsavtalen
            </Label>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            {contract.pdf_url && (
              <Button variant="outline" asChild>
                <a href={contract.pdf_url} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" />
                  Last ned PDF
                </a>
              </Button>
            )}
            <Button
              onClick={handleSign}
              disabled={!canSign || isSigning}
              className="min-w-[150px]"
            >
              {isSigning ? (
                "Signerer..."
              ) : (
                <>
                  <FileSignature className="mr-2 h-4 w-4" />
                  Signer kontrakt
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
