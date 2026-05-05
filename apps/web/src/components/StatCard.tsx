type StatCardVariant = "default" | "warning" | "danger";

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  variant?: StatCardVariant;
  onClick?: () => void;
};

const variantStyles: Record<StatCardVariant, string> = {
  default: "border-slate-100",
  warning: "border-amber-200 cursor-pointer hover:shadow-md hover:border-amber-400 transition-all",
  danger:  "border-red-200 cursor-pointer hover:shadow-md hover:border-red-400 transition-all",
};

const variantValueStyles: Record<StatCardVariant, string> = {
  default: "text-slate-900",
  warning: "text-amber-600",
  danger:  "text-red-600",
};

export function StatCard({ title, value, subtitle, variant = "default", onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`h-32 bg-white rounded-2xl border shadow-sm p-4 flex flex-col justify-between ${variantStyles[variant]}`}
    >
      <div className="text-sm text-slate-500">{title}</div>
      <div className={`text-2xl font-bold ${variantValueStyles[variant]}`}>{value}</div>
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-400">{subtitle}</div>
        {onClick && (
          <span className="text-xs font-semibold text-slate-400 hover:text-slate-600">
            View details →
          </span>
        )}
      </div>
    </div>
  );
}