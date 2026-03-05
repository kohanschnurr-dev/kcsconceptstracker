import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import { features } from "@/data/features";

export default function LandingFeatures() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader />

      <section className="pt-28 pb-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-center mb-4">
            All <span className="text-primary">Features</span>
          </h1>
          <p className="text-muted-foreground text-center mb-14 max-w-2xl mx-auto">
            Every tool you need to manage construction projects — from first bid
            to final closeout.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <Link
                  key={f.slug}
                  to={`/features/${f.slug}`}
                  className="group bg-card border border-border rounded-xl p-6 hover:gold-glow-sm hover:border-primary/30 transition-all"
                >
                  <Icon
                    className={`w-8 h-8 mb-4 ${f.color} group-hover:scale-110 transition-transform`}
                  />
                  <h3 className="font-heading font-semibold mb-2">
                    {f.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    {f.description}
                  </p>
                  <span className="text-sm text-primary flex items-center gap-1">
                    Learn more <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
