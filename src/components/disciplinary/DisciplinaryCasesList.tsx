import { useState } from "react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { 
  AlertTriangle, 
  Clock, 
  Search, 
  Filter,
  ChevronRight,
  Zap,
  CheckCircle2,
  XCircle,
  FileText,
  Timer,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDisciplinaryCases, useDisciplinaryCategories } from "@/hooks/useDisciplinary";
import type { 
  DisciplinaryCase, 
  DisciplinaryCaseFilter,
  CaseStatus,
  DisciplinarySeverity,
} from "@/types/disciplinary";
import { 
  getSeverityLabel, 
  getSeverityColor, 
  getStatusLabel, 
  getStatusColor,
  getWarningTypeLabel,
} from "@/types/disciplinary";

interface DisciplinaryCasesListProps {
  onSelectCase: (caseItem: DisciplinaryCase) => void;
}

export function DisciplinaryCasesList({ onSelectCase }: DisciplinaryCasesListProps) {
  const [filter, setFilter] = useState<DisciplinaryCaseFilter>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: cases = [], isLoading } = useDisciplinaryCases(filter);
  const { data: categories = [] } = useDisciplinaryCategories();

  // Apply local filters
  const filteredCases = cases.filter(c => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesEmployee = c.employee?.full_name?.toLowerCase().includes(query);
      const matchesCaseNumber = c.case_number?.toLowerCase().includes(query);
      const matchesDescription = c.incident_description?.toLowerCase().includes(query);
      if (!matchesEmployee && !matchesCaseNumber && !matchesDescription) return false;
    }
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (severityFilter !== "all" && c.severity !== severityFilter) return false;
    if (categoryFilter !== "all" && c.category_id !== categoryFilter) return false;
    return true;
  });

  const getStatusIcon = (status: CaseStatus) => {
    switch (status) {
      case 'acknowledged':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'disputed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending_acknowledgment':
        return <Timer className="h-4 w-4 text-yellow-600" />;
      case 'draft':
        return <FileText className="h-4 w-4 text-gray-400" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSeverityIcon = (severity: DisciplinarySeverity) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'medium':
        return <Zap className="h-4 w-4 text-yellow-600" />;
      default:
        return <Zap className="h-4 w-4 text-green-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søk etter ansatt, saksnummer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle statuser</SelectItem>
            <SelectItem value="draft">Utkast</SelectItem>
            <SelectItem value="pending_acknowledgment">Venter kvittering</SelectItem>
            <SelectItem value="acknowledged">Kvittert</SelectItem>
            <SelectItem value="disputed">Bestridt</SelectItem>
            <SelectItem value="withdrawn">Trukket tilbake</SelectItem>
          </SelectContent>
        </Select>

        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Alvorlighet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle nivåer</SelectItem>
            <SelectItem value="low">Lav</SelectItem>
            <SelectItem value="medium">Middels</SelectItem>
            <SelectItem value="high">Høy</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle kategorier</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {filteredCases.length} {filteredCases.length === 1 ? 'sak' : 'saker'}
      </div>

      {/* Cases list */}
      {filteredCases.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Ingen saker funnet</h3>
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== "all" || severityFilter !== "all" || categoryFilter !== "all"
                ? "Prøv å justere filtrene"
                : "Opprett en ny sak for å komme i gang"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCases.map(caseItem => (
            <Card 
              key={caseItem.id} 
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => onSelectCase(caseItem)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <AvatarWithInitials
                    name={caseItem.employee?.full_name || "Ukjent"}
                    avatarUrl={caseItem.employee?.avatar_url}
                    className="h-12 w-12"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-muted-foreground">
                        {caseItem.case_number}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="font-medium">
                        {caseItem.category?.name || "Ukjent kategori"}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">
                        {caseItem.employee?.full_name || "Ukjent ansatt"}
                      </span>
                      <div className="flex items-center gap-1">
                        {getSeverityIcon(caseItem.severity)}
                        <Badge variant="outline" className={getSeverityColor(caseItem.severity)}>
                          {getSeverityLabel(caseItem.severity)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(caseItem.status)}
                        <Badge variant="outline" className={getStatusColor(caseItem.status)}>
                          {getStatusLabel(caseItem.status)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-1">
                      Hendelse: {format(new Date(caseItem.incident_date), "d. MMMM yyyy", { locale: nb })}
                      {caseItem.incident_time && ` kl. ${caseItem.incident_time.slice(0, 5)}`}
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {caseItem.incident_description}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="secondary">
                      {getWarningTypeLabel(caseItem.warning_type)}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      Se detaljer
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
