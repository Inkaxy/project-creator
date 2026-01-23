import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, CheckCircle, User, FileText, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOnboardingByToken, useUpdateOnboarding } from "@/hooks/useOnboardings";
import { toast } from "sonner";
import crewplanLogo from "@/assets/crewplan-logo-v2.png";

// Step 1: Personal info schema
const personalInfoSchema = z.object({
  phone: z.string().min(8, "Telefonnummer må være minst 8 siffer"),
  date_of_birth: z.string().min(1, "Fødselsdato er påkrevd"),
  personal_number: z.string().length(11, "Personnummer må være 11 siffer").regex(/^\d+$/, "Kun tall"),
  bank_account_number: z.string().length(11, "Kontonummer må være 11 siffer").regex(/^\d+$/, "Kun tall"),
  address: z.string().min(1, "Adresse er påkrevd"),
  postal_code: z.string().length(4, "Postnummer må være 4 siffer"),
  city: z.string().min(1, "By er påkrevd"),
  emergency_contact_name: z.string().min(1, "Navn på nødkontakt er påkrevd"),
  emergency_contact_phone: z.string().min(8, "Telefonnummer må være minst 8 siffer"),
  emergency_contact_relation: z.string().min(1, "Relasjon er påkrevd"),
});

// Step 2: Account creation schema
const accountSchema = z.object({
  password: z.string().min(8, "Passord må være minst 8 tegn"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passordene må være like",
  path: ["confirmPassword"],
});

type PersonalInfoValues = z.infer<typeof personalInfoSchema>;
type AccountValues = z.infer<typeof accountSchema>;

export default function OnboardingPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: onboarding, isLoading, error } = useOnboardingByToken(token);
  const updateOnboarding = useUpdateOnboarding();

  const personalInfoForm = useForm<PersonalInfoValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      phone: "",
      date_of_birth: "",
      personal_number: "",
      bank_account_number: "",
      address: "",
      postal_code: "",
      city: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      emergency_contact_relation: "",
    },
  });

  const accountForm = useForm<AccountValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Determine current step based on onboarding status
  useEffect(() => {
    if (onboarding) {
      if (onboarding.status === 'completed') {
        setCurrentStep(4);
      } else if (onboarding.info_completed_at && onboarding.account_created_at) {
        setCurrentStep(3);
      } else if (onboarding.info_completed_at) {
        setCurrentStep(2);
      } else {
        setCurrentStep(1);
      }

      // Pre-fill form if data exists
      if (onboarding.phone) {
        personalInfoForm.setValue("phone", onboarding.phone);
      }
    }
  }, [onboarding]);

  const handlePersonalInfoSubmit = async (values: PersonalInfoValues) => {
    if (!onboarding) return;
    
    setIsSubmitting(true);
    try {
      await updateOnboarding.mutateAsync({
        id: onboarding.id,
        ...values,
        status: "account_pending",
        info_completed_at: new Date().toISOString(),
      });
      setCurrentStep(2);
      toast.success("Personopplysninger lagret!");
    } catch (error) {
      toast.error("Kunne ikke lagre opplysninger");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccountSubmit = async (values: AccountValues) => {
    if (!onboarding) return;
    
    setIsSubmitting(true);
    try {
      // Create Supabase auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: onboarding.email,
        password: values.password,
        options: {
          data: {
            full_name: onboarding.full_name,
          },
        },
      });

      if (authError) throw authError;

      // Update onboarding with profile_id
      await updateOnboarding.mutateAsync({
        id: onboarding.id,
        profile_id: authData.user?.id,
        status: "contract_pending",
        account_created_at: new Date().toISOString(),
      });

      setCurrentStep(3);
      toast.success("Konto opprettet!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Kunne ikke opprette konto";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !onboarding) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Ugyldig lenke</CardTitle>
            <CardDescription>
              Denne onboarding-lenken er ugyldig eller har utløpt. 
              Kontakt din arbeidsgiver for å få en ny invitasjon.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (onboarding.status === 'cancelled') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Onboarding avbrutt</CardTitle>
            <CardDescription>
              Denne onboardingen har blitt avbrutt. 
              Kontakt din arbeidsgiver for mer informasjon.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const progress = ((currentStep - 1) / 3) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <img src={crewplanLogo} alt="CrewPlan" className="mx-auto mb-4 h-10" />
          <h1 className="text-2xl font-bold">Velkommen, {onboarding.full_name}!</h1>
          <p className="text-muted-foreground">
            Fullfør registreringen din for å komme i gang
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Steg {currentStep} av 3</span>
            <span>{Math.round(progress)}% fullført</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Steps indicator */}
        <div className="mb-8 flex justify-center gap-4">
          {[
            { num: 1, label: "Personopplysninger", icon: FileText },
            { num: 2, label: "Opprett konto", icon: KeyRound },
            { num: 3, label: "Ferdig", icon: CheckCircle },
          ].map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.num;
            const isCompleted = currentStep > step.num;
            
            return (
              <div
                key={step.num}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{step.label}</span>
              </div>
            );
          })}
        </div>

        {/* Step 1: Personal Info */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Personopplysninger</CardTitle>
              <CardDescription>
                Fyll ut dine personlige opplysninger. Denne informasjonen brukes til lønnsutbetaling og nødssituasjoner.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...personalInfoForm}>
                <form onSubmit={personalInfoForm.handleSubmit(handlePersonalInfoSubmit)} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={personalInfoForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefonnummer</FormLabel>
                          <FormControl>
                            <Input placeholder="99999999" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={personalInfoForm.control}
                      name="date_of_birth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fødselsdato</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={personalInfoForm.control}
                      name="personal_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Personnummer</FormLabel>
                          <FormControl>
                            <Input placeholder="11 siffer" maxLength={11} {...field} />
                          </FormControl>
                          <FormDescription>Brukes kun til lønnsrapportering</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={personalInfoForm.control}
                      name="bank_account_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kontonummer</FormLabel>
                          <FormControl>
                            <Input placeholder="11 siffer" maxLength={11} {...field} />
                          </FormControl>
                          <FormDescription>For lønnsutbetaling</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={personalInfoForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>Adresse</FormLabel>
                          <FormControl>
                            <Input placeholder="Gateadresse 123" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={personalInfoForm.control}
                      name="postal_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postnummer</FormLabel>
                          <FormControl>
                            <Input placeholder="0000" maxLength={4} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={personalInfoForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Poststed</FormLabel>
                          <FormControl>
                            <Input placeholder="Oslo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="pt-4">
                    <h3 className="mb-4 text-sm font-medium">Nødkontakt</h3>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <FormField
                        control={personalInfoForm.control}
                        name="emergency_contact_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Navn</FormLabel>
                            <FormControl>
                              <Input placeholder="Ola Nordmann" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={personalInfoForm.control}
                        name="emergency_contact_phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefon</FormLabel>
                            <FormControl>
                              <Input placeholder="99999999" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={personalInfoForm.control}
                        name="emergency_contact_relation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Relasjon</FormLabel>
                            <FormControl>
                              <Input placeholder="Ektefelle, forelder..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Lagrer...
                        </>
                      ) : (
                        "Neste steg"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Create Account */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Opprett brukerkonto</CardTitle>
              <CardDescription>
                Velg et passord for å aktivere din brukerkonto. Du vil bruke {onboarding.email} for å logge inn.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...accountForm}>
                <form onSubmit={accountForm.handleSubmit(handleAccountSubmit)} className="space-y-4">
                  <FormField
                    control={accountForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Passord</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Minst 8 tegn" {...field} />
                        </FormControl>
                        <FormDescription>
                          Passordet må være minst 8 tegn langt
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={accountForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bekreft passord</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Skriv passordet på nytt" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
                      Tilbake
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Oppretter konto...
                        </>
                      ) : (
                        "Opprett konto"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Complete */}
        {currentStep >= 3 && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>Registrering fullført!</CardTitle>
              <CardDescription>
                Du er nå registrert i systemet. Når arbeidsavtalen din er klar, 
                vil du finne den under "Min side" for signering.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => navigate("/auth")}>
                Gå til innlogging
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
