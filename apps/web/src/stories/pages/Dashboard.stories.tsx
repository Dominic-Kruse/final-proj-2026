import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Dashboard } from "../../pages/Dashboard";

const mockInventory = [
  {
    id: 1,
    name: "Biogesic",
    genericName: "Paracetamol",
    totalStock: 5,
    reorderLevel: 20, // Triggers Low Stock
    batches: [
      { status: "available", expiryDate: "2028-01-01", currentQuantity: 5 },
    ],
  },
];

const mockedQueryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: Infinity } },
});

mockedQueryClient.setQueryData(["inventory"], mockInventory);
mockedQueryClient.setQueryData(["dashboard", "sales-by-category"], []);
mockedQueryClient.setQueryData(["dashboard", "sales-by-expiry-status"], []);
mockedQueryClient.setQueryData(["dashboard", "stock-by-category"], []);
mockedQueryClient.setQueryData(["dashboard", "stock-by-expiry-heatmap"], []);

const meta = {
  title: "Pages/Dashboard",
  component: Dashboard,
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
} satisfies Meta<typeof Dashboard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Use findAllByText and target [0] to avoid duplicate match errors
    const titleElements = await canvas.findAllByText("Total Medicines");
    await expect(titleElements[0]).toBeInTheDocument();

    const lowStockElements = await canvas.findAllByText("Low Stock");
    await expect(lowStockElements[0]).toBeInTheDocument();

    // Verify our mocked item triggered a Low Stock count of 1
    const valueElements = await canvas.findAllByText("1");
    await expect(valueElements[0]).toBeInTheDocument();
  },
};
