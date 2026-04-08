import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// ── Invite token storage key ─────────────────────────────────────────────────
// Auth.tsx writes the token here when the user arrives via an invite link.
// The SIGNED_IN handler below reads + clears it to accept the invitation
// atomically via accept_invitation_by_token().
export const INVITE_TOKEN_STORAGE_KEY = 'gw_pending_invite_token';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Auto-accept pending team invitations on sign-in or sign-up
        if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
          const u = session.user;
          const email = u.email;
          if (!email) return;

          // ── Priority 1: Token-based acceptance ───────────────────────────
          // If the user arrived via an invite link (/auth?invite_token=…),
          // Auth.tsx stored the token in localStorage. Accept it atomically
          // via the RPC which validates the token, expiry, and email match.
          // Note: email is derived server-side from auth.jwt() — not sent from client.
          const pendingToken = localStorage.getItem(INVITE_TOKEN_STORAGE_KEY);
          if (pendingToken) {
            localStorage.removeItem(INVITE_TOKEN_STORAGE_KEY);
            supabase
              .rpc('accept_invitation_by_token', {
                p_token:   pendingToken,
              })
              .then(({ data, error }) => {
                if (error) console.error('accept_invitation_by_token error:', error);
                else {
                  const result = data as unknown as { success: boolean; error?: string };
                  if (result && !result.success) {
                    console.warn('Token invitation not accepted:', result.error);
                  }
                }
              });
          }

          // ── Priority 2: Email-based scan (fallback) ───────────────────────
          // Covers users who navigated to /auth directly (no token) and any
          // invitations sent before the token system was introduced.
          // Note: email is derived server-side from auth.jwt() — p_email kept for compat.
          supabase.rpc('accept_pending_invitations').then(({ error }) => {
            if (error) console.error('Failed to accept pending invitations:', error);
          });
        }
      }
    );

    // THEN check for existing session
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
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
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
