import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "../../api/products";
import type { PendingBatch } from "./types";

type AddProductDrawerProps = {
    pending: PendingBatch;
    onClose: () => void;
    onSaved: (productId: number) => void;
};

export function AddProductDrawer({ pending, onClose, onSaved }: AddProductDrawerProps) {
    const queryClient = useQueryClient();
    const [name, setName] = useState(pending.productName);
    const [genericName, setGenericName] = useState(pending.genericName);
    const [dosage, setDosage] = useState(
        pending.strengthValue ? `${pending.strengthValue} ${pending.strengthUnit}` : ""
    );
    const [message, setMessage] = useState("");

    const mutation = useMutation({
        mutationFn: productsApi.create,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
    });

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const newProduct = await mutation.mutateAsync({
                name: name.trim(),
                genericName: genericName.trim(),
                dosage: dosage.trim() || null,
                baseUnit: pending.baseUnit,
                // ✅ packageUnit and conversionFactor now sent to backend
                packageUnit: pending.packageUnit || null,
                conversionFactor: pending.conversionFactor,
                isPrescriptionRequired: false,
                requiresColdChain: false,
                reorderLevel: 10,
                category: pending.category || null,
                form: pending.form || null,
            });
            setMessage(`"${newProduct.name}" added successfully.`);
            setTimeout(() => onSaved(newProduct.id), 900);
        } catch {
            setMessage("Failed to add product. Please try again.");
        }
    };

    return (
        <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-slate-200 bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                <div>
                    <h3 className="text-base font-semibold text-slate-800">Add new product</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Create the medicine record before the batch is drafted.</p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full w-8 h-8 flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-slate-50 text-lg leading-none"
                >
                    ×
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
                {/* Pending batch preview */}
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600 space-y-0.5">
                    <p className="font-semibold text-slate-700 mb-1">Pending batch</p>
                    <p className="font-mono">{pending.batchNumber || "—"}</p>
                    <p>{pending.quantityPackages} {pending.packageUnit || pending.baseUnit}(s) · expires {pending.expiryDate || "—"}</p>
                    {pending.packageUnit && (
                        <p className="text-slate-400">
                            Unit: {pending.conversionFactor} {pending.baseUnit}s / {pending.packageUnit}
                            {" → "}{pending.totalBaseUnits} {pending.baseUnit}s total
                        </p>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {[
                        { label: "Brand / product name", value: name, setter: setName, placeholder: "e.g. Biogesic" },
                        { label: "Generic name", value: genericName, setter: setGenericName, placeholder: "e.g. Paracetamol" },
                        { label: "Dosage", value: dosage, setter: setDosage, placeholder: "e.g. 500mg" },
                    ].map(({ label, value, setter, placeholder }) => (
                        <div key={label}>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">
                                {label} <span className="text-red-500">*</span>
                            </label>
                            <input
                                value={value}
                                onChange={e => setter(e.target.value)}
                                placeholder={placeholder}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                            />
                        </div>
                    ))}

                    {/* Read-only unit summary so pharmacist can verify before saving */}
                    <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-blue-700 space-y-0.5">
                        <p className="font-semibold">Unit configuration (from batch entry)</p>
                        <p>Base unit: <strong>{pending.baseUnit}</strong></p>
                        {pending.packageUnit
                            ? <p>Package: <strong>{pending.conversionFactor} {pending.baseUnit}s / {pending.packageUnit}</strong></p>
                            : <p className="text-blue-400">No package unit set</p>
                        }
                        {pending.form && <p>Form: <strong>{pending.form}</strong></p>}
                        {pending.category && <p>Category: <strong>{pending.category}</strong></p>}
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {mutation.isPending ? "Adding..." : "Add product"}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>

                    {message && (
                        <p className={`text-sm ${message.startsWith("Failed") ? "text-red-600" : "text-emerald-700"}`}>
                            {message}
                        </p>
                    )}
                </form>
            </div>
        </aside>
    );
}