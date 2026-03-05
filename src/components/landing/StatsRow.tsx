const stats = [
  { value: "12+", label: "Project Modules" },
  { value: "14-Day", label: "Free Trial" },
  { value: "3x", label: "Faster Draw Processing" },
  { value: "$0", label: "Setup Fees" },
];

export default function StatsRow() {
  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-heading text-4xl sm:text-5xl font-extrabold text-primary mb-2">
                {s.value}
              </p>
              <p className="text-sm sm:text-base text-muted-foreground">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
