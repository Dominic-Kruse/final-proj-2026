type Medicine = {
  id: number;
  name: string;
  stock: number;
  expiry: string;
};

const sampleData: Medicine[] = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  name: `Paracetamol ${i}`,
  stock: Math.floor(Math.random() * 100),
  expiry: "2026-12-01",
}));

export function InventoryTable() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <h2 className="text-lg font-semibold mb-4">Inventory</h2>

      <div className="max-h-64 overflow-y-auto">
        <table className="w-full text-sm text-left">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b">
              <th className="p-2">Medicine</th>
              <th className="p-2">Stock</th>
              <th className="p-2">Expiry</th>
            </tr>
          </thead>

          <tbody>
            {sampleData.map((med) => (
              <tr key={med.id} className="border-b">
                <td className="p-2">{med.name}</td>
                <td className="p-2">{med.stock}</td>
                <td className="p-2">{med.expiry}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}