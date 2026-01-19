import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Construction } from "lucide-react";

export default function PayrollPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lønnskjøring</h1>
          <p className="text-muted-foreground">
            Administrer lønnskjøring og lønnsutbetalinger
          </p>
        </div>

        <Card className="border-dashed">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Construction className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle>Under utvikling</CardTitle>
            <CardDescription>
              Denne modulen er under utvikling og vil snart være tilgjengelig.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Planlagte funksjoner: Lønnsberegning, eksport til lønnssystem, rapporter</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
