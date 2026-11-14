
import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export default function PlaceholderPage({
  title,
  description
}: PlaceholderPageProps) {
  return (
    <div className="p-8">
      <div className="max-w-3xl bg-[#FCFCF8] border border-[#E6E9E1] rounded-2xl p-8">
        <div className="w-12 h-12 bg-[#DCE8DF] text-[#183B36] rounded-xl flex items-center justify-center mb-5">
          <Construction size={23} />
        </div>

        <p className="text-xs font-semibold tracking-widest uppercase text-[#858D83]">
          Development in progress
        </p>

        <h2 className="text-2xl font-semibold text-[#263A33] mt-2">
          {title}
        </h2>

        <p className="text-sm text-[#758078] mt-2 leading-6">
          {description}
        </p>
      </div>
    </div>
  );
}
