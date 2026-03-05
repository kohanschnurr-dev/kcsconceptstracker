import { useNavigate } from "react-router-dom";
import { Play, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import { useAuth } from "@/contexts/AuthContext";

const highlights = [
  "Create and manage project budgets in minutes",
  "Track expenses and compare against budget in real time",
  "Generate lender-ready draw requests with one click",
  "Manage subs, vendors, and payments in one place",
  "Document progress with photos and daily logs",
  "View dashboards and reports across all your projects",
];

export default function Demo() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleTrialClick = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader />

      <section className="pt-28 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-8">
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-center mb-4">
            See GroundWorks <span className="text-primary">in Action</span>
          </h1>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            Watch how contractors and investors use GroundWorks to manage
            projects from bid to closeout.
          </p>

          {/* Video Placeholder */}
          <div className="relative aspect-video bg-card border border-border rounded-xl overflow-hidden mb-14">
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors"
                aria-label="Play demo video"
              >
                <Play className="w-8 h-8 text-primary ml-1" />
              </button>
            </div>
            <div className="absolute bottom-4 left-4 text-sm text-muted-foreground">
              Demo video — coming soon
            </div>
          </div>

          {/* Feature highlights */}
          <h2 className="font-heading text-2xl font-bold text-center mb-8">
            What You'll See
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-14">
            {highlights.map((h) => (
              <div key={h} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <p className="text-sm">{h}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button
              size="lg"
              className="gold-glow min-h-[48px] px-8 hover:scale-[1.03] transition-transform"
              onClick={handleTrialClick}
            >
              {user ? "Go to Dashboard" : "Start Your Free Trial"}
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required · 14-day free trial
            </p>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
