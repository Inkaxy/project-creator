import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import { StatusBadge } from "@/components/ui/status-badge";
import { pendingApprovals } from "@/data/mockData";
import {
  Search,
  Calendar,
  ArrowRightLeft,
  Clock,
  Receipt,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

const typeConfig = {
  absence: { icon: Calendar, label: "Fravær", color: "bg-primary-light text-primary" },
  shift_swap: { icon: ArrowRightLeft, label: "Vaktbytte", color: "bg-warning-light text-warning" },
  overtime: { icon: Clock, label: "Overtid", color: "bg-success-light text-success" },
  expense: { icon: Receipt, label: "Utgifter", color: "bg-muted text-muted-foreground" },
};

export default function ApprovalsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="pl-12 lg:pl-0">
          <h1 className="text-3xl font-bold text-foreground">Godkjenninger</h1>
          <p className="text-muted-foreground">
            Behandle søknader og forespørsler
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="bg-muted">
              <TabsTrigger value="pending" className="gap-2">
                Ventende
                <Badge variant="secondary" className="h-5 min-w-5 rounded-full">
                  {pendingApprovals.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="approved">Godkjent</TabsTrigger>
              <TabsTrigger value="rejected">Avslått</TabsTrigger>
              <TabsTrigger value="all">Alle</TabsTrigger>
            </TabsList>

            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Søk..." className="pl-10" />
            </div>
          </div>

          <TabsContent value="pending" className="space-y-4">
            {pendingApprovals.map((approval) => {
              const config = typeConfig[approval.type];
              const Icon = config.icon;

              return (
                <Card key={approval.id} className="transition-shadow hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-4">
                        <AvatarWithInitials name={approval.employeeName} size="lg" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-foreground">
                              {approval.employeeName}
                            </h3>
                            <Badge className={config.color}>
                              <Icon className="mr-1 h-3 w-3" />
                              {config.label}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">{approval.description}</p>
                          <div className="flex items-center gap-4 pt-2">
                            <StatusBadge status="pending" label="Venter godkjenning" />
                            <span className="text-xs text-muted-foreground">
                              Sendt {new Date(approval.date).toLocaleDateString("nb-NO")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 self-end sm:self-start">
                        <Button variant="outline" size="sm" className="gap-2">
                          <XCircle className="h-4 w-4" />
                          Avslå
                        </Button>
                        <Button size="sm" className="gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Godkjenn
                        </Button>
                      </div>
                    </div>

                    {/* Additional Details for Absence */}
                    {approval.type === "absence" && (
                      <div className="mt-4 rounded-lg border border-border bg-muted/50 p-4">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="mt-0.5 h-4 w-4 text-warning" />
                          <div className="text-sm">
                            <p className="font-medium text-foreground">
                              Overlappende vakter funnet
                            </p>
                            <p className="text-muted-foreground">
                              Denne forespørselen overlapper med 2 tilordnede vakter.
                              Ved godkjenning må vaktene håndteres.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="approved">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-success" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">Ingen godkjente</h3>
                <p className="text-muted-foreground">Godkjente søknader vises her</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rejected">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <XCircle className="h-12 w-12 text-destructive" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">Ingen avslåtte</h3>
                <p className="text-muted-foreground">Avslåtte søknader vises her</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">Alle søknader</h3>
                <p className="text-muted-foreground">Her vises alle søknader i historikken</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
