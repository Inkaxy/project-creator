import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Filter, UserCircle } from "lucide-react";
import { useAMUMembers, useRemoveAMUMember } from "@/hooks/useAMU";
import { AddAMUMemberModal } from "./AddAMUMemberModal";
import { AMU_MEMBER_TYPE_LABELS } from "@/types/amu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function AMUMembersPanel() {
  const { data: members, isLoading } = useAMUMembers();
  const removeMember = useRemoveAMUMember();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleRemove = () => {
    if (deleteId) {
      removeMember.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const getMemberTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "chair":
        return "default";
      case "deputy_chair":
        return "secondary";
      case "employee_rep":
        return "outline";
      case "employer_rep":
        return "outline";
      default:
        return "secondary";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            AMU-medlemmer
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button onClick={() => setAddModalOpen(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Legg til medlem
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {members && members.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Navn</TableHead>
                    <TableHead>Rolle</TableHead>
                    <TableHead>Avdeling</TableHead>
                    <TableHead>E-post</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead className="w-[80px]">Handling</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.profile?.full_name || "Ukjent"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getMemberTypeBadgeVariant(member.member_type)}>
                          {AMU_MEMBER_TYPE_LABELS[member.member_type] || member.member_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.profile?.departments?.name || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.profile?.email || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.profile?.phone || "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(member.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                <span>Rader per side: 10</span>
                <span>
                  1–{members.length} av {members.length}
                </span>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <UserCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Ingen AMU-medlemmer</p>
              <p className="text-sm">Legg til medlemmer for å komme i gang</p>
              <Button onClick={() => setAddModalOpen(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Legg til første medlem
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AddAMUMemberModal open={addModalOpen} onOpenChange={setAddModalOpen} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fjern AMU-medlem</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil fjerne dette medlemmet fra AMU? Medlemmet kan
              legges til igjen senere.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="bg-destructive text-destructive-foreground">
              Fjern medlem
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
