import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Edit, QrCode, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Equipment } from "@/hooks/useEquipment";

interface EquipmentListProps {
  equipment: Equipment[];
  isLoading: boolean;
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
    in_operation: { label: "I drift", variant: "default", color: "🟢" },
    service_scheduled: { label: "Service planlagt", variant: "secondary", color: "🟡" },
    under_repair: { label: "Under reparasjon", variant: "outline", color: "🟠" },
    out_of_service: { label: "Ute av drift", variant: "destructive", color: "🔴" },
  };
  const config = statusMap[status] || statusMap.in_operation;
  return (
    <div className="flex items-center gap-2">
      <span>{config.color}</span>
      <Badge variant={config.variant}>{config.label}</Badge>
    </div>
  );
}

function getCriticalityBadge(criticality: string) {
  const criticalityMap: Record<string, { label: string; className: string }> = {
    low: { label: "Lav", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
    medium: { label: "Medium", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
    high: { label: "Høy", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
    critical: { label: "Kritisk", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  };
  const config = criticalityMap[criticality] || criticalityMap.medium;
  return <Badge className={config.className}>{config.label}</Badge>;
}

export function EquipmentList({ equipment, isLoading }: EquipmentListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (equipment.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <QrCode className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">Ingen utstyr funnet</h3>
        <p className="text-muted-foreground">
          Legg til utstyr for å komme i gang.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Status</TableHead>
            <TableHead>Utstyr</TableHead>
            <TableHead className="hidden md:table-cell">Kategori</TableHead>
            <TableHead className="hidden lg:table-cell">Plassering</TableHead>
            <TableHead className="hidden lg:table-cell">Ansvarlig</TableHead>
            <TableHead className="hidden md:table-cell">Kritikalitet</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {equipment.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{getStatusBadge(item.status)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-10 w-10 rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-lg">
                      {item.category?.icon || "📦"}
                    </div>
                  )}
                  <div>
                    <Link
                      to={`/utstyr/${item.id}`}
                      className="font-medium hover:underline"
                    >
                      {item.name}
                    </Link>
                    {(item.brand || item.model) && (
                      <p className="text-sm text-muted-foreground">
                        {[item.brand, item.model].filter(Boolean).join(" ")}
                      </p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {item.category && (
                  <div className="flex items-center gap-2">
                    <span>{item.category.icon}</span>
                    <span>{item.category.name}</span>
                  </div>
                )}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <div>
                  {item.location?.name && (
                    <p className="text-sm">{item.location.name}</p>
                  )}
                  {item.location_description && (
                    <p className="text-xs text-muted-foreground">
                      {item.location_description}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {item.responsible?.full_name || "-"}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {getCriticalityBadge(item.criticality)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to={`/utstyr/${item.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Se detaljer
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={`/utstyr/${item.id}?tab=qr`}>
                        <QrCode className="mr-2 h-4 w-4" />
                        Vis QR-kode
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
