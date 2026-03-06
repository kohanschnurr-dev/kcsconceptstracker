const stats = [
  { value: "12+", label: "Integrated Modules" },
  { value: "40+", label: "Database-Backed Features" },
  { value: "3x", label: "Faster Than Spreadsheets" },
  { value: "$0", label: "Setup Fees" },
];

export default function StatsRow() {
  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          {stats.map((s, i) => (
            <div
              key={s.label}
              data-reveal
              className={`scroll-hidden stagger-${i + 1} text-center hover-gold-glow rounded-xl p-4 transition-all`}
            >
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
