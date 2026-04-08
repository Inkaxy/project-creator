import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

/**
 * After registering an egenmelding, check if the employee's self-cert quota
 * is now exhausted (days or occurrences). If so, notify all managers/admins
 * in the employee's department.
 */
export async function checkAndNotifyQuotaExhaustion(employeeId: string) {
  try {
    const today = format(new Date(), "yyyy-MM-dd");

    // 1. Fetch quota
    const { data: quota } = await supabase
      .from("self_certification_quotas")
      .select("*")
      .eq("employee_id", employeeId)
      .lte("period_start", today)
      .gte("period_end", today)
      .eq("is_active", true)
      .maybeSingle();

    if (!quota) return;

    const daysExhausted = quota.days_used >= quota.max_days_per_period;
    const occExhausted = quota.max_occurrences_per_period
      ? quota.occurrences_used >= quota.max_occurrences_per_period
      : false;

    if (!daysExhausted && !occExhausted) return;

    // 2. Get the employee's name and department
    const { data: employee } = await supabase
      .from("profiles")
      .select("full_name, department_id")
      .eq("id", employeeId)
      .single();

    if (!employee) return;

    // 3. Find managers/admins (users with superadmin or daglig_leder role)
    const { data: managerRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["superadmin", "daglig_leder"]);

    if (!managerRoles || managerRoles.length === 0) return;

    // If the employee has a department, filter managers to same department
    let targetManagerIds = managerRoles.map((r) => r.user_id);

    if (employee.department_id) {
      const { data: deptManagers } = await supabase
        .from("profiles")
        .select("id")
        .eq("department_id", employee.department_id)
        .in("id", targetManagerIds);

      // If department managers found, notify only them; otherwise notify all managers
      if (deptManagers && deptManagers.length > 0) {
        targetManagerIds = deptManagers.map((m) => m.id);
      }
    }

    // 4. Build the message
    const reasonParts: string[] = [];
    if (daysExhausted) {
      reasonParts.push(
        `${quota.days_used} av ${quota.max_days_per_period} egenmeldingsdager brukt`
      );
    }
    if (occExhausted) {
      reasonParts.push(
        `${quota.occurrences_used} av ${quota.max_occurrences_per_period} egenmeldingsperioder brukt`
      );
    }

    const message = `${employee.full_name} har brukt opp sin egenmeldingskvote: ${reasonParts.join(", ")}.`;

    // 5. Create notifications for each manager
    const notifications = targetManagerIds.map((managerId) => ({
      user_id: managerId,
      type: "self_cert_quota_exhausted",
      title: "⚠️ Egenmeldingskvote brukt opp",
      message,
      link: "/sykefravaer?tab=quotas",
      metadata: {
        employee_id: employeeId,
        employee_name: employee.full_name,
        days_used: quota.days_used,
        max_days: quota.max_days_per_period,
        occurrences_used: quota.occurrences_used,
        max_occurrences: quota.max_occurrences_per_period,
      },
    }));

    await supabase.from("notifications").insert(notifications);
  } catch (error) {
    console.error("Error checking self-cert quota exhaustion:", error);
  }
}
