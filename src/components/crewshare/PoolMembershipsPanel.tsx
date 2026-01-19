import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAllPoolMemberships, useApprovePoolMembership } from "@/hooks/useCrewshare";
import { Users, Loader2, Check, X } from "lucide-react";

export function PoolMembershipsPanel() {
  const { data: memberships, isLoading } = useAllPoolMemberships();
  const approveMutation = useApprovePoolMembership();

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!memberships?.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Ingen medlemskap</h3>
          <p className="text-muted-foreground">Det er ingen aktive poolmedlemskap.</p>
        </CardContent>
      </Card>
    );
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      {memberships.map((membership) => (
        <Card key={membership.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{membership.employee?.full_name}</CardTitle>
              <Badge variant={statusVariant(membership.status)}>{membership.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Partner: {membership.partner_organization?.name}
            </p>
            {membership.status === 'pending' && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => approveMutation.mutate({ id: membership.id, action: 'reject' })}>
                  <X className="h-4 w-4 mr-1" /> Avslå
                </Button>
                <Button size="sm" onClick={() => approveMutation.mutate({ id: membership.id, action: 'approve' })}>
                  <Check className="h-4 w-4 mr-1" /> Godkjenn
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
