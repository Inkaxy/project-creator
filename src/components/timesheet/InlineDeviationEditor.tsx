import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { type DeviationType } from "@/hooks/useDeviationTypes";

export interface DeviationLine {
  id: string;
  deviation_type_id: string;
  start_time: string; // HH:mm
  end_time: string;   // HH:mm
  duration_minutes: number;
}

interface InlineDeviationEditorProps {
  clockIn: string;  // HH:mm
  clockOut: string;  // HH:mm
  deviationTypes: DeviationType[];
  lines: DeviationLine[];
  onChange: (lines: DeviationLine[]) => void;
}

function timeDiffMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60; // overnight
  return diff;
}

let lineIdCounter = 0;
function newLineId() {
  return `line-${++lineIdCounter}-${Date.now()}`;
}

export function InlineDeviationEditor({
  clockIn,
  clockOut,
  deviationTypes,
  lines,
  onChange,
}: InlineDeviationEditorProps) {
  const normalType = deviationTypes.find((t) => t.code === "normal");

  const handleAddLine = () => {
    // New line starts where the last one ended
    const lastLine = lines[lines.length - 1];
    const startTime = lastLine ? lastLine.end_time : clockIn;
    
    onChange([
      ...lines,
      {
        id: newLineId(),
        deviation_type_id: deviationTypes[1]?.id || normalType?.id || "",
        start_time: startTime,
        end_time: clockOut,
        duration_minutes: timeDiffMinutes(startTime, clockOut),
      },
    ]);
  };

  const handleRemoveLine = (id: string) => {
    if (lines.length <= 1) return;
    onChange(lines.filter((l) => l.id !== id));
  };

  const handleLineChange = (
    id: string,
    field: "deviation_type_id" | "start_time" | "end_time",
    value: string
  ) => {
    onChange(
      lines.map((l) => {
        if (l.id !== id) return l;
        const updated = { ...l, [field]: value };
        updated.duration_minutes = timeDiffMinutes(updated.start_time, updated.end_time);
        return updated;
      })
    );
  };

  const totalMinutes = lines.reduce((s, l) => s + l.duration_minutes, 0);
  const clockedMinutes = timeDiffMinutes(clockIn, clockOut);

  return (
    <div className="space-y-2 bg-muted/50 rounded-lg p-3">
      <div className="grid grid-cols-[1fr_80px_80px_60px_32px] gap-2 text-xs font-medium text-muted-foreground px-1">
        <span>Type</span>
        <span>Fra</span>
        <span>Til</span>
        <span>Timer</span>
        <span></span>
      </div>

      {lines.map((line) => (
        <div
          key={line.id}
          className="grid grid-cols-[1fr_80px_80px_60px_32px] gap-2 items-center"
        >
          <Select
            value={line.deviation_type_id}
            onValueChange={(v) => handleLineChange(line.id, "deviation_type_id", v)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {deviationTypes.map((dt) => (
                <SelectItem key={dt.id} value={dt.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: dt.color }}
                    />
                    {dt.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="time"
            value={line.start_time}
            onChange={(e) => handleLineChange(line.id, "start_time", e.target.value)}
            className="h-8 text-sm"
          />
          <Input
            type="time"
            value={line.end_time}
            onChange={(e) => handleLineChange(line.id, "end_time", e.target.value)}
            className="h-8 text-sm"
          />
          <span className="text-sm text-center font-mono">
            {(line.duration_minutes / 60).toFixed(1)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={lines.length <= 1}
            onClick={() => handleRemoveLine(line.id)}
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      ))}

      <div className="flex items-center justify-between pt-1">
        <Button variant="outline" size="sm" onClick={handleAddLine} className="h-7 text-xs">
          <Plus className="mr-1 h-3 w-3" />
          Legg til linje
        </Button>
        <span className={`text-xs font-medium ${totalMinutes !== clockedMinutes ? "text-destructive" : "text-muted-foreground"}`}>
          Sum: {(totalMinutes / 60).toFixed(1)}t / {(clockedMinutes / 60).toFixed(1)}t
        </span>
      </div>
    </div>
  );
}
