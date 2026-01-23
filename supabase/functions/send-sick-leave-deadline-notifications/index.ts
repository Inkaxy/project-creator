import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SickLeave {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  status: string;
  follow_up_plan_due: string | null;
  dialogue_meeting_1_due: string | null;
  activity_requirement_due: string | null;
  dialogue_meeting_2_due: string | null;
}

interface Profile {
  id: string;
  full_name: string | null;
}

interface SickLeaveSettings {
  notify_days_before_deadline: number;
  notify_manager_on_sick_leave: boolean;
}

interface DeadlineNotification {
  sick_leave_id: string;
  deadline_type: string;
  deadline_date: string;
}

const deadlineTypeLabels: Record<string, string> = {
  follow_up_plan: "Oppfølgingsplan",
  dialogue_meeting_1: "Dialogmøte 1",
  activity_requirement: "Aktivitetskrav",
  dialogue_meeting_2: "Dialogmøte 2",
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("nb-NO", { day: "numeric", month: "short" });
}

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(dateStr);
  deadline.setHours(0, 0, 0, 0);
  return Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting sick leave deadline notification check...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get notification settings
    const { data: settingsData } = await supabase
      .from("sick_leave_settings")
      .select("notify_days_before_deadline, notify_manager_on_sick_leave")
      .limit(1)
      .single();

    const settings: SickLeaveSettings = settingsData || {
      notify_days_before_deadline: 3,
      notify_manager_on_sick_leave: true,
    };

    console.log(`Settings: notify ${settings.notify_days_before_deadline} days before deadline`);

    // Get active sick leaves with deadlines
    const { data: sickLeaves, error: sickLeavesError } = await supabase
      .from("sick_leaves")
      .select(`
        id,
        employee_id,
        leave_type,
        start_date,
        status,
        follow_up_plan_due,
        dialogue_meeting_1_due,
        activity_requirement_due,
        dialogue_meeting_2_due
      `)
      .eq("status", "active");

    if (sickLeavesError) {
      console.error("Error fetching sick leaves:", sickLeavesError);
      throw sickLeavesError;
    }

    if (!sickLeaves || sickLeaves.length === 0) {
      console.log("No active sick leaves found");
      return new Response(
        JSON.stringify({ success: true, message: "No active sick leaves", notificationsSent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${sickLeaves.length} active sick leaves`);

    // Get employee names for notifications
    const employeeIds = [...new Set(sickLeaves.map((sl) => sl.employee_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", employeeIds);

    const profileMap = new Map<string, string>();
    profiles?.forEach((p: Profile) => {
      profileMap.set(p.id, p.full_name || "Ukjent ansatt");
    });

    // Get already sent notifications
    const { data: sentNotifications } = await supabase
      .from("sick_leave_deadline_notifications")
      .select("sick_leave_id, deadline_type, deadline_date");

    const sentSet = new Set<string>();
    sentNotifications?.forEach((n: DeadlineNotification) => {
      sentSet.add(`${n.sick_leave_id}-${n.deadline_type}-${n.deadline_date}`);
    });

    // Get managers to notify
    const { data: managers } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["superadmin", "daglig_leder"]);

    if (!managers || managers.length === 0) {
      console.log("No managers found to notify");
      return new Response(
        JSON.stringify({ success: true, message: "No managers to notify", notificationsSent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const managerIds = managers.map((m) => m.user_id);
    console.log(`Found ${managerIds.length} managers to notify`);

    // Process deadlines
    const notificationsToInsert: Array<{
      user_id: string;
      type: string;
      title: string;
      message: string;
      link: string;
      metadata: Record<string, unknown>;
    }> = [];

    const deadlineRecordsToInsert: Array<{
      sick_leave_id: string;
      deadline_type: string;
      deadline_date: string;
    }> = [];

    const deadlineTypes = [
      { field: "follow_up_plan_due", type: "follow_up_plan" },
      { field: "dialogue_meeting_1_due", type: "dialogue_meeting_1" },
      { field: "activity_requirement_due", type: "activity_requirement" },
      { field: "dialogue_meeting_2_due", type: "dialogue_meeting_2" },
    ];

    for (const sickLeave of sickLeaves as SickLeave[]) {
      const employeeName = profileMap.get(sickLeave.employee_id) || "Ukjent ansatt";

      for (const { field, type } of deadlineTypes) {
        const deadlineDate = sickLeave[field as keyof SickLeave] as string | null;
        if (!deadlineDate) continue;

        const daysUntil = getDaysUntil(deadlineDate);
        const notificationKey = `${sickLeave.id}-${type}-${deadlineDate}`;

        // Skip if already sent
        if (sentSet.has(notificationKey)) continue;

        // Check if within notification window or overdue
        const isOverdue = daysUntil < 0;
        const isWithinWindow = daysUntil >= 0 && daysUntil <= settings.notify_days_before_deadline;

        if (!isOverdue && !isWithinWindow) continue;

        const label = deadlineTypeLabels[type] || type;
        const formattedDate = formatDate(deadlineDate);

        let title: string;
        let message: string;
        let notificationType: string;

        if (isOverdue) {
          notificationType = "sick_leave_deadline_overdue";
          title = `⚠️ Forfalt frist: ${label}`;
          message = `${label} for ${employeeName} forfalt ${formatDate(deadlineDate)} (${Math.abs(daysUntil)} dager siden)`;
        } else if (daysUntil === 0) {
          notificationType = "sick_leave_deadline_warning";
          title = `🔔 Frist i dag: ${label}`;
          message = `${label} for ${employeeName} forfaller i dag (${formattedDate})`;
        } else {
          notificationType = "sick_leave_deadline_warning";
          title = `🔔 Frist nærmer seg: ${label}`;
          message = `${label} for ${employeeName} forfaller om ${daysUntil} dag${daysUntil > 1 ? "er" : ""} (${formattedDate})`;
        }

        // Create notification for each manager
        for (const managerId of managerIds) {
          notificationsToInsert.push({
            user_id: managerId,
            type: notificationType,
            title,
            message,
            link: "/sykefravaer?tab=deadlines",
            metadata: {
              sick_leave_id: sickLeave.id,
              employee_id: sickLeave.employee_id,
              employee_name: employeeName,
              deadline_type: type,
              deadline_date: deadlineDate,
              days_until: daysUntil,
            },
          });
        }

        // Mark as sent (only add once per deadline, not per manager)
        deadlineRecordsToInsert.push({
          sick_leave_id: sickLeave.id,
          deadline_type: type,
          deadline_date: deadlineDate,
        });

        sentSet.add(notificationKey); // Prevent duplicates in same run
      }
    }

    // Insert notifications
    let notificationsSent = 0;
    if (notificationsToInsert.length > 0) {
      const { error: notifError } = await supabase
        .from("notifications")
        .insert(notificationsToInsert);

      if (notifError) {
        console.error("Error inserting notifications:", notifError);
      } else {
        notificationsSent = notificationsToInsert.length;
        console.log(`Inserted ${notificationsSent} notifications`);
      }
    }

    // Mark deadlines as notified
    if (deadlineRecordsToInsert.length > 0) {
      const { error: recordError } = await supabase
        .from("sick_leave_deadline_notifications")
        .upsert(deadlineRecordsToInsert, { onConflict: "sick_leave_id,deadline_type,deadline_date" });

      if (recordError) {
        console.error("Error recording sent notifications:", recordError);
      } else {
        console.log(`Recorded ${deadlineRecordsToInsert.length} deadline notifications as sent`);
      }
    }

    console.log("Sick leave deadline notification check completed");

    return new Response(
      JSON.stringify({
        success: true,
        notificationsSent,
        deadlinesProcessed: deadlineRecordsToInsert.length,
        activeSickLeaves: sickLeaves.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-sick-leave-deadline-notifications:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
