import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { History, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { useState } from "react";
import { useWageLadderHistory } from "@/hooks/useWageLadderHistory";
import { useWageLadders } from "@/hooks/useWageLadders";

export function WageLadderHistoryPanel() {
  const [selectedLadderId, setSelectedLadderId] = useState<string>("all");
  const { data: wageLadders, isLoading: laddersLoading } = useWageLadders();
  const { data: history, isLoading: historyLoading } = useWageLadderHistory(
    selectedLadderId === "all" ? undefined : selectedLadderId
  );

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("nb-NO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " kr";
  };

  const isLoading = laddersLoading || historyLoading;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5" />
            Lønnshistorikk
          </CardTitle>
          <Select value={selectedLadderId} onValueChange={setSelectedLadderId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Alle lønnsstiger" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle lønnsstiger</SelectItem>
              {wageLadders?.map((ladder) => (
                <SelectItem key={ladder.id} value={ladder.id}>
                  {ladder.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : !history || history.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Ingen lønnsendringer registrert.
          </p>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {history.map((entry) => {
                const isIncrease = entry.old_hourly_rate 
                  ? entry.new_hourly_rate > entry.old_hourly_rate 
                  : true;
                const difference = entry.old_hourly_rate 
                  ? entry.new_hourly_rate - entry.old_hourly_rate 
                  : null;

                return (
                  <Card key={entry.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {entry.wage_ladders?.name || "Ukjent stige"}
                          </span>
                          <Badge variant="outline">Nivå {entry.level}</Badge>
                          {isIncrease ? (
                            <Badge variant="outline" className="text-green-600 border-green-300">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Økning
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-300">
                              <TrendingDown className="h-3 w-3 mr-1" />
                              Reduksjon
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm">
                          {entry.old_hourly_rate ? (
                            <>
                              <span className="text-muted-foreground">
                                {formatCurrency(entry.old_hourly_rate)}
                              </span>
                              <span className="mx-2">→</span>
                              <span className="font-medium">
                                {formatCurrency(entry.new_hourly_rate)}
                              </span>
                              {difference && (
                                <span className={`ml-2 ${isIncrease ? 'text-green-600' : 'text-amber-600'}`}>
                                  ({isIncrease ? '+' : ''}{formatCurrency(difference)})
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="font-medium">
                              {formatCurrency(entry.new_hourly_rate)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            Gjelder fra: {format(new Date(entry.effective_from), "dd.MM.yyyy", { locale: nb })}
                          </span>
                          <span>
                            Opprettet: {format(new Date(entry.created_at), "dd.MM.yyyy HH:mm", { locale: nb })}
                          </span>
                          {entry.profiles && (
                            <span>Av: {entry.profiles.full_name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
