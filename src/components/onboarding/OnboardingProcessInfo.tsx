import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ChevronDown, 
  ChevronUp,
  UserPlus,
  Mail,
  FileText,
  KeyRound,
  FileSignature,
  CheckCircle
} from "lucide-react";

const steps = [
  {
    number: 1,
    title: "Du oppretter onboarding",
    description: "Fyll inn navn, e-post, stilling og startdato",
    icon: UserPlus,
    color: "text-blue-500",
  },
  {
    number: 2,
    title: "Ansatt mottar invitasjon",
    description: "En e-post med personlig lenke sendes automatisk",
    icon: Mail,
    color: "text-indigo-500",
  },
  {
    number: 3,
    title: "Ansatt fyller ut personopplysninger",
    description: "De registrerer personnummer, kontonummer og kontaktinfo selv",
    icon: FileText,
    color: "text-purple-500",
  },
  {
    number: 4,
    title: "Ansatt oppretter brukerkonto",
    description: "De velger passord og aktiverer kontoen sin",
    icon: KeyRound,
    color: "text-pink-500",
  },
  {
    number: 5,
    title: "Du genererer kontrakt",
    description: "Opprett arbeidsavtale fra mal når den ansatte er registrert",
    icon: FileSignature,
    color: "text-orange-500",
  },
  {
    number: 6,
    title: "Ansatt signerer",
    description: "De signerer digitalt via 'Min side'",
    icon: CheckCircle,
    color: "text-green-500",
  },
];

export function OnboardingProcessInfo() {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card>
      <CardHeader className="cursor-pointer pb-3" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Slik fungerer onboarding</CardTitle>
          <Button variant="ghost" size="icon">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className="flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted ${step.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {step.number}. {step.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
