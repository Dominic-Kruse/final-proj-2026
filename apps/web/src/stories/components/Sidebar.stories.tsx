import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { useState } from "react";
import { Sidebar } from "../../components/SideBar";

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<typeof Sidebar> = {
  title: "Components/Sidebar",
  component: Sidebar,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Collapsible navigation Sidebar. Renders NavLinks for all five pages (Dashboard, Inventory, Stock In, Dispense, Audit Logs). Collapses to icon-only mode via the toggle button at the bottom.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="flex h-screen">
        <Story />
        <main className="flex-1 p-8 bg-slate-50 text-slate-500 text-sm">
          Page content area
        </main>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

// ── Stories ───────────────────────────────────────────────────────────────────

export const Expanded: Story = {
  args: {
    collapsed: false,
    onToggleCollapse: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // All nav labels should be visible in expanded mode
    await expect(canvas.getByText("Dashboard")).toBeInTheDocument();
    await expect(canvas.getByText("Inventory")).toBeInTheDocument();
    await expect(canvas.getByText("Stock In")).toBeInTheDocument();
    await expect(canvas.getByText("Dispense")).toBeInTheDocument();
    await expect(canvas.getByText("Audit Logs")).toBeInTheDocument();

    // PharmAssist branding is visible when expanded
    await expect(canvas.getByText("PharmAssist")).toBeInTheDocument();
  },
};

export const Collapsed: Story = {
  args: {
    collapsed: true,
    onToggleCollapse: fn(),
  },
  play: async ({ canvasElement }) => {
    // Nav labels are aria-hidden when collapsed — text is in DOM but hidden
    // The Sidebar should be narrower (w-20 vs w-64)
    const Sidebar = canvasElement.querySelector("aside");
    await expect(Sidebar).toHaveClass("w-20");
  },
};

export const ToggleCollapseButton: Story = {
  args: {
    collapsed: false,
    onToggleCollapse: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    const toggleBtn = canvas.getByRole("button", { name: /collapse Sidebar/i });
    await expect(toggleBtn).toBeInTheDocument();

    await userEvent.click(toggleBtn);
    await expect(args.onToggleCollapse).toHaveBeenCalledTimes(1);
  },
};

export const ExpandCollapseInteractive: Story = {
  render: () => {
    const [collapsed, setCollapsed] = useState(false);
    return (
      <div className="flex h-screen">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
        />
        <main className="flex-1 p-8 bg-slate-50 text-slate-500 text-sm">
          Click the toggle at the bottom of the Sidebar.
        </main>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const Sidebar = canvasElement.querySelector("aside")!;

    // Starts expanded
    await expect(Sidebar).toHaveClass("w-64");

    // Collapse
    const collapseBtn = canvas.getByRole("button", {
      name: /collapse Sidebar/i,
    });
    await userEvent.click(collapseBtn);
    await expect(Sidebar).toHaveClass("w-20");

    // Re-expand
    const expandBtn = canvas.getByRole("button", { name: /expand Sidebar/i });
    await userEvent.click(expandBtn);
    await expect(Sidebar).toHaveClass("w-64");
  },
};

export const AllNavLinksPresent: Story = {
  args: {
    collapsed: false,
    onToggleCollapse: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify all five routes have a corresponding nav link
    const links = canvas.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));

    await expect(hrefs).toContain("/");
    await expect(hrefs).toContain("/inventory");
    await expect(hrefs).toContain("/stockin");
    await expect(hrefs).toContain("/dispense");
    await expect(hrefs).toContain("/customer");
  },
};
