import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, Eye, EyeOff, CheckCircle2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import groundworksLogo from "@/assets/groundworks-logo-new.png";

const TOTAL_STEPS = 7;

// ── Step data ──────────────────────────────────────────────────────────────────

const VOLUMES = ["1–2", "3–5", "6–10", "10+"];

const PAIN_POINTS = [
  "Tracking budgets & expenses",
  "Coordinating multiple rehabs at once",
  "Scattered docs and photos",
  "Estimating rehab costs accurately",
  "Staying on timeline",
  "Knowing my true project profit",
  "Managing subs and schedules",
];

const TOOLS = [
  "Spreadsheets & Google Docs",
  "Pen and paper / texts",
  "Another software (QuickBooks, Buildertrend, CoConstruct, etc.)",
  "A mix of everything",
  "I'm just getting started",
];

const TEAM_SIZES = ["Just me", "2–5 people", "6–15 people", "15+"];

// ── Value calculation helpers ──────────────────────────────────────────────────

const VOLUME_MULT: Record<string, number> = { "1–2": 1, "3–5": 2, "6–10": 3.5, "10+": 5 };
const TEAM_MULT: Record<string, number> = { "Just me": 1, "2–5 people": 1.5, "6–15 people": 2.5, "15+": 4 };
const TOOLS_REPLACED: Record<string, number> = {
  "Spreadsheets & Google Docs": 3,
  "Pen and paper / texts": 2,
  "Another software (QuickBooks, Buildertrend, CoConstruct, etc.)": 4,
  "A mix of everything": 5,
  "I'm just getting started": 1,
};

const PAIN_FEATURE_MAP: Record<string, string> = {
  "Tracking budgets & expenses": "Real-time budget tracking with overspend alerts",
  "Managing subs and schedules": "Drag-and-drop project calendar & vendor scheduling",
  
  "Coordinating multiple rehabs at once": "Multi-project dashboard with at-a-glance status",
  "Scattered docs and photos": "Project-linked document & photo gallery",
  "Estimating rehab costs accurately": "Category-level budget templates from past projects",
  "Staying on timeline": "Milestone timelines with critical-path tracking",
  "Knowing my true project profit": "Live profit calculator with holding-cost analysis",
};

function calcMetrics(volume: string, team: string, tools: string) {
  const vMult = VOLUME_MULT[volume] ?? 1;
  const tMult = TEAM_MULT[team] ?? 1;
  const baseHours = 8;
  const hoursSaved = Math.min(Math.round(baseHours * vMult * tMult), 160);
  const annualSavings = hoursSaved * 12 * 45;
  const toolsReplaced = TOOLS_REPLACED[tools] ?? 2;
  return { hoursSaved, annualSavings, toolsReplaced };
}

// ── Count-up hook ──────────────────────────────────────────────────────────────

