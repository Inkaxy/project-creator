import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  Globe, 
  Building2,
  Edit,
  Package
} from "lucide-react";
import { useSuppliers, useCreateSupplier, type Supplier } from "@/hooks/useSuppliers";
import { useToast } from "@/hooks/use-toast";

export default function SuppliersPage() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  
  const { data: suppliers, isLoading } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    org_number: "",
    address: "",
    phone_main: "",
    phone_service: "",
    phone_emergency: "",
    email: "",
    email_service: "",
    website: "",
    contact_name: "",
    contact_phone: "",
    customer_number: "",
    sla_response_hours: "",
    notes: "",
  });

  const filteredSuppliers = suppliers?.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ title: "Feil", description: "Navn er påkrevd", variant: "destructive" });
      return;
    }

    try {
      await createSupplier.mutateAsync({
        name: formData.name,
        org_number: formData.org_number || undefined,
        address: formData.address || undefined,
        phone_main: formData.phone_main || undefined,
        phone_service: formData.phone_service || undefined,
        phone_emergency: formData.phone_emergency || undefined,
        email: formData.email || undefined,
        email_service: formData.email_service || undefined,
        website: formData.website || undefined,
        contact_name: formData.contact_name || undefined,
        contact_phone: formData.contact_phone || undefined,
        customer_number: formData.customer_number || undefined,
        sla_response_hours: formData.sla_response_hours ? parseInt(formData.sla_response_hours) : undefined,
        notes: formData.notes || undefined,
      });
      toast({ title: "Opprettet", description: "Leverandør ble opprettet" });
      setShowModal(false);
      setFormData({
        name: "", org_number: "", address: "", phone_main: "", phone_service: "",
        phone_emergency: "", email: "", email_service: "", website: "",
        contact_name: "", contact_phone: "", customer_number: "", sla_response_hours: "", notes: "",
      });
    } catch {
      toast({ title: "Feil", description: "Kunne ikke opprette leverandør", variant: "destructive" });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Leverandører</h1>
            <p className="text-muted-foreground">
              Administrer leverandører for utstyr og service
            </p>
          </div>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ny leverandør
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Søk etter leverandør..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Suppliers Grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : filteredSuppliers && filteredSuppliers.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSuppliers.map((supplier) => (
              <Card key={supplier.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{supplier.name}</CardTitle>
                        {supplier.org_number && (
                          <p className="text-xs text-muted-foreground">
                            Org.nr: {supplier.org_number}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedSupplier(supplier)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Contact Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {supplier.phone_main && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={`tel:${supplier.phone_main}`}>
                          <Phone className="mr-1 h-3 w-3" />
                          Telefon
                        </a>
                      </Button>
                    )}
                    {supplier.phone_service && (
                      <Button size="sm" variant="outline" className="text-orange-600" asChild>
                        <a href={`tel:${supplier.phone_service}`}>
                          <Phone className="mr-1 h-3 w-3" />
                          Service
                        </a>
                      </Button>
                    )}
                    {supplier.phone_emergency && (
                      <Button size="sm" variant="destructive" asChild>
                        <a href={`tel:${supplier.phone_emergency}`}>
                          <Phone className="mr-1 h-3 w-3" />
                          24/7
                        </a>
                      </Button>
                    )}
                  </div>

                  {/* Email */}
                  {supplier.email && (
                    <a
                      href={`mailto:${supplier.email}`}
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Mail className="h-3 w-3" />
                      {supplier.email}
                    </a>
                  )}

                  {/* Website */}
                  {supplier.website && (
                    <a
                      href={supplier.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Globe className="h-3 w-3" />
                      Nettside
                    </a>
                  )}

                  {/* Equipment Count */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {supplier.equipment_count || 0} utstyr
                    </span>
                    {supplier.sla_response_hours && (
                      <Badge variant="secondary" className="ml-auto">
                        SLA: {supplier.sla_response_hours}t
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold">Ingen leverandører</h3>
              <p className="text-muted-foreground">
                Legg til leverandører for utstyr og service
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Supplier Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ny leverandør</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Navn *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Firmanavn"
                />
              </div>
              <div className="space-y-2">
                <Label>Org.nummer</Label>
                <Input
                  value={formData.org_number}
                  onChange={(e) => setFormData({ ...formData, org_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Kundenummer</Label>
                <Input
                  value={formData.customer_number}
                  onChange={(e) => setFormData({ ...formData, customer_number: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Adresse</Label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Telefonnumre</h4>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Hovedtelefon</Label>
                  <Input
                    value={formData.phone_main}
                    onChange={(e) => setFormData({ ...formData, phone_main: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Service</Label>
                  <Input
                    value={formData.phone_service}
                    onChange={(e) => setFormData({ ...formData, phone_service: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nødtelefon (24/7)</Label>
                  <Input
                    value={formData.phone_emergency}
                    onChange={(e) => setFormData({ ...formData, phone_emergency: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">E-post og web</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>E-post</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-post service</Label>
                  <Input
                    type="email"
                    value={formData.email_service}
                    onChange={(e) => setFormData({ ...formData, email_service: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nettside</Label>
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>SLA responstid (timer)</Label>
                  <Input
                    type="number"
                    value={formData.sla_response_hours}
                    onChange={(e) => setFormData({ ...formData, sla_response_hours: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Kontaktperson</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Navn</Label>
                  <Input
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <Input
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notater</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Avbryt
              </Button>
              <Button type="submit" disabled={createSupplier.isPending}>
                Opprett
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
