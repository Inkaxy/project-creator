import { Building2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Department {
  id: string;
  name: string;
  color?: string | null;
}

interface DepartmentFilterProps {
  selectedDepartment: string | null;
  onDepartmentChange: (departmentId: string | null) => void;
  departments: Department[];
}

export function DepartmentFilter({
  selectedDepartment,
  onDepartmentChange,
  departments,
}: DepartmentFilterProps) {
  return (
    <Select
      value={selectedDepartment || "all"}
      onValueChange={(v) => onDepartmentChange(v === "all" ? null : v)}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Velg avdeling" />
      </SelectTrigger>
      <SelectContent className="bg-popover">
        <SelectItem value="all">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Alle avdelinger
          </div>
        </SelectItem>
        {departments.map((dept) => (
          <SelectItem key={dept.id} value={dept.id}>
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: dept.color || "#3B82F6" }}
              />
              {dept.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
