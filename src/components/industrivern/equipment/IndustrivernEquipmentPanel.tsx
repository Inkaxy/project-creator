import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin
} from "lucide-react";
import { IV_EQUIPMENT_CATEGORY_LABELS } from "@/types/industrivern";

export function IndustrivernEquipmentPanel() {
  // TODO: Implement useIndustrivernEquipment hook

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Beredskapsutstyr</h2>
          <p className="text-muted-foreground">
            Utstyr og verneutstyr for industrivernet
          </p>
        </div>
        <Button>
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
                <p className="text-2xl font-bold">0</p>
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
                <p className="text-2xl font-bold">0</p>
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
                <p className="text-2xl font-bold">0</p>
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
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Defekt</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Equipment Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Utstyrsoversikt</CardTitle>
          <CardDescription>
            Beredskapsutstyr sortert etter kategori
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Wrench className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">Ingen utstyr registrert</h3>
            <p className="text-muted-foreground mb-4">
              Legg til beredskapsutstyr for å holde oversikt over kontroller og service
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Legg til utstyr
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Category Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(IV_EQUIPMENT_CATEGORY_LABELS).map(([key, label]) => (
          <Card key={key} className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">enheter</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
