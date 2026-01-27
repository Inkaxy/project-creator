import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  User, 
  Phone, 
  Mail,
  MoreHorizontal,
  Trash2,
  Edit
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  useIndustrivernPersonnel, 
  useRemoveIndustrivernPersonnel 
} from "@/hooks/useIndustrivernPersonnel";
import { INDUSTRIVERN_ROLE_LABELS, IndustrivernRole } from "@/types/industrivern";
import { AddPersonnelModal } from "./AddPersonnelModal";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";

const ROLE_ORDER: IndustrivernRole[] = [
  "industrivernleder",
  "fagleder_industrivern",
  "redningsstab",
  "innsatsperson",
  "forstehjelp",
  "brannvern",
  "miljo_kjemikalievern",
  "roykdykker",
  "kjemikaliedykker",
  "orden_sikring",
];

export function OrganizationPanel() {
  const [showAddModal, setShowAddModal] = useState(false);
  const { data: personnel, isLoading } = useIndustrivernPersonnel();
  const removeMutation = useRemoveIndustrivernPersonnel();

  const groupedPersonnel = personnel?.reduce((acc, p) => {
    if (!acc[p.role]) acc[p.role] = [];
    acc[p.role].push(p);
    return acc;
  }, {} as Record<string, typeof personnel>) || {};

  const sortedRoles = ROLE_ORDER.filter((role) => groupedPersonnel[role]?.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Industrivernorganisasjon</h2>
          <p className="text-muted-foreground">
            Administrer roller og personell i industrivernet
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Legg til personell
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : sortedRoles.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedRoles.map((role) => (
            <Card key={role}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {INDUSTRIVERN_ROLE_LABELS[role]}
                </CardTitle>
                <CardDescription>
                  {groupedPersonnel[role].length} {groupedPersonnel[role].length === 1 ? "person" : "personer"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {groupedPersonnel[role].map((person) => (
                    <div 
                      key={person.id} 
                      className="flex items-center justify-between p-2 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <AvatarWithInitials
                          name={person.profiles?.full_name || ""}
                          avatarUrl={person.profiles?.avatar_url}
                          className="h-10 w-10"
                        />
                        <div>
                          <div className="font-medium text-sm flex items-center gap-2">
                            {person.profiles?.full_name}
                            {person.is_deputy && (
                              <Badge variant="secondary" className="text-xs">
                                Stedfortreder
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            {person.emergency_phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {person.emergency_phone}
                              </span>
                            )}
                            {!person.emergency_phone && person.profiles?.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {person.profiles.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Rediger
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => removeMutation.mutate(person.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Fjern fra industrivern
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">Ingen personell registrert</h3>
            <p className="text-muted-foreground mb-4">
              Legg til personell for å bygge opp industrivernorganisasjonen
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Legg til personell
            </Button>
          </CardContent>
        </Card>
      )}

      <AddPersonnelModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal} 
      />
    </div>
  );
}
