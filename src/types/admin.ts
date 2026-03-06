export const ADMIN_EMAIL = "kohanschnurr@gmail.com";

export type DemoRequestStatus = "new" | "contacted" | "scheduled" | "completed" | "no-show";

export interface DemoRequest {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  message: string | null;
  status: DemoRequestStatus;
  notes: string | null;
  follow_up_date: string | null;
  created_at: string;
}

export type AdminEventType = "demo" | "trial_expiration" | "custom";

export interface AdminEvent {
  id: string;
  title: string;
  event_type: AdminEventType;
  date: string;
  time: string | null;
  notes: string | null;
  related_user_id: string | null;
  created_at: string;
}

export interface AdminSetting {
  id: string;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  subscription_tier: string;
  trial_start?: string | null;
  trial_end?: string | null;
  status: "trial" | "active" | "churned" | "inactive";
}

export type AdminSection = "overview" | "users" | "memberships" | "demos" | "calendar" | "settings";
