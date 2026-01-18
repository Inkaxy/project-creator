import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useEmployees, EmployeeProfile } from "@/hooks/useEmployees";
import { useEmployeeFunctions, useDeleteEmployeeFunction } from "@/hooks/useEmployeeFunctions";
import { EmployeeFunctionModal } from "@/components/employees/EmployeeFunctionModal";
import {
  Search,
  Plus,
  Upload,
  Mail,
  Phone,
  MoreHorizontal,
  ChevronRight,
  Star,
  X,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function EmployeesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeProfile | null>(null);
  const [functionModalOpen, setFunctionModalOpen] = useState(false);

  const { data: employees = [], isLoading } = useEmployees(showInactive);
  const { data: employeeFunctions = [] } = useEmployeeFunctions(selectedEmployee?.id);
  const deleteEmployeeFunction = useDeleteEmployeeFunction();

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

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
      laerling: "Lærling",
    };
    return types[type || ""] || type || "Ukjent";
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 pl-12 sm:flex-row sm:items-center sm:justify-between lg:pl-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Ansatte</h1>
            <p className="text-muted-foreground">Administrer ansatte og roller</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Importer ansatte
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Legg til
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Søk på navn eller e-post..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="show-inactive"
              checked={showInactive}
              onCheckedChange={setShowInactive}
            />
            <Label htmlFor="show-inactive" className="text-sm text-muted-foreground">
              Vis inaktive
            </Label>
          </div>
        </div>

        {/* Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Employee List */}
          <Card className={selectedEmployee ? "lg:col-span-2" : "lg:col-span-3"}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                Alle ansatte
                <Badge variant="secondary" className="ml-2">
                  {filteredEmployees.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                {isLoading ? (
                  <div className="space-y-2 p-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Ingen ansatte funnet. Registrer deg eller legg til ansatte.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Ansatt</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Avdeling</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployees.map((employee) => (
                        <TableRow
                          key={employee.id}
                          className="cursor-pointer transition-colors hover:bg-muted/50"
                          onClick={() => setSelectedEmployee(employee)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <AvatarWithInitials name={employee.full_name} size="md" />
                              <div>
                                <p className="font-medium text-foreground">{employee.full_name}</p>
                                <p className="text-sm text-muted-foreground">{employee.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{getEmployeeType(employee.employee_type)}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {employee.departments?.name || "-"}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={employee.is_active ? "active" : "inactive"} />
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-popover">
                                <DropdownMenuItem>Rediger</DropdownMenuItem>
                                <DropdownMenuItem>Se profil</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  Deaktiver
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Employee Detail Panel */}
          {selectedEmployee && (
            <Card className="animate-fade-in">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Ansattkort</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedEmployee(null)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Header */}
                <div className="flex flex-col items-center gap-3 text-center">
                  <AvatarWithInitials name={selectedEmployee.full_name} size="lg" />
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">
                      {selectedEmployee.full_name}
                    </h3>
                    <p className="text-muted-foreground">{selectedEmployee.functions?.name || "Ingen rolle"}</p>
                  </div>
                  <StatusBadge status={selectedEmployee.is_active ? "active" : "inactive"} />
                </div>

                {/* Contact Info */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Kontakt</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{selectedEmployee.email}</span>
                    </div>
                    {selectedEmployee.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{selectedEmployee.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Employment Info */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Ansettelse</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p className="font-medium text-foreground">
                        {getEmployeeType(selectedEmployee.employee_type)}
                      </p>
                    </div>
                    {selectedEmployee.start_date && (
                      <div>
                        <p className="text-muted-foreground">Startdato</p>
                        <p className="font-medium text-foreground">
                          {new Date(selectedEmployee.start_date).toLocaleDateString("nb-NO")}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground">Avdeling</p>
                      <p className="font-medium text-foreground">
                        {selectedEmployee.departments?.name || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Functions - NEW SECTION */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground">Funksjoner</h4>
                    <Button variant="outline" size="sm" onClick={() => setFunctionModalOpen(true)}>
                      <Plus className="mr-1 h-3 w-3" />
                      Legg til
                    </Button>
                  </div>
                  {employeeFunctions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Ingen funksjoner tildelt ennå.
                    </p>
                  ) : (
                    <div className="space-y-2">
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
                            onClick={() => handleRemoveFunction(ef.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <Button className="flex-1">Rediger</Button>
                  <Button variant="outline" className="flex-1">
                    Se personalmappe
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Employee Function Modal */}
      {selectedEmployee && (
        <EmployeeFunctionModal
          open={functionModalOpen}
          onOpenChange={setFunctionModalOpen}
          employeeId={selectedEmployee.id}
          employeeName={selectedEmployee.full_name}
        />
      )}
    </MainLayout>
  );
}
