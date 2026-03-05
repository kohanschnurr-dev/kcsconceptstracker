import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader />

      <section className="pt-28 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-8">
          <h1 className="font-heading text-4xl font-bold mb-8">
            Privacy Policy
          </h1>

          <div className="space-y-8 text-muted-foreground leading-relaxed">
            <p className="text-sm italic">
              [Placeholder — replace with final legal copy before launch]
            </p>

            <div>
              <h2 className="text-foreground font-heading font-semibold text-lg mb-3">
                1. Information We Collect
              </h2>
              <p>
                We collect information you provide when creating an account,
                using our platform, or contacting support. This includes name,
                email address, payment information, and project data you enter
                into GroundWorks.
              </p>
            </div>

            <div>
              <h2 className="text-foreground font-heading font-semibold text-lg mb-3">
                2. How We Use Your Information
              </h2>
              <p>
                Your information is used to provide and improve the Service,
                process payments, communicate with you about your account, and
                send product updates. We do not sell your personal data to third
                parties.
              </p>
            </div>

            <div>
              <h2 className="text-foreground font-heading font-semibold text-lg mb-3">
                3. Data Security
              </h2>
              <p>
                We use 256-bit SSL encryption for data in transit and at rest.
                All data is backed up daily. We are pursuing SOC 2 compliance
                and follow industry best practices for data protection.
              </p>
            </div>

            <div>
              <h2 className="text-foreground font-heading font-semibold text-lg mb-3">
                4. Cookies & Analytics
              </h2>
              <p>
                We use cookies and similar technologies to understand how you use
                GroundWorks and to improve your experience. You can manage cookie
                preferences through your browser settings.
              </p>
            </div>

            <div>
              <h2 className="text-foreground font-heading font-semibold text-lg mb-3">
                5. Third-Party Services
              </h2>
              <p>
                We use third-party services for payment processing (Stripe),
                hosting, and analytics. These services have their own privacy
                policies governing the use of your information.
              </p>
            </div>

            <div>
              <h2 className="text-foreground font-heading font-semibold text-lg mb-3">
                6. Your Rights
              </h2>
              <p>
                You may request access to, correction of, or deletion of your
                personal data at any time by contacting us. You may also export
                your project data from the platform.
              </p>
            </div>

            <div>
              <h2 className="text-foreground font-heading font-semibold text-lg mb-3">
                7. Changes to This Policy
              </h2>
              <p>
                We may update this privacy policy from time to time. We will
                notify you of significant changes via email or through the
                platform.
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
