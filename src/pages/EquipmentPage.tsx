import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  AlertTriangle, 
  AlertCircle, 
  Wrench, 
  Plus, 
  Search,
  QrCode,
  Building2,
  Filter
} from "lucide-react";
import { useEquipmentList, useEquipmentStats } from "@/hooks/useEquipment";
import { useEquipmentCategories } from "@/hooks/useEquipmentCategories";
import { EquipmentList } from "@/components/equipment/EquipmentList";
import { EquipmentFormModal } from "@/components/equipment/EquipmentFormModal";
import { Link } from "react-router-dom";

export default function EquipmentPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);

  const { data: stats, isLoading: statsLoading } = useEquipmentStats();
  const { data: categories } = useEquipmentCategories();
  const { data: equipment, isLoading } = useEquipmentList({
    search: search || undefined,
    categoryId: selectedCategory || undefined,
    isActive: true,
  });

  const statCards = [
    {
      title: "Totalt utstyr",
      value: stats?.total || 0,
      icon: Package,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    },
    {
      title: "Service forfaller",
      value: stats?.serviceDue || 0,
      icon: AlertTriangle,
      color: stats?.serviceDue ? "text-yellow-600" : "text-muted-foreground",
      bgColor: stats?.serviceDue ? "bg-yellow-50 dark:bg-yellow-950" : "bg-muted",
    },
    {
      title: "Åpne avvik",
      value: stats?.openDeviations || 0,
      icon: AlertCircle,
      color: stats?.openDeviations ? "text-red-600" : "text-muted-foreground",
      bgColor: stats?.openDeviations ? "bg-red-50 dark:bg-red-950" : "bg-muted",
    },
    {
      title: "Under reparasjon",
      value: stats?.underRepair || 0,
      icon: Wrench,
      color: stats?.underRepair ? "text-orange-600" : "text-muted-foreground",
      bgColor: stats?.underRepair ? "bg-orange-50 dark:bg-orange-950" : "bg-muted",
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Utstyr</h1>
            <p className="text-muted-foreground">
              Oversikt over maskiner, utstyr og kjøretøy
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/utstyr/skann">
                <QrCode className="mr-2 h-4 w-4" />
                Skann QR
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/utstyr/leverandorer">
                <Building2 className="mr-2 h-4 w-4" />
                Leverandører
              </Link>
            </Button>
            <Button onClick={() => setShowFormModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nytt utstyr
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className={stat.bgColor}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`rounded-full p-2 ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>
                    {statsLoading ? "..." : stat.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Søk etter utstyr, merke, modell eller serienummer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory || "all"} onValueChange={(v) => setSelectedCategory(v === "all" ? null : v)}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="all" className="gap-2">
              <Filter className="h-4 w-4" />
              Alle
            </TabsTrigger>
            {categories?.map((category) => (
              <TabsTrigger key={category.id} value={category.id} className="gap-2">
                <span>{category.icon}</span>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory || "all"} className="mt-4">
            <EquipmentList 
              equipment={equipment || []} 
              isLoading={isLoading} 
            />
          </TabsContent>
        </Tabs>
      </div>

      <EquipmentFormModal
        open={showFormModal}
        onOpenChange={setShowFormModal}
      />
    </MainLayout>
  );
}
