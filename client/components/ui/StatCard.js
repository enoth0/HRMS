import clsx from "clsx";

/**
 * Dashboard statistic card.
 * @param {{ title: string, value: string|number, icon: string, color: string, change?: string }} props
 */
export default function StatCard({ title, value, icon, color = "blue", change }) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    yellow: "bg-yellow-50 text-yellow-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="card flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value ?? "—"}</p>
        {change && (
          <p className={clsx("text-xs mt-1", change.startsWith("+") ? "text-green-600" : "text-red-500")}>
            {change} from last month
          </p>
        )}
      </div>
      <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center text-xl", colorMap[color])}>
        {icon}
      </div>
    </div>
  );
}
