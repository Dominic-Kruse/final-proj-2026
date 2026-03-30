import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { InventoryTable } from "../components/InventoryTable";
import type { ProductCatalogItem } from "../components/InventoryTable";

const initialCatalog: ProductCatalogItem[] = [
  {
    productDetails: "Paracetamol",
    dosage: "500 mg",
    category: "Analgesic",
    totalStock: 120,
    shelfLocation: "A1-01",
    status: "In Stock",
    batches: [
      { batchNumber: "PCM-2401", expiryDate: "2027-06-30", quantity: 70, supplier: "MediCore Pharma" },
      { batchNumber: "PCM-2409", expiryDate: "2027-11-15", quantity: 50, supplier: "HealthBridge Supplies" },
    ],
  },
  {
    productDetails: "Ibuprofen",
    dosage: "200 mg",
    category: "Analgesic",
    totalStock: 34,
    shelfLocation: "A1-02",
    status: "Low Stock",
    batches: [
      { batchNumber: "IBU-2388", expiryDate: "2026-08-05", quantity: 34, supplier: "RxUnified" },
    ],
  },
  {
    productDetails: "Amoxicillin",
    dosage: "500 mg",
    category: "Antibiotic",
    totalStock: 58,
    shelfLocation: "B2-04",
    status: "In Stock",
    batches: [
      { batchNumber: "AMX-1021", expiryDate: "2026-12-20", quantity: 30, supplier: "PrimeMeds" },
      { batchNumber: "AMX-1075", expiryDate: "2027-02-18", quantity: 28, supplier: "PrimeMeds" },
    ],
  },
  {
    productDetails: "Cetirizine",
    dosage: "10 mg",
    category: "Antihistamine",
    totalStock: 0,
    shelfLocation: "C1-03",
    status: "Out of Stock",
    batches: [],
  },
  {
    productDetails: "Loperamide",
    dosage: "2 mg",
    category: "Antidiarrheal",
    totalStock: 21,
    shelfLocation: "C2-01",
    status: "Low Stock",
    batches: [
      { batchNumber: "LOP-5530", expiryDate: "2026-10-02", quantity: 21, supplier: "MedAxis Trading" },
    ],
  },
];

export function Inventory() {
  const [catalog, setCatalog] = useState<ProductCatalogItem[]>(initialCatalog);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newGenericName, setNewGenericName] = useState("");
  const [newDosage, setNewDosage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const normalizedCatalog = useMemo(
    () =>
      new Set(
        catalog.map(
          (item) => `${item.productDetails.trim().toLowerCase()}|${item.dosage.trim().toLowerCase()}`,
        ),
      ),
    [catalog],
  );

  const handleAddProduct = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = newGenericName.trim();
    const trimmedDosage = newDosage.trim();
    if (!trimmedName) {
      setErrorMessage("Generic name is required.");
      return;
    }

    if (!trimmedDosage) {
      setErrorMessage("Dosage is required.");
      return;
    }

    if (normalizedCatalog.has(`${trimmedName.toLowerCase()}|${trimmedDosage.toLowerCase()}`)) {
      setErrorMessage("This product and dosage already exist in the catalog.");
      return;
    }

    const newProduct: ProductCatalogItem = {
      productDetails: trimmedName,
      dosage: trimmedDosage,
      category: "Uncategorized",
      totalStock: 0,
      shelfLocation: "Unassigned",
      status: "Out of Stock",
      batches: [],
    };

    setCatalog((current) =>
      [...current, newProduct].sort((a, b) => a.productDetails.localeCompare(b.productDetails)),
    );
    setNewGenericName("");
    setNewDosage("");
    setErrorMessage("");
    setShowAddProduct(false);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Inventory</h1>
        
        {/* Action Buttons Container */}
        <div className="flex items-center gap-3">
          {/* Secondary Button */}
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm shadow-sm">
            Export CSV
          </button>
          <button className="px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm flex items-center gap-2">
            Edit Stocks
          </button>
          <button
            onClick={() => {
              setShowAddProduct(true);
              setErrorMessage("");
            }}
            className="px-4 py-2 bg-blue-600 text-black rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm flex items-center gap-2"
          >
            <span>+</span> Add Product
          </button>
        </div>
      </div>
      
      {showAddProduct ? (
        <div className="mb-6 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <form onSubmit={handleAddProduct} className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1">
              <label htmlFor="generic-name" className="block text-sm font-medium text-slate-700 mb-1">
                Generic Name
              </label>
              <input
                id="generic-name"
                value={newGenericName}
                onChange={(event) => {
                  setNewGenericName(event.target.value);
                  if (errorMessage) {
                    setErrorMessage("");
                  }
                }}
                placeholder="e.g. Azithromycin"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              {errorMessage ? <p className="mt-1 text-sm text-red-600">{errorMessage}</p> : null}
            </div>

            <div className="w-full md:w-56">
              <label htmlFor="dosage" className="block text-sm font-medium text-slate-700 mb-1">
                Dosage
              </label>
              <input
                id="dosage"
                value={newDosage}
                onChange={(event) => {
                  setNewDosage(event.target.value);
                  if (errorMessage) {
                    setErrorMessage("");
                  }
                }}
                placeholder="e.g. 500 mg"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-black rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                Save Product
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddProduct(false);
                  setNewGenericName("");
                  setNewDosage("");
                  setErrorMessage("");
                }}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <InventoryTable products={catalog} />
    </>
  );
}