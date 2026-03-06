import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function FinalCTA() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/get-started");
  };

  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 text-center">
        <h2 data-reveal className="scroll-hidden font-heading text-3xl sm:text-4xl font-bold mb-4">
          Ready to <span className="text-primary">Ditch the Spreadsheets</span>?
        </h2>
        <p data-reveal className="scroll-hidden stagger-1 text-muted-foreground mb-10 max-w-lg mx-auto">
          Join contractors and investors who manage every project in one place.
          Start your free 14-day trial today.
        </p>
        <div data-reveal className="scroll-hidden stagger-2">
          <Button
            size="lg"
            className="gold-glow min-h-[48px] px-10 text-base hover:scale-[1.03] transition-transform"
            onClick={handleClick}
          >
            Start Your Free Trial
          </Button>
        </div>
        <p data-reveal className="scroll-hidden stagger-3 text-sm text-muted-foreground mt-6">
          No credit card required · 14-day free trial · Cancel anytime
        </p>
      </div>
    </section>
  );
}
