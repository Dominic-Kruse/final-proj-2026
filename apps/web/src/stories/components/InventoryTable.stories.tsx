import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { InventoryTable } from "../../components/InventoryTable";
import type { ProductCatalogItem } from "../../components/InventoryTable";

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<typeof InventoryTable> = {
  title: "Components/InventoryTable",
  component: InventoryTable,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Expandable inventory table used on the Dashboard (view mode) and Dispense page (dispense mode). In dispense mode each batch row exposes an Add button that fires `onAddBatch`. Rows expand to show per-batch detail including expiry badge, pricing, supplier, and location.",
      },
    },
  },
  argTypes: {
    onAddBatch: { action: "batch added" },
    mode: { control: "radio", options: ["view", "dispense"] },
  },
};

export default meta;
type Story = StoryObj<typeof InventoryTable>;

// ── Fixtures ──────────────────────────────────────────────────────────────────

const healthyBatch = {
  batchNumber: "BATCH-001",
  expiryDate: "2027-06-30",
  quantity: 150,
  supplier: "PharmaCo",
  location: "Shelf A3",
  costPrice: 4.5,
  sellingPrice: 9.0,
};

const nearExpiryBatch = {
  batchNumber: "BATCH-002",
  expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10), // 60 days from now
  quantity: 30,
  supplier: "MedSupply",
  location: "Shelf B1",
  costPrice: 3.0,
  sellingPrice: 7.0,
};

const expiredBatch = {
  batchNumber: "BATCH-003",
  expiryDate: "2024-01-01",
  quantity: 10,
  supplier: "OldMeds",
  location: "Shelf C2",
  costPrice: 2.0,
  sellingPrice: 5.0,
};

const makeProduct = (
  overrides: Partial<ProductCatalogItem>,
): ProductCatalogItem => ({
  productId: 1,
  productDetails: "Amoxicillin 500mg",
  genericName: "Amoxicillin",
  dosage: "500mg",
  form: "Capsule",
  baseUnit: "Capsule",
  packageUnit: "Box",
  conversionFactor: 100,
  category: "Antibiotic",
  totalStock: 150,
  shelfLocation: "Shelf A3",
  status: "In Stock",
  batches: [healthyBatch],
  ...overrides,
});

// ── Stories ───────────────────────────────────────────────────────────────────

export const Empty: Story = {
  args: {
    products: [],
    title: "Inventory",
    emptyTitle: "No products found",
    emptySubtitle: "No medicines match the current search or filters.",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("No products found")).toBeInTheDocument();
    await expect(
      canvas.getByText(/no medicines match the current search/i),
    ).toBeInTheDocument();
  },
};

export const SingleProductInStock: Story = {
  args: {
    products: [makeProduct({})],
    title: "Inventory",
    mode: "view",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("Amoxicillin 500mg")).toBeInTheDocument();
    await expect(canvas.getByText("Antibiotic")).toBeInTheDocument();

    // "In Stock" status badge
    await expect(canvas.getByText("In Stock")).toBeInTheDocument();
  },
};

export const LowStockProduct: Story = {
  args: {
    products: [
      makeProduct({
        productId: 2,
        productDetails: "Metformin 850mg",
        genericName: "Metformin",
        dosage: "850mg",
        totalStock: 8,
        status: "Low Stock",
        batches: [{ ...nearExpiryBatch, quantity: 8 }],
      }),
    ],
    title: "Stock Alerts",
    mode: "view",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("Metformin 850mg")).toBeInTheDocument();
    await expect(canvas.getByText("Low Stock")).toBeInTheDocument();
  },
};

export const ExpiredBatchVisible: Story = {
  args: {
    products: [
      makeProduct({
        productId: 3,
        productDetails: "Ibuprofen 200mg",
        genericName: "Ibuprofen",
        dosage: "200mg",
        totalStock: 10,
        status: "Low Stock",
        batches: [expiredBatch],
      }),
    ],
    title: "Expiry Alerts",
    mode: "view",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const row = canvas.getByText("Ibuprofen 200mg");
    await expect(row).toBeInTheDocument();

    // Expand the row to see per-batch details including expiry badge
    await userEvent.click(row.closest("tr")!);

    // "Expired" badge should appear after expanding
    const expiredBadge = await canvas.findByText("Expired");
    await expect(expiredBadge).toBeInTheDocument();
  },
};

export const DispenseModeShowsAddButton: Story = {
  args: {
    products: [makeProduct({})],
    mode: "dispense",
    onAddBatch: fn(),
    title: "Available Stock",
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Expand the product row first to reveal batch rows with Add buttons
    const productRow = canvas.getByText("Amoxicillin 500mg").closest("tr")!;
    await userEvent.click(productRow);

    // Add button appears in the expanded batch row
    const addButton = await canvas.findByRole("button", { name: /add/i });
    await expect(addButton).toBeInTheDocument();

    // Clicking it fires onAddBatch with the correct product and batch
    await userEvent.click(addButton);
    await expect(args.onAddBatch).toHaveBeenCalledTimes(1);
    await expect(args.onAddBatch).toHaveBeenCalledWith(
      expect.objectContaining({ productDetails: "Amoxicillin 500mg" }),
      expect.objectContaining({ batchNumber: "BATCH-001" }),
    );
  },
};

export const MultipleProducts: Story = {
  args: {
    products: [
      makeProduct({ productId: 1 }),
      makeProduct({
        productId: 2,
        productDetails: "Paracetamol 500mg",
        genericName: "Paracetamol",
        dosage: "500mg",
        category: "Analgesic",
        status: "In Stock",
        totalStock: 300,
        batches: [
          { ...healthyBatch, batchNumber: "BATCH-P001", quantity: 300 },
        ],
      }),
      makeProduct({
        productId: 3,
        productDetails: "Cetirizine 10mg",
        genericName: "Cetirizine",
        dosage: "10mg",
        category: "Antihistamine",
        status: "Low Stock",
        totalStock: 5,
        batches: [
          { ...nearExpiryBatch, batchNumber: "BATCH-C001", quantity: 5 },
        ],
      }),
    ],
    title: "Full Inventory",
    mode: "view",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("Amoxicillin 500mg")).toBeInTheDocument();
    await expect(canvas.getByText("Paracetamol 500mg")).toBeInTheDocument();
    await expect(canvas.getByText("Cetirizine 10mg")).toBeInTheDocument();
  },
};
