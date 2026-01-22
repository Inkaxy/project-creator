import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, ChevronRight, Star } from "lucide-react";
import { WageLadderLevel } from "@/hooks/useWageLadders";
import { cn } from "@/lib/utils";

interface LadderLevelsTableProps {
  levels: WageLadderLevel[];
  currentLevel: number;
  currentHours: number;
}

export function LadderLevelsTable({
  levels,
  currentLevel,
  currentHours,
}: LadderLevelsTableProps) {
  const sortedLevels = [...levels].sort((a, b) => a.level - b.level);

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-20">Nivå</TableHead>
            <TableHead>Timer</TableHead>
            <TableHead className="text-right">Timelønn</TableHead>
            <TableHead className="w-28">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedLevels.map((level) => {
            const isCurrent = level.level === currentLevel;
            const isCompleted = level.level < currentLevel;
            const isFuture = level.level > currentLevel;
            const hoursRemaining = isFuture ? level.min_hours - currentHours : 0;

            return (
              <TableRow
                key={level.id}
                className={cn(
                  "transition-colors",
                  isCurrent && "bg-primary/5 border-l-2 border-l-primary",
                  isCompleted && "text-muted-foreground"
                )}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    {isCurrent && (
                      <ChevronRight className="h-4 w-4 text-primary animate-pulse" />
                    )}
                    {isCompleted && (
                      <Star className="h-4 w-4 text-primary fill-primary" />
                    )}
                    <span className={cn("font-medium", isCurrent && "text-primary")}>
                      Nivå {level.level}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={cn(isCompleted && "line-through text-muted-foreground")}>
                    {level.min_hours.toLocaleString("nb-NO")}
                    {level.max_hours !== null
                      ? ` - ${level.max_hours.toLocaleString("nb-NO")}`
                      : "+"}{" "}
                    t
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono">
                  <span className={cn(isCurrent && "text-primary font-bold")}>
                    {level.hourly_rate.toLocaleString("nb-NO")} kr/t
                  </span>
                </TableCell>
                <TableCell>
                  {isCompleted && (
                    <Badge
                      variant="outline"
                      className="bg-accent/30 text-accent-foreground border-accent"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Fullført
                    </Badge>
                  )}
                  {isCurrent && (
                    <Badge className="bg-primary text-primary-foreground">
                      Du er her
                    </Badge>
                  )}
                  {isFuture && hoursRemaining > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {hoursRemaining.toLocaleString("nb-NO")} t
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
