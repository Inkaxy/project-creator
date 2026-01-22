import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AutoApprovalLog {
  id: string;
  time_entry_id: string;
  employee_id: string;
  approver_id: string | null;
  deviation_minutes: number;
  auto_approved_at: string;
}

interface Profile {
  id: string;
  full_name: string | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting daily timesheet summary generation...");

    // Get all auto-approvals that haven't been included in a summary yet
    const { data: pendingLogs, error: logsError } = await supabase
      .from("auto_approvals_log")
      .select("*")
      .eq("summary_sent", false)
      .order("auto_approved_at", { ascending: false });

    if (logsError) {
      console.error("Error fetching auto approval logs:", logsError);
      throw logsError;
    }

    if (!pendingLogs || pendingLogs.length === 0) {
      console.log("No pending auto-approvals to summarize");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No pending auto-approvals to summarize",
          summariesSent: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${pendingLogs.length} auto-approvals to summarize`);

    // Get employee names for the summary
    const employeeIds = [...new Set(pendingLogs.map((log: AutoApprovalLog) => log.employee_id))];
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", employeeIds);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
    }

    const profileMap = new Map<string, string>();
    profiles?.forEach((p: Profile) => {
      profileMap.set(p.id, p.full_name || "Ukjent");
    });

    // Calculate summary stats
    const totalEntries = pendingLogs.length;
    const totalDeviationMinutes = pendingLogs.reduce((sum: number, log: AutoApprovalLog) => 
      sum + log.deviation_minutes, 0);
    const avgDeviation = Math.round(totalDeviationMinutes / totalEntries);

    // Group by employee for the message
    const entriesByEmployee = new Map<string, number>();
    pendingLogs.forEach((log: AutoApprovalLog) => {
      const current = entriesByEmployee.get(log.employee_id) || 0;
      entriesByEmployee.set(log.employee_id, current + 1);
    });

    // Build summary message
    let employeeSummary = "";
    if (entriesByEmployee.size <= 5) {
      const summaryParts: string[] = [];
      entriesByEmployee.forEach((count, empId) => {
        const name = profileMap.get(empId) || "Ukjent";
        summaryParts.push(`${name} (${count})`);
      });
      employeeSummary = ` Ansatte: ${summaryParts.join(", ")}.`;
    } else {
      employeeSummary = ` ${entriesByEmployee.size} ansatte hadde auto-godkjente timer.`;
    }

    const summaryMessage = `I går ble ${totalEntries} timeliste${totalEntries === 1 ? "" : "r"} automatisk godkjent` +
      ` (snittavvik: ${avgDeviation >= 0 ? "+" : ""}${avgDeviation} min).${employeeSummary}`;

    console.log("Summary message:", summaryMessage);

    // Find all users with manager roles to notify
    const { data: managerRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["superadmin", "daglig_leder"]);

    if (rolesError) {
      console.error("Error fetching manager roles:", rolesError);
      throw rolesError;
    }

    if (!managerRoles || managerRoles.length === 0) {
      console.log("No managers found to notify");
      // Still mark as sent even if no managers
      await supabase
        .from("auto_approvals_log")
        .update({ summary_sent: true })
        .in("id", pendingLogs.map((l: AutoApprovalLog) => l.id));

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No managers to notify, marked logs as processed",
          summariesSent: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending notifications to ${managerRoles.length} managers`);

    // Create notifications for each manager
    const notifications = managerRoles.map((role: { user_id: string }) => ({
      user_id: role.user_id,
      type: "daily_timesheet_summary",
      title: "Daglig timesammendrag",
      message: summaryMessage,
      link: "/godkjenninger?tab=timesheets",
      metadata: {
        total_entries: totalEntries,
        avg_deviation: avgDeviation,
        employee_count: entriesByEmployee.size,
        date: new Date().toISOString().split("T")[0],
      },
    }));

    const { error: notifyError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (notifyError) {
      console.error("Error creating notifications:", notifyError);
      throw notifyError;
    }

    // Mark all logs as sent
    const { error: updateError } = await supabase
      .from("auto_approvals_log")
      .update({ summary_sent: true })
      .in("id", pendingLogs.map((l: AutoApprovalLog) => l.id));

    if (updateError) {
      console.error("Error marking logs as sent:", updateError);
      throw updateError;
    }

    console.log(`Successfully sent ${notifications.length} summary notifications`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${notifications.length} summary notifications`,
        summariesSent: notifications.length,
        entriesProcessed: totalEntries,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in send-daily-timesheet-summary:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
