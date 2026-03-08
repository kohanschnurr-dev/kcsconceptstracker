import LandingHeader from "@/components/landing/LandingHeader";
import Hero from "@/components/landing/Hero";
import PlatformOverview from "@/components/landing/PlatformOverview";
import BuiltFor from "@/components/landing/BuiltFor";

import Testimonials from "@/components/landing/Testimonials";
import StatsRow from "@/components/landing/StatsRow";
import CostCalculator from "@/components/landing/CostCalculator";
import FAQ from "@/components/landing/FAQ";
import FinalCTA from "@/components/landing/FinalCTA";
import LandingFooter from "@/components/landing/LandingFooter";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function Landing() {
  useScrollReveal();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <LandingHeader />
      <Hero />
      <PlatformOverview />
      <StatsRow />
      <CostCalculator />
      <BuiltFor />
      <Testimonials />
      <FinalCTA />
      <FAQ />
      <LandingFooter />
    </div>
  );
}
