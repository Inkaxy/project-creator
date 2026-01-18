import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmployeeProfile } from "@/hooks/useEmployees";
import { useEmployeeDetails } from "@/hooks/useEmployeeDetails";
import { useEmployeeFunctions, useDeleteEmployeeFunction } from "@/hooks/useEmployeeFunctions";
import { useEmployeeAccounts, getAvailableBalance, accountTypeLabels } from "@/hooks/useEmployeeAccounts";
import { EmployeeGeneralTab } from "./EmployeeGeneralTab";
import { EmployeePersonnelFileTab } from "./EmployeePersonnelFileTab";
import { EmployeeWorkTimeTab } from "./EmployeeWorkTimeTab";
import { EmployeeKioskTab } from "./EmployeeKioskTab";
import { EmployeeSalaryTab } from "./EmployeeSalaryTab";
import { EmployeeFunctionModal } from "./EmployeeFunctionModal";
import { EmployeeEditModal } from "./EmployeeEditModal";
import {
  ChevronRight,
  Star,
  Plus,
  X,
  Edit,
} from "lucide-react";

interface EmployeeCardExpandedProps {
  employee: EmployeeProfile;
  onClose: () => void;
}

export function EmployeeCardExpanded({ employee, onClose }: EmployeeCardExpandedProps) {
  const [functionModalOpen, setFunctionModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  const { data: employeeDetails } = useEmployeeDetails(employee.id);
  const { data: employeeFunctions = [] } = useEmployeeFunctions(employee.id);
  const { data: accounts = [] } = useEmployeeAccounts(employee.id);
  const deleteEmployeeFunction = useDeleteEmployeeFunction();

  const handleRemoveFunction = async (functionId: string) => {
    if (confirm("Er du sikker på at du vil fjerne denne funksjonen?")) {
      await deleteEmployeeFunction.mutateAsync(functionId);
    }
  };

  const getProficiencyStars = (level: string) => {
    const stars = level === "expert" ? 3 : level === "competent" ? 2 : 1;
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: stars }).map((_, i) => (
          <Star key={i} className="h-3 w-3 fill-primary text-primary" />
        ))}
        {Array.from({ length: 3 - stars }).map((_, i) => (
          <Star key={i} className="h-3 w-3 text-muted-foreground" />
        ))}
      </div>
    );
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

  const getCompetenceLabel = (level: string | null) => {
    const labels: Record<string, string> = {
      ufaglaert: "Ufaglært",
      faglaert: "Faglært",
      laerling: "Lærling",
    };
    return labels[level || ""] || level || "Ikke angitt";
  };

  return (
    <Card className="lg:col-span-2 animate-fade-in">
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between">
          {/* Profile Header */}
          <div className="flex items-center gap-4">
            <AvatarWithInitials name={employee.full_name} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-foreground">
                  {employee.full_name}
                </h2>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditModalOpen(true)}>
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-muted-foreground">
                {employee.functions?.name || "Ingen hovedfunksjon"} • {getEmployeeType(employee.employee_type)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={employee.is_active ? "active" : "inactive"} />
                {employeeDetails?.competence_level && (
                  <Badge variant="outline">{getCompetenceLabel(employeeDetails.competence_level)}</Badge>
                )}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="general">Generelt</TabsTrigger>
            <TabsTrigger value="salary">Lønn</TabsTrigger>
            <TabsTrigger value="personnel">Personalmappe</TabsTrigger>
            <TabsTrigger value="worktime">Arbeidstid</TabsTrigger>
            <TabsTrigger value="kiosk">Kiosk</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <EmployeeGeneralTab 
              employee={employee} 
              employeeDetails={employeeDetails}
              employeeFunctions={employeeFunctions}
              onAddFunction={() => setFunctionModalOpen(true)}
              onRemoveFunction={handleRemoveFunction}
              getProficiencyStars={getProficiencyStars}
            />
          </TabsContent>

          <TabsContent value="salary">
            <EmployeeSalaryTab 
              employee={employee}
              employeeDetails={employeeDetails}
            />
          </TabsContent>

          <TabsContent value="personnel">
            <EmployeePersonnelFileTab employeeId={employee.id} />
          </TabsContent>

          <TabsContent value="worktime">
            <EmployeeWorkTimeTab 
              employeeId={employee.id} 
              accounts={accounts}
            />
          </TabsContent>

          <TabsContent value="kiosk">
            <EmployeeKioskTab 
              employee={employee}
              employeeDetails={employeeDetails}
            />
          </TabsContent>
        </Tabs>
      </CardContent>

      <EmployeeFunctionModal
        open={functionModalOpen}
        onOpenChange={setFunctionModalOpen}
        employeeId={employee.id}
        employeeName={employee.full_name}
      />

      <EmployeeEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        employee={employee}
        employeeDetails={employeeDetails}
      />
    </Card>
  );
}
