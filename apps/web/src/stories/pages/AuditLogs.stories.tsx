import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuditLogs } from "../../pages/AuditLogs";

const mockLogsData = {
  metadata: { currentPage: 1, totalPages: 1, totalCount: 2, limit: 20 },
  data: [
    {
      id: 1,
      createdAt: new Date().toISOString(),
      performedBy: "Sarah Jenkins",
      action: "stock_inward",
      entityType: "inventory_batch",
      entityId: 101,
      ipAddress: "192.168.1.1",
      userAgent: "Mozilla/5.0...",
      oldValues: null,
      newValues: '{"quantity": 100}',
    },
    {
      id: 2,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      performedBy: "system",
      action: "stock_outward",
      entityType: "inventory_batch",
      entityId: 101,
      ipAddress: "127.0.0.1",
      userAgent: "Server",
      oldValues: '{"previousQuantity": 100}',
      newValues: '{"newQuantity": 90}',
    },
  ],
};

const mockedQueryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: Infinity } },
});

mockedQueryClient.setQueryData(["audit-logs", 1, 20], mockLogsData);

const meta = {
  title: "Pages/AuditLogs",
  component: AuditLogs,
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
} satisfies Meta<typeof AuditLogs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify logs rendered
    const actions = await canvas.findAllByText("stock_inward");
    await expect(actions[0]).toBeInTheDocument();

    const actors = await canvas.findAllByText("Sarah Jenkins");
    await expect(actors[0]).toBeInTheDocument();

    // Verify metadata calculation
    const paginationText = await canvas.findAllByText("1–2 of 2");
    await expect(paginationText[0]).toBeInTheDocument();
  },
};
