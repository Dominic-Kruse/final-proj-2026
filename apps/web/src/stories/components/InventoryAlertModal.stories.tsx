import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InventoryAlertModal } from "../../components/InventoryAlertModal";
import type { MedicineWithStock } from "../../utils/types";

// ── Mock Data Setup ───────────────────────────────────────────────────────────

const mockInventoryData: MedicineWithStock[] = [
  {
    id: 1,
    name: "Biogesic",
    genericName: "Paracetamol",
    baseUnit: "Tablet",
    conversionFactor: 1,
    isPrescriptionRequired: false,
    requiresColdChain: false,
    reorderLevel: 50,
    updatedAt: new Date().toISOString(),
    totalStock: 5, // Triggers "Low Stock"
    batches: [
      {
        id: 101,
        productId: 1,
        batchNumber: "B-001",
        inventoryLocation: "Shelf A",
        expiryDate: "2028-01-01",
        receivedDate: "2024-01-01",
        initialQuantity: 100,
        currentQuantity: 5,
        costPrice: "2.00",
        sellingPrice: "5.00",
        status: "available",
      },
    ],
  },
  {
    id: 2,
    name: "Amoxil",
    genericName: "Amoxicillin",
    baseUnit: "Capsule",
    conversionFactor: 1,
    isPrescriptionRequired: true,
    requiresColdChain: false,
    reorderLevel: 20,
    updatedAt: new Date().toISOString(),
    totalStock: 100,
    batches: [
      {
        id: 102,
        productId: 2,
        batchNumber: "EXP-999",
        inventoryLocation: "Shelf B",
        expiryDate: "2020-01-01", // Triggers "Expired"
        receivedDate: "2019-01-01",
        initialQuantity: 100,
        currentQuantity: 100,
        costPrice: "5.00",
        sellingPrice: "15.00",
        status: "available",
      },
    ],
  },
  {
    id: 3,
    name: "Advil", // Changed from Ibuprofen to avoid duplicate text match with genericName
    genericName: "Ibuprofen",
    baseUnit: "Tablet",
    conversionFactor: 1,
    isPrescriptionRequired: false,
    requiresColdChain: false,
    reorderLevel: 20,
    updatedAt: new Date().toISOString(),
    totalStock: 0, // Triggers "Out of Stock"
    batches: [],
  },
  {
    id: 4,
    name: "Neozep",
    genericName: "Phenylephrine",
    baseUnit: "Tablet",
    conversionFactor: 1,
    isPrescriptionRequired: false,
    requiresColdChain: false,
    reorderLevel: 20,
    updatedAt: new Date().toISOString(),
    totalStock: 100,
    batches: [
      {
        id: 104,
        productId: 4,
        batchNumber: "NEAR-001",
        inventoryLocation: "Shelf C",
        // Date that triggers "Near Expiry" (within 90 days from "today")
        expiryDate: new Date(Date.now() + 30 * 86400000)
          .toISOString()
          .split("T")[0],
        receivedDate: "2024-01-01",
        initialQuantity: 100,
        currentQuantity: 100,
        costPrice: "4.00",
        sellingPrice: "8.00",
        status: "available",
      },
    ],
  },
];

const mockedQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  },
});

// Seed cache
mockedQueryClient.setQueryData(["inventory", "all"], mockInventoryData);

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<typeof InventoryAlertModal> = {
  title: "Components/InventoryAlertModal",
  component: InventoryAlertModal,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A modal that fetches and displays Low Stock, Expired, Out of Stock, or Near Expiry batches. Uses React Router for navigation and React Query for fetching data.",
      },
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={mockedQueryClient}>
        <div className="w-screen h-screen bg-slate-200 relative">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  args: {
    type: "low-stock",
    onClose: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof InventoryAlertModal>;

// ── Stories ───────────────────────────────────────────────────────────────────

export const LowStockAlert: Story = {
  args: {
    type: "low-stock",
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Wait for Query to resolve and render the component
    const title = await canvas.findByText("Low Stock Items");
    await expect(title).toBeInTheDocument();

    // Verify low stock item is displayed
    await expect(canvas.getByText("Biogesic")).toBeInTheDocument();
    await expect(canvas.queryByText("Amoxil")).not.toBeInTheDocument();

    // Test close interaction
    const closeBtn = canvas.getByRole("button", { name: "✕" });
    await userEvent.click(closeBtn);
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};

export const ExpiredAlert: Story = {
  args: {
    type: "expired",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const title = await canvas.findByText("Expired Batches");
    await expect(title).toBeInTheDocument();

    await expect(canvas.getByText("Amoxil")).toBeInTheDocument();
    await expect(canvas.queryByText("Biogesic")).not.toBeInTheDocument();
  },
};

export const OutOfStockAlert: Story = {
  args: {
    type: "out-of-stock",
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    const title = await canvas.findByText("Out of Stock Items");
    await expect(title).toBeInTheDocument();

    // Look for Advil instead of Ibuprofen to avoid duplicate matches
    await expect(canvas.getByText("Advil")).toBeInTheDocument();
    await expect(canvas.queryByText("Biogesic")).not.toBeInTheDocument();
    await expect(canvas.queryByText("Amoxil")).not.toBeInTheDocument();

    const closeBtn = canvas.getByRole("button", { name: "✕" });
    await userEvent.click(closeBtn);
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};

export const NearExpiryAlert: Story = {
  args: {
    type: "near-expiry",
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    const title = await canvas.findByText("Near Expiry Batches");
    await expect(title).toBeInTheDocument();

    // Verify near expiry item is displayed
    await expect(canvas.getByText("Neozep")).toBeInTheDocument();
    await expect(canvas.queryByText("Biogesic")).not.toBeInTheDocument();

    const closeBtn = canvas.getByRole("button", { name: "✕" });
    await userEvent.click(closeBtn);
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};
