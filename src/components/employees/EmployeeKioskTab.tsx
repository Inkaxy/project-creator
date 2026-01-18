import { useState } from "react";
import { EmployeeProfile } from "@/hooks/useEmployees";
import { EmployeeDetails } from "@/hooks/useEmployeeDetails";
import { useUpsertEmployeeDetails } from "@/hooks/useEmployeeDetails";
import { useUpdatePinCode } from "@/hooks/useProfileMutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  EyeOff,
  RefreshCw,
  Smartphone,
  MapPin,
  QrCode,
  Download,
} from "lucide-react";
import { toast } from "sonner";

interface EmployeeKioskTabProps {
  employee: EmployeeProfile;
  employeeDetails: EmployeeDetails | null | undefined;
}

export function EmployeeKioskTab({ employee, employeeDetails }: EmployeeKioskTabProps) {
  const [showPin, setShowPin] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [isEditingPin, setIsEditingPin] = useState(false);

  const updatePinCode = useUpdatePinCode();
  const upsertDetails = useUpsertEmployeeDetails();

  // Get PIN from the profile (where it's stored according to the original schema)
  const extendedProfile = employee as EmployeeProfile & { pin_code?: string | null };
  const currentPin = extendedProfile.pin_code;

  const handlePinChange = async () => {
    if (!/^\d{4}$/.test(newPin)) {
      toast.error("PIN-kode må være 4 siffer");
      return;
    }

    try {
      await updatePinCode.mutateAsync({ employeeId: employee.id, pinCode: newPin });
      setIsEditingPin(false);
      setNewPin("");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const generateRandomPin = () => {
    const pin = String(Math.floor(1000 + Math.random() * 9000));
    setNewPin(pin);
  };

  const handleToggleMobileClock = async (enabled: boolean) => {
    await upsertDetails.mutateAsync({
      employee_id: employee.id,
      allow_mobile_clock: enabled,
    });
  };

  const handleToggleGpsRequired = async (enabled: boolean) => {
    await upsertDetails.mutateAsync({
      employee_id: employee.id,
      gps_required: enabled,
    });
  };

  return (
    <div className="space-y-6">
      {/* PIN Code Section */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-semibold text-foreground mb-4">PIN-kode for stemplingsur</h4>
          
          {isEditingPin ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  placeholder="4 siffer"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className="w-32 text-center text-lg font-mono tracking-widest"
                />
                <Button variant="outline" size="icon" onClick={generateRandomPin} title="Generer tilfeldig PIN">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Button onClick={handlePinChange} disabled={updatePinCode.isPending}>
                  {updatePinCode.isPending ? "Lagrer..." : "Lagre"}
                </Button>
                <Button variant="outline" onClick={() => { setIsEditingPin(false); setNewPin(""); }}>
                  Avbryt
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-lg tracking-widest">
                {showPin ? (
                  <span>{currentPin || "----"}</span>
                ) : (
                  <span>● ● ● ●</span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPin(!showPin)}
                title={showPin ? "Skjul PIN" : "Vis PIN"}
              >
                {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button variant="outline" onClick={() => setIsEditingPin(true)}>
                Endre
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code Section */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-semibold text-foreground mb-4">QR-kode for mobil-stempling</h4>
          <div className="flex items-start gap-6">
            <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
              <QrCode className="h-16 w-16 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-3">
              <p className="text-sm text-muted-foreground">
                Scan denne QR-koden med mobilappen for rask innlogging til stempling.
              </p>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Last ned QR-kode
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Section */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h4 className="font-semibold text-foreground">Stemplingsinnstillinger</h4>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Smartphone className="h-4 w-4 text-primary" />
              </div>
              <div>
                <Label htmlFor="mobile-clock" className="font-medium">Tillat mobil-stempling</Label>
                <p className="text-sm text-muted-foreground">
                  Ansatt kan stemple inn/ut via mobilappen
                </p>
              </div>
            </div>
            <Switch
              id="mobile-clock"
              checked={employeeDetails?.allow_mobile_clock ?? true}
              onCheckedChange={handleToggleMobileClock}
              disabled={upsertDetails.isPending}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div>
                <Label htmlFor="gps-required" className="font-medium">Krev GPS-verifisering</Label>
                <p className="text-sm text-muted-foreground">
                  Stempling må skje innenfor arbeidsstedets radius
                </p>
              </div>
            </div>
            <Switch
              id="gps-required"
              checked={employeeDetails?.gps_required ?? false}
              onCheckedChange={handleToggleGpsRequired}
              disabled={upsertDetails.isPending}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
