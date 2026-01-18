import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Moon, Sun, Calendar, Star, DollarSign } from "lucide-react";

interface CostBreakdown {
  totalHours: number;
  totalBaseCost: number;
  totalSupplements: number;
  totalCost: number;
  breakdown: {
    night: number;
    evening: number;
    weekend: number;
    holiday: number;
  };
}

interface CostSummaryTooltipProps {
  children: React.ReactNode;
  costs: CostBreakdown;
}

export function CostSummaryTooltip({ children, costs }: CostSummaryTooltipProps) {
  const hasSupplements = costs.totalSupplements > 0;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="top" className="w-64 p-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-sm font-medium">Kostnadsfordeling</span>
            <span className="text-sm font-bold text-primary">
              {costs.totalCost.toLocaleString("nb-NO")} kr
            </span>
          </div>
          
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Grunnlønn ({costs.totalHours.toFixed(1)}t)</span>
              <span>{costs.totalBaseCost.toLocaleString("nb-NO")} kr</span>
            </div>
            
            {hasSupplements && (
              <>
                <div className="my-1 border-t border-border" />
                <span className="font-medium text-muted-foreground">Tillegg:</span>
                
                {costs.breakdown.night > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Moon className="h-3 w-3" /> Natt
                    </span>
                    <span className="text-destructive">+{costs.breakdown.night.toLocaleString("nb-NO")} kr</span>
                  </div>
                )}
                
                {costs.breakdown.evening > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Sun className="h-3 w-3" /> Kveld
                    </span>
                    <span className="text-warning">+{costs.breakdown.evening.toLocaleString("nb-NO")} kr</span>
                  </div>
                )}
                
                {costs.breakdown.weekend > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-3 w-3" /> Helg
                    </span>
                    <span className="text-primary">+{costs.breakdown.weekend.toLocaleString("nb-NO")} kr</span>
                  </div>
                )}
                
                {costs.breakdown.holiday > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Star className="h-3 w-3" /> Helligdag
                    </span>
                    <span className="text-accent">+{costs.breakdown.holiday.toLocaleString("nb-NO")} kr</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
