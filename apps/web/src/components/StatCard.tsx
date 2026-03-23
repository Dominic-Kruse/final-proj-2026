type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
};

export function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <div className="h-32 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col justify-between">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-slate-400">{subtitle}</div>
    </div>
  );
}