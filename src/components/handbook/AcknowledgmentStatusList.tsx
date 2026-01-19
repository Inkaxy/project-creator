import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import { useAcknowledgmentStatuses } from "@/hooks/useHandbook";
import { useDepartments } from "@/hooks/useEmployees";
import { Search, Send, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { toast } from "sonner";

interface AcknowledgmentStatusListProps {
  handbookId: string;
  version: string;
}

export function AcknowledgmentStatusList({ handbookId, version }: AcknowledgmentStatusListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  
  const { data: statuses = [], isLoading } = useAcknowledgmentStatuses(handbookId);
  const { data: departments = [] } = useDepartments();
  
  const filteredStatuses = statuses.filter(s => {
    const matchesSearch = s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    const matchesDepartment = departmentFilter === "all" || s.department_id === departmentFilter;
    return matchesSearch && matchesStatus && matchesDepartment;
  });
  
  const stats = {
    acknowledged: statuses.filter(s => s.status === "acknowledged").length,
    pending: statuses.filter(s => s.status === "pending").length,
    outdated: statuses.filter(s => s.status === "outdated").length,
  };
  
  const handleSendReminders = () => {
    const pendingCount = statuses.filter(s => s.status !== "acknowledged").length;
    toast.success(`Påminnelse sendt til ${pendingCount} ansatte`);
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "acknowledged":
        return (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircle className="h-3 w-3" />
            Signert
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Venter
          </Badge>
        );
      case "outdated":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Utdatert
          </Badge>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.acknowledged}</p>
                <p className="text-sm text-muted-foreground">Signert</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Ikke lest</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.outdated}</p>
                <p className="text-sm text-muted-foreground">Utdatert</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex items-center justify-between">
        <Button onClick={handleSendReminders} className="gap-2">
          <Send className="h-4 w-4" />
          Send påminnelse til alle som mangler
        </Button>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-48"
            />
          </div>
          
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Alle avdelinger" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle avdelinger</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Alle statuser" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle statuser</SelectItem>
              <SelectItem value="acknowledged">Signert</SelectItem>
              <SelectItem value="pending">Venter</SelectItem>
              <SelectItem value="outdated">Utdatert</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ansatt</TableHead>
              <TableHead>Avdeling</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Signert</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Laster...
                </TableCell>
              </TableRow>
            ) : filteredStatuses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Ingen ansatte funnet
                </TableCell>
              </TableRow>
            ) : (
              filteredStatuses.map(status => (
                <TableRow key={status.employee_id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <AvatarWithInitials name={status.full_name} />
                      <div>
                        <p className="font-medium">{status.full_name}</p>
                        <p className="text-sm text-muted-foreground">{status.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{status.department_name || "-"}</TableCell>
                  <TableCell>{getStatusBadge(status.status)}</TableCell>
                  <TableCell>
                    {status.acknowledged_at ? (
                      <div>
                        <p>{format(new Date(status.acknowledged_at), "d. MMM yyyy", { locale: nb })}</p>
                        {status.acknowledged_version !== status.current_version && (
                          <p className="text-xs text-muted-foreground">v{status.acknowledged_version}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
