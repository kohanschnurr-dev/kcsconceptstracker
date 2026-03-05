import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";

export default function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader />

      <section className="pt-28 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-8">
          {/* Story */}
          <h1 className="font-heading text-4xl sm:text-5xl font-bold mb-6">
            Built by <span className="text-primary">Contractors</span>,<br />
            for Contractors
          </h1>
          <div className="space-y-5 text-muted-foreground leading-relaxed mb-16">
            <p>
              GroundWorks started on a job site — not in a conference room. We
              were contractors running fix-and-flip projects, juggling
              spreadsheets, group texts, and paper receipts. Every draw request
              meant hours of manual work. Every budget review was a scavenger
              hunt through email threads and Google Sheets.
            </p>
            <p>
              We built GroundWorks because we needed it. A single platform where
              you can track budgets, manage subs, document progress, and
              generate draw requests — all without leaving the job site. No
              enterprise software bloat. No features built for people who've
              never swung a hammer.
            </p>
            <p>
              Today, GroundWorks serves general contractors, real estate
              investors, property managers, and developers across the country.
              We're still builders at heart, and everything we ship is tested on
              real projects before it reaches yours.
            </p>
          </div>

          {/* Mission */}
          <div className="bg-card border border-border rounded-xl p-8 mb-16">
            <h2 className="font-heading text-2xl font-bold mb-4">
              Our Mission
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Give every contractor and investor the same project management
              tools that big firms use — without the big firm price tag or
              learning curve. Construction is hard enough. Your software
              shouldn't be.
            </p>
          </div>

          {/* Contact Form */}
          <h2 className="font-heading text-2xl font-bold mb-6">
            Get in Touch
          </h2>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="space-y-5"
          >
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Your name"
                className="mt-1 min-h-[48px]"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                className="mt-1 min-h-[48px]"
              />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="How can we help?"
                rows={5}
                className="mt-1"
              />
            </div>
            <Button
              type="submit"
              className="min-h-[48px] gold-glow"
            >
              Send Message
            </Button>
          </form>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
