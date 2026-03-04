import { useState, useEffect, useRef, KeyboardEvent, ClipboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2, Mail, RefreshCw } from 'lucide-react';
import kcsLogo from '@/assets/kcs-logo.png';

const signInSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
const signUpSchema = z
  .object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'At least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
const forgotSchema = z.object({ email: z.string().email('Enter a valid email') });

type SignInData = z.infer<typeof signInSchema>;
type SignUpData = z.infer<typeof signUpSchema>;
type ForgotData = z.infer<typeof forgotSchema>;
type AuthView = 'signin' | 'signup' | 'verify' | 'forgot' | 'forgot-sent';

function getStrength(pw: string): 0 | 1 | 2 | 3 | 4 {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /\d/.test(pw)) s++;
  if (/[!@#$%^&*(),.?":{}|<>_\-]/.test(pw)) s++;
  return Math.min(4, s) as 0 | 1 | 2 | 3 | 4;
}
const S_COLORS = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];
const S_TEXT   = ['', 'text-red-400', 'text-orange-400', 'text-yellow-400', 'text-green-400'];
const S_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];

function PasswordStrength({ password }: { password: string }) {
  const s = getStrength(password);
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={cn('h-1 flex-1 rounded-full transition-all duration-300', i <= s ? S_COLORS[s] : 'bg-muted')} />
        ))}
      </div>
      <p className={cn('text-[11px] font-medium', S_TEXT[s])}>{S_LABELS[s]}</p>
    </div>
  );
}

