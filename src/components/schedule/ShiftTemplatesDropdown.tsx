import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Copy, ChevronDown, Save, Play, Settings, Star, Globe, Building2 } from "lucide-react";
import { ShiftTemplate } from "@/hooks/useShiftTemplates";

interface ShiftTemplatesDropdownProps {
  templates: ShiftTemplate[];
  isLoading?: boolean;
  onSaveTemplate: () => void;
  onRollout: (template?: ShiftTemplate) => void;
  onManage: () => void;
}

export function ShiftTemplatesDropdown({
  templates,
  isLoading,
  onSaveTemplate,
  onRollout,
  onManage,
}: ShiftTemplatesDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Copy className="h-4 w-4" />
          Maler
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-popover">
        <DropdownMenuLabel className="flex items-center gap-2">
          Vaktmaler
          {templates.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {templates.length}
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {isLoading ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            Laster maler...
          </div>
        ) : templates.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            Ingen maler opprettet ennå
          </div>
        ) : (
          <>
            {templates.map((template) => (
              <DropdownMenuItem
                key={template.id}
                className="flex items-center justify-between cursor-pointer"
                onClick={() => {
                  onRollout(template);
                  setOpen(false);
                }}
              >
                <div className="flex items-center gap-2">
                  {template.is_default && (
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  )}
                  <span className="truncate max-w-[120px]">{template.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {template.department ? (
                    <Badge variant="outline" className="text-xs px-1.5">
                      <Building2 className="h-3 w-3 mr-1" />
                      {template.department.name}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs px-1.5">
                      <Globe className="h-3 w-3 mr-1" />
                      Global
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {template.shift_count}
                  </Badge>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          className="gap-2 cursor-pointer"
          onClick={() => {
            onSaveTemplate();
            setOpen(false);
          }}
        >
          <Save className="h-4 w-4" />
          Lagre gjeldende uke som mal
        </DropdownMenuItem>
        
        <DropdownMenuItem
          className="gap-2 cursor-pointer"
          onClick={() => {
            onRollout();
            setOpen(false);
          }}
        >
          <Play className="h-4 w-4" />
          Rull ut mal...
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          className="gap-2 cursor-pointer"
          onClick={() => {
            onManage();
            setOpen(false);
          }}
        >
          <Settings className="h-4 w-4" />
          Administrer maler
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
