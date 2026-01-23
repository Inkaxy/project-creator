import { useState } from "react";
import { useEmployeeContracts } from "@/hooks/useGeneratedContracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SignContractModal } from "@/components/contracts/SignContractModal";
import { FileSignature, Download, Check, Clock, Eye } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import type { GeneratedContract } from "@/hooks/useGeneratedContracts";

interface EmployeeContractsSectionProps {
  employeeId: string;
}

export function EmployeeContractsSection({ employeeId }: EmployeeContractsSectionProps) {
  const { data: contracts, isLoading } = useEmployeeContracts(employeeId);
  const [selectedContract, setSelectedContract] = useState<GeneratedContract | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!contracts || contracts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        Ingen kontrakter generert ennå.
      </p>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'signed':
        return (
          <Badge variant="outline" className="text-success border-success">
            <Check className="mr-1 h-3 w-3" />
            Signert
          </Badge>
        );
      case 'pending_signature':
        return (
          <Badge variant="outline" className="text-warning border-warning">
            <Clock className="mr-1 h-3 w-3" />
            Venter på signatur
          </Badge>
        );
      case 'draft':
        return (
          <Badge variant="secondary">
            Utkast
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Kansellert
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <>
      <div className="space-y-2">
        {contracts.map((contract) => (
          <div
            key={contract.id}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileSignature className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {contract.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {contract.employee_signed_at 
                    ? `Signert ${format(new Date(contract.employee_signed_at), "d. MMM yyyy", { locale: nb })}`
                    : `Opprettet ${format(new Date(contract.created_at), "d. MMM yyyy", { locale: nb })}`
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(contract.status)}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setSelectedContract(contract)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              {contract.pdf_url && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => window.open(contract.pdf_url!, '_blank')}
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

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
