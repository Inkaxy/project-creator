import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  FileText, 
  Bell, 
  ClipboardList,
  Building2,
  CheckCircle,
  Clock,
  Archive
} from "lucide-react";
import { useEmergencyPlans, useActiveEmergencyPlan, useAlertPlans, useActionCards } from "@/hooks/useEmergencyPlans";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

export function EmergencyPlanPanel() {
  const { data: plans, isLoading: loadingPlans } = useEmergencyPlans();
  const { data: activePlan } = useActiveEmergencyPlan();
  const { data: alertPlans, isLoading: loadingAlerts } = useAlertPlans(activePlan?.id);
  const { data: actionCards, isLoading: loadingCards } = useActionCards(activePlan?.id);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Aktiv</Badge>;
      case "draft":
        return <Badge variant="secondary">Utkast</Badge>;
      case "archived":
        return <Badge variant="outline">Arkivert</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Beredskapsplan</h2>
          <p className="text-muted-foreground">
            Varslingsplaner, tiltakskort og ressursoversikt
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Ny versjon
        </Button>
      </div>

      {/* Active Plan Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gjeldende beredskapsplan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingPlans ? (
            <Skeleton className="h-20 w-full" />
          ) : activePlan ? (
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Versjon {activePlan.version}</span>
                  {getStatusBadge(activePlan.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Godkjent {activePlan.approved_date 
                    ? format(new Date(activePlan.approved_date), "d. MMMM yyyy", { locale: nb })
                    : "Ikke godkjent"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Archive className="h-4 w-4 mr-2" />
                  Se historikk
                </Button>
                <Button variant="outline" size="sm">
                  Generer PDF
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium mb-2">Ingen beredskapsplan</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Opprett en beredskapsplan for å dokumentere varslingsrutiner og tiltak
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Opprett beredskapsplan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="alert-plans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alert-plans" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Varslingsplaner
          </TabsTrigger>
          <TabsTrigger value="action-cards" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Tiltakskort
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Ressurser
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alert-plans" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Varslingsrutiner for ulike typer hendelser
            </p>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ny varslingsplan
            </Button>
          </div>

          {loadingAlerts ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : alertPlans && alertPlans.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {alertPlans.map((plan) => (
                <Card key={plan.id}>
                  <CardHeader>
                    <CardTitle className="text-lg capitalize">
                      {plan.incident_type.replace(/_/g, " ")}
                    </CardTitle>
                    {plan.notify_neighbors && (
                      <Badge variant="outline">Varsler naboer</Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-2">
                      {plan.alert_sequence.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center">
                            {step.step}
                          </span>
                          <span>{step.action}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Ingen varslingsplaner opprettet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="action-cards" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Tiltakskort for innsatspersonell
            </p>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nytt tiltakskort
            </Button>
          </div>

          {loadingCards ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : actionCards && actionCards.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {actionCards.map((card) => (
                <Card key={card.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                    <CardDescription className="capitalize">
                      {card.incident_type.replace(/_/g, " ")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground mb-1">
                        Umiddelbare tiltak
                      </p>
                      <ul className="space-y-1">
                        {card.immediate_actions.slice(0, 3).map((action, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            {action}
                          </li>
                        ))}
                        {card.immediate_actions.length > 3 && (
                          <li className="text-sm text-muted-foreground">
                            +{card.immediate_actions.length - 3} flere tiltak
                          </li>
                        )}
                      </ul>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      Vis komplett kort
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Ingen tiltakskort opprettet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Interne og eksterne ressurser for beredskap
            </p>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Legg til ressurs
            </Button>
          </div>

          <Card>
            <CardContent className="py-8 text-center">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Ingen ressurser registrert</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
