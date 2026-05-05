import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { useState } from "react";
import { DispenseList, type DispenseItem } from "../../components/DispenseList";

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<typeof DispenseList> = {
  title: "Components/DispenseList",
  component: DispenseList,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "The dispense cart/list panel. Allows users to adjust quantities, set dispense reasons, input a staff name, and confirm stock updates.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[400px] h-[800px] bg-slate-100 p-4 border border-slate-200">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DispenseList>;

// ── Mock Data ─────────────────────────────────────────────────────────────────

const mockItems: DispenseItem[] = [
  {
    productId: 1,
    batchId: 101,
    name: "Biogesic 500mg Tablet",
    batchNumber: "BATCH-001",
    quantity: 2,
    maxQuantity: 100,
    reason: "Sale",
    sellingPrice: 5.5,
  },
  {
    productId: 2,
    batchId: 102,
    name: "Amoxicillin 250mg Capsule",
    batchNumber: "AMX-2024",
    quantity: 1,
    maxQuantity: 50,
    reason: "Damaged",
    sellingPrice: 12.0,
  },
];

// ── Stories ───────────────────────────────────────────────────────────────────

export const Empty: Story = {
  args: {
    items: [],
    dispensedBy: "",
    onDispensedByChange: fn(),
    onUpdateQuantity: fn(),
    onUpdateReason: fn(),
    onRemove: fn(),
    onConfirm: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify empty state text
    await expect(canvas.getByText("No items selected.")).toBeInTheDocument();

    // Verify confirm button is disabled
    const confirmBtn = canvas.getByRole("button", {
      name: /confirm & update stock/i,
    });
    await expect(confirmBtn).toBeDisabled();
  },
};

export const Populated: Story = {
  args: {
    items: mockItems,
    dispensedBy: "Sarah Jenkins",
    onDispensedByChange: fn(),
    onUpdateQuantity: fn(),
    onUpdateReason: fn(),
    onRemove: fn(),
    onConfirm: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify items are rendered
    await expect(canvas.getByText("Biogesic 500mg Tablet")).toBeInTheDocument();
    await expect(
      canvas.getByText("Amoxicillin 250mg Capsule"),
    ).toBeInTheDocument();

    // Verify confirm button is enabled
    const confirmBtn = canvas.getByRole("button", {
      name: /confirm & update stock/i,
    });
    await expect(confirmBtn).toBeEnabled();
  },
};

export const InteractiveState: Story = {
  render: () => {
    const [items, setItems] = useState<DispenseItem[]>(mockItems);
    const [dispensedBy, setDispensedBy] = useState("");

    return (
      <DispenseList
        items={items}
        dispensedBy={dispensedBy}
        onDispensedByChange={setDispensedBy}
        onUpdateQuantity={(batchNumber, qty) =>
          setItems((prev) =>
            prev.map((i) =>
              i.batchNumber === batchNumber ? { ...i, quantity: qty } : i,
            ),
          )
        }
        onUpdateReason={(batchNumber, reason) =>
          setItems((prev) =>
            prev.map((i) =>
              i.batchNumber === batchNumber ? { ...i, reason } : i,
            ),
          )
        }
        onRemove={(batchNumber) =>
          setItems((prev) => prev.filter((i) => i.batchNumber !== batchNumber))
        }
        onConfirm={fn()}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Type in the 'Dispensed by' input
    const staffInput = canvas.getByPlaceholderText("Enter staff name...");
    await userEvent.type(staffInput, "John Doe");
    await expect(staffInput).toHaveValue("John Doe");

    // Remove the first item
    const removeButtons = canvas.getAllByRole("button", {
      name: /remove item/i,
    });
    await userEvent.click(removeButtons[0]);

    // Ensure item was removed
    await expect(
      canvas.queryByText("Biogesic 500mg Tablet"),
    ).not.toBeInTheDocument();
    await expect(
      canvas.getByText("Amoxicillin 250mg Capsule"),
    ).toBeInTheDocument();

    // Change reason dropdown for remaining item
    const reasonSelect = canvas.getByRole("combobox");
    await userEvent.selectOptions(reasonSelect, "Expired");
    await expect(reasonSelect).toHaveValue("Expired");
  },
};
