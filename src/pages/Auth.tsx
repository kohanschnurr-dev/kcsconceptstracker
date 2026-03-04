import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2, Shield, BarChart3, MessageSquare, Users, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import kcsLogo from '@/assets/kcs-logo.png';

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

const features = [
  { icon: BarChart3, text: 'Real-time budget tracking per project' },
  { icon: MessageSquare, text: 'Team messaging & daily site logs' },
  { icon: Users, text: 'Vendor & procurement management' },
  { icon: Sparkles, text: 'AI-powered expense receipt parsing' },
];

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const handleSignIn = async (data: SignInFormData) => {
    setIsLoading(true);
    setError(null);
    const { error } = await signIn(data.email, data.password);
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      } else if (error.message.includes('Email not confirmed')) {
        setError('Please verify your email address before signing in. Check your inbox for a verification link.');
      } else {
        setError(error.message);
      }
    } else {
      navigate('/', { replace: true });
    }
    setIsLoading(false);
  };

  const handleSignUp = async (data: SignUpFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    const { error } = await signUp(data.email, data.password);
    if (error) {
      if (error.message.includes('already registered')) {
        setError('This email is already registered. Please sign in instead.');
      } else if (error.message.includes('rate limit')) {
        setError('Too many attempts. Please wait a moment and try again.');
      } else if (error.message.includes('weak password')) {
        setError('Please choose a stronger password.');
      } else {
        setError(error.message);
      }
    } else {
      setSuccessMessage('Account created successfully! Please check your email to verify your account, then sign in.');
      signUpForm.reset();
      setIsSignUp(false);
    }
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) {
      setError(error.message || 'Failed to sign in with Google');
      setIsGoogleLoading(false);
    }
  };

  const switchMode = () => {
    setError(null);
    setSuccessMessage(null);
    setIsSignUp(!isSignUp);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Left Branding Panel */}
      <div className="lg:w-1/2 flex flex-col justify-between p-8 lg:p-12 xl:p-16 bg-card/50">
        {/* Top: Logo */}
        <div className="flex items-center gap-3">
          <img src={kcsLogo} alt="KCS logo" className="h-9 w-9 rounded" />
          <span className="text-xl font-bold text-foreground tracking-tight">GroundWorks</span>
        </div>

        {/* Center: Headline + features */}
        <div className="flex-1 flex flex-col justify-center py-12 lg:py-0 max-w-lg">
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground leading-tight mb-4">
            Built for{' '}
            <span className="text-primary">every build.</span>
          </h1>
          <p className="text-muted-foreground text-lg mb-10">
            Track budgets, expenses, daily logs, and team activity across every fix&nbsp;&amp;&nbsp;flip project.
          </p>

          <ul className="space-y-4">
            {features.map((f) => (
              <li key={f.text} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                  <f.icon className="h-4 w-4 text-primary" />
                </span>
                <span className="text-foreground/80 text-sm">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom: Security footer */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-3.5 w-3.5 text-success" />
          <span>Secured &amp; encrypted · All data encrypted at rest</span>
        </div>
      </div>

      {/* Right Auth Panel */}
      <div className="lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-12 xl:p-16">
        <div className="w-full max-w-sm space-y-6">
          {/* Heading */}
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {isSignUp ? 'Create an account' : 'Welcome back'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isSignUp ? (
                <>Already have an account?{' '}<button onClick={switchMode} className="text-primary hover:underline font-medium">Sign in</button></>
              ) : (
                <>Don&apos;t have an account?{' '}<button onClick={switchMode} className="text-primary hover:underline font-medium">Sign up</button></>
              )}
            </p>
          </div>

          {/* Google Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2 h-11"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
          >
            {isGoogleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
            Continue with Google
          </Button>

          {/* OR divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          {/* Sign In Form */}
          {!isSignUp && (
            <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {successMessage && (
                <Alert className="border-success/50 bg-success/10 text-success">
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input id="signin-email" type="email" placeholder="you@example.com" {...signInForm.register('email')} />
                {signInForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{signInForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="signin-password">Password</Label>
                  <button type="button" className="text-xs text-primary hover:underline">Forgot password?</button>
                </div>
                <Input id="signin-password" type="password" placeholder="••••••••" {...signInForm.register('password')} />
                {signInForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{signInForm.formState.errors.password.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full h-11" disabled={isLoading || isGoogleLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : 'Sign In'}
              </Button>
            </form>
          )}

          {/* Sign Up Form */}
          {isSignUp && (
            <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input id="signup-email" type="email" placeholder="you@example.com" {...signUpForm.register('email')} />
                {signUpForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{signUpForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input id="signup-password" type="password" placeholder="••••••••" {...signUpForm.register('password')} />
                {signUpForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{signUpForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                <Input id="signup-confirm-password" type="password" placeholder="••••••••" {...signUpForm.register('confirmPassword')} />
                {signUpForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">{signUpForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full h-11" disabled={isLoading || isGoogleLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</> : 'Create Account'}
              </Button>
            </form>
          )}

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground pt-4">
            © 2026 GroundWorks · All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
}
