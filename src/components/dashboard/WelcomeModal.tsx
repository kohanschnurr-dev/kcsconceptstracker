import { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingInfo {
  firstName: string;
  painPoints: string[];
}

export function WelcomeModal() {
  const [show, setShow] = useState(false);
  const [info, setInfo] = useState<OnboardingInfo | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("gw_onboarding_complete");
    if (raw) {
      try {
        setInfo(JSON.parse(raw));
        setShow(true);
      } catch {
        // invalid data
      }
      localStorage.removeItem("gw_onboarding_complete");
    }
  }, []);

  if (!show || !info) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShow(false)}>
      <div
        className="bg-card border border-border rounded-2xl max-w-md w-full p-8 text-center space-y-5 animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center gap-2 text-primary">
          <Sparkles className="w-6 h-6" />
        </div>

        <h2 className="font-heading text-2xl font-bold">
          Welcome to GroundWorks, {info.firstName}!
        </h2>

        <p className="text-muted-foreground">
          We've set things up based on how you work. Your dashboard is tailored to show what matters most.
        </p>

        {info.painPoints && info.painPoints.length > 0 && (
          <div className="text-left bg-secondary/30 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">We're focused on helping you with:</p>
            <ul className="space-y-1">
              {info.painPoints.map((p) => (
                <li key={p} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button
          className="w-full gold-glow min-h-[44px]"
          onClick={() => setShow(false)}
        >
          Let's Get Started
        </Button>
      </div>
    </div>
  );
}
