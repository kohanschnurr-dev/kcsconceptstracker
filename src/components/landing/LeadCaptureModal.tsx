import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLeadCapture } from "@/contexts/LeadCaptureContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function LeadCaptureModal() {
  const { open, closeModal } = useLeadCapture();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  if (!open) return null;

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("leads" as any).insert([
        {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
        },
      ] as any);

      if (error) throw error;

      toast({
        title: "Success! We'll be in touch.",
        description:
          "Thanks for your interest in GroundWorks. A member of our team will reach out shortly.",
      });
      resetForm();
      closeModal();
    } catch {
      toast({
        title: "Something went wrong",
        description: "Please try again or email us directly.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeModal}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-card/70 backdrop-blur-xl shadow-2xl gold-glow-sm">
        {/* Close */}
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <h2 className="font-heading text-2xl font-bold mb-2 text-center">
            Start Your <span className="text-primary">Free Trial</span>
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-8">
            14 days free. No credit card required. We'll get you set up.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="lead-name" className="text-sm font-medium">
                Name
              </Label>
              <Input
                id="lead-name"
                placeholder="Marcus Thompson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1.5 min-h-[48px] bg-background/50 border-border/60"
              />
            </div>

            <div>
              <Label htmlFor="lead-email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="lead-email"
                type="email"
                placeholder="marcus@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1.5 min-h-[48px] bg-background/50 border-border/60"
              />
            </div>

            <div>
              <Label htmlFor="lead-phone" className="text-sm font-medium">
                Phone{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="lead-phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1.5 min-h-[48px] bg-background/50 border-border/60"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[48px] gold-glow text-base font-semibold hover:scale-[1.02] transition-transform"
            >
              {submitting ? "Submitting…" : "Get Early Access"}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              No spam. We'll only contact you about GroundWorks.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
