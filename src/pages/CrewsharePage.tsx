import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Users, 
  Building2, 
  CalendarClock, 
  Settings,
  Plus,
  Search,
  Filter,
  Star,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Briefcase,
  TrendingUp,
} from "lucide-react";
import { AvailableShiftsPanel } from "@/components/crewshare/AvailableShiftsPanel";
import { MyPoolShiftsPanel } from "@/components/crewshare/MyPoolShiftsPanel";
import { PoolSettingsPanel } from "@/components/crewshare/PoolSettingsPanel";
import { PartnerOrganizationsPanel } from "@/components/crewshare/PartnerOrganizationsPanel";
import { PoolMembershipsPanel } from "@/components/crewshare/PoolMembershipsPanel";
import { PoolShiftRequestsPanel } from "@/components/crewshare/PoolShiftRequestsPanel";
import { CreatePoolShiftModal } from "@/components/crewshare/CreatePoolShiftModal";
import { useMyPoolSettings, useMyPoolShifts, useMyPoolShiftRequests } from "@/hooks/useCrewshare";

export default function CrewsharePage() {
  const { user, isAdminOrManager } = useAuth();
  const canManage = isAdminOrManager();
  
  const [activeTab, setActiveTab] = useState("available");
  const [showCreateShiftModal, setShowCreateShiftModal] = useState(false);
  
  const { data: poolSettings } = useMyPoolSettings();
  const { data: myShifts } = useMyPoolShifts();
  const { data: myRequests } = useMyPoolShiftRequests();
  
  const pendingRequests = myRequests?.filter(r => r.status === 'pending_employee') || [];
  const upcomingShifts = myShifts?.filter(s => new Date(s.date) >= new Date()) || [];
  
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Crewshare</h1>
            <p className="text-muted-foreground">
              Del personale med partnerbedrifter - trygt og enkelt
            </p>
          </div>
          
          {canManage && (
            <Button onClick={() => setShowCreateShiftModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Opprett poolvakt
            </Button>
          )}
        </div>
        
        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Min status</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {poolSettings?.is_available_for_pooling ? (
                  <>
                    <Badge variant="default" className="bg-green-500">Tilgjengelig</Badge>
                    <span className="text-xs text-muted-foreground">for utleie</span>
                  </>
                ) : (
                  <>
                    <Badge variant="secondary">Ikke aktiv</Badge>
                    <span className="text-xs text-muted-foreground">i poolen</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Kommende vakter</CardTitle>
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingShifts.length}</div>
              <p className="text-xs text-muted-foreground">eksterne oppdrag</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ventende</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingRequests.length}</div>
              <p className="text-xs text-muted-foreground">krever din respons</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Utleieandel</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12%</div>
              <p className="text-xs text-muted-foreground">
                av {poolSettings?.max_pool_percentage || 50}% maks
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Pending Requests Alert */}
        {pendingRequests.length > 0 && (
          <Card className="border-warning bg-warning/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <CardTitle className="text-base">Vakter venter på ditt svar</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pendingRequests.slice(0, 3).map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                    <div>
                      <p className="font-medium">{request.pool_shift?.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.pool_shift?.partner_organization?.name} • {request.pool_shift?.date}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Avslå</Button>
                      <Button size="sm">Aksepter</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
            <TabsTrigger value="available" className="gap-2">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Tilgjengelige</span>
            </TabsTrigger>
            <TabsTrigger value="my-shifts" className="gap-2">
              <CalendarClock className="h-4 w-4" />
              <span className="hidden sm:inline">Mine vakter</span>
            </TabsTrigger>
            {canManage && (
              <>
                <TabsTrigger value="requests" className="gap-2">
                  <Briefcase className="h-4 w-4" />
                  <span className="hidden sm:inline">Forespørsler</span>
                </TabsTrigger>
                <TabsTrigger value="partners" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Partnere</span>
                </TabsTrigger>
                <TabsTrigger value="memberships" className="gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Medlemskap</span>
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Innstillinger</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="available" className="mt-6">
            <AvailableShiftsPanel />
          </TabsContent>
          
          <TabsContent value="my-shifts" className="mt-6">
            <MyPoolShiftsPanel />
          </TabsContent>
          
          {canManage && (
            <>
              <TabsContent value="requests" className="mt-6">
                <PoolShiftRequestsPanel />
              </TabsContent>
              
              <TabsContent value="partners" className="mt-6">
                <PartnerOrganizationsPanel />
              </TabsContent>
              
              <TabsContent value="memberships" className="mt-6">
                <PoolMembershipsPanel />
              </TabsContent>
            </>
          )}
          
          <TabsContent value="settings" className="mt-6">
            <PoolSettingsPanel />
          </TabsContent>
        </Tabs>
      </div>
      
      {showCreateShiftModal && (
        <CreatePoolShiftModal
          open={showCreateShiftModal}
          onOpenChange={setShowCreateShiftModal}
        />
      )}
    </MainLayout>
  );
}
