import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";

const COLORS = { low: "#22C55E", medium: "#F97316", high: "#EF4444" };

export default function RiskDistributionChart({
  low,
  medium,
  high,
}: {
  low: number;
  medium: number;
  high: number;
}) {
  const total = low + medium + high;
  const data = [
    { name: "Low risk", value: low, color: COLORS.low },
    { name: "Medium risk", value: medium, color: COLORS.medium },
    { name: "High risk", value: high, color: COLORS.high },
  ];

  if (total === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-sm text-slate-400">
        Analyze a lease to see your risk breakdown
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      <div className="w-32 h-32 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={38} outerRadius={58} paddingAngle={3} strokeWidth={0}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <RechartsTooltip
              contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(30,58,138,0.15)", fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-slate-500 dark:text-slate-400">{d.name}</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
