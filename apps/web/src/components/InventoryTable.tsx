// import React from 'react';

type Medicine = {
  id: number;
  name: string;
  stock: number;
  expiry: string;
};

// Slightly adjusted the mock data to look more realistic
const sampleData: Medicine[] = Array.from({ length: 20 }, (_, i) => ({
  id: 1000 + i, 
  name: `Paracetamol 500mg - Pack ${i + 1}`, 
  stock: Math.floor(Math.random() * 100),
  expiry: "2026-12-01",
}));

export function InventoryTable() {
  // Helper function to calculate days left from today
  const calculateDaysLeft = (expiryDateString: string) => {
    const expiryDate = new Date(expiryDateString);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header Section */}
      <div className="p-5 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-800">Inventory Management</h2>
      </div>

      {/* Table Container */}
      <div className="max-h-400px overflow-y-auto">
        <table className="w-full text-sm text-left whitespace-nowrap">
          {/* Sticky Header */}
          <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-3">Product</th>
              <th className="px-6 py-3">Batch ID</th>
              <th className="px-6 py-3">Stock</th>
              <th className="px-6 py-3">Expiry</th>
              <th className="px-6 py-3">Days Left</th>
              <th className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100">
            {sampleData.map((med) => {
              const daysLeft = calculateDaysLeft(med.expiry);
              const isLowStock = med.stock < 50;

              return (
                <tr key={med.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{med.name}</td>
                  <td className="px-6 py-4 text-slate-500">#{med.id}</td>
                  
                  {/* Stock Level Badge */}
                  <td className="px-6 py-4">
                    <span 
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isLowStock 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {med.stock} units
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 text-slate-600">{med.expiry}</td>
                  
                  {/* Days Left highlighting */}
                  <td className={`px-6 py-4 font-medium ${daysLeft < 90 ? 'text-orange-600' : 'text-slate-600'}`}>
                    {daysLeft} days
                  </td>
                  
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors">
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}