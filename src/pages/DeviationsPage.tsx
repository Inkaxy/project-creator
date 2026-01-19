import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDeviations, useDeviationStats, Deviation } from "@/hooks/useDeviations";
import { AssignDeviationModal } from "@/components/deviation/AssignDeviationModal";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import {
  AlertTriangle,
  Plus,
  Clock,
  CheckCircle2,
  Lightbulb,
  AlertOctagon,
  UserPlus,
  XCircle,
} from "lucide-react";

const statusColors: Record<string, string> = {
  open: "destructive",
  in_progress: "warning",
  resolved: "default",
  closed: "secondary",
};

const statusLabels: Record<string, string> = {
  open: "Åpen",
  in_progress: "Under behandling",
  resolved: "Løst",
  closed: "Lukket",
};

const categoryIcons: Record<string, React.ElementType> = {
  idea: Lightbulb,
  concern: AlertTriangle,
  accident: AlertOctagon,
};

export default function DeviationsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: deviations = [], isLoading } = useDeviations(statusFilter);
  const { data: stats } = useDeviationStats();

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedDeviation, setSelectedDeviation] = useState<Deviation | null>(null);

  const handleAssign = (deviation: Deviation) => {
    setSelectedDeviation(deviation);
    setAssignModalOpen(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Avvikshåndtering</h1>
            <p className="text-muted-foreground">Oversikt over alle meldte avvik</p>
          </div>
          <Button asChild>
            <Link to="/meld-avvik">
              <Plus className="mr-2 h-4 w-4" />
              Meld avvik
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Åpne</p>
                  <p className="text-2xl font-bold">{stats?.byStatus?.open || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Under behandling</p>
                  <p className="text-2xl font-bold">{stats?.byStatus?.in_progress || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lukket</p>
                  <p className="text-2xl font-bold">{stats?.byStatus?.closed || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Lightbulb className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Totalt</p>
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">Alle</TabsTrigger>
            <TabsTrigger value="open">Åpne</TabsTrigger>
            <TabsTrigger value="in_progress">Under behandling</TabsTrigger>
            <TabsTrigger value="closed">Lukket</TabsTrigger>
          </TabsList>

          <TabsContent value={statusFilter} className="mt-4">
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-6 text-center text-muted-foreground">Laster...</div>
                ) : deviations.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    Ingen avvik funnet
                  </div>
                ) : (
                  <div className="divide-y">
                    {deviations.map((deviation) => {
                      const Icon = categoryIcons[deviation.category] || AlertTriangle;
                      return (
                        <div
                          key={deviation.id}
                          className="flex items-center justify-between p-4 hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium">{deviation.title}</p>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                <span>
                                  {format(new Date(deviation.created_at), "d. MMM yyyy", {
                                    locale: nb,
                                  })}
                                </span>
                                {deviation.department?.name && (
                                  <>
                                    <span>•</span>
                                    <span>{deviation.department.name}</span>
                                  </>
                                )}
                                {deviation.location && (
                                  <>
                                    <span>•</span>
                                    <span>{deviation.location}</span>
                                  </>
                                )}
                                {deviation.assignee?.full_name && (
                                  <>
                                    <span>•</span>
                                    <span className="text-primary">
                                      Tildelt: {deviation.assignee.full_name}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {deviation.require_clock_out_confirmation && (
                              <Badge variant="outline" className="border-warning text-warning">
                                Må bekreftes
                              </Badge>
                            )}
                            <Badge variant={statusColors[deviation.status] as "destructive" | "warning" | "default" | "secondary"}>
                              {statusLabels[deviation.status]}
                            </Badge>
                            {deviation.status === "open" && !deviation.assigned_to && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAssign(deviation)}
                              >
                                <UserPlus className="mr-1 h-4 w-4" />
                                Tildel
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AssignDeviationModal
        deviation={selectedDeviation}
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
      />
    </MainLayout>
  );
}
