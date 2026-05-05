import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "../api/products";
import { inventoryApi } from "../api/inventory";
import { InwardHeader } from "../components/stockin/InwardHeader";
import { BatchEntryForm } from "../components/stockin/BatchEntryForm";
import { DraftList } from "../components/stockin/DraftList";
import { SummaryPanel } from "../components/stockin/SummaryPanel";
import { AddProductDrawer } from "../components/stockin/AddProductDrawer";
import { DEFAULT_DATE } from "../components/stockin/types";
import type { StockInBatchDraft, PendingBatch } from "../components/stockin/types";

function splitGenericAndDosage(value: string): { genericName: string; dosage: string } {
  const raw = value.trim();
  const firstDigitIndex = raw.search(/\d/);

  if (firstDigitIndex <= 0) {
    return { genericName: raw.toLowerCase(), dosage: "" };
  }

  return {
    genericName: raw.slice(0, firstDigitIndex).trim().toLowerCase(),
    dosage: raw.slice(firstDigitIndex).trim().toLowerCase(),
  };
}

function buildEnteredDosage(strengthValue: string, strengthUnit: string): string {
  const value = strengthValue.trim();
  if (!value) return "";
  return `${value}${strengthUnit}`.toLowerCase();
}

export function StockIn() {
  const queryClient = useQueryClient();

  const { data: productCatalog = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => productsApi.getAll(),
  });

  const stockInwardMutation = useMutation({
    mutationFn: inventoryApi.stockInward,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  // ── Inward header ──────────────────────────────────────────────────────────
  const [supplier, setSupplier] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [dateReceived, setDateReceived] = useState(DEFAULT_DATE);

  // ── Batch entry ────────────────────────────────────────────────────────────
  const [productName, setProductName] = useState("");
  const [genericName, setGenericName] = useState("");
  const [strengthValue, setStrengthValue] = useState("");
  const [strengthUnit, setStrengthUnit] = useState("mg");
  const [category, setCategory] = useState("");
  const [form, setForm] = useState("Tablet");
  const [baseUnit, setBaseUnit] = useState("Tablet");
  const [packageUnit, setPackageUnit] = useState("Box");
  const [conversionFactor, setConversionFactor] = useState(100);
  const [batchNumber, setBatchNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [inventoryLocation, setInventoryLocation] = useState("");
  const [quantityPackages, setQuantityPackages] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");

  // ── UI state ───────────────────────────────────────────────────────────────
  const [draftBatches, setDraftBatches] = useState<StockInBatchDraft[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [pendingBatch, setPendingBatch] = useState<PendingBatch | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);

  // ── Derived ────────────────────────────────────────────────────────────────
  const parsedQty = Number(quantityPackages);
  const hasPackage = !!packageUnit;
  const totalBaseUnits = hasPackage ? parsedQty * conversionFactor : parsedQty;

  const summary = useMemo(() => ({
    totalUnits: draftBatches.reduce((s, b) => s + b.totalBaseUnits, 0),
    totalCost: draftBatches.reduce((s, b) => s + b.totalBaseUnits * b.unitCost, 0),
    totalRetail: draftBatches.reduce((s, b) => s + b.totalBaseUnits * b.sellingPrice, 0),
  }), [draftBatches]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const resetBatch = () => {
    setProductName(""); setGenericName(""); setStrengthValue("");
    setStrengthUnit("mg"); setCategory(""); setForm("Tablet");
    setBaseUnit("Tablet"); setPackageUnit("Box"); setConversionFactor(100);
    setBatchNumber(""); setExpiryDate(""); setInventoryLocation("");
    setQuantityPackages(""); setUnitCost(""); setSellingPrice("");
  };

  const buildPendingBatch = (): PendingBatch => ({
    productName: productName.trim(),
    genericName: genericName.trim(),
    strengthValue, strengthUnit, category, form,
    baseUnit, packageUnit, conversionFactor,
    batchNumber: batchNumber.trim(), expiryDate,
    inventoryLocation: inventoryLocation.trim(),
    quantityPackages: parsedQty || 0,
    totalBaseUnits: totalBaseUnits || 0,
    unitCost: Number(unitCost) || 0,
    sellingPrice: Number(sellingPrice) || 0,
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAddBatch = (e: FormEvent) => {
    e.preventDefault();
    setSaveMessage("");

    if (!supplier.trim() || !referenceNumber.trim() || !dateReceived) {
      setErrorMessage("Complete the inward header (supplier, reference, date) first.");
      return;
    }
    if (!productName.trim() || !genericName.trim() || !batchNumber.trim() || !expiryDate || !quantityPackages || !unitCost || !sellingPrice) {
      setErrorMessage("Please complete all required batch fields.");
      return;
    }
    if (!category) {
      setErrorMessage("Please select a category.");
      return;
    }
    if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
      setErrorMessage("Quantity must be a positive number.");
      return;
    }
    const parsedCost = Number(unitCost);
    const parsedSell = Number(sellingPrice);
    if (!Number.isFinite(parsedCost) || parsedCost <= 0 || !Number.isFinite(parsedSell) || parsedSell <= 0) {
      setErrorMessage("Cost and selling price must be positive numbers.");
      return;
    }
    if (draftBatches.some((b) => b.batchNumber.toLowerCase() === batchNumber.trim().toLowerCase())) {
      setErrorMessage("Batch number already exists in the draft.");
      return;
    }

    const enteredName = productName.trim().toLowerCase();
    const enteredGeneric = genericName.trim().toLowerCase();
    const enteredDosage = buildEnteredDosage(strengthValue, strengthUnit);

    const matchedProduct = productCatalog.find((p) => {
      if (p.name.toLowerCase() !== enteredName) return false;

      const parsed = splitGenericAndDosage(p.genericName);
      if (parsed.genericName !== enteredGeneric) return false;

      return enteredDosage ? parsed.dosage === enteredDosage : true;
    });

    if (!matchedProduct) {
      setPendingBatch(buildPendingBatch());
      setShowDrawer(true);
      setErrorMessage("");
      return;
    }

    setDraftBatches((prev) => [
      ...prev,
      { ...buildPendingBatch(), productId: matchedProduct.id, unitCost: parsedCost, sellingPrice: parsedSell },
    ]);
    setErrorMessage("");
    resetBatch();
  };

  const handleDrawerSaved = (productId: number) => {
    if (!pendingBatch) return;
    setDraftBatches((prev) => [...prev, { ...pendingBatch, productId }]);
    setPendingBatch(null);
    setShowDrawer(false);
    resetBatch();
  };

  const handleSaveInward = async () => {
    if (!supplier.trim() || !referenceNumber.trim() || !dateReceived) {
      setErrorMessage("Complete the inward header first.");
      return;
    }
    if (draftBatches.length === 0) {
      setErrorMessage("Add at least one batch to the draft.");
      return;
    }
    setErrorMessage("");
    try {
      await stockInwardMutation.mutateAsync({
        supplierName: supplier.trim(),
        referenceNumber: referenceNumber.trim(),
        dateReceived,
        batches: draftBatches.map((b) => ({
          productId: b.productId,
          batchNumber: b.batchNumber,
          expiryDate: b.expiryDate,
          quantity: b.totalBaseUnits,
          unitCost: b.unitCost,
          sellingPrice: b.sellingPrice,
          inventoryLocation: b.inventoryLocation || undefined,
        })),
      });
      setSaveMessage(`Saved ${draftBatches.length} batch(es) from ${supplier.trim()} (ref: ${referenceNumber.trim()}).`);
      setDraftBatches([]);
      resetBatch();
    } catch {
      setErrorMessage("Failed to save stock inward. Please try again.");
    }
  };

  return (
    <div className="w-full space-y-5">
      {showDrawer && pendingBatch && (
        <AddProductDrawer
          pending={pendingBatch}
          onClose={() => { setShowDrawer(false); setPendingBatch(null); }}
          onSaved={handleDrawerSaved}
        />
      )}


      <InwardHeader
        supplier={supplier} setSupplier={setSupplier}
        referenceNumber={referenceNumber} setReferenceNumber={setReferenceNumber}
        dateReceived={dateReceived} setDateReceived={setDateReceived}
        onClearError={() => setErrorMessage("")}
      />

      <BatchEntryForm
        productName={productName} setProductName={setProductName}
        genericName={genericName} setGenericName={setGenericName}
        strengthValue={strengthValue} setStrengthValue={setStrengthValue}
        strengthUnit={strengthUnit} setStrengthUnit={setStrengthUnit}
        category={category} setCategory={setCategory}
        form={form} setForm={setForm}
        baseUnit={baseUnit} setBaseUnit={setBaseUnit}
        packageUnit={packageUnit} setPackageUnit={setPackageUnit}
        conversionFactor={conversionFactor} setConversionFactor={setConversionFactor}
        batchNumber={batchNumber} setBatchNumber={setBatchNumber}
        expiryDate={expiryDate} setExpiryDate={setExpiryDate}
        inventoryLocation={inventoryLocation} setInventoryLocation={setInventoryLocation}
        quantityPackages={quantityPackages} setQuantityPackages={setQuantityPackages}
        unitCost={unitCost} setUnitCost={setUnitCost}
        sellingPrice={sellingPrice} setSellingPrice={setSellingPrice}
        totalBaseUnits={totalBaseUnits}
        productCatalog={productCatalog}
        onSubmit={handleAddBatch}
        onClear={resetBatch}
        onAddNew={() => { setPendingBatch(buildPendingBatch()); setShowDrawer(true); }}
        errorMessage={errorMessage}
      />

      <DraftList
        batches={draftBatches}
        onRemove={(bn) => setDraftBatches((prev) => prev.filter((b) => b.batchNumber !== bn))}
      />

      <SummaryPanel
        totalUnits={summary.totalUnits}
        totalCost={summary.totalCost}
        totalRetail={summary.totalRetail}
        errorMessage={errorMessage}
        saveMessage={saveMessage}
        isPending={stockInwardMutation.isPending}
        onClearDraft={() => { setDraftBatches([]); setErrorMessage(""); setSaveMessage(""); }}
        onSave={handleSaveInward}
      />
    </div>
  );
}