import { useState } from "react";
import { Slider } from "@/components/ui/slider";

export default function CostCalculator() {
  const [rate, setRate] = useState(45);
  const [hours, setHours] = useState(6);
  const [projects, setProjects] = useState(2);

  const monthlyCost = rate * hours * 4.33 * projects;
  const annualCost = monthlyCost * 12;
  const annualSavings = annualCost - 89 * 12;

  return (
    <section className="py-20 sm:py-28 bg-muted/20 border-y border-border/40">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-center mb-4">
          See Where Your <span className="text-primary">Time</span> Goes
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
          Plug in your numbers. See what you could get back.
        </p>

        <div className="max-w-2xl mx-auto bg-card border border-border rounded-xl p-6 sm:p-10 gold-glow-sm">
          {/* Hourly Rate */}
          <div className="mb-8">
            <div className="flex justify-between mb-3">
              <label className="text-sm font-medium">Your Hourly Rate</label>
              <span className="text-sm font-semibold text-primary">
                ${rate}{rate >= 75 ? "+" : ""}/hr
              </span>
            </div>
            <Slider
              value={[rate]}
              onValueChange={([v]) => setRate(v)}
              min={20}
              max={75}
              step={5}
              className="min-h-[48px]"
            />
          </div>

          {/* Hours per week */}
          <div className="mb-8">
            <div className="flex justify-between mb-3">
              <label className="text-sm font-medium">Hours a Week</label>
              <span className="text-sm font-semibold text-primary">
                {hours}{hours >= 12 ? "+" : ""} hrs
              </span>
            </div>
            <Slider
              value={[hours]}
              onValueChange={([v]) => setHours(v)}
              min={1}
              max={12}
              step={1}
              className="min-h-[48px]"
            />
          </div>

          {/* Active Projects */}
          <div className="mb-10">
            <div className="flex justify-between mb-3">
              <label className="text-sm font-medium">Active Projects</label>
              <span className="text-sm font-semibold text-primary">
                {projects}{projects >= 5 ? "+" : ""}
              </span>
            </div>
            <Slider
              value={[projects]}
              onValueChange={([v]) => setProjects(v)}
              min={1}
              max={5}
              step={1}
              className="min-h-[48px]"
            />
          </div>

          {/* Results */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-secondary/50 rounded-lg p-5 text-center">
              <p className="text-sm text-muted-foreground mb-1">
                Monthly Time Cost
              </p>
              <p className="font-heading text-3xl font-bold text-destructive">
                ${monthlyCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-5 text-center">
              <p className="text-sm text-muted-foreground mb-1">
                Your Annual Overhead
              </p>
              <p className="font-heading text-3xl font-bold text-destructive">
                ${annualCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          {/* Savings banner */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-5 text-center">
            <p className="text-sm text-muted-foreground mb-1">
              GroundWorks Solo: $89/mo
            </p>
            <p className="font-heading text-xl font-bold text-primary">
              Get back $
              {annualSavings > 0
                ? annualSavings.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })
                : "0"}{" "}
              worth of your time
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
