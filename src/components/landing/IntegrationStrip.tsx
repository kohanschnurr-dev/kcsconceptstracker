import { FileSpreadsheet, Camera, Upload, FileText, Cloud } from "lucide-react";

const integrations = [
  { icon: Cloud, label: "QuickBooks Sync", desc: "Auto-import expenses" },
  { icon: FileSpreadsheet, label: "CSV Import", desc: "AI-powered matching" },
  { icon: Camera, label: "Photo Upload", desc: "Paste or upload receipts" },
  { icon: FileText, label: "PDF Export", desc: "Branded documents" },
  { icon: Upload, label: "Cloud Storage", desc: "Secure file hosting" },
];

export default function IntegrationStrip() {
  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
        <h2 className="font-heading text-[22px] sm:text-4xl font-bold text-center mb-4">
          Connects With Your <span className="text-primary">Workflow</span>
        </h2>
        <p className="text-muted-foreground text-center mb-10 sm:mb-12 max-w-xl mx-auto leading-relaxed">
          Import data, export reports, and keep everything synced.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {integrations.map((int) => {
            const Icon = int.icon;
            return (
              <div
                key={int.label}
                className="bg-card border border-border rounded-xl p-5 text-center hover:border-primary/30 transition-colors"
              >
                <Icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-heading font-semibold text-sm mb-1">
                  {int.label}
                </h3>
                <p className="text-xs text-muted-foreground">{int.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
