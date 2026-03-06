import LandingHeader from "@/components/landing/LandingHeader";
import Hero from "@/components/landing/Hero";
import BuiltFor from "@/components/landing/BuiltFor";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import PlatformOverview from "@/components/landing/PlatformOverview";
import FeatureShowcase from "@/components/landing/FeatureShowcase";
import IntegrationStrip from "@/components/landing/IntegrationStrip";
import HowItWorks from "@/components/landing/HowItWorks";
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
      <FeaturesGrid />
      <BuiltFor />
      <PlatformOverview />
      <FeatureShowcase />
      <IntegrationStrip />
      <HowItWorks />
      <Testimonials />
      <StatsRow />
      <CostCalculator />
      <FAQ />
      <FinalCTA />
      <LandingFooter />
    </div>
  );
}
