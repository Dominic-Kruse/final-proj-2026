import { Fragment, useState } from "react";

export type ProductBatch = {
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  supplier: string;
};

export type ProductCatalogItem = {
  productDetails: string;
  dosage: string;
  category: string;
  totalStock: number;
  shelfLocation: string;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  batches: ProductBatch[];
};

const defaultProducts: ProductCatalogItem[] = [
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

type InventoryTableProps = {
  products?: ProductCatalogItem[];
};

export function InventoryTable({ products = defaultProducts }: InventoryTableProps) {
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  const calculateDaysLeft = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffInMs = expiry.getTime() - today.getTime();
    return Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-800">Inventory Master</h2>
        <p className="text-sm text-slate-500 mt-1">Click a product row to view its batch details.</p>
      </div>

      <div className="max-h-105 overflow-y-auto">
        <table className="w-full text-sm text-left">
          <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-3">Product Details</th>
              <th className="px-6 py-3">Dosage</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3">Total Stock</th>
              <th className="px-6 py-3">Shelf/Location</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((product) => {
              const rowKey = `${product.productDetails}-${product.dosage}`;
              const isExpanded = expandedProduct === rowKey;

              return (
                <Fragment key={rowKey}>
                  <tr
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setExpandedProduct((current) => (current === rowKey ? null : rowKey))}
                  >
                    <td className="px-6 py-4 font-medium text-slate-800">{product.productDetails}</td>
                    <td className="px-6 py-4 text-slate-600">{product.dosage}</td>
                    <td className="px-6 py-4 text-slate-600">{product.category}</td>
                    <td className="px-6 py-4 text-slate-700">{product.totalStock}</td>
                    <td className="px-6 py-4 text-slate-600">{product.shelfLocation}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          product.status === "In Stock"
                            ? "bg-emerald-100 text-emerald-700"
                            : product.status === "Low Stock"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={(event) => event.stopPropagation()}
                          className="px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={(event) => event.stopPropagation()}
                          className="px-2.5 py-1.5 text-xs font-medium bg-blue-600 text-black rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>

                  {isExpanded ? (
                    <tr className="bg-slate-50/80">
                      <td colSpan={7} className="px-6 py-4">
                        {product.batches.length === 0 ? (
                          <p className="text-sm text-slate-500">No batches available for this product.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
                              <thead className="bg-white text-slate-600 border-b border-slate-200">
                                <tr>
                                  <th className="px-3 py-2">Batch Number</th>
                                  <th className="px-3 py-2">Expiry Date</th>
                                  <th className="px-3 py-2">Quantity</th>
                                  <th className="px-3 py-2">Days Left</th>
                                  <th className="px-3 py-2">Supplier</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 bg-white">
                                {product.batches.map((batch) => {
                                  const daysLeft = calculateDaysLeft(batch.expiryDate);
                                  return (
                                    <tr key={batch.batchNumber}>
                                      <td className="px-3 py-2 font-medium text-slate-700">{batch.batchNumber}</td>
                                      <td className="px-3 py-2 text-slate-600">{batch.expiryDate}</td>
                                      <td className="px-3 py-2 text-slate-600">{batch.quantity}</td>
                                      <td className={`px-3 py-2 font-medium ${daysLeft <= 90 ? "text-amber-700" : "text-slate-600"}`}>
                                        {daysLeft}
                                      </td>
                                      <td className="px-3 py-2 text-slate-600">{batch.supplier}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-6 text-slate-500">No products yet. Add your first product to start the catalog.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}