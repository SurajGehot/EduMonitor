
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const data = [
  { name: "Not at Risk", value: 1103 },
  { name: "At Risk", value: 91 }
];

const COLORS = ["#72947B", "#C87567"];

export default function RiskChart() {
  return (
    <div className="bg-[#FBFAF6] border border-[#E8E2D5] rounded-2xl p-6">

      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-base font-semibold text-[#292720]">
            Academic Risk Distribution
          </h3>

          <p className="text-xs text-[#8D887D] mt-1">
            Classification across the reference dataset
          </p>
        </div>

        <span className="text-xs bg-[#F0EDE5] text-[#78643D] px-3 py-1.5 rounded-full">
          1,194 records
        </span>
      </div>

      <div className="h-[250px] relative mt-4">

        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={72}
              outerRadius={100}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index]} />
              ))}
            </Pie>

            <Tooltip
              formatter={(value) => [value, "Students"]}
              contentStyle={{
                backgroundColor: "#FBFAF6",
                border: "1px solid #E8E2D5",
                borderRadius: "12px",
                fontSize: "12px"
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-semibold text-[#292720]">
            1,194
          </span>

          <span className="text-xs text-[#8D887D]">
            Total records
          </span>
        </div>

      </div>

      <div className="flex justify-center gap-7 mt-2 flex-wrap">

        <div className="flex items-center gap-2 text-xs text-[#655F53]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#72947B]" />
          Not at Risk · 92.38%
        </div>

        <div className="flex items-center gap-2 text-xs text-[#655F53]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C87567]" />
          At Risk · 7.62%
        </div>

      </div>

    </div>
  );
}
