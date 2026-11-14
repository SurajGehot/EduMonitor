
import { Bell, Search } from "lucide-react";
import { useLocation } from "react-router-dom";

const pageTitles: Record<string, string> = {
  "/": "Overview",
  "/students": "Student Directory",
  "/assessment": "Risk Assessment",
  "/interventions": "Intervention Management",
  "/analytics": "Academic Analytics"
};

export default function Header() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || "EduMonitor";

  return (
    <header className="h-[82px] bg-[#FBFAF6] border-b border-[#E8E2D5] flex items-center justify-between px-8 sticky top-0 z-20">

      <div>
        <p className="text-xs text-[#8D887D] mb-1">
          Academic Intelligence / Workspace
        </p>

        <h2 className="text-xl font-semibold text-[#292720]">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-5">

        <div className="hidden md:flex items-center gap-2 bg-[#F0EDE5] px-3 py-2.5 rounded-xl border border-transparent focus-within:border-[#B69A61]">
          <Search size={17} className="text-[#77736A]" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent outline-none text-sm w-36 text-[#292720] placeholder:text-[#999387]"
          />
        </div>

        <button className="relative p-2 text-[#655F53] hover:bg-[#F0EDE5] rounded-xl transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#C87567] rounded-full" />
        </button>

        <div className="flex items-center gap-3 border-l border-[#E8E2D5] pl-5">
          <div className="w-10 h-10 rounded-full bg-[#E9E0CD] text-[#69552F] flex items-center justify-center font-semibold">
            A
          </div>

          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-[#292720]">Administrator</p>
            <p className="text-xs text-[#8D887D]">Admin workspace</p>
          </div>
        </div>

      </div>
    </header>
  );
}
