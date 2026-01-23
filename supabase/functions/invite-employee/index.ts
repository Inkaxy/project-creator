import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  onboardingId: string;
  email: string;
  fullName: string;
  invitationToken: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { onboardingId, email, fullName, invitationToken }: InviteRequest = await req.json();

    console.log(`Processing invitation for ${email}`);

    // Get the base URL for the onboarding link
    // In production, this should be configured via environment variable
    const baseUrl = Deno.env.get("APP_URL") || "https://crew-plan.lovable.app";
    const onboardingUrl = `${baseUrl}/onboarding/${invitationToken}`;

    // For now, we'll use Supabase's built-in email functionality
    // In a real implementation, you might want to use a custom email service
    
    // Update the onboarding record to mark invitation as sent
    const { error: updateError } = await supabase
      .from("employee_onboardings")
      .update({
        invitation_sent_at: new Date().toISOString(),
        status: "invited",
      })
      .eq("id", onboardingId);

    if (updateError) {
      console.error("Error updating onboarding:", updateError);
      throw updateError;
    }

    // Create a notification for admins
    const { data: admins, error: adminError } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["superadmin", "daglig_leder"]);

    if (!adminError && admins) {
      const notifications = admins.map((admin) => ({
        user_id: admin.user_id,
        type: "general",
        title: "Onboarding startet",
        message: `Invitasjon sendt til ${fullName} (${email})`,
        link: "/ansatte",
      }));

      await supabase.from("notifications").insert(notifications);
    }

    console.log(`Invitation processed successfully for ${email}`);
    console.log(`Onboarding URL: ${onboardingUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Invitation sent successfully",
        onboardingUrl,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Error processing invitation:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to process invitation";
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
