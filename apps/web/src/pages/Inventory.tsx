import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InventoryTable } from "../components/InventoryTable";
import { productsApi } from "../api/products";
import { SearchBar } from "../components/SearchBar";
import { SortFilterChips } from "../components/SortFilterChips";
import { type SortFilter } from "../utils/catalogDecorators";
import { BASE_UNITS } from "../components/stockin/types";
import { usePaginatedCatalog } from "../hooks/usePaginatedCatalog";

export function Inventory() {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<SortFilter[]>([]);

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGenericName, setNewGenericName] = useState("");
  const [newDosage, setNewDosage] = useState("");
  const [newBaseUnit, setNewBaseUnit] = useState("Tablet");
  const [errorMessage, setErrorMessage] = useState("");

  const toggleFilter = (filter: SortFilter) => {
    setActiveFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((activeFilter) => activeFilter !== filter)
        : [...prev, filter],
    );
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const {
    displayCatalog,
    setCurrentPage,
    totalPages,
    safeCurrentPage,
    totalCount,
    isLoading,
    isFetching,
    pageSize,
    totalStockCounts,
  } = usePaginatedCatalog(searchQuery, activeFilters);

  const invalidateInventoryViews = () => {
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
  };

  const addProductMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: invalidateInventoryViews,
  });

  const renameProductMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      productsApi.update(id, { name }),
    onSuccess: invalidateInventoryViews,
  });

  const deleteProductMutation = useMutation({
    mutationFn: productsApi.delete,
    onSuccess: invalidateInventoryViews,
  });

  const mutatingProductId = renameProductMutation.isPending
    ? renameProductMutation.variables?.id ?? null
    : deleteProductMutation.isPending
      ? deleteProductMutation.variables ?? null
      : null;

  const normalizedCatalog = useMemo(
    () =>
      new Set(
        displayCatalog.map((item) => {
          const genericWithDosage = `${item.genericName} ${item.dosage ?? ""}`
            .trim()
            .toLowerCase();

          return `${item.productDetails.trim().toLowerCase()}|${genericWithDosage}`;
        }),
      ),
    [displayCatalog],
  );

  const handleAddProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = newName.trim();
    const trimmedGenericName = newGenericName.trim();
    const trimmedDosage = newDosage.trim();

    if (!trimmedName) {
      setErrorMessage("Product name is required.");
      return;
    }

    if (!trimmedGenericName) {
      setErrorMessage("Generic name is required.");
      return;
    }

    const normalizedGeneric = `${trimmedGenericName} ${trimmedDosage}`
      .trim()
      .toLowerCase();

    if (normalizedCatalog.has(`${trimmedName.toLowerCase()}|${normalizedGeneric}`)) {
      setErrorMessage("This product already exists in the catalog.");
      return;
    }

    try {
      await addProductMutation.mutateAsync({
        name: trimmedName,
        genericName: trimmedGenericName,
        dosage: trimmedDosage || null,
        baseUnit: newBaseUnit,
        packageUnit: null,
        conversionFactor: 1,
        isPrescriptionRequired: false,
        requiresColdChain: false,
        reorderLevel: 10,
      });

      setNewName("");
      setNewGenericName("");
      setNewDosage("");
      setNewBaseUnit("Tablet");
      setErrorMessage("");
      setShowAddProduct(false);
    } catch {
      setErrorMessage("Failed to add product. Please try again.");
    }
  };

  if (isLoading && displayCatalog.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading inventory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end items-center gap-2">
        <button className="px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-600 shadow-sm">
          Export CSV
        </button>
        <button
          onClick={() => {
            setShowAddProduct(true);
            setErrorMessage("");
          }}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-semibold shadow-sm flex items-center gap-1.5"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M6 1v10M1 6h10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Add product
        </button>
      </div>

      <SearchBar
        placeholder="Search by medicine name or generic name..."
        onSearch={(query) => setSearchInput(query)}
      />

      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl shadow-sm text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="font-semibold text-slate-700">
            {totalStockCounts.inStock}
          </span>
          <span className="text-slate-400">In stock</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-amber-200 rounded-xl shadow-sm text-xs">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="font-semibold text-amber-700">
            {totalStockCounts.lowStock}
          </span>
          <span className="text-slate-400">Low stock</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-red-200 rounded-xl shadow-sm text-xs">
          <span className="w-2 h-2 rounded-full bg-red-400" />
          <span className="font-semibold text-red-700">
            {totalStockCounts.outOfStock}
          </span>
          <span className="text-slate-400">Out of stock</span>
        </div>
        <div className="h-5 w-px bg-slate-200" />
        <div className="flex-1">
          <SortFilterChips
            activeFilters={activeFilters}
            onToggle={toggleFilter}
          />
        </div>
      </div>

      {isFetching && (
        <p className="text-xs text-slate-400">Updating results...</p>
      )}

      {showAddProduct && (
        <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Add new product
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Quick-add a medicine to the catalog
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowAddProduct(false);
                setNewName("");
                setNewGenericName("");
                setNewDosage("");
                setErrorMessage("");
              }}
              className="text-slate-400 hover:text-slate-600 text-lg leading-none w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
            >
              ×
            </button>
          </div>

          <form
            onSubmit={handleAddProduct}
            className="flex flex-col gap-3 md:flex-row md:items-end"
          >
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Brand / product name <span className="text-red-400">*</span>
              </label>
              <input
                value={newName}
                onChange={(event) => {
                  setNewName(event.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                placeholder="e.g. Biogesic"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>

            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Generic name <span className="text-red-400">*</span>
              </label>
              <input
                value={newGenericName}
                onChange={(event) => {
                  setNewGenericName(event.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                placeholder="e.g. Paracetamol"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>

            <div className="w-full md:w-36">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Dosage
              </label>
              <input
                value={newDosage}
                onChange={(event) => {
                  setNewDosage(event.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                placeholder="e.g. 500mg"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
              {errorMessage && (
                <p className="mt-1 text-xs text-red-500">{errorMessage}</p>
              )}
            </div>

            <div className="w-full md:w-32">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Base unit
              </label>
              <select
                value={newBaseUnit}
                onChange={(event) => setNewBaseUnit(event.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              >
                {BASE_UNITS.map((unit) => (
                  <option key={unit}>{unit}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={addProductMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {addProductMutation.isPending ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddProduct(false);
                  setNewName("");
                  setNewGenericName("");
                  setNewDosage("");
                  setErrorMessage("");
                }}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <InventoryTable
        products={displayCatalog}
        mutatingProductId={mutatingProductId}
        onRenameProduct={async (product, name) => {
          await renameProductMutation.mutateAsync({
            id: product.productId,
            name,
          });
        }}
        onDeleteProduct={async (product) => {
          await deleteProductMutation.mutateAsync(product.productId);
        }}
      />

      <div className="flex items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200 px-5 py-3 text-sm text-slate-500 shadow-sm">
        <span className="text-xs">
          Showing{" "}
          <strong className="text-slate-700">
            {totalCount === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1}–
            {Math.min(safeCurrentPage * pageSize, totalCount)}
          </strong>{" "}
          of <strong className="text-slate-700">{totalCount}</strong>
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={safeCurrentPage === 1}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
          >
            ← Previous
          </button>
          <span className="text-xs text-slate-400">
            Page <strong className="text-slate-600">{safeCurrentPage}</strong>{" "}
            of {totalPages}
          </span>
          <label className="flex items-center gap-1.5 text-xs text-slate-400">
            Jump to
            <input
              type="number"
              min={1}
              max={totalPages}
              value={safeCurrentPage}
              onChange={(event) => {
                const page = Number(event.target.value);
                if (Number.isFinite(page)) {
                  setCurrentPage(
                    Math.min(totalPages, Math.max(1, Math.floor(page))),
                  );
                }
              }}
              className="w-14 px-2 py-1 border border-slate-200 rounded-lg text-center text-xs text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <button
            type="button"
            onClick={() =>
              setCurrentPage((page) => Math.min(totalPages, page + 1))
            }
            disabled={safeCurrentPage === totalPages}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
