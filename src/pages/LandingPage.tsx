import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/Logo";
import {
  Calendar,
  Clock,
  Users,
  Shield,
  FileText,
  GraduationCap,
  Flame,
  Wrench,
  ClipboardCheck,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Star,
  Building2,
  Utensils,
  Hotel,
  Coffee,
  ChevronRight,
  Bot,
  Zap,
  Globe,
  Lock,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Module data
const modules = [
  {
    id: "vaktplan",
    name: "Vaktplanlegging",
    description: "Intelligent vaktplanlegging med drag-and-drop, rotasjoner og automatisk bemanning",
    icon: Calendar,
    price: 299,
    features: ["Drag-and-drop planlegging", "Automatiske rotasjoner", "Tilgjengelighetsvisning", "Varslinger"],
    popular: true,
  },
  {
    id: "timelister",
    name: "Timelister & Stempling",
    description: "Digital stempling, GPS-validering og automatisk timelistegodkjenning",
    icon: Clock,
    price: 199,
    features: ["Digital inn/ut-stempling", "GPS-verifisering", "Auto-godkjenning", "Avvikshåndtering"],
    popular: true,
  },
  {
    id: "ansatte",
    name: "Ansattadministrasjon",
    description: "Komplett HR-system med personalfiler, kontrakter og kompetanseoversikt",
    icon: Users,
    price: 249,
    features: ["Digitale personalfiler", "Kompetansematrise", "Lønnsstiger", "Sertifikathåndtering"],
    popular: false,
  },
  {
    id: "hms",
    name: "HMS & Sikkerhet",
    description: "Risikovurderinger, vernerunder og avvikshåndtering i ett system",
    icon: Shield,
    price: 349,
    features: ["Risikovurderinger", "Vernerunder", "Avviksrapportering", "HMS-roller"],
    popular: false,
  },
  {
    id: "ik-mat",
    name: "IK-Mat & HACCP",
    description: "Temperaturlogging, kontrollpunkter og Mattilsynet-klar dokumentasjon",
    icon: ClipboardCheck,
    price: 399,
    features: ["Temperaturlogging", "HACCP-kontroller", "Mattilsynet-rapport", "Kritiske grenser"],
    popular: true,
  },
  {
    id: "opplaering",
    name: "Opplæring & Kurs",
    description: "Digitale kurs, sertifiseringer og automatisk påminnelse om fornyelse",
    icon: GraduationCap,
    price: 249,
    features: ["Interaktive kurs", "Sertifikatsporing", "Påminnelser", "Kompetansekrav"],
    popular: false,
  },
  {
    id: "brann",
    name: "Brannsikkerhet",
    description: "Brannøvelser, evakueringsplaner og utstyrsvedlikehold",
    icon: Flame,
    price: 199,
    features: ["Brannøvelseslogg", "Evakueringsplaner", "Bygningskart", "Utstyrssjekk"],
    popular: false,
  },
  {
    id: "utstyr",
    name: "Utstyrshåndtering",
    description: "Vedlikeholdsplanlegging, QR-koding og servicehistorikk for alt utstyr",
    icon: Wrench,
    price: 299,
    features: ["QR-kode skanning", "Serviceplanlegging", "Datablader", "Leverandørkontakt"],
    popular: false,
  },
  {
    id: "handbok",
    name: "Personalhåndbok",
    description: "Digital håndbok med kvittering for leste dokumenter og oppdateringer",
    icon: FileText,
    price: 149,
    features: ["Digital publisering", "Lesekvittering", "Versjonskontroll", "Søkefunksjon"],
    popular: false,
  },
  {
    id: "rapporter",
    name: "Rapporter & Analyse",
    description: "Innsikt i arbeidstid, fravær og kostnad med kraftige rapportverktøy",
    icon: BarChart3,
    price: 199,
    features: ["Lønnsrapporter", "Fraværsstatistikk", "Arbeidstidsanalyse", "Eksport til Excel"],
    popular: false,
  },
];

// Pricing tiers
const pricingTiers = [
  {
    name: "Starter",
    description: "For små bedrifter som kommer i gang",
    price: 990,
    period: "pr. måned",
    employees: "Opptil 15 ansatte",
    modules: 3,
    features: [
      "Velg 3 moduler",
      "E-post support",
      "Grunnleggende rapporter",
      "Mobil-app for ansatte",
      "Automatisk backup",
    ],
    cta: "Start gratis prøveperiode",
    popular: false,
  },
  {
    name: "Professional",
    description: "For voksende bedrifter",
    price: 2490,
    period: "pr. måned",
    employees: "Opptil 50 ansatte",
    modules: 6,
    features: [
      "Velg 6 moduler",
      "Prioritert support",
      "Avanserte rapporter",
      "API-tilgang",
      "CrewAI Assistent",
      "Integrasjoner",
    ],
    cta: "Start gratis prøveperiode",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "For store organisasjoner",
    price: null,
    period: "Tilpasset pris",
    employees: "Ubegrenset antall ansatte",
    modules: 10,
    features: [
      "Alle 10 moduler",
      "Dedikert kundekontakt",
      "Skreddersydde rapporter",
      "SLA-garanti",
      "On-premise mulighet",
      "Opplæring på stedet",
    ],
    cta: "Kontakt salg",
    popular: false,
  },
];

// Customer logos (fictional)
const customers = [
  { name: "Grand Hotel Oslo", icon: Hotel },
  { name: "Scandic Hotels", icon: Building2 },
  { name: "Maaemo Restaurant", icon: Utensils },
  { name: "Kaffebrenneriet", icon: Coffee },
];

// Stats
const stats = [
  { value: "500+", label: "Bedrifter" },
  { value: "25 000", label: "Brukere" },
  { value: "1M+", label: "Vakter planlagt" },
  { value: "99.9%", label: "Oppetid" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Logo size="sm" />
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#moduler" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Moduler
              </a>
              <a href="#priser" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Priser
              </a>
              <a href="#om-oss" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Om oss
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/auth">
                <Button variant="ghost" size="sm">
                  Logg inn
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="sm">
                  Prøv gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="border-b border-border bg-background py-20 sm:py-32">
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
              <Sparkles className="mr-2 h-4 w-4 text-primary" />
              Ny: CrewAI - Din intelligente assistent
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              Personaladministrasjon{" "}
              <span className="text-primary">gjort enkelt</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl max-w-2xl mx-auto">
              CrewPlan er det komplette systemet for vaktplanlegging, timelister, HMS og internkontroll. 
              Skreddersydd for hotell, restaurant og servicebransjen.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth">
                <Button size="lg" className="w-full sm:w-auto text-base px-8">
                  Start gratis i 14 dager
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#moduler">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-8">
                  Se alle moduler
                </Button>
              </a>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Ingen kredittkort nødvendig • Avbryt når som helst
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/30 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-semibold tabular-nums text-primary sm:text-4xl">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="py-20 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <Card className="relative overflow-hidden bg-card border border-border">
              <CardContent className="relative p-8 sm:p-12">
                <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
                  <div>
                    <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
                      <Bot className="mr-2 h-4 w-4" />
                      Kunstig Intelligens
                    </Badge>
                    <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                      Møt CrewAI
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                      Din personlige AI-assistent som hjelper deg med alt fra å forstå arbeidsregler 
                      til å feilsøke utstyr. Spør om hva som helst – CrewAI har svaret.
                    </p>
                    <ul className="mt-6 space-y-3">
                      {[
                        "Svar på HMS- og arbeidstidsspørsmål",
                        "Hjelp med feilsøking av utstyr",
                        "Veiledning for fraværssøknader",
                        "Forklaring av rutiner og prosedyrer",
                      ].map((feature, index) => (
                        <li key={index} className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="relative">
                    <div className="rounded-lg bg-card border border-border p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">CrewAI</p>
                          <p className="text-xs text-muted-foreground">Din smarte assistent</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="bg-muted rounded-lg rounded-bl-none px-4 py-2.5 text-sm">
                          Hei! Jeg kan hjelpe deg med alt fra vaktbytte til HMS-rutiner. 
                          Hva lurer du på? 🤖
                        </div>
                        <div className="bg-primary text-primary-foreground rounded-lg rounded-br-none px-4 py-2.5 text-sm ml-8">
                          Hvordan søker jeg om ferie?
                        </div>
                        <div className="bg-muted rounded-lg rounded-bl-none px-4 py-2.5 text-sm">
                          For å søke om ferie, gå til Fravær-modulen og klikk på "Ny søknad". 
                          Du velger datoer, og søknaden sendes automatisk til din leder for godkjenning. 
                          Feriedager trekkes fra din feriesaldo. ✨
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section id="moduler" className="py-20 sm:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Alle modulene du trenger
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Velg de modulene som passer din bedrift. Start enkelt og utvid etter behov.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <Card
                  key={module.id}
                  className={cn(
                    "relative overflow-hidden transition-all hover:border-primary",
                    module.popular && "border-2 border-primary"
                  )}
                >
                  {module.popular && (
                    <div className="absolute top-0 right-0">
                      <Badge className="rounded-none rounded-bl-lg bg-primary text-primary-foreground">
                        <Star className="mr-1 h-3 w-3" />
                        Populær
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{module.name}</CardTitle>
                        <div className="text-sm font-semibold text-primary">
                          kr {module.price}/mnd
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">{module.description}</CardDescription>
                    <ul className="space-y-1.5">
                      {module.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Hvorfor velge CrewPlan?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Vi har bygget CrewPlan for å løse de virkelige utfordringene i servicebransjen.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Zap,
                title: "Rask implementering",
                description: "Kom i gang på timer, ikke uker. Enkel oppsett og intuitivt grensesnitt.",
              },
              {
                icon: Globe,
                title: "Tilgang overalt",
                description: "Nettbasert løsning med mobil-app. Perfekt for ansatte på farten.",
              },
              {
                icon: Lock,
                title: "Sikker og pålitelig",
                description: "GDPR-kompatibel med automatisk backup og kryptering av all data.",
              },
              {
                icon: TrendingUp,
                title: "Reduser kostnadene",
                description: "Spar tid på administrasjon og få kontroll over overtid og fravær.",
              },
              {
                icon: Bot,
                title: "AI-drevet support",
                description: "CrewAI hjelper ansatte 24/7 med spørsmål om rutiner og regler.",
              },
              {
                icon: BarChart3,
                title: "Innsikt og rapporter",
                description: "Ta bedre beslutninger med sanntidsdata og kraftige analyser.",
              },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-0 bg-transparent shadow-none">
                  <CardContent className="pt-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="priser" className="py-20 sm:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Enkel og transparent prising
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Velg pakken som passer din bedrift. Alle priser er eks. mva.
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-3 max-w-5xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <Card
                key={index}
                className={cn(
                  "relative flex flex-col",
                  tier.popular && "border-2 border-primary scale-105"
                )}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                      <Star className="mr-1 h-3 w-3" />
                      Mest populær
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-base">{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pt-6">
                  <div className="text-center mb-6">
                    {tier.price !== null ? (
                      <>
                        <span className="text-4xl font-semibold">kr {tier.price.toLocaleString()}</span>
                        <span className="text-muted-foreground ml-1">/{tier.period}</span>
                      </>
                    ) : (
                      <span className="text-2xl font-semibold">{tier.period}</span>
                    )}
                    <p className="text-sm text-muted-foreground mt-2">{tier.employees}</p>
                    <p className="text-sm font-medium text-primary mt-1">
                      {tier.modules === 10 ? "Alle" : `Velg ${tier.modules}`} moduler inkludert
                    </p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/auth" className="block">
                    <Button
                      className="w-full"
                      variant={tier.popular ? "default" : "outline"}
                    >
                      {tier.cta}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-8">
            Ekstra moduler kan legges til for kr 99-399/mnd avhengig av modul
          </p>
        </div>
      </section>

      {/* Customers Section */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-muted-foreground mb-8">
            Brukes av ledende bedrifter i hotell- og restaurantbransjen
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16">
            {customers.map((customer, index) => {
              const Icon = customer.icon;
              return (
                <div key={index} className="flex items-center gap-2 text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                  <Icon className="h-6 w-6" />
                  <span className="font-medium">{customer.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="om-oss" className="py-20 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="relative overflow-hidden bg-primary text-primary-foreground">
            <CardContent className="relative py-16 px-8 sm:px-16 text-center">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl mb-4">
                Klar til å forenkle hverdagen?
              </h2>
              <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto mb-8">
                Bli med over 500 bedrifter som allerede bruker CrewPlan. 
                Start din gratis prøveperiode i dag – ingen forpliktelser.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/auth">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto text-base px-8">
                    Start gratis i 14 dager
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <a href="mailto:salg@crewplan.no">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                    Kontakt salg
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Logo size="sm" />
              </div>
              <p className="text-sm text-muted-foreground">
                Personaladministrasjon gjort enkelt for hotell, restaurant og servicebransjen.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produkt</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#moduler" className="hover:text-foreground">Moduler</a></li>
                <li><a href="#priser" className="hover:text-foreground">Priser</a></li>
                <li><Link to="/auth" className="hover:text-foreground">Logg inn</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Ressurser</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Hjelpesenter</a></li>
                <li><a href="#" className="hover:text-foreground">API-dokumentasjon</a></li>
                <li><a href="#" className="hover:text-foreground">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Kontakt</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>salg@crewplan.no</li>
                <li>+47 22 00 00 00</li>
                <li>Oslo, Norge</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 CrewPlan AS. Alle rettigheter reservert.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground">Personvern</a>
              <a href="#" className="hover:text-foreground">Vilkår</a>
              <a href="#" className="hover:text-foreground">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
