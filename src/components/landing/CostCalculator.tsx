import { useState } from "react";
import { Slider } from "@/components/ui/slider";

export default function CostCalculator() {
  const [rate, setRate] = useState(75);
  const [hours, setHours] = useState(8);
  const [projects, setProjects] = useState(3);

  const monthlyCost = rate * hours * 4.33 * projects;
  const annualCost = monthlyCost * 12;
  const annualSavings = annualCost - 89 * 12;

  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-center mb-4">
          See What You're <span className="text-primary">Losing</span> to
          Spreadsheets
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
          Plug in your numbers. The math speaks for itself.
        </p>

        <div className="max-w-2xl mx-auto bg-card border border-border rounded-xl p-6 sm:p-10 gold-glow-sm">
          {/* Hourly Rate */}
          <div className="mb-8">
            <div className="flex justify-between mb-3">
              <label className="text-sm font-medium">Your Hourly Rate</label>
              <span className="text-sm font-semibold text-primary">
                ${rate}/hr
              </span>
            </div>
            <Slider
              value={[rate]}
              onValueChange={([v]) => setRate(v)}
              min={25}
              max={150}
              step={5}
              className="min-h-[48px]"
            />
          </div>

          {/* Hours per week */}
          <div className="mb-8">
            <div className="flex justify-between mb-3">
              <label className="text-sm font-medium">Hours/Week on Admin</label>
              <span className="text-sm font-semibold text-primary">
                {hours} hrs
              </span>
            </div>
            <Slider
              value={[hours]}
              onValueChange={([v]) => setHours(v)}
              min={2}
              max={20}
              step={1}
              className="min-h-[48px]"
            />
          </div>

          {/* Active Projects */}
          <div className="mb-10">
            <div className="flex justify-between mb-3">
              <label className="text-sm font-medium">Active Projects</label>
              <span className="text-sm font-semibold text-primary">
                {projects}
              </span>
            </div>
            <Slider
              value={[projects]}
              onValueChange={([v]) => setProjects(v)}
              min={1}
              max={10}
              step={1}
              className="min-h-[48px]"
            />
          </div>

          {/* Results */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-secondary/50 rounded-lg p-5 text-center">
              <p className="text-sm text-muted-foreground mb-1">
                Monthly Cost of Admin
              </p>
              <p className="font-heading text-3xl font-bold text-destructive">
                ${monthlyCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-5 text-center">
              <p className="text-sm text-muted-foreground mb-1">
                Annual Wasted Cost
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
              Save $
              {annualSavings > 0
                ? annualSavings.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })
                : "0"}{" "}
              per year
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
