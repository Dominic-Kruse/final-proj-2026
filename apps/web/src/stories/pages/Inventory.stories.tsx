import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Inventory } from "../../pages/Inventory";

const mockInventoryData = [
  {
    id: 1,
    name: "Amoxicillin",
    genericName: "Amoxicillin 250mg",
    baseUnit: "Capsule",
    conversionFactor: 1,
    reorderLevel: 20,
    totalStock: 100,
    batches: [
      {
        batchNumber: "AMX-01",
        inventoryLocation: "Shelf A",
        expiryDate: "2028-01-01",
        currentQuantity: 100,
        costPrice: "5.00",
        sellingPrice: "15.00",
        status: "available",
      },
    ],
  },
];

const mockedQueryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: Infinity } },
});

mockedQueryClient.setQueryData(["inventory", 1, 20, ""], {
  metadata: { currentPage: 1, totalPages: 1, totalCount: 1, limit: 20 },
  data: mockInventoryData,
});
mockedQueryClient.setQueryData(["inventory", "all"], mockInventoryData);

const meta = {
  title: "Pages/Inventory",
  component: Inventory,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <QueryClientProvider client={mockedQueryClient}>
        <div className="flex h-screen w-full bg-[#F8F9FA] overflow-hidden font-sans text-slate-900">
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <main className="flex-1 overflow-y-auto p-8">
              <Story />
            </main>
          </div>
        </div>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof Inventory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AddProductValidation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Open the drawer
    const addBtn = canvas.getByRole("button", { name: /add product/i });
    await userEvent.click(addBtn);

    // Try to save empty form
    const saveBtn = canvas.getByRole("button", { name: "Save" });
    await userEvent.click(saveBtn);

    // Verify validation error (using findAllByText for safety)
    const errors = await canvas.findAllByText("Product name is required.");
    await expect(errors[0]).toBeInTheDocument();

    // Close the drawer
    const closeBtn = canvas.getByRole("button", { name: "Cancel" });
    await userEvent.click(closeBtn);
  },
};
