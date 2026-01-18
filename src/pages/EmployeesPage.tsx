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
import { EmployeeCardExpanded } from "@/components/employees/EmployeeCardExpanded";
import {
  Search,
  Plus,
  Upload,
  MoreHorizontal,
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

  const { data: employees = [], isLoading } = useEmployees(showInactive);

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getEmployeeType = (type: string | null) => {
    const types: Record<string, string> = {
      fast: "Fast ansatt",
      deltid: "Fast deltid",
      tilkalling: "Tilkalling",
      vikar: "Vikar",
      laerling: "Lærling",
      sesong: "Sesong",
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
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Employee List */}
          <Card className={selectedEmployee ? "lg:col-span-2" : "lg:col-span-4"}>
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
                    Ingen ansatte funnet.
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

          {/* Employee Detail Panel - Now using EmployeeCardExpanded */}
          {selectedEmployee && (
            <EmployeeCardExpanded 
              employee={selectedEmployee} 
              onClose={() => setSelectedEmployee(null)} 
            />
          )}
        </div>
      </div>
    </MainLayout>
  );
}
