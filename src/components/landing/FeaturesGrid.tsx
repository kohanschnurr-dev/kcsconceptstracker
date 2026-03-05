import { Link } from "react-router-dom";
import { features } from "@/data/features";
import { ArrowRight, Sparkles } from "lucide-react";

export default function FeaturesGrid() {
  // Show 7 features + 1 "And more..." card
  const displayed = features.slice(0, 7);

  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-center mb-14">
          Everything You Need to{" "}
          <span className="text-primary">Run the Job</span>
        </h2>

        {/* Top row: 4 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
          {displayed.slice(0, 4).map((f) => (
            <FeatureCard key={f.slug} feature={f} />
          ))}
        </div>

        {/* Bottom row: 3 cards + "And more" */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {displayed.slice(4, 7).map((f) => (
            <FeatureCard key={f.slug} feature={f} />
          ))}

          <Link
            to="/features"
            className="group bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center text-center hover:gold-glow-sm hover:border-primary/30 transition-all"
          >
            <Sparkles className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-heading font-semibold mb-2">And More...</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Explore all features built for contractors.
            </p>
            <span className="text-sm text-primary flex items-center gap-1">
              See all features <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature }: { feature: (typeof features)[number] }) {
  const Icon = feature.icon;
  return (
    <div className="group bg-card border border-border rounded-xl p-6 hover:gold-glow-sm hover:border-primary/30 transition-all">
      <div className="mb-4">
        <Icon
          className={`w-8 h-8 ${feature.color} group-hover:scale-110 transition-transform`}
        />
      </div>
      <h3 className="font-heading font-semibold mb-2">{feature.title}</h3>
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
        {feature.description}
      </p>
      <Link
        to={`/features/${feature.slug}`}
        className="text-sm text-primary hover:underline flex items-center gap-1"
      >
        See it in action <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
