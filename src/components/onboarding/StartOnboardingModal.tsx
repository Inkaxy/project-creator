import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { useDepartments } from "@/hooks/useEmployees";
import { useFunctions } from "@/hooks/useFunctions";
import { useContractTemplates } from "@/hooks/useContractTemplates";
import { useCreateOnboarding } from "@/hooks/useOnboardings";

const formSchema = z.object({
  full_name: z.string().min(2, "Navn må være minst 2 tegn"),
  email: z.string().email("Ugyldig e-postadresse"),
  employee_type: z.string().optional(),
  department_id: z.string().optional(),
  function_id: z.string().optional(),
  start_date: z.string().optional(),
  contract_template_id: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface StartOnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const employeeTypes = [
  { value: "fast", label: "Fast ansatt" },
  { value: "deltid", label: "Fast deltid" },
  { value: "tilkalling", label: "Tilkalling" },
  { value: "vikar", label: "Vikar" },
  { value: "laerling", label: "Lærling" },
  { value: "sesong", label: "Sesong" },
];

export function StartOnboardingModal({ open, onOpenChange }: StartOnboardingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: departments = [] } = useDepartments();
  const { data: functions = [] } = useFunctions();
  const { data: templates = [] } = useContractTemplates();
  const createOnboarding = useCreateOnboarding();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      email: "",
      employee_type: "",
      department_id: "",
      function_id: "",
      start_date: "",
      contract_template_id: "",
      notes: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await createOnboarding.mutateAsync({
        full_name: values.full_name,
        email: values.email,
        employee_type: values.employee_type || undefined,
        department_id: values.department_id || undefined,
        function_id: values.function_id || undefined,
        start_date: values.start_date || undefined,
        contract_template_id: values.contract_template_id || undefined,
        notes: values.notes || undefined,
      });
      form.reset();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Start ny onboarding</DialogTitle>
          <DialogDescription>
            Fyll ut informasjonen nedenfor for å sende en invitasjon til den nye ansatte.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Fullt navn *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ola Nordmann" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>E-post *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="ola@eksempel.no" {...field} />
                    </FormControl>
                    <FormDescription>
                      Invitasjonen sendes til denne adressen
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="employee_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ansatttype</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Velg type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employeeTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Startdato</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avdeling</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Velg avdeling" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="function_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funksjon/stilling</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Velg funksjon" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {functions.map((func) => (
                          <SelectItem key={func.id} value={func.id}>
                            {func.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contract_template_id"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Kontraktmal</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Velg mal for arbeidsavtale" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name} {template.is_default && "(Standard)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Interne notater</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Notater om onboardingen (kun synlig for ledere)"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Avbryt
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sender...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send invitasjon
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
