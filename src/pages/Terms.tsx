import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader />

      <section className="pt-28 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-8">
          <h1 className="font-heading text-4xl font-bold mb-8">
            Terms of Service
          </h1>

          <div className="space-y-8 text-muted-foreground leading-relaxed">
            <p className="text-sm italic">
              [Placeholder — replace with final legal copy before launch]
            </p>

            <div>
              <h2 className="text-foreground font-heading font-semibold text-lg mb-3">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing or using GroundWorks ("the Service"), you agree to be
                bound by these Terms of Service. If you do not agree to these
                terms, do not use the Service.
              </p>
            </div>

            <div>
              <h2 className="text-foreground font-heading font-semibold text-lg mb-3">
                2. Description of Service
              </h2>
              <p>
                GroundWorks provides a web-based construction project management
                platform for tracking budgets, timelines, vendors, documents, and
                related project data. Features may change from time to time.
              </p>
            </div>

            <div>
              <h2 className="text-foreground font-heading font-semibold text-lg mb-3">
                3. User Accounts
              </h2>
              <p>
                You are responsible for maintaining the confidentiality of your
                account credentials. You agree to notify us immediately of any
                unauthorized use of your account.
              </p>
            </div>

            <div>
              <h2 className="text-foreground font-heading font-semibold text-lg mb-3">
                4. Payment & Billing
              </h2>
              <p>
                Paid subscriptions are billed monthly or annually as selected.
                All fees are non-refundable except as described in our refund
                policy. You authorize us to charge your payment method on file.
              </p>
            </div>

            <div>
              <h2 className="text-foreground font-heading font-semibold text-lg mb-3">
                5. Intellectual Property
              </h2>
              <p>
                All content, features, and functionality of the Service are owned
                by GroundWorks. You retain ownership of data you upload to the
                platform.
              </p>
            </div>

            <div>
              <h2 className="text-foreground font-heading font-semibold text-lg mb-3">
                6. Limitation of Liability
              </h2>
              <p>
                GroundWorks shall not be liable for any indirect, incidental,
                special, consequential, or punitive damages arising out of your
                use of the Service.
              </p>
            </div>

            <div>
              <h2 className="text-foreground font-heading font-semibold text-lg mb-3">
                7. Changes to Terms
              </h2>
              <p>
                We may update these terms from time to time. Continued use of the
                Service after changes constitutes acceptance of the new terms.
              </p>
            </div>

            <p className="text-sm">Last updated: March 2025</p>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
