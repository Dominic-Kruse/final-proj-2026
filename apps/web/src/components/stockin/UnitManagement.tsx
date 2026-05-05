import { BASE_UNITS, PACKAGE_UNITS } from "./types";

type UnitManagementProps = {
  baseUnit: string;
  setBaseUnit: (v: string) => void;
  packageUnit: string;
  setPackageUnit: (v: string) => void;
  conversionFactor: number;
  setConversionFactor: (v: number) => void;
  quantityPackages: number;
};

export function UnitManagement({
  baseUnit, setBaseUnit,
  packageUnit, setPackageUnit,
  conversionFactor, setConversionFactor,
  quantityPackages,
}: UnitManagementProps) {
  const hasPackage = !!packageUnit;
  const totalBase = hasPackage ? quantityPackages * conversionFactor : quantityPackages;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Base unit <span className="text-red-500">*</span>
          </label>
          <select
            value={baseUnit}
            onChange={(e) => setBaseUnit(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
          >
            {BASE_UNITS.map((u) => <option key={u}>{u}</option>)}
          </select>
          <p className="mt-1 text-[11px] text-slate-400">Smallest dispensable unit</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Package unit</label>
          <select
            value={packageUnit}
            onChange={(e) => setPackageUnit(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
          >
            {PACKAGE_UNITS.map((u) => (
              <option key={u} value={u}>{u || "— None (track by base unit) —"}</option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-slate-400">Container the supplier ships in</p>
        </div>
      </div>

      {hasPackage && (
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Conversion factor <span className="text-red-500">*</span>
            <span className="ml-1 font-normal text-slate-400">
              — how many {baseUnit}s per {packageUnit}
            </span>
          </label>
          <input
            type="number"
            min={1}
            value={conversionFactor}
            onChange={(e) => setConversionFactor(Math.max(1, Number(e.target.value)))}
            className="w-32 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
          />
        </div>
      )}

      <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-600 flex flex-wrap gap-x-6 gap-y-1">
        {hasPackage ? (
          <>
            <span><strong>1 {packageUnit}</strong> = {conversionFactor} {baseUnit}s</span>
            {quantityPackages > 0 && (
              <span>
                <strong>{quantityPackages} {packageUnit}{quantityPackages !== 1 ? "s" : ""}</strong>
                {" → "}
                <strong className="text-blue-700">{totalBase} {baseUnit}s</strong> added to stock
              </span>
            )}
          </>
        ) : (
          <span>Tracking directly in <strong>{baseUnit}s</strong> — no package conversion needed</span>
        )}
      </div>
    </div>
  );
}