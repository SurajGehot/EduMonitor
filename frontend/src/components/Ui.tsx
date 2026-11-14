import type { LucideIcon } from "lucide-react";

export function PageHeading({ eyebrow, title, description, action }: {
  eyebrow: string; title: string; description: string; action?: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#AA8D54]">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-semibold text-[#292720] lg:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-[#77736A]">{description}</p>
      </div>
      {action}
    </section>
  );
}

export function MetricCard({ title, value, description, icon: Icon, tone = "gold" }: {
  title: string; value: string | number; description: string; icon: LucideIcon; tone?: "gold" | "red" | "green";
}) {
  const tones = {
    gold: "bg-[#EEE7D8] text-[#806A3E]",
    red: "bg-[#F3E3DE] text-[#B96556]",
    green: "bg-[#E4ECE3] text-[#55765A]"
  };
  return (
    <div className="rounded-2xl border border-[#E8E2D5] bg-[#FBFAF6] p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#77736A]">{title}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}><Icon size={19} /></span>
      </div>
      <p className="mt-4 text-3xl font-semibold text-[#292720]">{value}</p>
      <p className="mt-1 text-xs text-[#8D887D]">{description}</p>
    </div>
  );
}


export function RiskPill({ risk }: { risk: string | null }) {
  if (!risk) {
    return (
      <span className="inline-flex items-center rounded-full border border-[#E8E2D5] bg-[#F5F2EA] px-2.5 py-1 text-xs font-medium text-[#8D887D]">
        Not Assessed
      </span>
    );
  }

  const isAtRisk = risk === "At Risk";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
        isAtRisk
          ? "border border-[#EBCFCB] bg-[#F8E9E7] text-[#A64F45]"
          : "border border-[#D5E3D4] bg-[#EAF2E9] text-[#587B57]"
      }`}
    >
      {risk}
    </span>
  );
}


export function Panel({ title, subtitle, children }: {
  title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#E8E2D5] bg-[#FBFAF6]">
      <div className="border-b border-[#E8E2D5] px-5 py-4 lg:px-6">
        <h2 className="text-base font-semibold text-[#292720]">{title}</h2>
        {subtitle && <p className="mt-1 text-xs text-[#8D887D]">{subtitle}</p>}
      </div>
      <div className="p-5 lg:p-6">{children}</div>
    </section>
  );
}
