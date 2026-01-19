import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import { 
  HardHat, 
  Flame, 
  Heart, 
  Utensils,
  Users,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface HMSRole {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  required: boolean;
  minCount: number;
  fieldName: keyof EmployeeWithDetails;
}

interface EmployeeWithDetails {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  is_safety_representative: boolean | null;
  is_fire_safety_leader: boolean | null;
  is_food_safety_responsible: boolean | null;
  has_first_aid_course: boolean | null;
}

const HMS_ROLES: HMSRole[] = [
  {
    id: "safety_rep",
    icon: <HardHat className="h-5 w-5" />,
    title: "Verneombud",
    description: "Representerer ansatte i HMS-spørsmål og samarbeider med arbeidsgiver for et trygt arbeidsmiljø",
    required: false,
    minCount: 1,
    fieldName: "is_safety_representative",
  },
  {
    id: "fire_leader",
    icon: <Flame className="h-5 w-5" />,
    title: "Brannvernleder",
    description: "Ansvarlig for brannforebyggende arbeid, brannøvelser og vedlikehold av brannvernutstyr",
    required: false,
    minCount: 1,
    fieldName: "is_fire_safety_leader",
  },
  {
    id: "first_aid",
    icon: <Heart className="h-5 w-5" />,
    title: "Førstehjelpansvarlig",
    description: "Har gjennomført førstehjelpsopplæring og kan gi førstehjelp ved behov",
    required: false,
    minCount: 1,
    fieldName: "has_first_aid_course",
  },
  {
    id: "food_safety",
    icon: <Utensils className="h-5 w-5" />,
    title: "Mattrygghetsansvarlig",
    description: "Ansvarlig for IK-Mat, HACCP og matsikkerhet i virksomheten",
    required: false,
    minCount: 1,
    fieldName: "is_food_safety_responsible",
  },
];

function useEmployeesWithHMSRoles() {
  return useQuery({
    queryKey: ["employees-with-hms-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          email,
          avatar_url
        `)
        .eq("is_active", true);

      if (error) throw error;

      // Get employee details for HMS roles
      const { data: details, error: detailsError } = await supabase
        .from("employee_details")
        .select(`
          employee_id,
          is_safety_representative,
          is_fire_safety_leader,
          is_food_safety_responsible,
          has_first_aid_course
        `);

      if (detailsError) throw detailsError;

      // Merge profiles with details
      const detailsMap = new Map(details?.map(d => [d.employee_id, d]) || []);
      
      return data.map(emp => ({
        ...emp,
        is_safety_representative: detailsMap.get(emp.id)?.is_safety_representative || false,
        is_fire_safety_leader: detailsMap.get(emp.id)?.is_fire_safety_leader || false,
        is_food_safety_responsible: detailsMap.get(emp.id)?.is_food_safety_responsible || false,
        has_first_aid_course: detailsMap.get(emp.id)?.has_first_aid_course || false,
      })) as EmployeeWithDetails[];
    },
  });
}

export function HMSRolesPanel() {
  const { data: employees = [], isLoading } = useEmployeesWithHMSRoles();

  const getEmployeesForRole = (fieldName: keyof EmployeeWithDetails) => {
    return employees.filter(emp => emp[fieldName] === true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Laster HMS-roller...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Rolleoversikt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {HMS_ROLES.map(role => {
              const assignedEmployees = getEmployeesForRole(role.fieldName);
              const hasEnough = assignedEmployees.length >= role.minCount;
              
              return (
                <div 
                  key={role.id} 
                  className={`p-4 rounded-lg border ${
                    hasEnough 
                      ? "bg-success/5 border-success/20" 
                      : "bg-warning/5 border-warning/20"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-2 rounded-lg ${hasEnough ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                      {role.icon}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{role.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {assignedEmployees.length} tildelt
                      </p>
                    </div>
                  </div>
                  {hasEnough ? (
                    <div className="flex items-center gap-1 text-xs text-success">
                      <CheckCircle2 className="h-3 w-3" />
                      Dekket
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-warning">
                      <AlertCircle className="h-3 w-3" />
                      Anbefalt: min. {role.minCount}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Role Details */}
      <div className="grid gap-4 md:grid-cols-2">
        {HMS_ROLES.map(role => {
          const assignedEmployees = getEmployeesForRole(role.fieldName);
          
          return (
            <Card key={role.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {role.icon}
                  </div>
                  {role.title}
                  {role.required && (
                    <Badge variant="outline" className="ml-auto">Påkrevd</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {role.description}
                </p>
                
                {assignedEmployees.length === 0 ? (
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <p className="text-sm text-muted-foreground">
                      Ingen ansatte er tildelt denne rollen
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tildel roller via ansattkortet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {assignedEmployees.map(emp => (
                      <div 
                        key={emp.id} 
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <AvatarWithInitials
                          name={emp.full_name}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{emp.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{emp.email}</p>
                        </div>
                        <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Aktiv
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Card */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-medium mb-1">Tildel HMS-roller</h4>
              <p className="text-sm text-muted-foreground">
                HMS-roller tildeles via ansattkortet. Gå til Ansatte-siden, velg en ansatt, 
                og aktiver relevante roller under "Kiosk"-fanen eller i ansattdetaljer.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
