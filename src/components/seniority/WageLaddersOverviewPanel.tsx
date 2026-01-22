import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Plus,
  Upload,
  Star,
  ChevronRight,
} from "lucide-react";
import { useWageLadders, WageLadder } from "@/hooks/useWageLadders";
import { useEmployees } from "@/hooks/useEmployees";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WageLaddersManagementModal } from "@/components/employees/WageLaddersManagementModal";
import { TariffImportModal } from "@/components/employees/TariffImportModal";

interface WageLaddersOverviewPanelProps {
  onOpenModal: () => void;
  onOpenImport: () => void;
}

// Fetch employees with their ladder assignments
function useEmployeesWithLadders() {
  return useQuery({
    queryKey: ["employees-with-ladders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_details")
        .select(`
          employee_id,
          wage_ladder_id,
          accumulated_hours,
          current_seniority_level,
          profiles:employee_id (
            id,
            full_name,
            is_active
          )
        `)
        .not("wage_ladder_id", "is", null);

      if (error) throw error;
      return data || [];
    },
  });
}

const COMPETENCE_LABELS: Record<string, string> = {
  faglaert: "Faglært",
  ufaglaert: "Ufaglært",
  laerling: "Lærling",
};

export function WageLaddersOverviewPanel({
  onOpenModal,
  onOpenImport,
}: WageLaddersOverviewPanelProps) {
  const { data: wageLadders = [], isLoading } = useWageLadders();
  const { data: employeesWithLadders = [] } = useEmployeesWithLadders();

  // Count employees per ladder
  const getEmployeeCount = (ladderId: string) => {
    return employeesWithLadders.filter(
      (e) => e.wage_ladder_id === ladderId && e.profiles?.is_active
    ).length;
  };

  // Get employees for a specific ladder
  const getEmployeesForLadder = (ladderId: string) => {
    return employeesWithLadders.filter(
      (e) => e.wage_ladder_id === ladderId && e.profiles?.is_active
    );
  };

  // Calculate distribution of employees across levels
  const getLevelDistribution = (ladder: WageLadder) => {
    const employees = getEmployeesForLadder(ladder.id);
    const distribution: Record<number, number> = {};

    ladder.levels?.forEach((level) => {
      distribution[level.level] = 0;
    });

    employees.forEach((emp) => {
      const level = emp.current_seniority_level || 1;
      if (distribution[level] !== undefined) {
        distribution[level]++;
      }
    });

    return distribution;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Laster lønnsstiger...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onOpenImport}>
          <Upload className="mr-2 h-4 w-4" />
          Importer tariff
        </Button>
        <Button onClick={onOpenModal}>
          <TrendingUp className="mr-2 h-4 w-4" />
          Administrer lønnsstiger
        </Button>
      </div>

      {wageLadders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">Ingen lønnsstiger</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Opprett lønnsstiger for å administrere timelønn basert på ansiennitet.
            </p>
            <Button className="mt-4" onClick={onOpenModal}>
              <Plus className="mr-2 h-4 w-4" />
              Opprett lønnsstige
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="space-y-3">
          {wageLadders.map((ladder) => {
            const employeeCount = getEmployeeCount(ladder.id);
            const distribution = getLevelDistribution(ladder);
            const totalEmployees = employeeCount;
            const levels = ladder.levels?.sort((a, b) => a.level - b.level) || [];
            const minRate = levels.length > 0 ? Math.min(...levels.map((l) => l.hourly_rate)) : 0;
            const maxRate = levels.length > 0 ? Math.max(...levels.map((l) => l.hourly_rate)) : 0;

            return (
              <AccordionItem
                key={ladder.id}
                value={ladder.id}
                className="border rounded-lg bg-card overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline px-4 py-3">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-foreground">{ladder.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {COMPETENCE_LABELS[ladder.competence_level] || ladder.competence_level}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary">
                        <Users className="h-3 w-3 mr-1" />
                        {employeeCount} ansatte
                      </Badge>
                      <Badge variant="outline">
                        {levels.length} nivå{levels.length !== 1 ? "er" : ""}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {minRate.toLocaleString("nb-NO")} - {maxRate.toLocaleString("nb-NO")} kr/t
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4 pt-2">
                    {ladder.description && (
                      <p className="text-sm text-muted-foreground">{ladder.description}</p>
                    )}

                    {/* Levels Table */}
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="w-20">Nivå</TableHead>
                            <TableHead>Timer</TableHead>
                            <TableHead className="text-right">Timelønn</TableHead>
                            <TableHead className="text-right">Ansatte</TableHead>
                            <TableHead className="w-32">Fordeling</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {levels.map((level) => {
                            const levelCount = distribution[level.level] || 0;
                            const percentage =
                              totalEmployees > 0
                                ? Math.round((levelCount / totalEmployees) * 100)
                                : 0;

                            return (
                              <TableRow key={level.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Star className="h-4 w-4 text-primary" />
                                    <span className="font-medium">Nivå {level.level}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {level.min_hours.toLocaleString("nb-NO")}
                                  {level.max_hours !== null
                                    ? ` - ${level.max_hours.toLocaleString("nb-NO")}`
                                    : "+"}{" "}
                                  t
                                </TableCell>
                                <TableCell className="text-right font-mono font-medium">
                                  {level.hourly_rate.toLocaleString("nb-NO")} kr/t
                                </TableCell>
                                <TableCell className="text-right">
                                  <Badge
                                    variant={levelCount > 0 ? "default" : "secondary"}
                                    className="min-w-[2rem] justify-center"
                                  >
                                    {levelCount}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {totalEmployees > 0 && (
                                    <div className="flex items-center gap-2">
                                      <Progress value={percentage} className="h-2" />
                                      <span className="text-xs text-muted-foreground w-8">
                                        {percentage}%
                                      </span>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4 pt-2">
                      <div className="p-3 bg-muted/50 rounded-lg text-center">
                        <DollarSign className="h-5 w-5 text-primary mx-auto mb-1" />
                        <p className="text-lg font-bold text-foreground">
                          {minRate.toLocaleString("nb-NO")}
                        </p>
                        <p className="text-xs text-muted-foreground">Startlønn</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg text-center">
                        <TrendingUp className="h-5 w-5 text-primary mx-auto mb-1" />
                        <p className="text-lg font-bold text-foreground">
                          {maxRate.toLocaleString("nb-NO")}
                        </p>
                        <p className="text-xs text-muted-foreground">Topplønn</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg text-center">
                        <Clock className="h-5 w-5 text-primary mx-auto mb-1" />
                        <p className="text-lg font-bold text-foreground">
                          {levels.length > 0 && levels[levels.length - 1].min_hours > 0
                            ? levels[levels.length - 1].min_hours.toLocaleString("nb-NO")
                            : "-"}
                        </p>
                        <p className="text-xs text-muted-foreground">Timer til topp</p>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
