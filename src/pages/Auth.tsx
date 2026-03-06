import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { INVITE_TOKEN_STORAGE_KEY } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Calculator, Users, Receipt, ShieldCheck, Loader2, Mail, ArrowLeft } from 'lucide-react';
import { lovable } from '@/integrations/lovable/index';
import groundworksLogo from '@/assets/groundworks-logo.png';

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignInFormData = z.infer<typeof signInSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

const FEATURES = [
  { icon: Calculator, label: 'Real-time budget tracking' },
  { icon: Users, label: 'Team messaging & collaboration' },
  { icon: Receipt, label: 'AI-powered receipt parsing' },
  { icon: ShieldCheck, label: 'Bank-grade data encryption' },
] as const;

const TAGLINE = "And that's just the start";

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('signin');

  // ── Invite-link context ──────────────────────────────────────────────────
  // When a user arrives via /auth?invite_token=<hex64>:
  //   1. Persist the token in localStorage (survives email-verification redirects)
  //   2. Switch to sign-up tab so new users see the right form first
  //   3. Show a contextual banner above the form
  const [hasInviteToken, setHasInviteToken] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteToken = params.get('invite_token');

    if (inviteToken && inviteToken.length === 64) {
      localStorage.setItem(INVITE_TOKEN_STORAGE_KEY, inviteToken);
      setHasInviteToken(true);
      setActiveTab('signup');
      // Clean the token from the URL so it doesn't appear in browser history
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const signInForm = useForm<SignInFormData>({ resolver: zodResolver(signInSchema) });
  const signUpForm = useForm<SignUpFormData>({ resolver: zodResolver(signUpSchema) });

  useEffect(() => {
    if (user && !authLoading) navigate('/dashboard', { replace: true });
  }, [user, authLoading, navigate]);

  const handleSignIn = async (data: SignInFormData) => {
    setIsLoading(true);
    setError(null);
    const { error } = await signIn(data.email, data.password);
    if (error) {
      if (error.message.includes('Invalid login credentials')) setError('Invalid email or password. Please try again.');
      else if (error.message.includes('Email not confirmed')) setError('Please verify your email address before signing in. Check your inbox for a verification link.');
      else setError(error.message);
    }
    setIsLoading(false);
  };

  const handleSignUp = async (data: SignUpFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    const { error } = await signUp(data.email, data.password);
    if (error) {
      if (error.message.includes('already registered')) setError('This email is already registered. Please sign in instead.');
      else if (error.message.includes('rate limit')) setError('Too many attempts. Please wait a moment and try again.');
      else if (error.message.includes('weak password')) setError('Please choose a stronger password.');
      else setError(error.message);
    } else {
      setSuccessMessage(
        hasInviteToken
          ? 'Account created! Check your email to verify your address, then sign in — your team invitation will be accepted automatically.'
          : 'Account created successfully! Please check your email to verify your account, then sign in.'
      );
      signUpForm.reset();
      setActiveTab('signin');
    }
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    const { error } = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin });
    if (error) {
      setError(error.message || 'Failed to sign in with Google');
      setIsGoogleLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const GoogleButton = () => (
    <Button type="button" variant="outline" className="w-full gap-2" onClick={handleGoogleSignIn} disabled={isGoogleLoading || isLoading}>
      {isGoogleLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      )}
      Continue with Google
    </Button>
  );

  const EmailSeparator = () => (
    <div className="relative my-4">
      <div className="absolute inset-0 flex items-center"><Separator className="w-full" /></div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Left Panel – desktop only */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-10 overflow-hidden"
        style={{ background: '#000' }}>
        {/* Grid overlay */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(51,51,51,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(51,51,51,.4) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        {/* Orange glow */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(circle at 50% 35%, rgba(255,140,0,0.15), transparent 70%)',
        }} />

        <div className="relative z-10 flex flex-col gap-12">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <img src={groundworksLogo} alt="GroundWorks logo" className="h-14 w-14 rounded" />
            <span className="text-3xl font-bold text-white tracking-tight">GroundWorks</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-white/90 max-w-md">
            Smarter Project Management Starts Here
          </h1>

          {/* Feature bullets */}
          <ul className="space-y-5">
            {FEATURES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-gray-300">
                <div className="flex items-center justify-center h-10 w-10 rounded-md border border-[#333] bg-white/5">
                  <Icon className="h-5 w-5 text-[hsl(var(--primary))]" />
                </div>
                <span className="text-base">{label}</span>
              </li>
            ))}
          </ul>

          <p className="text-base text-gray-400 italic tracking-wide">{TAGLINE}</p>
        </div>

      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col p-6 bg-background relative">
        <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-[340px] space-y-6">
          {/* Mobile logo */}
          <div className="flex flex-col items-center gap-1 lg:hidden">
            <img src={groundworksLogo} alt="GroundWorks logo" className="h-14 w-14 rounded" />
            <span className="text-xl font-bold">GroundWorks</span>
          </div>

          {/* ── Invite context banner ── */}
          {hasInviteToken && (
            <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3">
              <Mail className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">You have a team invitation</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sign in or create an account — you'll be added to the team automatically.
                </p>
              </div>
            </div>
          )}

          {/* Tab toggle */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => { setActiveTab('signin'); setError(null); }}
              className={`text-sm font-semibold pb-1 border-b-2 transition-colors ${activeTab === 'signin' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setActiveTab('signup'); setError(null); }}
              className={`text-sm font-semibold pb-1 border-b-2 transition-colors ${activeTab === 'signup' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              Sign Up
            </button>
          </div>

          <GoogleButton />
          <EmailSeparator />

          {activeTab === 'signin' ? (
            <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
              {successMessage && (
                <Alert className="border-green-500/50 bg-green-500/10 text-green-400"><AlertDescription>{successMessage}</AlertDescription></Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input id="signin-email" type="email" placeholder="you@example.com" {...signInForm.register('email')} />
                {signInForm.formState.errors.email && <p className="text-sm text-destructive">{signInForm.formState.errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input id="signin-password" type="password" placeholder="••••••••" {...signInForm.register('password')} />
                {signInForm.formState.errors.password && <p className="text-sm text-destructive">{signInForm.formState.errors.password.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : 'Sign In'}
              </Button>
            </form>
          ) : (
            <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input id="signup-email" type="email" placeholder="you@example.com" {...signUpForm.register('email')} />
                {signUpForm.formState.errors.email && <p className="text-sm text-destructive">{signUpForm.formState.errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input id="signup-password" type="password" placeholder="••••••••" {...signUpForm.register('password')} />
                {signUpForm.formState.errors.password && <p className="text-sm text-destructive">{signUpForm.formState.errors.password.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                <Input id="signup-confirm-password" type="password" placeholder="••••••••" {...signUpForm.register('confirmPassword')} />
                {signUpForm.formState.errors.confirmPassword && <p className="text-sm text-destructive">{signUpForm.formState.errors.confirmPassword.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</> : 'Create Account'}
              </Button>
            </form>
          )}
        </div>
        </div>
      </div>

      <Button variant="ghost" size="sm" className="fixed bottom-6 left-6 gap-1.5 text-white hover:text-white/80 hover:bg-white/10 z-50" onClick={() => navigate('/')}>
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Button>
    </div>
  );
}
