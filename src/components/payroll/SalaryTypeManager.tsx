import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { useSalaryTypesWithMappings, useUpdateSalaryTypeMapping } from "@/hooks/useSalaryTypes";
import { Settings, Check, X } from "lucide-react";
import type { PayrollSystemType, SalaryType, SalaryTypeMapping } from "@/types/payroll";
import { SALARY_CATEGORIES, getCategoryInfo } from "@/types/payroll";

const SYSTEMS: PayrollSystemType[] = ["tripletex", "poweroffice"];

export function SalaryTypeManager() {
  const [editingMapping, setEditingMapping] = useState<{
    salaryTypeId: string;
    systemType: PayrollSystemType;
  } | null>(null);
  const [mappingValue, setMappingValue] = useState("");

  const { data: salaryTypes = [], isLoading } = useSalaryTypesWithMappings();
  const updateMapping = useUpdateSalaryTypeMapping();

  const getMapping = (mappings: SalaryTypeMapping[] | undefined, systemType: PayrollSystemType) => {
    return mappings?.find((m) => m.system_type === systemType);
  };

  // Group by category
  const groupedTypes = salaryTypes.reduce((acc, type) => {
    if (!acc[type.category]) acc[type.category] = [];
    acc[type.category].push(type);
    return acc;
  }, {} as Record<string, SalaryType[]>);

  const handleSave = () => {
    if (!editingMapping) return;
    updateMapping.mutate(
      {
        salaryTypeId: editingMapping.salaryTypeId,
        systemType: editingMapping.systemType,
        externalCode: mappingValue,
      },
      { onSuccess: () => setEditingMapping(null) }
    );
  };

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Lønnsarter og Mappings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="space-y-2">
          {SALARY_CATEGORIES.map((category) => {
            const types = groupedTypes[category.value] || [];
            if (types.length === 0) return null;

            return (
              <AccordionItem key={category.value} value={category.value}>
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Badge className={category.color}>{category.label}</Badge>
                    <span className="text-muted-foreground">({types.length} lønnsarter)</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Kode</TableHead>
                        <TableHead>Navn</TableHead>
                        <TableHead className="text-center">Auto</TableHead>
                        <TableHead className="text-center">Tripletex</TableHead>
                        <TableHead className="text-center">PowerOffice</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {types.map((type) => (
                        <TableRow key={type.id}>
                          <TableCell className="font-mono">{type.code}</TableCell>
                          <TableCell>{type.name}</TableCell>
                          <TableCell className="text-center">
                            {type.auto_calculate ? (
                              <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Ja</Badge>
                            ) : (
                              <Badge variant="secondary">Nei</Badge>
                            )}
                          </TableCell>
                          {SYSTEMS.map((sys) => {
                            const mapping = getMapping(type.mappings, sys);
                            const isEditing = editingMapping?.salaryTypeId === type.id && editingMapping?.systemType === sys;

                            return (
                              <TableCell key={sys} className="text-center">
                                {isEditing ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <Input
                                      value={mappingValue}
                                      onChange={(e) => setMappingValue(e.target.value)}
                                      className="w-20 h-8"
                                      onKeyDown={(e) => e.key === "Enter" && handleSave()}
                                    />
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleSave}>
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditingMapping(null)}>
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingMapping({ salaryTypeId: type.id, systemType: sys });
                                      setMappingValue(mapping?.external_code || type.code);
                                    }}
                                  >
                                    {mapping?.external_code || <span className="text-muted-foreground">-</span>}
                                  </Button>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
