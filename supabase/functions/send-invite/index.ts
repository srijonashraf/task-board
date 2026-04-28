// Supabase Edge Function: send-invite
// Sends invite emails via Resend (optional, invites work via link without this)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { board_id, email, role } = await req.json();

    // Verify caller is owner/admin
    const { data: membership } = await supabaseClient
      .from("board_members")
      .select("role")
      .eq("board_id", board_id)
      .eq("user_id", user.id)
      .single();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create invite
    const { data: invite, error: inviteError } = await supabaseClient
      .from("invites")
      .insert({
        board_id,
        email,
        role: role || "member",
        invited_by: user.id,
      })
      .select()
      .single();

    if (inviteError) {
      return new Response(JSON.stringify({ error: inviteError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Optionally send email via Resend if API key is configured
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      const { data: board } = await supabaseClient
        .from("boards")
        .select("title")
        .eq("id", board_id)
        .single();

      const inviteUrl = `${Deno.env.get("APP_URL") || "http://localhost:3000"}/invite?token=${invite.token}`;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "TaskBoard <noreply@yourdomain.com>",
          to: [email],
          subject: `You've been invited to ${board?.title || "a board"}`,
          html: `
            <h2>Board Invite</h2>
            <p>You've been invited to join <strong>${board?.title || "a board"}</strong> as a <strong>${role || "member"}</strong>.</p>
            <p><a href="${inviteUrl}">Click here to accept the invite</a></p>
            <p>This invite expires in 7 days.</p>
          `,
        }),
      });
    }

    return new Response(JSON.stringify({ invite }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
