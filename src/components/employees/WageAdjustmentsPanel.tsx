import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  Loader2,
  Check,
  X,
  Download,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import {
  useWageAdjustments,
  useUpdateWageAdjustmentStatus,
  WageAdjustment,
} from "@/hooks/useWageAdjustments";

export function WageAdjustmentsPanel() {
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const { data: adjustments, isLoading } = useWageAdjustments(statusFilter || undefined);
  const updateStatus = useUpdateWageAdjustmentStatus();

  const handleApprove = (id: string) => {
    updateStatus.mutate({ id, status: "approved" });
  };

  const handleReject = (id: string) => {
    updateStatus.mutate({ id, status: "rejected" });
  };

  const handleMarkAsPaid = (id: string) => {
    updateStatus.mutate({ id, status: "paid" });
  };

  const handleMarkAllAsPaid = () => {
    const exportedAdjustments = adjustments?.filter(a => a.status === "exported") || [];
    if (exportedAdjustments.length === 0) return;
    
    exportedAdjustments.forEach(adj => {
      updateStatus.mutate({ id: adj.id, status: "paid" });
    });
  };

  const handleExport = () => {
    // Export approved adjustments as CSV
    const approvedAdjustments = adjustments?.filter(a => a.status === "approved") || [];
    if (approvedAdjustments.length === 0) {
      return;
    }

    const csvContent = [
      ["Ansatt", "Periode", "Timer", "Gammel sats", "Ny sats", "Differanse", "Totalt"].join(";"),
      ...approvedAdjustments.map(a => [
        a.employee?.full_name || "",
        `${format(new Date(a.period_start), "dd.MM.yyyy")} - ${format(new Date(a.period_end), "dd.MM.yyyy")}`,
        a.total_hours.toString().replace(".", ","),
        a.old_rate.toString().replace(".", ","),
        a.new_rate.toString().replace(".", ","),
        a.difference_per_hour.toString().replace(".", ","),
        a.total_adjustment.toString().replace(".", ","),
      ].join(";"))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `etterbetalinger-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    // Mark as exported
    approvedAdjustments.forEach(adj => {
      updateStatus.mutate({ id: adj.id, status: "exported" });
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-amber-600 border-amber-300"><Clock className="h-3 w-3 mr-1" />Venter</Badge>;
      case "approved":
        return <Badge variant="outline" className="text-green-600 border-green-300"><Check className="h-3 w-3 mr-1" />Godkjent</Badge>;
      case "exported":
        return <Badge variant="outline" className="text-blue-600 border-blue-300"><Download className="h-3 w-3 mr-1" />Eksportert</Badge>;
      case "paid":
        return <Badge variant="outline" className="text-primary"><DollarSign className="h-3 w-3 mr-1" />Utbetalt</Badge>;
      case "rejected":
        return <Badge variant="outline" className="text-destructive border-destructive/30"><X className="h-3 w-3 mr-1" />Avvist</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("nb-NO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " kr";
  };

  const pendingCount = adjustments?.filter(a => a.status === "pending").length || 0;
  const approvedCount = adjustments?.filter(a => a.status === "approved").length || 0;
  const exportedCount = adjustments?.filter(a => a.status === "exported").length || 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5" />
            Etterbetalinger
            {pendingCount > 0 && (
              <Badge variant="secondary">{pendingCount} venter</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filtrer status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="pending">Venter</SelectItem>
                <SelectItem value="approved">Godkjent</SelectItem>
                <SelectItem value="exported">Eksportert</SelectItem>
                <SelectItem value="paid">Utbetalt</SelectItem>
                <SelectItem value="rejected">Avvist</SelectItem>
              </SelectContent>
            </Select>
            {approvedCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Eksporter ({approvedCount})
              </Button>
            )}
            {exportedCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllAsPaid} className="text-green-600 hover:text-green-700">
                <Check className="h-4 w-4 mr-2" />
                Merk utbetalt ({exportedCount})
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : adjustments?.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Ingen etterbetalinger funnet.
          </p>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {adjustments?.map((adjustment) => (
                <AdjustmentCard
                  key={adjustment.id}
                  adjustment={adjustment}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onMarkAsPaid={handleMarkAsPaid}
                  getStatusBadge={getStatusBadge}
                  formatCurrency={formatCurrency}
                  isPending={updateStatus.isPending}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

interface AdjustmentCardProps {
  adjustment: WageAdjustment;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onMarkAsPaid: (id: string) => void;
  getStatusBadge: (status: string) => React.ReactNode;
  formatCurrency: (amount: number) => string;
  isPending: boolean;
}

function AdjustmentCard({
  adjustment,
  onApprove,
  onReject,
  onMarkAsPaid,
  getStatusBadge,
  formatCurrency,
  isPending,
}: AdjustmentCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{adjustment.employee?.full_name || "Ukjent ansatt"}</span>
            {getStatusBadge(adjustment.status)}
          </div>
          <p className="text-sm text-muted-foreground">
            Periode: {format(new Date(adjustment.period_start), "dd.MM.yyyy", { locale: nb })} - {format(new Date(adjustment.period_end), "dd.MM.yyyy", { locale: nb })}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">{adjustment.total_hours.toLocaleString("nb-NO")} t × </span>
            <span className="text-muted-foreground">(+{formatCurrency(adjustment.difference_per_hour)}/t)</span>
            <span className="font-medium ml-2">= {formatCurrency(adjustment.total_adjustment)}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Gammel sats: {formatCurrency(adjustment.old_rate)} → Ny sats: {formatCurrency(adjustment.new_rate)}
          </p>
        </div>

        {adjustment.status === "pending" && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onApprove(adjustment.id)}
              disabled={isPending}
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <Check className="h-4 w-4 mr-1" />
              Godkjenn
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReject(adjustment.id)}
              disabled={isPending}
              className="text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4 mr-1" />
              Avvis
            </Button>
          </div>
        )}

        {adjustment.status === "exported" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMarkAsPaid(adjustment.id)}
            disabled={isPending}
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
          >
            <DollarSign className="h-4 w-4 mr-1" />
            Merk utbetalt
          </Button>
        )}
      </div>
    </Card>
  );
}
