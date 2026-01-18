import { EmployeeProfile } from "@/hooks/useEmployees";
import { EmployeeDetails } from "@/hooks/useEmployeeDetails";
import { EmployeeFunctionData } from "@/hooks/useEmployeeFunctions";
import { useDepartments } from "@/hooks/useEmployees";
import { useUpdateEmployeeDepartment } from "@/hooks/useUpdateEmployeeDepartment";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  AlertTriangle,
  Plus,
  X,
  Shield,
  Flame,
  Utensils,
  Heart,
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface EmployeeGeneralTabProps {
  employee: EmployeeProfile;
  employeeDetails: EmployeeDetails | null | undefined;
  employeeFunctions: EmployeeFunctionData[];
  onAddFunction: () => void;
  onRemoveFunction: (id: string) => void;
  getProficiencyStars: (level: string) => React.ReactNode;
}

export function EmployeeGeneralTab({
  employee,
  employeeDetails,
  employeeFunctions,
  onAddFunction,
  onRemoveFunction,
  getProficiencyStars,
}: EmployeeGeneralTabProps) {
  const { data: departments = [] } = useDepartments();
  const updateDepartment = useUpdateEmployeeDepartment();

  // Extended profile data - these are now available on the profiles table
  const extendedProfile = employee as EmployeeProfile & {
    date_of_birth?: string | null;
    address?: string | null;
    postal_code?: string | null;
    city?: string | null;
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    emergency_contact_relation?: string | null;
    employee_number?: string | null;
  };

  const getEmployeeType = (type: string | null) => {
    const types: Record<string, string> = {
      fast: "Fast ansatt",
      deltid: "Fast deltid",
      tilkalling: "Tilkalling",
      vikar: "Vikar",
      laerling: "Lærling",
      sesong: "Sesongarbeider",
    };
    return types[type || ""] || type || "Ukjent";
  };

  return (
    <div className="space-y-6">
      {/* Contact Information */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Kontaktinformasjon
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">E-post</p>
            <p className="font-medium text-foreground">{employee.email}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Telefon</p>
            <p className="font-medium text-foreground">{employee.phone || "-"}</p>
          </div>
        </div>
      </div>

      {/* Personal Details (GDPR protected - only visible to admin) */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <User className="h-4 w-4" />
          Personalia
          <Badge variant="outline" className="text-xs">GDPR</Badge>
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Fødselsdato</p>
            <p className="font-medium text-foreground">
              {extendedProfile.date_of_birth 
                ? format(new Date(extendedProfile.date_of_birth), "d. MMMM yyyy", { locale: nb })
                : "-"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Ansattnummer</p>
            <p className="font-medium text-foreground">{extendedProfile.employee_number || "-"}</p>
          </div>
        </div>
        <div className="text-sm">
          <p className="text-muted-foreground">Adresse</p>
          <p className="font-medium text-foreground">
            {extendedProfile.address 
              ? `${extendedProfile.address}, ${extendedProfile.postal_code || ""} ${extendedProfile.city || ""}`
              : "-"}
          </p>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Nødkontakt
        </h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Navn</p>
            <p className="font-medium text-foreground">{extendedProfile.emergency_contact_name || "-"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Telefon</p>
            <p className="font-medium text-foreground">{extendedProfile.emergency_contact_phone || "-"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Relasjon</p>
            <p className="font-medium text-foreground">{extendedProfile.emergency_contact_relation || "-"}</p>
          </div>
        </div>
      </div>

      {/* Employment Info */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Ansettelse
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Type</p>
            <p className="font-medium text-foreground">{getEmployeeType(employee.employee_type)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Startdato</p>
            <p className="font-medium text-foreground">
              {employee.start_date 
                ? format(new Date(employee.start_date), "d. MMMM yyyy", { locale: nb })
                : "-"}
            </p>
          </div>
          {employeeDetails?.probation_end_date && (
            <div>
              <p className="text-muted-foreground">Prøvetid slutt</p>
              <p className="font-medium text-foreground">
                {format(new Date(employeeDetails.probation_end_date), "d. MMMM yyyy", { locale: nb })}
              </p>
            </div>
          )}
          {employeeDetails?.end_date && (
            <div>
              <p className="text-muted-foreground">Sluttdato</p>
              <p className="font-medium text-foreground">
                {format(new Date(employeeDetails.end_date), "d. MMMM yyyy", { locale: nb })}
              </p>
            </div>
          )}
        </div>
        <div>
          <p className="text-muted-foreground text-sm mb-1">Avdeling</p>
          <Select
            value={employee.department_id || "none"}
            onValueChange={(value) => {
              updateDepartment.mutate({
                employeeId: employee.id,
                departmentId: value === "none" ? null : value,
                employeeName: employee.full_name,
              });
            }}
          >
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Velg avdeling" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="none">Ingen avdeling</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: dept.color || "#3B82F6" }}
                    />
                    {dept.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* HMS Roles */}
      {employeeDetails && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">HMS / IK-roller</h4>
          <div className="flex flex-wrap gap-2">
            {employeeDetails.is_safety_representative && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Verneombud
              </Badge>
            )}
            {employeeDetails.is_fire_safety_leader && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Flame className="h-3 w-3" />
                Brannvernleder
              </Badge>
            )}
            {employeeDetails.is_food_safety_responsible && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Utensils className="h-3 w-3" />
                IK-Mat ansvarlig
              </Badge>
            )}
            {employeeDetails.has_first_aid_course && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                Førstehjelpskurs
              </Badge>
            )}
            {!employeeDetails.is_safety_representative && 
             !employeeDetails.is_fire_safety_leader && 
             !employeeDetails.is_food_safety_responsible && 
             !employeeDetails.has_first_aid_course && (
              <p className="text-sm text-muted-foreground">Ingen HMS-roller tildelt</p>
            )}
          </div>
        </div>
      )}

      {/* Functions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">Funksjoner</h4>
          <Button variant="outline" size="sm" onClick={onAddFunction}>
            <Plus className="mr-1 h-3 w-3" />
            Legg til
          </Button>
        </div>
        {employeeFunctions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ingen funksjoner tildelt ennå.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {employeeFunctions.map((ef) => (
              <div
                key={ef.id}
                className="flex items-center justify-between rounded-lg border border-border p-2"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded"
                    style={{ backgroundColor: ef.functions?.color || "#3B82F6" }}
                  />
                  <span className="text-sm font-medium">{ef.functions?.name}</span>
                  {getProficiencyStars(ef.proficiency_level)}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onRemoveFunction(ef.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
