import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmployeeProfile, useDepartments } from "@/hooks/useEmployees";
import { EmployeeDetails, useUpsertEmployeeDetails } from "@/hooks/useEmployeeDetails";
import { useUpdateProfile } from "@/hooks/useProfileMutations";
import { useWageLadders } from "@/hooks/useWageLadders";
import { useFunctions } from "@/hooks/useFunctions";
import { FixedSalaryCalculator } from "./FixedSalaryCalculator";
import { Calculator } from "lucide-react";

interface EmployeeEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: EmployeeProfile;
  employeeDetails: EmployeeDetails | null | undefined;
}

export function EmployeeEditModal({
  open,
  onOpenChange,
  employee,
  employeeDetails,
}: EmployeeEditModalProps) {
  const { data: departments = [] } = useDepartments();
  const { data: functions = [] } = useFunctions();
  const { data: wageLadders = [] } = useWageLadders();

  const updateProfile = useUpdateProfile();
  const upsertDetails = useUpsertEmployeeDetails();

  // Extended profile fields
  const extendedProfile = employee as EmployeeProfile & {
    date_of_birth?: string | null;
    address?: string | null;
    postal_code?: string | null;
    city?: string | null;
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    emergency_contact_relation?: string | null;
    employee_number?: string | null;
  };

  // Profile form state
  const [fullName, setFullName] = useState(employee.full_name);
  const [email, setEmail] = useState(employee.email);
  const [phone, setPhone] = useState(employee.phone || "");
  const [dateOfBirth, setDateOfBirth] = useState(extendedProfile.date_of_birth || "");
  const [address, setAddress] = useState(extendedProfile.address || "");
  const [postalCode, setPostalCode] = useState(extendedProfile.postal_code || "");
  const [city, setCity] = useState(extendedProfile.city || "");
  const [employeeNumber, setEmployeeNumber] = useState(extendedProfile.employee_number || "");
  const [emergencyName, setEmergencyName] = useState(extendedProfile.emergency_contact_name || "");
  const [emergencyPhone, setEmergencyPhone] = useState(extendedProfile.emergency_contact_phone || "");
  const [emergencyRelation, setEmergencyRelation] = useState(extendedProfile.emergency_contact_relation || "");

  // Employment form state
  const [employeeType, setEmployeeType] = useState(employee.employee_type || "fast");
  const [departmentId, setDepartmentId] = useState(employee.department_id || "");
  const [functionId, setFunctionId] = useState(employee.function_id || "");
  const [startDate, setStartDate] = useState(employee.start_date || "");
  const [endDate, setEndDate] = useState(employeeDetails?.end_date || "");
  const [probationEndDate, setProbationEndDate] = useState(employeeDetails?.probation_end_date || "");

  // Salary form state
  const [salaryType, setSalaryType] = useState<"hourly" | "fixed">(employeeDetails?.salary_type || "hourly");
  const [competenceLevel, setCompetenceLevel] = useState(employeeDetails?.competence_level || "ufaglaert");
  const [wageLadderId, setWageLadderId] = useState(employeeDetails?.wage_ladder_id || "");
  const [contractedHoursPerWeek, setContractedHoursPerWeek] = useState(String(employeeDetails?.contracted_hours_per_week || 37.5));
  const [fixedMonthlySalary, setFixedMonthlySalary] = useState(String(employeeDetails?.fixed_monthly_salary || ""));
  const [includedNightHours, setIncludedNightHours] = useState(String(employeeDetails?.included_night_hours || ""));
  const [contractedHoursPerMonth, setContractedHoursPerMonth] = useState(String(employeeDetails?.contracted_hours_per_month || ""));
  const [currentSeniorityLevel, setCurrentSeniorityLevel] = useState<number | undefined>(employeeDetails?.current_seniority_level || undefined);
  const [accumulatedHours, setAccumulatedHours] = useState(employeeDetails?.accumulated_hours || 0);
  
  // Calculator visibility
  const [showCalculator, setShowCalculator] = useState(false);

  // HMS form state
  const [isSafetyRep, setIsSafetyRep] = useState(employeeDetails?.is_safety_representative || false);
  const [isFireSafety, setIsFireSafety] = useState(employeeDetails?.is_fire_safety_leader || false);
  const [isFoodSafety, setIsFoodSafety] = useState(employeeDetails?.is_food_safety_responsible || false);
  const [hasFirstAid, setHasFirstAid] = useState(employeeDetails?.has_first_aid_course || false);

  const handleSave = async () => {
    try {
      // Update profile
      await updateProfile.mutateAsync({
        id: employee.id,
        full_name: fullName,
        email,
        phone: phone || null,
        date_of_birth: dateOfBirth || null,
        address: address || null,
        postal_code: postalCode || null,
        city: city || null,
        employee_number: employeeNumber || null,
        emergency_contact_name: emergencyName || null,
        emergency_contact_phone: emergencyPhone || null,
        emergency_contact_relation: emergencyRelation || null,
        employee_type: employeeType as any,
        department_id: departmentId || null,
        function_id: functionId || null,
        start_date: startDate || null,
      });

      // Update employee details
      await upsertDetails.mutateAsync({
        employee_id: employee.id,
        end_date: endDate || null,
        probation_end_date: probationEndDate || null,
        salary_type: salaryType,
        competence_level: competenceLevel as any,
        wage_ladder_id: wageLadderId || null,
        contracted_hours_per_week: parseFloat(contractedHoursPerWeek) || 37.5,
        fixed_monthly_salary: fixedMonthlySalary ? parseFloat(fixedMonthlySalary) : null,
        included_night_hours: includedNightHours ? parseFloat(includedNightHours) : null,
        contracted_hours_per_month: contractedHoursPerMonth ? parseFloat(contractedHoursPerMonth) : null,
        current_seniority_level: currentSeniorityLevel || null,
        accumulated_hours: accumulatedHours,
        is_safety_representative: isSafetyRep,
        is_fire_safety_leader: isFireSafety,
        is_food_safety_responsible: isFoodSafety,
        has_first_aid_course: hasFirstAid,
      });

      onOpenChange(false);
    } catch (error) {
      // Error handled by mutations
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={showCalculator ? "sm:max-w-[95vw] max-h-[95vh] overflow-y-auto" : "sm:max-w-[600px] max-h-[85vh] overflow-y-auto"}>
        <DialogHeader>
          <DialogTitle>Rediger {employee.full_name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="personal" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">Personalia</TabsTrigger>
            <TabsTrigger value="employment">Ansettelse</TabsTrigger>
            <TabsTrigger value="salary">Lønn</TabsTrigger>
            <TabsTrigger value="hms">HMS</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fullt navn</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Ansattnummer</Label>
                <Input value={employeeNumber} onChange={(e) => setEmployeeNumber(e.target.value)} placeholder="Valgfritt" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>E-post</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fødselsdato</Label>
              <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Postnummer</Label>
                <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Sted</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-3">Nødkontakt</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Navn</Label>
                  <Input value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <Input value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Relasjon</Label>
                  <Input value={emergencyRelation} onChange={(e) => setEmergencyRelation(e.target.value)} placeholder="f.eks. Ektefelle" />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="employment" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ansettelsestype</Label>
                <Select value={employeeType} onValueChange={setEmployeeType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fast">Fast ansatt</SelectItem>
                    <SelectItem value="deltid">Fast deltid</SelectItem>
                    <SelectItem value="tilkalling">Tilkalling</SelectItem>
                    <SelectItem value="vikar">Vikar</SelectItem>
                    <SelectItem value="laerling">Lærling</SelectItem>
                    <SelectItem value="sesong">Sesongarbeider</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Avdeling</Label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg avdeling" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Hovedfunksjon</Label>
              <Select value={functionId} onValueChange={setFunctionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg hovedfunksjon" />
                </SelectTrigger>
                <SelectContent>
                  {functions.map((func) => (
                    <SelectItem key={func.id} value={func.id}>{func.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Startdato</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Prøvetid slutt</Label>
                <Input type="date" value={probationEndDate} onChange={(e) => setProbationEndDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Sluttdato</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="salary" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lønnstype</Label>
                <Select value={salaryType} onValueChange={(v) => setSalaryType(v as "hourly" | "fixed")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Timelønn</SelectItem>
                    <SelectItem value="fixed">Fastlønn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kompetansenivå</Label>
                <Select value={competenceLevel} onValueChange={(v) => setCompetenceLevel(v as "ufaglaert" | "faglaert" | "laerling")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ufaglaert">Ufaglært</SelectItem>
                    <SelectItem value="faglaert">Faglært</SelectItem>
                    <SelectItem value="laerling">Lærling</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {salaryType === "hourly" && (
              <>
                <div className="space-y-2">
                  <Label>Lønnsstige</Label>
                  <Select value={wageLadderId} onValueChange={setWageLadderId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg lønnsstige" />
                    </SelectTrigger>
                    <SelectContent>
                      {wageLadders.map((ladder) => (
                        <SelectItem key={ladder.id} value={ladder.id}>{ladder.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Avtalt timer per uke</Label>
                  <Input 
                    type="number" 
                    value={contractedHoursPerWeek} 
                    onChange={(e) => setContractedHoursPerWeek(e.target.value)} 
                  />
                </div>
              </>
            )}

            {salaryType === "fixed" && (
              <>
                <div className="space-y-2">
                  <Label>Lønnsstige (for beregning)</Label>
                  <Select value={wageLadderId} onValueChange={setWageLadderId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg lønnsstige" />
                    </SelectTrigger>
                    <SelectContent>
                      {wageLadders.map((ladder) => (
                        <SelectItem key={ladder.id} value={ladder.id}>{ladder.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Calculator Toggle Button */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setShowCalculator(!showCalculator)}
                >
                  <Calculator className="h-4 w-4" />
                  {showCalculator ? "Skjul kalkulator" : "Åpne fastlønn-kalkulator"}
                </Button>

                {/* Calculator */}
                {showCalculator && (
                  <div className="mt-4 border-t pt-4">
                    <FixedSalaryCalculator
                      employeeId={employee.id}
                      employeeName={employee.full_name}
                      competenceLevel={competenceLevel as "ufaglaert" | "faglaert" | "laerling"}
                      accumulatedHours={accumulatedHours}
                      currentWageLadderId={wageLadderId}
                      currentSeniorityLevel={currentSeniorityLevel}
                      onApply={(result) => {
                        setFixedMonthlySalary(String(Math.round(result.fixedMonthlySalary)));
                        setIncludedNightHours(String((result.totalNightHours / 4 * 4.33).toFixed(1)));
                        setContractedHoursPerMonth(String(Math.round((result.totalOrdinaryHours + result.totalNightHours) / 4 * 4.33)));
                        setCurrentSeniorityLevel(result.selectedLevel);
                        setAccumulatedHours(result.adjustedAccumulatedHours);
                        setShowCalculator(false);
                      }}
                    />
                  </div>
                )}

                {/* Manual Input Fields */}
                {!showCalculator && (
                  <>
                    <div className="space-y-2">
                      <Label>Månedslønn (kr)</Label>
                      <Input 
                        type="number" 
                        value={fixedMonthlySalary} 
                        onChange={(e) => setFixedMonthlySalary(e.target.value)} 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Avtalt timer per måned</Label>
                        <Input 
                          type="number" 
                          value={contractedHoursPerMonth} 
                          onChange={(e) => setContractedHoursPerMonth(e.target.value)} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Innbakte natt-timer (per mnd)</Label>
                        <Input 
                          type="number" 
                          value={includedNightHours} 
                          onChange={(e) => setIncludedNightHours(e.target.value)} 
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="hms" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Tildel HMS og IK-roller til denne ansatte.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="safety-rep">Verneombud</Label>
                <Switch id="safety-rep" checked={isSafetyRep} onCheckedChange={setIsSafetyRep} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="fire-safety">Brannvernleder</Label>
                <Switch id="fire-safety" checked={isFireSafety} onCheckedChange={setIsFireSafety} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="food-safety">IK-Mat ansvarlig</Label>
                <Switch id="food-safety" checked={isFoodSafety} onCheckedChange={setIsFoodSafety} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="first-aid">Førstehjelpskurs</Label>
                <Switch id="first-aid" checked={hasFirstAid} onCheckedChange={setHasFirstAid} />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSave} disabled={updateProfile.isPending || upsertDetails.isPending}>
            {updateProfile.isPending || upsertDetails.isPending ? "Lagrer..." : "Lagre endringer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
