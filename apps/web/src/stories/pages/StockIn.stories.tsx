import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StockIn } from "../../pages/StockIn";

const mockedQueryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: Infinity } },
});

// Mock the product catalog so the generic name picker doesn't crash
mockedQueryClient.setQueryData(["products"], []);

const meta = {
  title: "Pages/StockIn",
  component: StockIn,
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
} satisfies Meta<typeof StockIn>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FormValidationWalkthrough: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Attempt to add a draft without filling anything
    const addDraftBtn = canvas.getByRole("button", {
      name: "Add to draft list",
    });
    await userEvent.click(addDraftBtn);

    // Use findAllByText for the error message because it's rendered in two places
    const headerErrors = await canvas.findAllByText(
      "Complete the inward header (supplier, reference, date) first.",
    );
    await expect(headerErrors[0]).toBeInTheDocument();

    // Fill the header
    await userEvent.type(canvas.getByLabelText("Supplier *"), "MediCore");
    await userEvent.type(
      canvas.getByLabelText("Invoice / reference number *"),
      "INV-123",
    );

    // Click again, verify batch validation triggers
    await userEvent.click(addDraftBtn);
    const batchErrors = await canvas.findAllByText(
      "Please complete all required batch fields.",
    );
    await expect(batchErrors[0]).toBeInTheDocument();
  },
};
