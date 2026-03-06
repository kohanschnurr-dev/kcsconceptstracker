import { useEffect, useRef, useState } from "react";

const stats = [
  { value: 500, prefix: "", suffix: "+", label: "Hours Saved Per Year" },
  { value: 10000, prefix: "", suffix: "+", label: "Expenses Tracked" },
  { value: 5, prefix: "", suffix: " min", label: "To Start Tracking Today!" },
  { value: 0, prefix: "$", suffix: "", label: "To Get Started" },
];

function CountUpStat({ value, prefix, suffix, label, index }: {
  value: number; prefix: string; suffix: string; label: string; index: number;
}) {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);
  const ref = useRef<HTMLDivElement>(null);
  const delay = index * 250;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          if (value === 0) { setCount(0); observer.unobserve(el); return; }

          timeoutId = setTimeout(() => {
            const duration = 1500;
            let startTime: number | null = null;

            const animate = (timestamp: number) => {
              if (!startTime) startTime = timestamp;
              const progress = Math.min((timestamp - startTime) / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 4);
              setCount(Math.floor(eased * value));
              if (progress < 1) requestAnimationFrame(animate);
              else setCount(value);
            };

            requestAnimationFrame(animate);
          }, delay);

          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [value, hasAnimated, delay]);

  return (
    <div
      ref={ref}
      className="text-center hover-gold-glow rounded-xl p-4 transition-all"
    >
      <p className="font-heading text-4xl sm:text-5xl font-extrabold text-primary mb-2">
        {prefix}{count.toLocaleString()}{suffix}
      </p>
      <p className="text-sm sm:text-base text-muted-foreground">{label}</p>
    </div>
  );
}

export default function StatsRow() {
  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          {stats.map((s, i) => (
            <CountUpStat key={s.label} {...s} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
