import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Dispense } from "../../pages/Dispense";

const mockInventoryData = [
  {
    id: 1,
    name: "Advil", // Renamed to avoid matching generic name
    genericName: "Ibuprofen 400mg",
    baseUnit: "Tablet",
    conversionFactor: 1,
    reorderLevel: 20,
    totalStock: 50,
    batches: [
      {
        batchNumber: "IBU-99",
        inventoryLocation: "Shelf A",
        expiryDate: "2028-01-01",
        currentQuantity: 50,
        costPrice: "5.00",
        sellingPrice: "10.00",
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
  title: "Pages/Dispense",
  component: Dispense,
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
} satisfies Meta<typeof Dispense>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify main components rendered
    const listTitles = await canvas.findAllByText("Dispense List");
    await expect(listTitles[0]).toBeInTheDocument();

    const productNames = await canvas.findAllByText("Advil");
    await expect(productNames[0]).toBeInTheDocument();

    // Toggle a filter chip
    const sortChip = canvas.getByRole("button", { name: "A → Z" });
    await userEvent.click(sortChip);

    // It triggers client-side sort, "Clear" should appear
    const clearBtns = await canvas.findAllByRole("button", { name: "Clear" });
    await expect(clearBtns[0]).toBeInTheDocument();
  },
};
