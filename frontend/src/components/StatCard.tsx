
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
}

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor
}: StatCardProps) {
  return (
    <div className="bg-[#FBFAF6] border border-[#E8E2D5] rounded-2xl p-5 hover:border-[#C7B487] hover:shadow-md transition-all duration-200">

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[#77736A]">
          {title}
        </p>

        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColor}`}>
          <Icon size={20} strokeWidth={1.8} />
        </div>
      </div>

      <h2 className="text-3xl font-semibold tracking-tight text-[#292720] mt-5">
        {value}
      </h2>

      <p className="text-xs text-[#8D887D] mt-2">
        {description}
      </p>

    </div>
  );
}
