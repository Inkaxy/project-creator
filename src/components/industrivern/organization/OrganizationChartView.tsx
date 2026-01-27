import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, HardHat, Users } from "lucide-react";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import { useIndustrivernPersonnel } from "@/hooks/useIndustrivernPersonnel";
import { INDUSTRIVERN_ROLE_LABELS, IndustrivernRole } from "@/types/industrivern";
import { Skeleton } from "@/components/ui/skeleton";

export function OrganizationChartView() {
  const { data: personnel, isLoading } = useIndustrivernPersonnel();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center space-y-8 py-8">
        <Skeleton className="h-32 w-64" />
        <Skeleton className="h-1 w-px bg-border" />
        <div className="flex gap-8">
          <Skeleton className="h-24 w-40" />
          <Skeleton className="h-24 w-40" />
          <Skeleton className="h-24 w-40" />
        </div>
      </div>
    );
  }

  // Get industrivernleder (main leader)
  const industrivernleder = personnel?.find(
    (p) => p.role === "industrivernleder" && !p.is_deputy
  );
  const industrivernlederDeputy = personnel?.find(
    (p) => p.role === "industrivernleder" && p.is_deputy
  );

  // Get fagledere (shift leaders)
  const fagledere = personnel?.filter((p) => p.role === "fagleder_industrivern") || [];

  // Get innsatspersoner (response personnel) grouped by role
  const innsatspersoner = personnel?.filter((p) => p.role === "innsatsperson") || [];
  const brannvern = personnel?.filter((p) => p.role === "brannvern") || [];
  const forstehjelp = personnel?.filter((p) => p.role === "forstehjelp") || [];
  const ordenSikring = personnel?.filter((p) => p.role === "orden_sikring") || [];
  const miljoKjemikalievern = personnel?.filter((p) => p.role === "miljo_kjemikalievern") || [];
  const roykdykkere = personnel?.filter((p) => p.role === "roykdykker") || [];
  const kjemikaliedykkere = personnel?.filter((p) => p.role === "kjemikaliedykker") || [];
  const redningsstab = personnel?.filter((p) => p.role === "redningsstab") || [];

  // All response personnel for counting
  const allResponsePersonnel = [
    ...innsatspersoner,
    ...brannvern,
    ...forstehjelp,
    ...ordenSikring,
    ...miljoKjemikalievern,
    ...roykdykkere,
    ...kjemikaliedykkere,
    ...redningsstab,
  ];

  // If no industrivernleder, show empty state
  if (!industrivernleder) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <HardHat className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground">
          Ingen industrivernleder er tildelt ennå.
        </p>
        <p className="text-sm text-muted-foreground">
          Legg til personell for å bygge organisasjonskartet.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-8 overflow-x-auto">
      {/* Industrivernleder (Top of hierarchy) */}
      <Card className="border-2 border-primary/30 bg-primary/5 min-w-[200px]">
        <CardContent className="p-4 text-center">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
              <HardHat className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h3 className="font-semibold text-foreground">
            {industrivernleder.profiles?.full_name || "Ikke tildelt"}
          </h3>
          <p className="text-sm text-primary font-medium">Industrivernleder</p>
          {(industrivernleder.emergency_phone || industrivernleder.profiles?.phone) && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <Phone className="h-3 w-3" />
              {industrivernleder.emergency_phone || industrivernleder.profiles?.phone}
            </p>
          )}
          {industrivernlederDeputy && (
            <Badge variant="outline" className="mt-2 text-xs">
              Stedfortreder: {industrivernlederDeputy.profiles?.full_name}
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Vertical connector line */}
      {fagledere.length > 0 && (
        <div className="w-px h-8 bg-border" />
      )}

      {/* Fagledere (Middle tier) */}
      {fagledere.length > 0 && (
        <>
          {/* Horizontal line connecting fagledere */}
          <div className="relative flex items-start">
            {fagledere.length > 1 && (
              <div 
                className="absolute top-0 left-1/2 -translate-x-1/2 h-px bg-border"
                style={{ 
                  width: `calc(${(fagledere.length - 1) * 100}% / ${fagledere.length} * ${fagledere.length})`,
                  maxWidth: `${(fagledere.length - 1) * 180 + 40}px`
                }}
              />
            )}
          </div>

          <div className="flex gap-4 md:gap-8 flex-wrap justify-center">
            {fagledere.map((fagleder, index) => (
              <div key={fagleder.id} className="flex flex-col items-center">
                {/* Vertical line from horizontal connector */}
                <div className="w-px h-4 bg-border" />
                
                <Card className="min-w-[140px] border border-border">
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">
                      {index === 0 ? "Dagskift" : index === 1 ? "Kveldskift" : "Nattskift"}
                    </p>
                    <h4 className="font-medium text-sm">
                      {fagleder.profiles?.full_name || "Ikke tildelt"}
                    </h4>
                    <p className="text-xs text-muted-foreground">Fagleder</p>
                  </CardContent>
                </Card>

                {/* Connector to innsatspersoner */}
                <div className="w-px h-4 bg-border" />

                {/* Innsatspersoner count box */}
                <Card className="bg-muted/50 border-dashed">
                  <CardContent className="p-3 text-center">
                    <p className="font-medium text-sm">
                      {Math.ceil(allResponsePersonnel.length / Math.max(fagledere.length, 1))} pers
                    </p>
                    <p className="text-xs text-muted-foreground">Innsats</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </>
      )}

      {/* If no fagledere but has response personnel, show them directly */}
      {fagledere.length === 0 && allResponsePersonnel.length > 0 && (
        <>
          <div className="w-px h-8 bg-border" />
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{allResponsePersonnel.length} pers</span>
              </div>
              <p className="text-xs text-muted-foreground">Innsatspersonell</p>
            </CardContent>
          </Card>
        </>
      )}

      {/* Role breakdown legend */}
      {allResponsePersonnel.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2 justify-center">
          {brannvern.length > 0 && (
            <Badge variant="outline" className="text-xs">
              🔥 Brannvern: {brannvern.length}
            </Badge>
          )}
          {forstehjelp.length > 0 && (
            <Badge variant="outline" className="text-xs">
              🏥 Førstehjelp: {forstehjelp.length}
            </Badge>
          )}
          {ordenSikring.length > 0 && (
            <Badge variant="outline" className="text-xs">
              🚧 Orden/sikring: {ordenSikring.length}
            </Badge>
          )}
          {innsatspersoner.length > 0 && (
            <Badge variant="outline" className="text-xs">
              👷 Innsats: {innsatspersoner.length}
            </Badge>
          )}
          {roykdykkere.length > 0 && (
            <Badge variant="outline" className="text-xs">
              😷 Røykdykkere: {roykdykkere.length}
            </Badge>
          )}
          {kjemikaliedykkere.length > 0 && (
            <Badge variant="outline" className="text-xs">
              ☣️ Kjemikaliedykkere: {kjemikaliedykkere.length}
            </Badge>
          )}
          {miljoKjemikalievern.length > 0 && (
            <Badge variant="outline" className="text-xs">
              🧪 Miljø/kjemikalie: {miljoKjemikalievern.length}
            </Badge>
          )}
          {redningsstab.length > 0 && (
            <Badge variant="outline" className="text-xs">
              🎖️ Redningsstab: {redningsstab.length}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
