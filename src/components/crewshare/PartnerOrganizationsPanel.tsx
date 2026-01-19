import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { usePartnerOrganizations, useCreatePartnerOrganization } from "@/hooks/useCrewshare";
import { Building2, Plus, Loader2 } from "lucide-react";

export function PartnerOrganizationsPanel() {
  const { data: partners, isLoading } = usePartnerOrganizations();
  const createMutation = useCreatePartnerOrganization();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [orgNumber, setOrgNumber] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const handleCreate = () => {
    createMutation.mutate({
      name,
      org_number: orgNumber || null,
      contact_name: contactName || null,
      contact_email: contactEmail || null,
      contact_phone: null,
      address: null,
      is_staffing_agency: false,
      staffing_agency_approval_id: null,
      default_hourly_markup: 0,
      is_active: true,
    }, {
      onSuccess: () => {
        setOpen(false);
        setName("");
        setOrgNumber("");
        setContactName("");
        setContactEmail("");
      }
    });
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Legg til partner</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ny partnerorganisasjon</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Navn *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Restaurant AS" />
              </div>
              <div className="space-y-2">
                <Label>Org.nummer</Label>
                <Input value={orgNumber} onChange={(e) => setOrgNumber(e.target.value)} placeholder="123456789" />
              </div>
              <div className="space-y-2">
                <Label>Kontaktperson</Label>
                <Input value={contactName} onChange={(e) => setContactName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>E-post</Label>
                <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
              </div>
              <Button onClick={handleCreate} disabled={!name || createMutation.isPending} className="w-full">
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Opprett partner
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!partners?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Ingen partnere</h3>
            <p className="text-muted-foreground">Legg til partnerbedrifter for å dele personale.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {partners.map((partner) => (
            <Card key={partner.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{partner.name}</CardTitle>
                  <Badge variant={partner.is_active ? "default" : "secondary"}>
                    {partner.is_active ? "Aktiv" : "Inaktiv"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {partner.org_number && <p>Org.nr: {partner.org_number}</p>}
                {partner.contact_email && <p>{partner.contact_email}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
