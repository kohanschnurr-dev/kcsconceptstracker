import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden blueprint-grid">
      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(38_92%_50%_/_0.08)_0%,_transparent_70%)]" />

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-8 pt-24 pb-16 text-center">
        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-tight tracking-tight mb-6">
          Stop Managing Projects{" "}
          <span className="text-primary">in Spreadsheets</span>
        </h1>

        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground mb-10">
          GroundWorks replaces your scattered docs, texts, and spreadsheets with one
          platform that tracks budgets, timelines, subs, and draws — from bid to
          closeout.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Link to="/auth">
            <Button
              size="lg"
              className="gold-glow min-h-[48px] px-8 text-base hover:scale-[1.03] transition-transform"
            >
              Start Your Free Trial
            </Button>
          </Link>
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

        <p className="text-sm text-muted-foreground">
          No credit card required · 14-day free trial · Cancel anytime
        </p>
      </div>
    </section>
  );
}
