import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// ── Invite token storage key ─────────────────────────────────────────────────
// Auth.tsx writes the token here when the user arrives via an invite link.
// AuthContext reads and clears it after a successful sign-in so the team
// membership is created atomically via accept_invitation_by_token().
export const INVITE_TOKEN_STORAGE_KEY = 'gw_pending_invite_token';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Skip silent token refreshes — they cause re-renders that wipe inline edit state
        if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') return;

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
          const u     = session.user;
          const email = u.email;
          if (!email) return;

          // ── Priority 1: Token-based acceptance ───────────────────
          // If the user arrived via an invite link, accept that specific
          // invitation atomically (validates token, expiry, and email match).
          const pendingToken = localStorage.getItem(INVITE_TOKEN_STORAGE_KEY);
          if (pendingToken) {
            localStorage.removeItem(INVITE_TOKEN_STORAGE_KEY);
            supabase
              .rpc('accept_invitation_by_token', {
                p_user_id: u.id,
                p_email:   email,
                p_token:   pendingToken,
              })
              .then(({ data, error }) => {
                if (error) {
                  console.error('accept_invitation_by_token error:', error);
                } else if (data?.success === false) {
                  // Not a hard error — the user is still signed in, just
                  // the invite wasn't accepted (expired / email mismatch).
                  console.warn('Invitation not accepted:', data.error);
                }
              });
            // Fall through to email-based scan as a belt-and-suspenders
            // measure (covers invitations sent before tokens were introduced).
          }

          // ── Priority 2: Email-based scan (fallback) ───────────────
          // Accepts any remaining pending invitations for this email address.
          // Also covers users who navigated to /auth directly without the token.
          supabase
            .rpc('accept_pending_invitations', {
              p_user_id: u.id,
              p_email:   email,
            })
            .then(({ error }) => {
              if (error) console.error('Failed to accept pending invitations:', error);
            });
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  /**
   * Google OAuth — native Supabase flow, redirects browser to Google then back.
   * Setup required (see README in Auth.tsx):
   *   1. Supabase Dashboard → Auth → Providers → Google → enable + add credentials
   *   2. Google Cloud Console → add https://[project].supabase.co/auth/v1/callback
   *      to Authorized redirect URIs
   *   3. Supabase Dashboard → Auth → URL Configuration → set Site URL
   */
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo:  `${window.location.origin}/`,
        queryParams: { access_type: 'offline', prompt: 'select_account' },
      },
    });
    return { error: error as Error | null };
  };

  /**
   * Verify 6-digit OTP sent by Supabase in the sign-up confirmation email.
   * The email contains both a click-through link AND a 6-digit {{.Token}}.
   */
  const verifyOtp = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    });
    return { error: error as Error | null };
  };

  /**
   * Initiate password reset — Supabase emails a magic link back to /auth.
   */
  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    return { error: error as Error | null };
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signIn, signUp, signOut, signInWithGoogle, verifyOtp, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
