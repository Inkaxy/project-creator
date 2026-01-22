import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import {
  LogIn,
  LogOut,
  Clock,
  User,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import crewplanLogo from "@/assets/crewplan-logo-v2.png";

interface KioskEmployee {
  id: string;
  full_name: string;
  avatar_url: string | null;
  pin_code: string | null;
  department_id: string | null;
}

interface ActiveEntry {
  id: string;
  clock_in: string;
  shift_id: string | null;
}

type KioskMode = "idle" | "select_employee" | "enter_pin" | "action" | "success";

export default function KioskPage() {
  const [mode, setMode] = useState<KioskMode>("idle");
  const [employees, setEmployees] = useState<KioskEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<KioskEmployee | null>(null);
  const [pin, setPin] = useState("");
  const [activeEntry, setActiveEntry] = useState<ActiveEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null);

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch employees on mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, pin_code, department_id")
      .eq("is_active", true)
      .order("full_name");

    if (!error && data) {
      setEmployees(data);
    }
  };

  const checkActiveEntry = async (employeeId: string) => {
    const { data } = await supabase
      .from("time_entries")
      .select("id, clock_in, shift_id")
      .eq("employee_id", employeeId)
      .is("clock_out", null)
      .not("clock_in", "is", null)
      .maybeSingle();

    setActiveEntry(data || null);
    return data;
  };

  const handleEmployeeSelect = async (employee: KioskEmployee) => {
    setSelectedEmployee(employee);
    setPin("");
    
    if (employee.pin_code) {
      setMode("enter_pin");
    } else {
      // No PIN required, check status and go to action
      await checkActiveEntry(employee.id);
      setMode("action");
    }
  };

  const handlePinSubmit = async () => {
    if (!selectedEmployee) return;

    if (pin !== selectedEmployee.pin_code) {
      toast.error("Feil PIN-kode");
      setPin("");
      return;
    }

    await checkActiveEntry(selectedEmployee.id);
    setMode("action");
  };

  const handlePinKeyPress = (key: string) => {
    if (key === "clear") {
      setPin("");
    } else if (key === "back") {
      setPin(prev => prev.slice(0, -1));
    } else if (pin.length < 4) {
      const newPin = pin + key;
      setPin(newPin);
      
      // Auto-submit when 4 digits entered
      if (newPin.length === 4 && selectedEmployee?.pin_code === newPin) {
        setTimeout(() => handlePinSubmit(), 200);
      }
    }
  };

  const handleClockIn = async () => {
    if (!selectedEmployee) return;
    setIsLoading(true);

    try {
      const now = new Date();
      const date = now.toISOString().split("T")[0];

      // Check for today's shift
      const { data: shift } = await supabase
        .from("shifts")
        .select("id")
        .eq("employee_id", selectedEmployee.id)
        .eq("date", date)
        .neq("status", "cancelled")
        .maybeSingle();

      const { error } = await supabase.from("time_entries").insert({
        employee_id: selectedEmployee.id,
        shift_id: shift?.id || null,
        date,
        clock_in: now.toISOString(),
        status: "draft",
      });

      if (error) throw error;

      setActionResult({ success: true, message: "Stemplet inn!" });
      setMode("success");
    } catch (error) {
      setActionResult({ success: false, message: "Kunne ikke stemple inn" });
      setMode("success");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!selectedEmployee || !activeEntry) return;
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("time_entries")
        .update({
          clock_out: new Date().toISOString(),
        })
        .eq("id", activeEntry.id);

      if (error) throw error;

      setActionResult({ success: true, message: "Stemplet ut!" });
      setMode("success");
    } catch (error) {
      setActionResult({ success: false, message: "Kunne ikke stemple ut" });
      setMode("success");
    } finally {
      setIsLoading(false);
    }
  };

  const resetKiosk = () => {
    setMode("idle");
    setSelectedEmployee(null);
    setPin("");
    setActiveEntry(null);
    setActionResult(null);
  };

  // Auto-reset after success
  useEffect(() => {
    if (mode === "success") {
      const timer = setTimeout(resetKiosk, 3000);
      return () => clearTimeout(timer);
    }
  }, [mode]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b">
        <div className="flex items-center gap-3">
          <img src={crewplanLogo} alt="Crewplan" className="h-10 w-10" />
          <span className="text-2xl font-bold">Crewplan Kiosk</span>
        </div>
        <div className="text-right">
          <p className="text-3xl font-mono font-bold">
            {format(currentTime, "HH:mm:ss")}
          </p>
          <p className="text-muted-foreground">
            {format(currentTime, "EEEE d. MMMM yyyy", { locale: nb })}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        {mode === "idle" && (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Velkommen!</CardTitle>
              <p className="text-muted-foreground">Velg ditt navn for å stemple</p>
            </CardHeader>
            <CardContent>
              <Button
                size="lg"
                className="w-full h-16 text-xl"
                onClick={() => setMode("select_employee")}
              >
                <User className="mr-2 h-6 w-6" />
                Velg ansatt
              </Button>
            </CardContent>
          </Card>
        )}

        {mode === "select_employee" && (
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <CardHeader className="flex flex-row items-center gap-2">
              <Button variant="ghost" size="icon" onClick={resetKiosk}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <CardTitle>Velg ditt navn</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {employees.map((emp) => (
                  <Button
                    key={emp.id}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-1"
                    onClick={() => handleEmployeeSelect(emp)}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                      {getInitials(emp.full_name)}
                    </div>
                    <span className="text-sm font-medium truncate max-w-full px-1">
                      {emp.full_name}
                    </span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {mode === "enter_pin" && selectedEmployee && (
          <Card className="w-full max-w-sm">
            <CardHeader className="text-center">
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-4"
                onClick={() => setMode("select_employee")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-semibold">
                {getInitials(selectedEmployee.full_name)}
              </div>
              <CardTitle className="mt-2">{selectedEmployee.full_name}</CardTitle>
              <p className="text-muted-foreground">Skriv inn PIN-kode</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* PIN Display */}
              <div className="flex justify-center gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-14 w-14 rounded-lg border-2 flex items-center justify-center text-2xl font-bold"
                  >
                    {pin[i] ? "•" : ""}
                  </div>
                ))}
              </div>

              {/* Numeric Keypad */}
              <div className="grid grid-cols-3 gap-2">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"].map((key) => (
                  <Button
                    key={key}
                    variant={key === "clear" || key === "back" ? "outline" : "secondary"}
                    size="lg"
                    className="h-16 text-xl font-semibold"
                    onClick={() => handlePinKeyPress(key)}
                  >
                    {key === "clear" ? "C" : key === "back" ? "←" : key}
                  </Button>
                ))}
              </div>

              <Button
                className="w-full h-14 text-lg"
                onClick={handlePinSubmit}
                disabled={pin.length !== 4}
              >
                <KeyRound className="mr-2 h-5 w-5" />
                Bekreft
              </Button>
            </CardContent>
          </Card>
        )}

        {mode === "action" && selectedEmployee && (
          <Card className="w-full max-w-sm">
            <CardHeader className="text-center">
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-4"
                onClick={() => setMode("select_employee")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-semibold">
                {getInitials(selectedEmployee.full_name)}
              </div>
              <CardTitle className="mt-2">{selectedEmployee.full_name}</CardTitle>
              {activeEntry ? (
                <Badge className="mt-2" variant="secondary">
                  <Clock className="mr-1 h-3 w-3" />
                  Stemplet inn {format(new Date(activeEntry.clock_in), "HH:mm")}
                </Badge>
              ) : (
                <p className="text-muted-foreground mt-2">Ikke stemplet inn</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {activeEntry ? (
                <Button
                  size="lg"
                  variant="destructive"
                  className="w-full h-20 text-xl"
                  onClick={handleClockOut}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  ) : (
                    <LogOut className="mr-2 h-6 w-6" />
                  )}
                  {isLoading ? "Stempler ut..." : "Stemple ut"}
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="w-full h-20 text-xl"
                  onClick={handleClockIn}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  ) : (
                    <LogIn className="mr-2 h-6 w-6" />
                  )}
                  {isLoading ? "Stempler inn..." : "Stemple inn"}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {mode === "success" && actionResult && (
          <Card className="w-full max-w-sm">
            <CardContent className="py-12 text-center">
              {actionResult.success ? (
                <CheckCircle2 className="h-24 w-24 mx-auto text-primary mb-4" />
              ) : (
                <XCircle className="h-24 w-24 mx-auto text-destructive mb-4" />
              )}
              <h2 className="text-3xl font-bold mb-2">{actionResult.message}</h2>
              <p className="text-muted-foreground">
                {selectedEmployee?.full_name} • {format(currentTime, "HH:mm")}
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                Går tilbake om 3 sekunder...
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
