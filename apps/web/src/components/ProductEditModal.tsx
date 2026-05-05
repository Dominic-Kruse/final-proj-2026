import type { FormEvent } from "react";
import type { ProductCatalogItem } from "./InventoryTable";

type ProductEditModalProps = {
  product: ProductCatalogItem;
  draftName: string;
  deleteConfirm: boolean;
  errorMessage: string;
  isMutating: boolean;
  onDraftNameChange: (name: string) => void;
  onDeleteConfirmChange: (value: boolean) => void;
  onErrorChange: (message: string) => void;
  onClose: () => void;
  onRename: (product: ProductCatalogItem, name: string) => Promise<void> | void;
  onDelete: (product: ProductCatalogItem) => Promise<void> | void;
};

export function ProductEditModal({
  product,
  draftName,
  deleteConfirm,
  errorMessage,
  isMutating,
  onDraftNameChange,
  onDeleteConfirmChange,
  onErrorChange,
  onClose,
  onRename,
  onDelete,
}: ProductEditModalProps) {
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextName = draftName.trim();
    if (!nextName) {
      onErrorChange("Product name is required.");
      return;
    }

    try {
      onErrorChange("");
      await onRename(product, nextName);
      onClose();
    } catch {
      onErrorChange("Failed to rename product. Please try again.");
    }
  };

  const handleDelete = async () => {
    try {
      onErrorChange("");
      await onDelete(product);
      onClose();
    } catch {
      onErrorChange("Failed to delete product. Please try again.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
      onClick={() => {
        if (!isMutating) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-xl p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-900">Edit product</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Rename the product or delete it with all of its batches.
            </p>
          </div>
          <button
            type="button"
            disabled={isMutating}
            onClick={onClose}
            className="w-8 h-8 p-0 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
            aria-label="Close edit product"
          >
            x
          </button>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="block text-xs font-semibold text-slate-600 mb-1">
              Product name
            </span>
            <input
              value={draftName}
              onChange={(event) => {
                onDraftNameChange(event.target.value);
                if (errorMessage) onErrorChange("");
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              autoFocus
            />
          </label>

          {errorMessage && <p className="text-xs text-red-500">{errorMessage}</p>}

          <div className="flex flex-wrap justify-between gap-2">
            <button
              type="submit"
              disabled={isMutating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {isMutating ? "Saving..." : "Save name"}
            </button>

            {!deleteConfirm ? (
              <button
                type="button"
                disabled={isMutating}
                onClick={() => onDeleteConfirmChange(true)}
                className="px-4 py-2 border border-red-200 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-50 disabled:opacity-50"
              >
                Delete product
              </button>
            ) : (
              <button
                type="button"
                disabled={isMutating}
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {isMutating
                  ? "Deleting..."
                  : `Delete ${product.batches.length} batch(es) too`}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}