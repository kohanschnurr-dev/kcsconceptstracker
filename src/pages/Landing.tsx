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

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader />
      <Hero />
      <PlatformOverview />
      <BuiltFor />


      <CostCalculator />
      <Testimonials />
      <StatsRow />
      <FAQ />
      <FinalCTA />
      <LandingFooter />
    </div>
  );
}
