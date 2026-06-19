// Public endpoint that books a demo walkthrough slot.
// - Validates input
// - Inserts a `demo_bookings` row (unique index guards against double-booking)
// - Sends two transactional emails via Resend (prospect confirmation + owner alert)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// ---- TODO: swap these to your real addresses ----
const OWNER_EMAIL = "hello@groundworksapp.com";
const FROM_EMAIL = "GroundWorks Demo <onboarding@resend.dev>"; // use a verified Resend sender once your domain is set up
const BRAND_NAME = "GroundWorks";
// --------------------------------------------------

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface BookingPayload {
  name?: string;
  email?: string;
  company?: string;
  phone?: string;
  role?: string;
  notes?: string;
  slot_at?: string; // ISO timestamp
  timezone?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function bad(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatSlot(iso: string, tz: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toUTCString();
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return bad("Method not allowed", 405);

  let body: BookingPayload;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid JSON body");
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const company = (body.company ?? "").trim();
  const phone = (body.phone ?? "").trim();
  const role = (body.role ?? "").trim();
  const notes = (body.notes ?? "").trim();
  const slot_at = (body.slot_at ?? "").trim();
  const timezone = (body.timezone ?? "UTC").trim();

  if (!name || name.length > 120) return bad("Please enter your name (max 120 chars).");
  if (!EMAIL_RE.test(email) || email.length > 254) return bad("Please enter a valid email.");
  if (company.length > 200) return bad("Company name too long.");
  if (phone.length > 40) return bad("Phone too long.");
  if (role.length > 60) return bad("Role too long.");
  if (notes.length > 1000) return bad("Notes too long (max 1000 chars).");

  const slotDate = new Date(slot_at);
  if (Number.isNaN(slotDate.getTime())) return bad("Invalid slot time.");
  if (slotDate.getTime() < Date.now() + 5 * 60 * 1000) {
    return bad("That slot is in the past. Please pick a future time.");
  }
  // Must be on a 30-minute boundary
  if (slotDate.getUTCMinutes() % 30 !== 0 || slotDate.getUTCSeconds() !== 0) {
    return bad("Slot must align with a 30-minute boundary.");
  }
  // Must be inside an allowed CT business-hours window
  {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      hour12: false,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    const parts = dtf.formatToParts(slotDate).reduce<Record<string, string>>((a, p) => { a[p.type] = p.value; return a; }, {});
    const dowMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const dow = dowMap[parts.weekday] ?? -1;
    const hour = parseInt(parts.hour, 10) % 24;
    const minute = parseInt(parts.minute, 10);
    const mins = hour * 60 + minute;
    const windows: Array<[number, number]> =
      dow === 0 || dow === 6
        ? [[9 * 60, 21 * 60]]
        : [[7 * 60, 8 * 60], [17 * 60 + 30, 21 * 60]];
    const allowed = windows.some(([s, e]) => mins >= s && mins < e);
    if (!allowed) return bad("That slot is outside our walkthrough hours.");
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const insert = await supabase
    .from("demo_bookings")
    .insert({
      name,
      email,
      company: company || null,
      phone: phone || null,
      role: role || null,
      notes: notes || null,
      slot_at: slotDate.toISOString(),
      slot_duration_minutes: 30,
      timezone,
      status: "booked",
    })
    .select("id")
    .single();

  if (insert.error) {
    // Unique violation = slot already taken
    if ((insert.error as any).code === "23505") {
      return bad("That time was just booked by someone else. Please pick another slot.", 409);
    }
    console.error("[book-demo] insert error", insert.error);
    return bad("Could not save your booking. Please try again.", 500);
  }

  const booking_id = insert.data!.id;
  const slotPrettyProspect = formatSlot(slotDate.toISOString(), timezone);
  const slotPrettyOwner = formatSlot(slotDate.toISOString(), "America/Chicago");

  // ----- Resend emails (best-effort: don't fail the booking if email fails) -----
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  const prospectHtml = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111;">
      <h2 style="margin:0 0 8px;font-size:20px;">Your ${BRAND_NAME} walkthrough is booked</h2>
      <p style="margin:0 0 16px;color:#555;">Thanks ${escapeHtml(name.split(" ")[0])}! I'll walk you through ${BRAND_NAME} and help set up your first project live.</p>
      <div style="border:1px solid #e5e5e5;padding:16px;margin:16px 0;background:#fafafa;">
        <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#777;">When</p>
        <p style="margin:0;font-size:16px;font-weight:600;">${escapeHtml(slotPrettyProspect)}</p>
      </div>
      <p style="margin:0 0 8px;font-size:14px;color:#555;">I'll send a video link before the call. If you need to reschedule, just reply to this email.</p>
      <p style="margin:24px 0 0;font-size:13px;color:#999;">Booking ref: ${booking_id}</p>
    </div>`;

  const ownerHtml = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111;">
      <h2 style="margin:0 0 12px;font-size:18px;">New demo booked</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 0;color:#777;width:120px;">When</td><td style="padding:6px 0;"><b>${escapeHtml(slotPrettyOwner)}</b></td></tr>
        <tr><td style="padding:6px 0;color:#777;">Name</td><td style="padding:6px 0;">${escapeHtml(name)}</td></tr>
        <tr><td style="padding:6px 0;color:#777;">Email</td><td style="padding:6px 0;">${escapeHtml(email)}</td></tr>
        ${company ? `<tr><td style="padding:6px 0;color:#777;">Company</td><td style="padding:6px 0;">${escapeHtml(company)}</td></tr>` : ""}
        ${phone ? `<tr><td style="padding:6px 0;color:#777;">Phone</td><td style="padding:6px 0;">${escapeHtml(phone)}</td></tr>` : ""}
        ${role ? `<tr><td style="padding:6px 0;color:#777;">Role</td><td style="padding:6px 0;">${escapeHtml(role)}</td></tr>` : ""}
        <tr><td style="padding:6px 0;color:#777;">Timezone</td><td style="padding:6px 0;">${escapeHtml(timezone)}</td></tr>
        ${notes ? `<tr><td style="padding:6px 0;color:#777;vertical-align:top;">Notes</td><td style="padding:6px 0;white-space:pre-wrap;">${escapeHtml(notes)}</td></tr>` : ""}
      </table>
      <p style="margin:24px 0 0;font-size:12px;color:#999;">Booking ref: ${booking_id}</p>
    </div>`;

  async function sendEmail(to: string, subject: string, html: string) {
    if (!RESEND_API_KEY) return;
    try {
      // Prefer the Lovable gateway if available; fall back to direct Resend API.
      const url = LOVABLE_API_KEY
        ? "https://connector-gateway.lovable.dev/resend/emails"
        : "https://api.resend.com/emails";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (LOVABLE_API_KEY) {
        headers["Authorization"] = `Bearer ${LOVABLE_API_KEY}`;
        headers["X-Connection-Api-Key"] = RESEND_API_KEY;
      } else {
        headers["Authorization"] = `Bearer ${RESEND_API_KEY}`;
      }
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
      });
      if (!res.ok) {
        const t = await res.text();
        console.error("[book-demo] email send failed", res.status, t);
      }
    } catch (e) {
      console.error("[book-demo] email exception", e);
    }
  }

  await Promise.all([
    sendEmail(email, `Your ${BRAND_NAME} walkthrough is confirmed`, prospectHtml),
    sendEmail(OWNER_EMAIL, `New demo booked: ${name}${company ? " · " + company : ""}`, ownerHtml),
  ]);

  return new Response(
    JSON.stringify({ booking_id, slot_at: slotDate.toISOString() }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
