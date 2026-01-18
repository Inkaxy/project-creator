import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import {
  Download,
  Filter,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock timesheet data
const timesheetEntries = [
  {
    id: "1",
    date: "2026-01-19",
    employee: "Maria Hansen",
    group: "Baker",
    shiftType: "Natt",
    planned: "01:30 - 09:00",
    actual: "01:28 - 09:15",
    start: "01:28",
    end: "09:15",
    duration: "7.75",
    hasDeviation: true,
    pause: true,
    comment: "Ble litt lenger pga leveranse",
  },
  {
    id: "2",
    date: "2026-01-19",
    employee: "Erik Olsen",
    group: "Baker",
    shiftType: "Natt",
    planned: "04:00 - 12:00",
    actual: "04:02 - 12:00",
    start: "04:02",
    end: "12:00",
    duration: "8.0",
    hasDeviation: false,
    pause: true,
    comment: "",
  },
  {
    id: "3",
    date: "2026-01-19",
    employee: "Sara Nilsen",
    group: "Lærling",
    shiftType: "Dag",
    planned: "06:00 - 14:00",
    actual: "06:05 - 14:00",
    start: "06:05",
    end: "14:00",
    duration: "7.9",
    hasDeviation: true,
    pause: true,
    comment: "",
  },
  {
    id: "4",
    date: "2026-01-19",
    employee: "Lisa Johansen",
    group: "Selger",
    shiftType: "Dag",
    planned: "07:00 - 15:00",
    actual: "07:00 - 15:00",
    start: "07:00",
    end: "15:00",
    duration: "8.0",
    hasDeviation: false,
    pause: true,
    comment: "",
  },
];

export default function TimesheetsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 pl-12 sm:flex-row sm:items-center sm:justify-between lg:pl-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Timelister</h1>
            <p className="text-muted-foreground">
              Uke 4, januar 2026
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Eksporter
            </Button>
            <Button>
              <CheckCircle className="mr-2 h-4 w-4" />
              Godkjenn alle
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select defaultValue="week4">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Velg periode" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="week3">Uke 3 (13-19 jan)</SelectItem>
                    <SelectItem value="week4">Uke 4 (20-26 jan)</SelectItem>
                    <SelectItem value="week5">Uke 5 (27 jan - 2 feb)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Select defaultValue="all">
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Avdeling" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">Alle avdelinger</SelectItem>
                  <SelectItem value="production">Produksjon</SelectItem>
                  <SelectItem value="store">Butikk</SelectItem>
                </SelectContent>
              </Select>

              <Select defaultValue="all-status">
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all-status">Alle</SelectItem>
                  <SelectItem value="deviation">Med avvik</SelectItem>
                  <SelectItem value="approved">Godkjent</SelectItem>
                  <SelectItem value="pending">Venter</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 rounded-lg bg-warning-light px-3 py-1.5">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium text-warning">2 avvik</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timesheet Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox />
                    </TableHead>
                    <TableHead>Dato</TableHead>
                    <TableHead>Medarbeider</TableHead>
                    <TableHead>Gruppe</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Planlagt</TableHead>
                    <TableHead>Stemplet</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>Slutt</TableHead>
                    <TableHead>Lengde</TableHead>
                    <TableHead className="text-center">Pause</TableHead>
                    <TableHead>Kommentar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timesheetEntries.map((entry) => (
                    <TableRow
                      key={entry.id}
                      className={cn(
                        "transition-colors",
                        entry.hasDeviation && "bg-warning-light/30"
                      )}
                    >
                      <TableCell>
                        <Checkbox />
                      </TableCell>
                      <TableCell className="font-medium">
                        {new Date(entry.date).toLocaleDateString("nb-NO", {
                          day: "numeric",
                          month: "short",
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <AvatarWithInitials name={entry.employee} size="sm" />
                          <span>{entry.employee}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{entry.group}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            entry.shiftType === "Natt"
                              ? "bg-night-light text-night"
                              : "bg-primary-light text-primary"
                          )}
                        >
                          {entry.shiftType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{entry.planned}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {entry.hasDeviation && (
                            <AlertTriangle className="h-4 w-4 text-warning" />
                          )}
                          <span className={entry.hasDeviation ? "text-warning" : ""}>
                            {entry.actual}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          defaultValue={entry.start}
                          className="h-8 w-[70px] text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          defaultValue={entry.end}
                          className="h-8 w-[70px] text-center"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{entry.duration}t</TableCell>
                      <TableCell className="text-center">
                        <Checkbox checked={entry.pause} />
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                        {entry.comment || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Totalt timer</p>
                <p className="text-2xl font-bold text-foreground">31.65t</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-night-light">
                <Clock className="h-6 w-6 text-night" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Natt-timer</p>
                <p className="text-2xl font-bold text-foreground">15.75t</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning-light">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avvik</p>
                <p className="text-2xl font-bold text-foreground">2</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