function OtpInput({ value, onChange, hasError }: { value: string; onChange: (v: string) => void; hasError?: boolean }) {
  const LEN = 6;
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const focus = (i: number) => refs.current[Math.max(0, Math.min(LEN - 1, i))]?.focus();
  const arr = () => (value + ' '.repeat(LEN)).slice(0, LEN).split('');

  const handleChange = (i: number, raw: string) => {
    const d = raw.replace(/\D/g, '').slice(-1);
    const a = arr(); a[i] = d;
    onChange(a.join('').trimEnd());
    if (d) focus(i + 1);
  };
  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const a = arr();
      if (!a[i].trim()) { a[Math.max(0, i - 1)] = ''; onChange(a.join('').trimEnd()); focus(i - 1); }
      else { a[i] = ''; onChange(a.join('').trimEnd()); }
    } else if (e.key === 'ArrowLeft') focus(i - 1);
    else if (e.key === 'ArrowRight') focus(i + 1);
  };
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LEN);
    onChange(p); focus(Math.min(p.length, LEN - 1));
  };

  return (
    <div className="flex gap-2.5 justify-center">
      {Array.from({ length: LEN }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text" inputMode="numeric" maxLength={1} autoComplete="one-time-code"
          value={value[i] ?? ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={cn(
            'w-11 h-14 text-center text-xl font-bold rounded-xl border-2 bg-muted/50 outline-none transition-all duration-150 focus:ring-4',
            hasError
              ? 'border-destructive text-destructive focus:border-destructive focus:ring-destructive/10'
              : value[i]?.trim()
              ? 'border-primary/60 text-foreground focus:border-primary focus:ring-primary/10'
              : 'border-border text-foreground focus:border-primary focus:ring-primary/10'
          )}
        />
      ))}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function BrandPanel() {
  return (
    <div
      className="hidden lg:flex flex-col justify-between h-full px-10 py-12 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 10% 90%, hsl(32 95% 55% / 0.2) 0%, transparent 60%), hsl(220 20% 7%)' }}
    >
      <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: 'linear-gradient(hsl(210 20% 95%) 1px, transparent 1px), linear-gradient(90deg, hsl(210 20% 95%) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
      <div className="relative z-10 space-y-12">
        <div className="flex items-center gap-3">
          <img src={kcsLogo} alt="GroundWorks" className="h-11 w-11 object-contain drop-shadow-sm" />
          <span className="text-2xl font-bold tracking-tight text-foreground">GroundWorks</span>
        </div>
        <div className="space-y-4">
          <h1 className="text-[2.5rem] font-bold text-foreground leading-tight">
            Built for<br /><span className="text-primary">every build.</span>
          </h1>
          <p className="text-[0.9rem] text-muted-foreground leading-relaxed max-w-[280px]">
            Track budgets, expenses, daily logs, and team activity across every fix &amp; flip project.
          </p>
        </div>
        <ul className="space-y-3.5">
          {[
            'Real-time budget tracking per project',
            'Team messaging & daily site logs',
            'Vendor & procurement management',
            'AI-powered expense receipt parsing',
          ].map((f) => (
            <li key={f} className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="h-5 w-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-3 w-3 text-primary" />
              </span>
              {f}
            </li>
          ))}
        </ul>
      </div>
      <div className="relative z-10 flex items-center gap-2 text-xs text-muted-foreground/50">
        <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
        Secured by Supabase · All data encrypted at rest
      </div>
    </div>
  );
}

function OrDivider() {
  return (
    <div className="relative flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-border" />
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">or</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function ErrorBox({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">{msg}</div>;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-destructive">{msg}</p>;
}

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, loading: authLoading, signInWithGoogle, verifyOtp, resetPassword } = useAuth();

  const [view, setView] = useState<AuthView>('signin');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingPassword, setPendingPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => { if (user && !authLoading) navigate('/', { replace: true }); }, [user, authLoading, navigate]);
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const clearError = () => setError(null);
  const switchView = (v: AuthView) => { setView(v); clearError(); setOtp(''); setOtpError(false); };

  const signInForm = useForm<SignInData>({ resolver: zodResolver(signInSchema) });
  const signUpForm = useForm<SignUpData>({ resolver: zodResolver(signUpSchema) });
  const forgotForm = useForm<ForgotData>({ resolver: zodResolver(forgotSchema) });

  const handleSignIn = async (data: SignInData) => {
    setIsLoading(true); clearError();
    const { error } = await signIn(data.email, data.password);
    if (error) {
      const msg = error.message ?? '';
      if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) setError('Incorrect email or password. Please try again.');
      else if (msg.includes('Email not confirmed')) { setPendingEmail(data.email); setView('verify'); }
      else setError(msg || 'Sign in failed. Please try again.');
    }
    setIsLoading(false);
  };

  const handleSignUp = async (data: SignUpData) => {
    setIsLoading(true); clearError();
    const { error } = await signUp(data.email, data.password);
    if (error) {
      const msg = error.message ?? '';
      if (msg.includes('already registered') || msg.includes('already been registered')) setError('An account with this email exists. Sign in instead.');
      else if (msg.includes('rate limit')) setError('Too many attempts. Please wait a moment.');
      else setError(msg || 'Could not create account. Please try again.');
    } else {
      setPendingEmail(data.email);
      setPendingPassword(data.password);
      setOtp(''); setOtpError(false); setResendCooldown(60);
      setView('verify');
    }
    setIsLoading(false);
  };

  const handleVerify = async () => {
    const code = otp.replace(/\s/g, '');
    if (code.length < 6) { setOtpError(true); return; }
    setIsLoading(true); setOtpError(false); clearError();
    const { error } = await verifyOtp(pendingEmail, code);
    if (error) { setOtpError(true); setError('Invalid or expired code. Check your email and try again.'); }
    setIsLoading(false);
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setIsLoading(true); clearError();
    await signUp(pendingEmail, pendingPassword);
    setResendCooldown(60);
    setIsLoading(false);
  };

  const handleForgot = async (data: ForgotData) => {
    setIsLoading(true); clearError();
    await resetPassword(data.email);
    setView('forgot-sent');
    setIsLoading(false);
  };

  const handleGoogle = async () => {
    setIsGoogleLoading(true); clearError();
    const { error } = await signInWithGoogle();
    if (error) { setError(error.message || 'Google sign-in failed.'); setIsGoogleLoading(false); }
  };

  const any = isLoading || isGoogleLoading;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <div className="w-[44%] flex-shrink-0 min-h-screen border-r border-border/30">
        <BrandPanel />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 lg:px-14 min-h-screen">
        <div className="lg:hidden flex items-center gap-2.5 mb-10">
          <img src={kcsLogo} alt="GroundWorks" className="h-10 w-10 object-contain" />
          <span className="text-xl font-bold text-foreground">GroundWorks</span>
        </div>

        <div className="w-full max-w-[340px]">

          {/* ── SIGN IN ── */}
          {view === 'signin' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <button onClick={() => switchView('signup')} className="text-primary font-medium hover:underline">Sign up</button>
                </p>
              </div>
              <Button type="button" variant="outline" className="w-full h-11 gap-2.5 font-medium" onClick={handleGoogle} disabled={any}>
                {isGoogleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                Continue with Google
              </Button>
              <OrDivider />
              <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                <ErrorBox msg={error} />
                <div className="space-y-1.5">
                  <Label htmlFor="si-email">Email</Label>
                  <Input id="si-email" type="email" placeholder="you@example.com" autoComplete="email" className="h-10" {...signInForm.register('email')} />
                  <FieldError msg={signInForm.formState.errors.email?.message} />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="si-pw">Password</Label>
                    <button type="button" onClick={() => switchView('forgot')} className="text-xs text-muted-foreground hover:text-primary transition-colors">Forgot password?</button>
                  </div>
                  <div className="relative">
                    <Input id="si-pw" type={showPassword ? 'text' : 'password'} placeholder="••••••••" autoComplete="current-password" className="h-10 pr-10" {...signInForm.register('password')} />
                    <button type="button" tabIndex={-1} onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <FieldError msg={signInForm.formState.errors.password?.message} />
                </div>
                <Button type="submit" className="w-full h-11 font-medium mt-2" disabled={any}>
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {isLoading ? 'Signing in…' : 'Sign In'}
                </Button>
              </form>
            </div>
          )}

          {/* ── SIGN UP ── */}
          {view === 'signup' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Create your account</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Already have one?{' '}
                  <button onClick={() => switchView('signin')} className="text-primary font-medium hover:underline">Sign in</button>
                </p>
              </div>
              <Button type="button" variant="outline" className="w-full h-11 gap-2.5 font-medium" onClick={handleGoogle} disabled={any}>
                {isGoogleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                Continue with Google
              </Button>
              <OrDivider />
              <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                <ErrorBox msg={error} />
                <div className="space-y-1.5">
                  <Label htmlFor="su-email">Email</Label>
                  <Input id="su-email" type="email" placeholder="you@example.com" autoComplete="email" className="h-10" {...signUpForm.register('email')} />
                  <FieldError msg={signUpForm.formState.errors.email?.message} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-pw">Password</Label>
                  <div className="relative">
                    <Input id="su-pw" type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters" autoComplete="new-password" className="h-10 pr-10" {...signUpForm.register('password')} />
                    <button type="button" tabIndex={-1} onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <PasswordStrength password={signUpForm.watch('password') ?? ''} />
                  <FieldError msg={signUpForm.formState.errors.password?.message} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-confirm">Confirm Password</Label>
                  <div className="relative">
                    <Input id="su-confirm" type={showConfirm ? 'text' : 'password'} placeholder="••••••••" autoComplete="new-password" className="h-10 pr-10" {...signUpForm.register('confirmPassword')} />
                    <button type="button" tabIndex={-1} onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <FieldError msg={signUpForm.formState.errors.confirmPassword?.message} />
                </div>
                <Button type="submit" className="w-full h-11 font-medium mt-2" disabled={any}>
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {isLoading ? 'Creating account…' : 'Create Account'}
                </Button>
                <p className="text-center text-[11px] text-muted-foreground/60 leading-relaxed">
                  By signing up you agree to our{' '}
                  <a href="/eula" className="underline hover:text-muted-foreground">Terms</a>{' '}and{' '}
                  <a href="/privacy" className="underline hover:text-muted-foreground">Privacy Policy</a>.
                </p>
              </form>
            </div>
          )}

          {/* ── VERIFY OTP ── */}
          {view === 'verify' && (
            <div className="space-y-7">
              <button onClick={() => switchView('signup')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <div className="flex flex-col items-center text-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 ring-4 ring-primary/5 flex items-center justify-center">
                  <Mail className="h-7 w-7 text-primary" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-2xl font-bold text-foreground">Check your email</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    We sent a 6-digit code to<br />
                    <span className="font-semibold text-foreground">{pendingEmail}</span>
                  </p>
                </div>
              </div>
              <div className="space-y-5">
                <ErrorBox msg={error} />
                <OtpInput value={otp} onChange={(v) => { setOtp(v); setOtpError(false); clearError(); }} hasError={otpError} />
                <Button className="w-full h-11 font-medium" onClick={handleVerify} disabled={otp.replace(/\s/g,'').length < 6 || any}>
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {isLoading ? 'Verifying…' : 'Verify Email'}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Didn't receive it?{' '}
                  <button onClick={handleResend} disabled={resendCooldown > 0 || any} className={cn('font-medium transition-colors inline-flex items-center gap-1', resendCooldown > 0 ? 'text-muted-foreground/40 cursor-not-allowed' : 'text-primary hover:underline')}>
                    {resendCooldown > 0 ? <><RefreshCw className="h-3 w-3" /> Resend in {resendCooldown}s</> : 'Resend code'}
                  </button>
                </p>
                <p className="text-center text-xs text-muted-foreground/50">Also check your spam or junk folder.</p>
              </div>
            </div>
          )}

          {/* ── FORGOT ── */}
          {view === 'forgot' && (
            <div className="space-y-6">
              <button onClick={() => switchView('signin')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back to sign in
              </button>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Reset password</h2>
                <p className="mt-1 text-sm text-muted-foreground">Enter your email and we'll send a reset link.</p>
              </div>
              <form onSubmit={forgotForm.handleSubmit(handleForgot)} className="space-y-4">
                <ErrorBox msg={error} />
                <div className="space-y-1.5">
                  <Label htmlFor="fp-email">Email</Label>
                  <Input id="fp-email" type="email" placeholder="you@example.com" autoComplete="email" className="h-10" {...forgotForm.register('email')} />
                  <FieldError msg={forgotForm.formState.errors.email?.message} />
                </div>
                <Button type="submit" className="w-full h-11 font-medium" disabled={isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {isLoading ? 'Sending…' : 'Send Reset Link'}
                </Button>
              </form>
            </div>
          )}

          {/* ── FORGOT SENT ── */}
          {view === 'forgot-sent' && (
            <div className="flex flex-col items-center text-center gap-6">
              <div className="h-16 w-16 rounded-full bg-green-500/10 ring-4 ring-green-500/5 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-green-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Check your inbox</h2>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
                  If that email is registered, you'll receive a password reset link shortly. Check your spam folder too.
                </p>
              </div>
              <Button variant="outline" className="w-full h-11" onClick={() => switchView('signin')}>Back to Sign In</Button>
            </div>
          )}
        </div>

        <p className="mt-12 text-[11px] text-muted-foreground/35 text-center">
          © {new Date().getFullYear()} GroundWorks · All rights reserved
        </p>
      </div>
    </div>
  );
}
