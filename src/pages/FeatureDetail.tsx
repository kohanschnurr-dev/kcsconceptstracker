import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import { features } from "@/data/features";
import { useAuth } from "@/contexts/AuthContext";
import { useLeadCapture } from "@/contexts/LeadCaptureContext";

export default function FeatureDetail() {
  const { slug } = useParams<{ slug: string }>();
  const feature = features.find((f) => f.slug === slug);
  const { user } = useAuth();
  const { openModal } = useLeadCapture();
  const navigate = useNavigate();

  const handleTrialClick = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      openModal();
    }
  };

  if (!feature) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold mb-4">
            Feature not found
          </h1>
          <Link to="/features" className="text-primary hover:underline">
            Back to features
          </Link>
        </div>
      </div>
    );
  }

  const Icon = feature.icon;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader />

      <section className="pt-28 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-8">
          <Link
            to="/features"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Features
          </Link>

          {/* Hero */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className={`w-7 h-7 ${feature.color}`} />
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold">
              {feature.title}
            </h1>
          </div>

          <p className="text-lg text-muted-foreground mb-12 leading-relaxed">
            {feature.description}
          </p>

          {/* Details */}
          <div className="space-y-6">
            {feature.details.map((detail, i) => (
              <div key={i} className="flex gap-4">
                <CheckCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <p className="text-foreground leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-14 text-center">
            <Button
              size="lg"
              className="gold-glow min-h-[48px] px-8 hover:scale-[1.03] transition-transform"
              onClick={handleTrialClick}
            >
              {user ? "Go to Dashboard" : "Start Your Free Trial"}
            </Button>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
