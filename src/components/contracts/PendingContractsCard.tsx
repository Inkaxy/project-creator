import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileSignature, AlertTriangle, Clock } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { useMyPendingContracts, GeneratedContract } from "@/hooks/useGeneratedContracts";
import { SignContractModal } from "./SignContractModal";

interface PendingContractsCardProps {
  userId: string | undefined;
}

export function PendingContractsCard({ userId }: PendingContractsCardProps) {
  const { data: pendingContracts = [], isLoading } = useMyPendingContracts(userId);
  const [selectedContract, setSelectedContract] = useState<GeneratedContract | null>(null);

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  if (pendingContracts.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="border-warning bg-warning/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-warning">
            <AlertTriangle className="h-5 w-5" />
            Usignerte kontrakter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingContracts.map((contract) => (
            <div
              key={contract.id}
              className="flex items-center justify-between rounded-lg border border-border bg-background p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-light">
                  <FileSignature className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{contract.title}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      Sendt {format(new Date(contract.sent_at || contract.created_at), "d. MMM yyyy", { locale: nb })}
                    </span>
                  </div>
                </div>
              </div>
              <Button onClick={() => setSelectedContract(contract)}>
                <FileSignature className="mr-2 h-4 w-4" />
                Les og signer
              </Button>
            </div>
          ))}
          
          {pendingContracts.length > 1 && (
            <p className="text-center text-sm text-muted-foreground">
              Du har {pendingContracts.length} kontrakter som venter på signering
            </p>
          )}
        </CardContent>
      </Card>

      {selectedContract && (
        <SignContractModal
          contract={selectedContract}
          open={!!selectedContract}
          onOpenChange={(open) => !open && setSelectedContract(null)}
        />
      )}
    </>
  );
}
