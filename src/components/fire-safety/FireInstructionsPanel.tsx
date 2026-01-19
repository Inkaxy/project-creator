import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Upload, 
  Download,
  CheckCircle2,
  AlertTriangle,
  Users,
  ExternalLink
} from "lucide-react";

export function FireInstructionsPanel() {
  // In a full implementation, this would fetch from database/storage
  const [hasInstructions] = useState(false);

  return (
    <div className="space-y-6">
      {/* Main Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Branninstruks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasInstructions ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Branninstruks 2024</p>
                      <p className="text-sm text-muted-foreground">
                        Oppdatert: 15. januar 2024 • PDF • 2.4 MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Last ned
                    </Button>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Åpne
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center border-2 border-dashed rounded-lg">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg mb-2">Ingen branninstruks lastet opp</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Last opp din branninstruks som PDF for enkel tilgang og distribusjon til ansatte
              </p>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Last opp branninstruks
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Emergency Contacts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Nødnumre
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <span className="font-medium">Brann</span>
              <span className="text-2xl font-bold text-destructive">110</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
              <span className="font-medium">Politi</span>
              <span className="text-2xl font-bold text-primary">112</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-success/10 border border-success/20">
              <span className="font-medium">Ambulanse</span>
              <span className="text-2xl font-bold text-success">113</span>
            </div>
          </CardContent>
        </Card>

        {/* Checklist */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Ved brann
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {[
                "Varsle andre i bygningen",
                "Ring 110 - Brannvesenet",
                "Forsøk slukking hvis trygt",
                "Evakuer via nærmeste rømningsvei",
                "Møt på avtalt samlingssted",
                "Vent på brannvesen",
              ].map((step, index) => (
                <li key={index} className="flex items-start gap-3 text-sm">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* Employee Acknowledgement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Signering av ansatte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              Spor hvilke ansatte som har lest og signert branninstruksen
            </p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="bg-success/10 text-success">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  0 signert
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="bg-warning/10 text-warning">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  0 mangler
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resources */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <h4 className="font-medium mb-3">Nyttige ressurser</h4>
          <div className="grid gap-2 md:grid-cols-3">
            <a 
              href="https://www.dsb.no/lover/brannvern-brannvesen-nodnett/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-sm"
            >
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              DSB - Brannvern
            </a>
            <a 
              href="https://www.arbeidstilsynet.no/tema/brann-og-eksplosjonsvern/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-sm"
            >
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              Arbeidstilsynet
            </a>
            <a 
              href="https://www.brannvernforeningen.no/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-sm"
            >
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              Brannvernforeningen
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
