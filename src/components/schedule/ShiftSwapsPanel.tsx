import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployees } from "@/hooks/useEmployees";
import { ShiftData, useShifts } from "@/hooks/useShifts";
import {
  useShiftSwapRequests,
  useMySwapRequests,
  useCreateSwapRequest,
  useColleagueApproveSwap,
  useRejectSwap,
  useCancelSwapRequest,
  useManagerApproveSwap,
  useManagerRejectSwap,
  ShiftSwapRequest,
  SwapType,
} from "@/hooks/useShiftSwaps";
import {
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Clock,
  Calendar,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ShiftSwapsPanelProps {
  compact?: boolean;
}

export function ShiftSwapsPanel({ compact = false }: ShiftSwapsPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { isAdminOrManager } = useAuth();

  const { data: allRequests = [] } = useShiftSwapRequests();
  const { data: myRequests = [] } = useMySwapRequests();

  // For managers, show all pending requests
  // For employees, show their own requests and requests where they're the target
  const requests = isAdminOrManager() ? allRequests : myRequests;

  if (requests.length === 0) return null;

  const pendingCount = requests.filter(
    (r) => r.status === "pending_colleague" || r.status === "pending_manager"
  ).length;

  if (compact) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="border-secondary bg-secondary/30">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="h-4 w-4 text-secondary-foreground" />
                  <CardTitle className="text-sm font-medium">
                    Vaktbytter
                  </CardTitle>
                  {pendingCount > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      {pendingCount}
                    </Badge>
                  )}
                </div>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <ScrollArea className="max-h-[250px]">
                <div className="space-y-2">
                  {requests.map((request) => (
                    <SwapRequestCard key={request.id} request={request} compact />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowLeftRight className="h-5 w-5" />
          Vaktbytteforespørsler
          {pendingCount > 0 && (
            <Badge variant="secondary">{pendingCount} ventende</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-3">
            {requests.map((request) => (
              <SwapRequestCard key={request.id} request={request} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface SwapRequestCardProps {
  request: ShiftSwapRequest;
  compact?: boolean;
}

function SwapRequestCard({ request, compact = false }: SwapRequestCardProps) {
  const { user, isAdminOrManager } = useAuth();
  const colleagueApprove = useColleagueApproveSwap();
  const reject = useRejectSwap();
  const cancel = useCancelSwapRequest();
  const managerApprove = useManagerApproveSwap();
  const managerReject = useManagerRejectSwap();

  const isRequester = request.requester_id === user?.id;
  const isTarget = request.target_employee_id === user?.id;
  const isManager = isAdminOrManager();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("nb-NO", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const getSwapTypeLabel = (type: SwapType) => {
    switch (type) {
      case "swap":
        return "Bytte";
      case "giveaway":
        return "Gi bort";
      case "cover":
        return "Dekning";
    }
  };

  const getStatusBadge = () => {
    switch (request.status) {
      case "pending_colleague":
        return <Badge variant="secondary">Venter på kollega</Badge>;
      case "pending_manager":
        return <Badge className="bg-warning text-warning-foreground">Venter på leder</Badge>;
      case "approved":
        return <Badge className="bg-primary">Godkjent</Badge>;
      case "rejected":
        return <Badge variant="destructive">Avslått</Badge>;
      case "cancelled":
        return <Badge variant="outline">Kansellert</Badge>;
    }
  };

  return (
    <div className={cn("rounded-lg border bg-card p-3", compact && "p-2")}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {getSwapTypeLabel(request.swap_type)}
            </Badge>
            {getStatusBadge()}
          </div>

          <div className="mt-2 flex items-center gap-2">
            <AvatarWithInitials
              name={request.requester?.full_name || "?"}
              size="sm"
            />
            <span className={cn("font-medium", compact && "text-sm")}>
              {request.requester?.full_name}
            </span>
          </div>

          {/* Original shift */}
          {request.original_shift && (
            <div
              className={cn(
                "mt-2 flex items-center gap-2 text-muted-foreground",
                compact && "text-xs"
              )}
            >
              <Calendar className="h-3 w-3" />
              <span>{formatDate(request.original_shift.date)}</span>
              <Clock className="h-3 w-3" />
              <span>
                {request.original_shift.planned_start?.slice(0, 5)}-
                {request.original_shift.planned_end?.slice(0, 5)}
              </span>
              {request.original_shift.functions && (
                <span className="font-medium">
                  {request.original_shift.functions.name}
                </span>
              )}
            </div>
          )}

          {/* Target for swap */}
          {request.swap_type === "swap" && request.target_employee && (
            <div className="mt-2 flex items-center gap-2">
              <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
              <AvatarWithInitials
                name={request.target_employee.full_name}
                size="sm"
              />
              <span className="text-sm">{request.target_employee.full_name}</span>
            </div>
          )}

          {request.reason && (
            <p className="mt-2 text-sm text-muted-foreground">
              "{request.reason}"
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex gap-2">
        {/* Colleague needs to approve */}
        {isTarget && request.status === "pending_colleague" && (
          <>
            <Button
              size="sm"
              onClick={() => colleagueApprove.mutate(request.id)}
              disabled={colleagueApprove.isPending}
            >
              <Check className="mr-1 h-3 w-3" />
              Godkjenn
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => reject.mutate(request.id)}
              disabled={reject.isPending}
            >
              <X className="mr-1 h-3 w-3" />
              Avslå
            </Button>
          </>
        )}

        {/* Manager needs to approve */}
        {isManager && request.status === "pending_manager" && (
          <>
            <Button
              size="sm"
              onClick={() => managerApprove.mutate(request)}
              disabled={managerApprove.isPending}
            >
              <Check className="mr-1 h-3 w-3" />
              Godkjenn
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => managerReject.mutate(request.id)}
              disabled={managerReject.isPending}
            >
              <X className="mr-1 h-3 w-3" />
              Avslå
            </Button>
          </>
        )}

        {/* Requester can cancel */}
        {isRequester &&
          (request.status === "pending_colleague" ||
            request.status === "pending_manager") && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => cancel.mutate(request.id)}
              disabled={cancel.isPending}
            >
              Kanseller
            </Button>
          )}
      </div>
    </div>
  );
}

// Modal for creating a swap request
interface CreateSwapRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: ShiftData;
}

export function CreateSwapRequestModal({
  open,
  onOpenChange,
  shift,
}: CreateSwapRequestModalProps) {
  const [swapType, setSwapType] = useState<SwapType>("giveaway");
  const [targetEmployeeId, setTargetEmployeeId] = useState<string>("");
  const [reason, setReason] = useState("");

  const { data: employees = [] } = useEmployees();
  const createSwap = useCreateSwapRequest();

  // Get week dates for target shift selection
  const shiftDate = new Date(shift.date);
  const weekStart = new Date(shiftDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const { data: weekShifts = [] } = useShifts(
    weekStart.toISOString().split("T")[0],
    weekEnd.toISOString().split("T")[0]
  );

  // Filter to get target employee's shifts
  const targetShifts = weekShifts.filter(
    (s) => s.employee_id === targetEmployeeId && s.id !== shift.id
  );

  const handleSubmit = () => {
    createSwap.mutate(
      {
        originalShiftId: shift.id,
        swapType,
        targetEmployeeId: targetEmployeeId || undefined,
        reason: reason || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSwapType("giveaway");
          setTargetEmployeeId("");
          setReason("");
        },
      }
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("nb-NO", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vaktbytte</DialogTitle>
          <DialogDescription>
            Be om å bytte eller gi bort denne vakten
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current shift info */}
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="text-sm font-medium">Din vakt</p>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(shift.date)}</span>
              <Clock className="h-3 w-3" />
              <span>
                {shift.planned_start?.slice(0, 5)}-{shift.planned_end?.slice(0, 5)}
              </span>
            </div>
          </div>

          {/* Swap type */}
          <div>
            <Label className="mb-3 block">Hva vil du gjøre?</Label>
            <RadioGroup
              value={swapType}
              onValueChange={(v) => setSwapType(v as SwapType)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-3 rounded-lg border p-3">
                <RadioGroupItem value="giveaway" id="giveaway" />
                <Label htmlFor="giveaway" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <UserMinus className="h-4 w-4" />
                    <span>Gi bort vakten</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Vakten blir ledig og andre kan søke
                  </p>
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border p-3">
                <RadioGroupItem value="cover" id="cover" />
                <Label htmlFor="cover" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    <span>Be noen dekke</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Spør en kollega om å ta over vakten
                  </p>
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border p-3">
                <RadioGroupItem value="swap" id="swap" />
                <Label htmlFor="swap" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <ArrowLeftRight className="h-4 w-4" />
                    <span>Bytt med kollega</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Bytt vakt med en annen ansatt
                  </p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Target employee (for cover/swap) */}
          {(swapType === "cover" || swapType === "swap") && (
            <div>
              <Label className="mb-2 block">Hvem vil du spørre?</Label>
              <Select value={targetEmployeeId} onValueChange={setTargetEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg kollega" />
                </SelectTrigger>
                <SelectContent>
                  {employees
                    .filter((e) => e.id !== shift.employee_id)
                    .map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.full_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Reason */}
          <div>
            <Label className="mb-2 block">Grunn (valgfritt)</Label>
            <Textarea
              placeholder="Hvorfor trenger du å bytte?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              createSwap.isPending ||
              ((swapType === "cover" || swapType === "swap") && !targetEmployeeId)
            }
          >
            {createSwap.isPending ? "Sender..." : "Send forespørsel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
