import LandingHeader from "@/components/landing/LandingHeader";
import Hero from "@/components/landing/Hero";
import BuiltFor from "@/components/landing/BuiltFor";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import Testimonials from "@/components/landing/Testimonials";
import StatsRow from "@/components/landing/StatsRow";
import CostCalculator from "@/components/landing/CostCalculator";
import FinalCTA from "@/components/landing/FinalCTA";
import LandingFooter from "@/components/landing/LandingFooter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader />
      <Hero />
      <BuiltFor />
      <FeaturesGrid />
      <Testimonials />
      <StatsRow />
      <CostCalculator />
      <FinalCTA />
      <LandingFooter />
    </div>
  );
}
