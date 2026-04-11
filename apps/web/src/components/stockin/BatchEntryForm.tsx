import type { FormEvent } from "react";
import type { Medicine } from "../../utils/types";
import { CATEGORIES, FORMS, STRENGTH_UNITS } from "./types";
import { GenericNamePicker } from "./GenericNamePicker";
import { PillSelector } from "./PillSelector";
import { UnitManagement } from "./UnitManagement";

type BatchEntryFormProps = {
  // Product
  productName: string; setProductName: (v: string) => void;
  genericName: string; setGenericName: (v: string) => void;
  strengthValue: string; setStrengthValue: (v: string) => void;
  strengthUnit: string; setStrengthUnit: (v: string) => void;
  category: string; setCategory: (v: string) => void;
  form: string; setForm: (v: string) => void;
  // Units
  baseUnit: string; setBaseUnit: (v: string) => void;
  packageUnit: string; setPackageUnit: (v: string) => void;
  conversionFactor: number; setConversionFactor: (v: number) => void;
  // Batch
  batchNumber: string; setBatchNumber: (v: string) => void;
  expiryDate: string; setExpiryDate: (v: string) => void;
  inventoryLocation: string; setInventoryLocation: (v: string) => void;
  quantityPackages: string; setQuantityPackages: (v: string) => void;
  unitCost: string; setUnitCost: (v: string) => void;
  sellingPrice: string; setSellingPrice: (v: string) => void;
  // Computed
  totalBaseUnits: number;
  // Catalog
  productCatalog: Medicine[];
  // Handlers
  onSubmit: (e: FormEvent) => void;
  onClear: () => void;
  onAddNew: () => void;
  errorMessage: string;
};

function SectionDivider({ label }: { label: string }) {
  return (
    <>
      <hr className="border-slate-100" />
      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
    </>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-medium text-slate-600 mb-1.5">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function TextInput({ value, onChange, placeholder, type = "text", className = "" }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 ${className}`}
    />
  );
}

export function BatchEntryForm({
  productName, setProductName,
  genericName, setGenericName,
  strengthValue, setStrengthValue,
  strengthUnit, setStrengthUnit,
  category, setCategory,
  form, setForm,
  baseUnit, setBaseUnit,
  packageUnit, setPackageUnit,
  conversionFactor, setConversionFactor,
  batchNumber, setBatchNumber,
  expiryDate, setExpiryDate,
  inventoryLocation, setInventoryLocation,
  quantityPackages, setQuantityPackages,
  unitCost, setUnitCost,
  sellingPrice, setSellingPrice,
  totalBaseUnits,
  productCatalog,
  onSubmit, onClear, onAddNew,
  errorMessage,
}: BatchEntryFormProps) {
  const hasPackage = !!packageUnit;
  const parsedQty = Number(quantityPackages);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Batch entry</span>
      </div>
      <form onSubmit={onSubmit} className="p-5 flex flex-col gap-6">

        {/* Product + Generic */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <FieldLabel required>Brand / product name</FieldLabel>
            <TextInput value={productName} onChange={setProductName} placeholder="e.g. Biogesic, Amoxil" />
            <p className="mt-1 text-[11px] text-slate-400">Trade or brand name</p>
          </div>
          <div>
            <FieldLabel required>
              Generic name{" "}
              <span className="font-normal text-slate-400">— scroll or search</span>
            </FieldLabel>
            <GenericNamePicker
              products={productCatalog}
              value={genericName}
              onChange={setGenericName}
              onAddNew={onAddNew}
            />
          </div>
        </div>

        {/* Dosage / Strength */}
        <SectionDivider label="Dosage / strength" />
        <div className="flex gap-3 items-end">
          <div className="w-36">
            <FieldLabel>Strength value</FieldLabel>
            <TextInput type="number" value={strengthValue} onChange={setStrengthValue} placeholder="e.g. 500" />
          </div>
          <div className="w-28">
            <FieldLabel>Unit</FieldLabel>
            <select
              value={strengthUnit}
              onChange={(e) => setStrengthUnit(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            >
              {STRENGTH_UNITS.map((u) => <option key={u}>{u}</option>)}
            </select>
          </div>
          {strengthValue && (
            <p className="pb-2 text-sm text-slate-500">
              → <strong className="text-slate-700">{strengthValue} {strengthUnit}</strong>
            </p>
          )}
        </div>

        {/* Category */}
        <SectionDivider label="Category" />
        <div>
          <p className="text-[10px] text-amber-500 mb-2">Currently null in DB — required going forward</p>
          <PillSelector
            options={CATEGORIES}
            value={category}
            onChange={setCategory}
            colorClass="bg-emerald-50 border-emerald-400 text-emerald-700"
          />
        </div>

        {/* Form */}
        <SectionDivider label="Dosage form" />
        <PillSelector
          options={FORMS}
          value={form}
          onChange={setForm}
          colorClass="bg-amber-50 border-amber-400 text-amber-700"
        />

        {/* Unit management */}
        <SectionDivider label="Unit management" />
        <UnitManagement
          baseUnit={baseUnit} setBaseUnit={setBaseUnit}
          packageUnit={packageUnit} setPackageUnit={setPackageUnit}
          conversionFactor={conversionFactor} setConversionFactor={setConversionFactor}
          quantityPackages={parsedQty}
        />

        {/* Batch details */}
        <SectionDivider label="Batch details" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <FieldLabel required>Batch number</FieldLabel>
            <TextInput value={batchNumber} onChange={setBatchNumber} placeholder="e.g. AMX-2026-04" className="font-mono" />
          </div>
          <div>
            <FieldLabel required>Expiry date</FieldLabel>
            <TextInput type="date" value={expiryDate} onChange={setExpiryDate} />
          </div>
          <div>
            <FieldLabel>Inventory location</FieldLabel>
            <TextInput value={inventoryLocation} onChange={setInventoryLocation} placeholder="e.g. Shelf A-3" />
          </div>
        </div>

        {/* Pricing + Quantity */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <FieldLabel required>
              Quantity ({hasPackage ? `${packageUnit}s` : `${baseUnit}s`})
            </FieldLabel>
            <TextInput type="number" value={quantityPackages} onChange={setQuantityPackages} placeholder="0" />
            {hasPackage && parsedQty > 0 && (
              <p className="mt-1 text-[11px] text-blue-600 font-medium">
                = {totalBaseUnits} {baseUnit}s added to stock
              </p>
            )}
          </div>
          <div>
            <FieldLabel>Unit cost (₱) per {baseUnit}</FieldLabel>
            <TextInput type="number" value={unitCost} onChange={setUnitCost} placeholder="0.00" />
          </div>
          <div>
            <FieldLabel>Selling price (₱) per {baseUnit}</FieldLabel>
            <TextInput type="number" value={sellingPrice} onChange={setSellingPrice} placeholder="0.00" />
          </div>
        </div>

        {errorMessage && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            {errorMessage}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClear} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            Clear
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
            Add to draft list
          </button>
        </div>
      </form>
    </div>
  );
}