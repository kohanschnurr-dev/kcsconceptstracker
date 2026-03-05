import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const { email, ownerName, appUrl, token, role, companyName } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!token) {
      return new Response(JSON.stringify({ error: "Invitation token is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseUrl = appUrl || "https://kcsconceptstracker.lovable.app";

    // ── Secure token-based invite link ──────────────────────────────
    // The token is validated server-side; the link alone grants nothing
    // until the user authenticates and the RPC verifies the token.
    const joinUrl = `${baseUrl}/auth?invite_token=${encodeURIComponent(token)}`;

    const displayCompany = companyName || "GroundWorks";
    const displayRole    = role === "manager" ? "Project Manager" : "Viewer";
    const senderName     = ownerName || "A team owner";

    const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've been invited to ${displayCompany}</title>
</head>
<body style="margin:0;padding:0;background-color:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F9FAFB;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #E5E7EB;">

          <!-- Header band -->
          <tr>
            <td style="background:#111827;padding:28px 36px;">
              <p style="margin:0;color:#ffffff;font-size:20px;font-weight:800;letter-spacing:0.04em;">
                ${displayCompany}
              </p>
              <p style="margin:6px 0 0;color:#6B7280;font-size:12px;font-weight:500;letter-spacing:0.06em;text-transform:uppercase;">
                Team Invitation
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 36px 28px;">
              <p style="margin:0 0 6px;color:#111827;font-size:22px;font-weight:700;line-height:1.3;">
                You've been invited!
              </p>
              <p style="margin:0 0 28px;color:#6B7280;font-size:14px;line-height:1.7;">
                <strong style="color:#374151;">${senderName}</strong> has invited you to collaborate on
                <strong style="color:#374151;">${displayCompany}</strong>.
              </p>

              <!-- Role pill -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background:#F3F4F6;border-radius:8px;padding:14px 22px;">
                    <p style="margin:0 0 3px;color:#9CA3AF;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">
                      Your assigned role
                    </p>
                    <p style="margin:0;color:#111827;font-size:16px;font-weight:700;">
                      ${displayRole}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${joinUrl}"
                       style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;
                              padding:14px 40px;border-radius:8px;font-size:14px;font-weight:600;
                              letter-spacing:0.02em;">
                      Accept Invitation &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;color:#9CA3AF;font-size:12px;line-height:1.6;text-align:center;">
                This link expires in <strong>7 days</strong>.
                If you weren't expecting this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Link fallback for email clients that block buttons -->
          <tr>
            <td style="padding:16px 36px;background:#F9FAFB;border-top:1px solid #F3F4F6;">
              <p style="margin:0 0 5px;color:#9CA3AF;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">
                Or paste this link into your browser
              </p>
              <p style="margin:0;color:#6B7280;font-size:11px;word-break:break-all;line-height:1.5;">
                ${joinUrl}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 36px;text-align:center;border-top:1px solid #F3F4F6;">
              <p style="margin:0;color:#D1D5DB;font-size:10px;">
                &copy; ${new Date().getFullYear()} ${displayCompany} &middot; All rights reserved
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${displayCompany} <onboarding@resend.dev>`,
        to: [email],
        subject: `${senderName} invited you to join ${displayCompany}`,
        html: htmlBody,
      }),
    });

    const resData = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", res.status, resData);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: resData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ success: true, id: resData.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-team-invite error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
