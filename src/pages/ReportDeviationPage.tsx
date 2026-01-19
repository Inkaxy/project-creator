import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateDeviation } from "@/hooks/useDeviations";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Lightbulb, AlertTriangle, AlertOctagon, Send } from "lucide-react";
import { cn } from "@/lib/utils";

const categories = [
  { value: "idea", label: "Idé / Forbedringsforslag", icon: Lightbulb, color: "text-primary" },
  { value: "concern", label: "Bekymring / Nesten-ulykke", icon: AlertTriangle, color: "text-warning" },
  { value: "accident", label: "Ulykke / Skade", icon: AlertOctagon, color: "text-destructive" },
];

const severities = [
  { value: "low", label: "Lav" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "Høy" },
  { value: "critical", label: "Kritisk" },
];

export default function ReportDeviationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createDeviation = useCreateDeviation();

  const [category, setCategory] = useState("concern");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;

    await createDeviation.mutateAsync({
      category,
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      severity,
      is_anonymous: isAnonymous,
      reported_by: user?.id || null,
    });

    navigate("/avvik");
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meld avvik</h1>
          <p className="text-muted-foreground">
            Rapporter avvik, forbedringsforslag eller hendelser
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Hva vil du melde?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={cn(
                      "flex items-center gap-4 rounded-lg border p-4 text-left transition-colors",
                      category === cat.value
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <cat.icon className={cn("h-6 w-6", cat.color)} />
                    <span className="font-medium">{cat.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Detaljer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tittel *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Kort beskrivelse av hendelsen"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beskrivelse</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Beskriv hendelsen i detalj..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Plassering / Avdeling</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Hvor skjedde det?"
                />
              </div>

              <div className="space-y-2">
                <Label>Alvorlighetsgrad</Label>
                <RadioGroup value={severity} onValueChange={setSeverity}>
                  <div className="flex flex-wrap gap-4">
                    {severities.map((sev) => (
                      <div key={sev.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={sev.value} id={sev.value} />
                        <Label htmlFor={sev.value}>{sev.label}</Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="anonymous"
                  checked={isAnonymous}
                  onCheckedChange={(checked) => setIsAnonymous(!!checked)}
                />
                <Label htmlFor="anonymous" className="text-sm">
                  Meld anonymt
                </Label>
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={!title.trim() || createDeviation.isPending}
          >
            <Send className="mr-2 h-4 w-4" />
            {createDeviation.isPending ? "Sender..." : "Send inn avvik"}
          </Button>
        </form>
      </div>
    </MainLayout>
  );
}
