import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Copy, 
  Star, 
  FileText,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { 
  useContractTemplates, 
  useDeleteContractTemplate,
  useUpdateContractTemplate,
  ContractTemplate 
} from "@/hooks/useContractTemplates";
import { ContractTemplateEditorModal } from "./ContractTemplateEditorModal";

export function ContractTemplatesPanel() {
  const { data: templates = [], isLoading } = useContractTemplates();
  const deleteTemplate = useDeleteContractTemplate();
  const updateTemplate = useUpdateContractTemplate();
  
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);

  const handleEdit = (template: ContractTemplate) => {
    setEditingTemplate(template);
    setEditorOpen(true);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setEditorOpen(true);
  };

  const handleDuplicate = (template: ContractTemplate) => {
    setEditingTemplate({
      ...template,
      id: "", // Clear ID to create new
      name: `${template.name} (kopi)`,
      is_default: false,
    });
    setEditorOpen(true);
  };

  const handleSetDefault = (template: ContractTemplate) => {
    updateTemplate.mutate({
      id: template.id,
      is_default: true,
    });
  };

  const getEmployeeTypeLabel = (type: string | null) => {
    const types: Record<string, string> = {
      hourly: "Timelønn",
      fixed: "Fastlønn",
      management: "Ledelse",
    };
    return type ? types[type] || type : "Alle";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Kontraktmaler
            </CardTitle>
            <CardDescription>
              Administrer maler for arbeidskontrakter med automatisk datafletting
            </CardDescription>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Ny mal
          </Button>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">Ingen maler opprettet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Opprett din første kontraktmal for å komme i gang
              </p>
              <Button onClick={handleCreate} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Opprett mal
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Navn</TableHead>
                  <TableHead>Type ansatt</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sist oppdatert</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {template.name}
                        {template.is_default && (
                          <Badge variant="default" className="gap-1">
                            <Star className="h-3 w-3" />
                            Standard
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getEmployeeTypeLabel(template.employee_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={template.is_active ? "default" : "outline"}>
                        {template.is_active ? "Aktiv" : "Inaktiv"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(template.updated_at), "d. MMM yyyy", { locale: nb })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={() => handleEdit(template)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Rediger
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Dupliser
                          </DropdownMenuItem>
                          {!template.is_default && (
                            <DropdownMenuItem onClick={() => handleSetDefault(template)}>
                              <Star className="mr-2 h-4 w-4" />
                              Sett som standard
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteTemplate.mutate(template.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Slett
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ContractTemplateEditorModal
        template={editingTemplate}
        open={editorOpen}
        onOpenChange={setEditorOpen}
      />
    </>
  );
}
