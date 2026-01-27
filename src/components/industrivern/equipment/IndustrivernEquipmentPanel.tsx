import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  XCircle
} from "lucide-react";
import { IV_EQUIPMENT_CATEGORY_LABELS, IVEquipmentCategory } from "@/types/industrivern";
import { useIndustrivernEquipment, useEquipmentStats } from "@/hooks/useIndustrivernEquipment";
import { CreateEquipmentModal } from "./CreateEquipmentModal";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

export function IndustrivernEquipmentPanel() {
  const { data: equipment, isLoading } = useIndustrivernEquipment();
  const { data: stats } = useEquipmentStats();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<IVEquipmentCategory | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ok":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "needs_inspection":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "needs_service":
        return <Wrench className="h-4 w-4 text-orange-600" />;
      case "defective":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ok":
        return <Badge className="bg-green-100 text-green-800">OK</Badge>;
      case "needs_inspection":
        return <Badge className="bg-yellow-100 text-yellow-800">Trenger kontroll</Badge>;
      case "needs_service":
        return <Badge className="bg-orange-100 text-orange-800">Trenger service</Badge>;
      case "defective":
        return <Badge variant="destructive">Defekt</Badge>;
      case "retired":
        return <Badge variant="outline">Utrangert</Badge>;
      default:
        return null;
    }
  };

  const filteredEquipment = selectedCategory 
    ? equipment?.filter(e => e.category === selectedCategory)
    : equipment;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Beredskapsutstyr</h2>
          <p className="text-muted-foreground">
            Utstyr og verneutstyr for industrivernet
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Legg til utstyr
        </Button>
      </div>

      {/* Status Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.ok || 0}</p>
                <p className="text-sm text-muted-foreground">OK</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.needsInspection || 0}</p>
                <p className="text-sm text-muted-foreground">Trenger kontroll</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.needsService || 0}</p>
                <p className="text-sm text-muted-foreground">Trenger service</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.defective || 0}</p>
                <p className="text-sm text-muted-foreground">Defekt</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          Alle ({stats?.total || 0})
        </Button>
        {Object.entries(IV_EQUIPMENT_CATEGORY_LABELS).map(([key, label]) => (
          <Button
            key={key}
            variant={selectedCategory === key ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(key as IVEquipmentCategory)}
          >
            {label} ({stats?.byCategory[key] || 0})
          </Button>
        ))}
      </div>

      {/* Equipment List */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filteredEquipment && filteredEquipment.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEquipment.map((item) => (
            <Card key={item.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{item.name}</CardTitle>
                    <CardDescription>{item.equipment_type}</CardDescription>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {item.location}
                  {item.location_details && `, ${item.location_details}`}
                </div>
                {item.serial_number && (
                  <p className="text-muted-foreground">
                    Serienr: {item.serial_number}
                  </p>
                )}
                {item.next_inspection_date && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className={new Date(item.next_inspection_date) < new Date() ? "text-red-600" : "text-muted-foreground"}>
                      Neste kontroll: {format(new Date(item.next_inspection_date), "d. MMM yyyy", { locale: nb })}
                    </span>
                  </div>
                )}
                <div className="pt-2">
                  <Badge variant="secondary" className="text-xs">
                    {IV_EQUIPMENT_CATEGORY_LABELS[item.category as IVEquipmentCategory]}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Wrench className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">Ingen utstyr registrert</h3>
            <p className="text-muted-foreground mb-4">
              Legg til beredskapsutstyr for å holde oversikt over kontroller og service
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Legg til utstyr
            </Button>
          </CardContent>
        </Card>
      )}

      <CreateEquipmentModal open={showCreateModal} onOpenChange={setShowCreateModal} />
    </div>
  );
}