function useCountUp(target: number, delay: number, duration = 1400) {
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const timeout = setTimeout(() => {
      if (target === 0) { setCount(0); return; }
      let startTime: number | null = null;
      const animate = (ts: number) => {
        if (!startTime) startTime = ts;
        const progress = Math.min((ts - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        setCount(Math.floor(eased * target));
        if (progress < 1) requestAnimationFrame(animate);
        else setCount(target);
      };
      requestAnimationFrame(animate);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, delay, duration]);

  return count;
}

// ── Selection card component ───────────────────────────────────────────────────

function SelectionCard({
  label,
  emoji,
  selected,
  onClick,
}: {
  label: string;
  emoji?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-5 py-4 lg:px-6 lg:py-5 rounded-xl border-2 transition-all duration-200 ${
        selected
          ? "border-primary bg-primary/10 shadow-[0_0_15px_hsl(32_95%_55%/0.2)]"
          : "border-border/60 bg-card/50 hover:border-border hover:bg-card/80"
      }`}
    >
      <span className="flex items-center gap-3 text-base lg:text-lg">
        {emoji && <span className="text-xl">{emoji}</span>}
        <span className={selected ? "text-foreground font-medium" : "text-muted-foreground"}>
          {label}
        </span>
      </span>
    </button>
  );
}

// ── Stat card for value step ───────────────────────────────────────────────────

function ValueStat({ value, prefix, suffix, label, delay }: {
  value: number; prefix?: string; suffix?: string; label: string; delay: number;
}) {
  const count = useCountUp(value, delay);
  return (
    <div className="text-center rounded-xl border-2 border-primary/20 bg-primary/5 p-4 py-5 hover-gold-glow transition-all">
      <p className="font-heading text-2xl sm:text-3xl font-extrabold text-primary mb-1 whitespace-nowrap">
        {prefix}{count.toLocaleString()}{suffix}
      </p>
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{label}</p>
    </div>
  );
}

// ── Progress bar ───────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  const pct = step === 1 ? 0 : ((step - 1) / (TOTAL_STEPS - 1)) * 100;
  return (
    <div className="w-full h-1.5 bg-border/40 rounded-full overflow-hidden">
      <div
        className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function GetStarted() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const transitionTo = (nextStep: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setStep(nextStep);
      setIsTransitioning(false);
    }, 250);
  };

  // Questionnaire state
  const [annualVolume, setAnnualVolume] = useState("");
  const [painPoints, setPainPoints] = useState<string[]>([]);
  const [currentTools, setCurrentTools] = useState("");
  const [teamSize, setTeamSize] = useState("");

  // Account state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState("");

  const togglePainPoint = (point: string) => {
    setPainPoints((prev) => {
      if (prev.includes(point)) return prev.filter((p) => p !== point);
      if (prev.length >= 3) return prev;
      return [...prev, point];
    });
  };

  const canContinue = () => {
    switch (step) {
      case 1: return true;
      case 2: return !!annualVolume;
      case 3: return painPoints.length > 0;
      case 4: return !!currentTools;
      case 5: return !!teamSize;
      case 6: return true; // value summary — always can continue
      case 7: return fullName.trim() && email.trim() && password.length >= 8 && /\d/.test(password) && agreedToTerms;
      default: return false;
    }
  };

  const handleContinue = () => {
    if (step < TOTAL_STEPS) transitionTo(step + 1);
  };

  const handleBack = () => {
    if (step > 1) transitionTo(step - 1);
  };

  const handleSubmit = async () => {
    if (!canContinue()) return;
    setIsSubmitting(true);
    setError("");

    try {
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: phone.trim() || undefined,
          },
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          setError("This email is already registered. Please log in instead.");
        } else if (authError.message.includes("rate limit")) {
          setError("Too many attempts. Please wait a moment and try again.");
        } else if (authError.message.includes("weak password")) {
          setError("Please choose a stronger password.");
        } else {
          setError(authError.message);
        }
        setIsSubmitting(false);
        return;
      }

      const userId = authData.user?.id;

      if (userId) {
        await supabase
          .from("profiles")
          .update({ first_name: firstName, last_name: lastName })
          .eq("user_id", userId);
      }

      if (userId) {
        await (supabase.from as any)("user_onboarding").insert({
          user_id: userId,
          annual_project_volume: annualVolume,
          pain_points: painPoints,
          current_tools: currentTools,
          team_size: teamSize,
        });
      }

      if (userId) {
        localStorage.setItem("gw_onboarding_complete", JSON.stringify({
          firstName,
          painPoints,
        }));
      }

      toast.success("Account created! Check your email to verify, then sign in.");
      navigate("/auth");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Computed metrics for value step ─────────────────────────────────────────
  const metrics = calcMetrics(annualVolume, teamSize, currentTools);

  // ── Step content ────────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="flex flex-col items-center text-center space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="animate-[fade-in_0.8s_ease-out_0.3s_both]">
              <img src={groundworksLogo} alt="GroundWorks" className="h-28 w-28 lg:h-36 lg:w-36 animate-[float_3s_ease-in-out_infinite] drop-shadow-[0_0_25px_hsl(var(--primary)/0.4)]" />
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              Let's set up GroundWorks for the way{" "}
              <span className="text-primary">you work</span>.
            </h1>
            <p className="text-muted-foreground text-lg max-w-md">
              Takes about 60 seconds. We'll tailor everything to your workflow.
            </p>
            <Button
              size="lg"
              className="gold-glow min-h-[48px] px-10 text-base hover:scale-[1.03] transition-transform mt-4"
              onClick={handleContinue}
            >
              Let's Go
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-2">
              <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold">
                How many projects do you run per year?
              </h2>
            </div>
            <div className="grid gap-3 max-w-md mx-auto">
              {VOLUMES.map((v) => (
                <SelectionCard
                  key={v}
                  label={v}
                  selected={annualVolume === v}
                  onClick={() => { setAnnualVolume(v); setTimeout(() => transitionTo(3), 300); }}
                />
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-2">
              <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold">
                What's your biggest headache right now?
              </h2>
              <p className="text-muted-foreground">
                Pick up to 3 — {painPoints.length}/3 selected
              </p>
            </div>
            <div className="grid gap-3 max-w-lg mx-auto">
              {PAIN_POINTS.map((point) => (
                <SelectionCard
                  key={point}
                  label={point}
                  selected={painPoints.includes(point)}
                  onClick={() => togglePainPoint(point)}
                />
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-2">
              <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold">
                How are you managing projects today?
              </h2>
            </div>
            <div className="grid gap-3 max-w-lg mx-auto">
              {TOOLS.map((tool) => (
                <SelectionCard
                  key={tool}
                  label={tool}
                  selected={currentTools === tool}
                  onClick={() => { setCurrentTools(tool); setTimeout(() => transitionTo(5), 300); }}
                />
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-2">
              <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold">
                How big is your team?
              </h2>
            </div>
            <div className="grid gap-3 max-w-md mx-auto">
              {TEAM_SIZES.map((size) => (
                <SelectionCard
                  key={size}
                  label={size}
                  selected={teamSize === size}
                  onClick={() => { setTeamSize(size); setTimeout(() => transitionTo(6), 300); }}
                />
              ))}
            </div>
          </div>
        );

      // ── NEW: Value summary step ─────────────────────────────────────────────
      case 6:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-2">
                <Zap className="w-4 h-4" />
                Personalized for you
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold">
                Here's what GroundWorks can do for{" "}
                <span className="text-primary">your business</span>
              </h2>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
              <ValueStat
                value={metrics.hoursSaved}
                suffix=" hrs/mo"
                prefix="~"
                label="Admin time saved"
                delay={0}
              />
              <ValueStat
                value={metrics.annualSavings}
                prefix="$"
                suffix="/yr"
                label="In time recovered"
                delay={250}
              />
              <ValueStat
                value={metrics.toolsReplaced}
                suffix=" tools → 1"
                label="Consolidated platform"
                delay={500}
              />
            </div>

            {/* Pain point → feature mapping */}
            {painPoints.length > 0 && (
              <div className="max-w-lg mx-auto space-y-3">
                <p className="text-sm font-medium text-muted-foreground text-center uppercase tracking-wider">
                  Here's how we help
                </p>
                <div className="space-y-2">
                  {painPoints.map((pp) => (
                    <div
                      key={pp}
                      className="flex items-start gap-3 rounded-lg border border-border/60 bg-card/50 px-3 py-2.5 animate-in fade-in duration-500"
                    >
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground line-through">{pp}</p>
                        <p className="text-sm font-medium text-foreground">
                          {PAIN_FEATURE_MAP[pp]}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="text-center space-y-3 pt-2">
              <Button
                size="lg"
                className="gold-glow min-h-[48px] px-10 text-base hover:scale-[1.03] transition-transform"
                onClick={handleContinue}
              >
                Start My Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <p className="text-xs text-muted-foreground">
                No credit card required · 7-day free trial
              </p>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-2">
              <h2 className="font-heading text-2xl sm:text-3xl font-bold">
                Create Your Account
              </h2>
              <p className="text-muted-foreground">
                You're almost in. Just a few details.
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-4">
              {error && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Smith"
                  className="min-h-[44px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="min-h-[44px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="min-h-[44px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters, include a number"
                    className="min-h-[44px] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="terms" className="text-sm text-muted-foreground leading-snug cursor-pointer">
                  I agree to the{" "}
                  <Link to="/terms" className="text-primary hover:underline" target="_blank">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="text-primary hover:underline" target="_blank">
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              <Button
                size="lg"
                className="w-full gold-glow min-h-[48px] text-base hover:scale-[1.01] transition-transform"
                disabled={!canContinue() || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Start My Free Trial"
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/auth" className="text-primary hover:underline font-medium">
                  Log In
                </Link>
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top bar with progress */}
      {step > 1 && (
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/30">
          <div className="max-w-3xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="h-6" />
              <span className="text-xs text-muted-foreground">
                Step {step - 1} of {TOTAL_STEPS - 1}
              </span>
            </div>
            <ProgressBar step={step} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className={`w-full max-w-2xl lg:max-w-3xl transition-all duration-250 ease-in-out ${isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>{renderStep()}</div>
      </div>

      {/* Bottom nav — steps 2-5 (questionnaire) */}
      {step > 1 && step < 6 && (
        <div className="sticky bottom-0 bg-background/80 backdrop-blur-md border-t border-border/30">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <Button variant="ghost" onClick={handleBack} disabled={isTransitioning} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button
              className="gold-glow gap-2 min-h-[44px] px-8"
              disabled={!canContinue() || isTransitioning}
              onClick={handleContinue}
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 6 (value) & 7 (account) — back button only */}
      {(step === 6 || step === 7) && (
        <div className="sticky bottom-0 bg-background/80 backdrop-blur-md border-t border-border/30">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <Button variant="ghost" onClick={handleBack} disabled={isTransitioning} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
