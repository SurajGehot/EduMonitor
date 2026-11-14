
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  HeartHandshake,
  ChartNoAxesCombined,
  GraduationCap
} from "lucide-react";

const navigation = [
  { name: "Overview", path: "/", icon: LayoutDashboard },
  { name: "Students", path: "/students", icon: Users },
  { name: "Risk Assessment", path: "/assessment", icon: ClipboardCheck },
  { name: "Interventions", path: "/interventions", icon: HeartHandshake },
  { name: "Analytics", path: "/analytics", icon: ChartNoAxesCombined }
];

export default function Sidebar() {
  return (
    <aside className="w-[250px] shrink-0 min-h-screen bg-[#20201E] text-[#F6F4EE] flex flex-col px-4 py-6">

      {/* Brand */}

      <div className="flex items-center gap-3 px-2 mb-12">
        <div className="w-10 h-10 rounded-xl bg-[#B69A61] text-[#20201E] flex items-center justify-center">
          <GraduationCap size={23} />
        </div>

        <div>
          <h1 className="text-lg font-bold tracking-tight">
            EduMonitor
          </h1>
          <p className="text-xs text-[#B8B1A2]">
            Academic Intelligence
          </p>
        </div>
      </div>

      {/* Navigation */}

      <p className="text-[10px] font-semibold tracking-[0.18em] text-[#A69D8B] uppercase px-3 mb-4">
        Workspace
      </p>

      <nav className="flex flex-col gap-2">
        {navigation.map(({ name, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 border ${
                isActive
                  ? "bg-[#2D2B25] border-[#AA8D54] text-[#F6F4EE]"
                  : "border-transparent text-[#D0CABB] hover:bg-[#2D2B25] hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-[#AA8D54]" />
                )}

                <Icon
                  size={19}
                  strokeWidth={1.8}
                  className={isActive ? "text-[#C7A968]" : "text-[#B8B1A2]"}
                />

                {name}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Sidebar Footer */}

      <div className="mt-auto border-t border-[#403D35] pt-5 px-2">
        <div className="flex items-center gap-2 text-xs text-[#C4BDAE]">
          <div className="w-2 h-2 rounded-full bg-[#AA8D54]" />
          Prototype Environment
        </div>

        <p className="text-[10px] text-[#918A7D] mt-2">
          Academic Risk Management System
        </p>
      </div>

    </aside>
  );
}
