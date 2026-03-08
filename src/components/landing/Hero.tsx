import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, ChevronDown } from "lucide-react";

export default function Hero() {
  const navigate = useNavigate();

  const handleTrialClick = () => {
    navigate("/get-started");
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden blueprint-grid">
      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(38_92%_50%_/_0.08)_0%,_transparent_70%)]" />

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-8 pt-24 pb-16 text-center">
        <h1 className="hero-animate hero-delay-1 font-heading text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-tight tracking-tight mb-6">
          Your Entire Operation,{" "}
          <span className="text-primary">One Platform</span>
        </h1>

        <p className="hero-animate hero-delay-2 max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground mb-10">
          GroundWorks is the command center for residential investors — track
          rehab budgets, manage draws, coordinate subs, and hit your numbers
          from acquisition to disposition.
        </p>

        <div className="hero-animate hero-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Button
            size="lg"
            className="gold-glow min-h-[48px] px-8 text-base hover:scale-[1.03] transition-transform"
            onClick={handleTrialClick}
          >
            Start Your Free Trial
          </Button>
          <Link to="/demo">
            <Button
              variant="outline"
              size="lg"
              className="min-h-[48px] px-8 text-base hover:scale-[1.03] transition-transform"
            >
              <Play className="w-4 h-4 mr-2" />
              Watch Demo
            </Button>
          </Link>
        </div>

        <p className="hero-animate hero-delay-4 text-sm text-muted-foreground">
          No credit card required · 7-day free trial · Cancel anytime
        </p>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={() => document.getElementById("platform")?.scrollIntoView({ behavior: "smooth" })}
        className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
        aria-label="Scroll down"
      >
        <span className="text-sm font-medium tracking-widest uppercase">See What's Inside</span>
        <div className="relative flex items-center justify-center w-14 h-14">
          <div className="absolute w-14 h-14 rounded-full bg-primary/10 animate-ping" />
          <div className="absolute w-14 h-14 rounded-full bg-primary/5 group-hover:bg-primary/15 transition-colors" />
          <ChevronDown className="relative w-10 h-10 animate-bounce-down" />
        </div>
      </button>
    </section>
  );
}
