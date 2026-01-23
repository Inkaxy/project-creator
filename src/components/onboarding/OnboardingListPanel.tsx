import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  MoreHorizontal, 
  Send, 
  Eye, 
  XCircle, 
  FileSignature,
  ExternalLink,
  Copy
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { useOnboardings, useCancelOnboarding, useResendInvitation } from "@/hooks/useOnboardings";
import { OnboardingStatusBadge } from "./OnboardingStatusBadge";
import { OnboardingDetailModal } from "./OnboardingDetailModal";
import type { EmployeeOnboarding } from "@/hooks/useOnboardings";
import { toast } from "sonner";

export function OnboardingListPanel() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOnboarding, setSelectedOnboarding] = useState<EmployeeOnboarding | null>(null);
  
  const { data: onboardings = [], isLoading } = useOnboardings(statusFilter);
  const cancelOnboarding = useCancelOnboarding();
  const resendInvitation = useResendInvitation();

  const handleCopyLink = (token: string) => {
    const link = `${window.location.origin}/onboarding/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Lenke kopiert til utklippstavle");
  };

  const activeOnboardings = onboardings.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  const completedOnboardings = onboardings.filter(o => o.status === 'completed');

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg">
            Pågående onboardinger
            <Badge variant="secondary" className="ml-2">
              {activeOnboardings.length}
            </Badge>
          </CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrer status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="invited">Invitert</SelectItem>
              <SelectItem value="info_pending">Venter på info</SelectItem>
              <SelectItem value="account_pending">Venter på konto</SelectItem>
              <SelectItem value="contract_pending">Venter på kontrakt</SelectItem>
              <SelectItem value="signature_pending">Venter på signatur</SelectItem>
              <SelectItem value="completed">Fullført</SelectItem>
              <SelectItem value="cancelled">Avbrutt</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : onboardings.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Ingen onboardinger funnet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Navn</TableHead>
                    <TableHead>E-post</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Startdato</TableHead>
                    <TableHead>Opprettet</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {onboardings.map((onboarding) => (
                    <TableRow key={onboarding.id}>
                      <TableCell className="font-medium">
                        {onboarding.full_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {onboarding.email}
                      </TableCell>
                      <TableCell>
                        <OnboardingStatusBadge status={onboarding.status} />
                      </TableCell>
                      <TableCell>
                        {onboarding.start_date 
                          ? format(new Date(onboarding.start_date), "d. MMM yyyy", { locale: nb })
                          : "-"
                        }
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(onboarding.created_at), "d. MMM", { locale: nb })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem onClick={() => setSelectedOnboarding(onboarding)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Se detaljer
                            </DropdownMenuItem>
                            
                            {onboarding.invitation_token && (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => handleCopyLink(onboarding.invitation_token!)}
                                >
                                  <Copy className="mr-2 h-4 w-4" />
                                  Kopier lenke
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => window.open(`/onboarding/${onboarding.invitation_token}`, '_blank')}
                                >
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  Åpne onboarding-side
                                </DropdownMenuItem>
                              </>
                            )}

                            {onboarding.status === 'invited' && (
                              <DropdownMenuItem 
                                onClick={() => resendInvitation.mutate(onboarding.id)}
                              >
                                <Send className="mr-2 h-4 w-4" />
                                Send påminnelse
                              </DropdownMenuItem>
                            )}

                            {(onboarding.status === 'contract_pending' || onboarding.status === 'account_pending') && (
                              <DropdownMenuItem>
                                <FileSignature className="mr-2 h-4 w-4" />
                                Generer kontrakt
                              </DropdownMenuItem>
                            )}

                            {onboarding.status !== 'completed' && onboarding.status !== 'cancelled' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => cancelOnboarding.mutate(onboarding.id)}
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Avbryt onboarding
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pågående
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeOnboardings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fullført denne måneden
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedOnboardings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gjennomsnittlig tid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3 dager</div>
          </CardContent>
        </Card>
      </div>

      {selectedOnboarding && (
        <OnboardingDetailModal
          onboarding={selectedOnboarding}
          open={!!selectedOnboarding}
          onOpenChange={(open) => !open && setSelectedOnboarding(null)}
        />
      )}
    </>
  );
}
