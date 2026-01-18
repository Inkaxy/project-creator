import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import { StatusBadge } from "@/components/ui/status-badge";
import { employees, Employee } from "@/data/mockData";
import {
  Search,
  Plus,
  Upload,
  Mail,
  Phone,
  MoreHorizontal,
  ChevronRight,
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
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = showInactive || employee.status !== "inactive";
    return matchesSearch && matchesStatus;
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 pl-12 sm:flex-row sm:items-center sm:justify-between lg:pl-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Ansatte</h1>
            <p className="text-muted-foreground">
              Administrer ansatte og roller
            </p>
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
              placeholder="Søk på navn, e-post eller rolle..."
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Ansatt</TableHead>
                      <TableHead>Rolle</TableHead>
                      <TableHead>Avdeling</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Funksjoner</TableHead>
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
                            <AvatarWithInitials name={employee.name} size="md" />
                            <div>
                              <p className="font-medium text-foreground">{employee.name}</p>
                              <p className="text-sm text-muted-foreground">{employee.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{employee.role}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {employee.department}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={employee.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {employee.functions.slice(0, 2).map((fn) => (
                              <Badge key={fn} variant="secondary" className="text-xs">
                                {fn}
                              </Badge>
                            ))}
                            {employee.functions.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{employee.functions.length - 2}
                              </Badge>
                            )}
                          </div>
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
              </div>
            </CardContent>
          </Card>

          {/* Employee Detail Panel */}
          {selectedEmployee && (
            <Card className="animate-fade-in">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Ansattkort</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedEmployee(null)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Header */}
                <div className="flex flex-col items-center gap-3 text-center">
                  <AvatarWithInitials name={selectedEmployee.name} size="lg" />
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">
                      {selectedEmployee.name}
                    </h3>
                    <p className="text-muted-foreground">{selectedEmployee.role}</p>
                  </div>
                  <StatusBadge status={selectedEmployee.status} />
                </div>

                {/* Contact Info */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Kontakt</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{selectedEmployee.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{selectedEmployee.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Employment Info */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Ansettelse</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p className="font-medium text-foreground">{selectedEmployee.employeeType}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Startdato</p>
                      <p className="font-medium text-foreground">
                        {new Date(selectedEmployee.startDate).toLocaleDateString("nb-NO")}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avdeling</p>
                      <p className="font-medium text-foreground">{selectedEmployee.department}</p>
                    </div>
                  </div>
                </div>

                {/* Functions */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Funksjoner</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedEmployee.functions.map((fn) => (
                      <Badge key={fn} variant="secondary">
                        {fn}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* HMS Roles */}
                {selectedEmployee.hmsRoles && selectedEmployee.hmsRoles.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">HMS-roller</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedEmployee.hmsRoles.map((role) => (
                        <Badge key={role} className="bg-primary-light text-primary">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

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
    </MainLayout>
  );
}
