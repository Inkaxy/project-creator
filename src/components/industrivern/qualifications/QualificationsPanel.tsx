import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  GraduationCap,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle
} from "lucide-react";
import { 
  useIndustrivernQualifications, 
  useExpiringQualifications,
  usePersonnelQualifications 
} from "@/hooks/useIndustrivernQualifications";
import { useIndustrivernPersonnel } from "@/hooks/useIndustrivernPersonnel";
import { INDUSTRIVERN_ROLE_LABELS } from "@/types/industrivern";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { AddQualificationModal } from "./AddQualificationModal";

export function QualificationsPanel() {
  const { data: qualifications, isLoading: loadingQuals } = useIndustrivernQualifications();
  const { data: expiringQuals, isLoading: loadingExpiring } = useExpiringQualifications(60);
  const { data: personnel, isLoading: loadingPersonnel } = useIndustrivernPersonnel();
  const { data: personnelQuals } = usePersonnelQualifications();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | undefined>();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "valid":
        return <Badge className="bg-green-100 text-green-800">Gyldig</Badge>;
      case "expiring_soon":
        return <Badge className="bg-yellow-100 text-yellow-800">Utløper snart</Badge>;
      case "expired":
        return <Badge variant="destructive">Utløpt</Badge>;
      case "revoked":
        return <Badge variant="outline">Tilbakekalt</Badge>;
      default:
        return null;
    }
  };

  const handleAddQualification = (profileId?: string) => {
    setSelectedProfileId(profileId);
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Kvalifikasjoner</h2>
          <p className="text-muted-foreground">
            Kompetansekrav og sertifiseringer for industrivern
          </p>
        </div>
        <Button onClick={() => handleAddQualification()}>
          <Plus className="h-4 w-4 mr-2" />
          Registrer kvalifikasjon
        </Button>
      </div>

      {/* Expiring Qualifications Alert */}
      {!loadingExpiring && expiringQuals && expiringQuals.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              Kvalifikasjoner som utløper snart
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiringQuals.map((qual: any) => (
                <div key={qual.id} className="flex items-center justify-between p-2 bg-background rounded-lg">
                  <div>
                    <span className="font-medium">{qual.profiles?.full_name}</span>
                    <span className="text-muted-foreground mx-2">·</span>
                    <span>{qual.industrivern_qualifications?.name}</span>
                  </div>
                  <Badge variant="outline" className="text-yellow-700">
                    <Clock className="h-3 w-3 mr-1" />
                    {format(new Date(qual.expires_date), "d. MMM yyyy", { locale: nb })}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Qualification Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Kvalifikasjonskrav per rolle</CardTitle>
          <CardDescription>
            Oversikt over påkrevde kvalifikasjoner for hver industrivernrolle
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingQuals ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : qualifications && qualifications.length > 0 ? (
            <div className="space-y-4">
              {qualifications.map((qual) => (
                <div key={qual.id} className="p-4 rounded-lg border">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-primary" />
                        <span className="font-semibold">{qual.name}</span>
                        {qual.code && (
                          <Badge variant="outline" className="text-xs">
                            {qual.code}
                          </Badge>
                        )}
                      </div>
                      {qual.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {qual.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {qual.required_for_roles?.map((role) => (
                          <Badge key={role} variant="secondary" className="text-xs">
                            {INDUSTRIVERN_ROLE_LABELS[role]}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {qual.training_hours && (
                        <div>{qual.training_hours} timer</div>
                      )}
                      {qual.validity_months ? (
                        <div>Gyldig i {qual.validity_months} mnd</div>
                      ) : (
                        <div>Ingen utløp</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Ingen kvalifikasjoner definert ennå</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personnel Qualifications Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Personell-kvalifikasjoner</CardTitle>
          <CardDescription>
            Status for kvalifikasjoner hos industrivern-personell
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingPersonnel ? (
            <Skeleton className="h-48 w-full" />
          ) : personnel && personnel.length > 0 ? (
            <div className="space-y-3">
              {personnel.map((person) => {
                const personQuals = personnelQuals?.filter(
                  (q) => q.profile_id === person.profile_id
                ) || [];

                return (
                  <div key={person.id} className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium">{person.profiles?.full_name}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {INDUSTRIVERN_ROLE_LABELS[person.role]}
                        </Badge>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleAddQualification(person.profile_id)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Legg til
                      </Button>
                    </div>
                    {personQuals.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {personQuals.map((q) => (
                          <div 
                            key={q.id} 
                            className="flex items-center gap-1 text-sm bg-muted rounded-full px-2 py-1"
                          >
                            {q.status === "valid" ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : q.status === "expiring_soon" ? (
                              <Clock className="h-3 w-3 text-yellow-600" />
                            ) : (
                              <XCircle className="h-3 w-3 text-red-600" />
                            )}
                            {q.industrivern_qualifications?.name}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Ingen kvalifikasjoner registrert
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Ingen personell i industrivernet</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AddQualificationModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal}
        preselectedProfileId={selectedProfileId}
      />
    </div>
  );
}
