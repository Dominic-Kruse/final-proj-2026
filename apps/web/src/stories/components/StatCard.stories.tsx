import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { StatCard } from "../../components/StatCard";

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<typeof StatCard> = {
  title: "Components/StatCard",
  component: StatCard,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Dashboard summary card. Supports three visual variants — default, warning (amber), and danger (red). Warning and danger cards are clickable and show a 'View details →' affordance.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "warning", "danger"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatCard>;

// ── Stories ───────────────────────────────────────────────────────────────────

export const Default: Story = {
  args: {
    title: "Total Medicines",
    value: 142,
    subtitle: "Products in catalog",
    variant: "default",
    onClick: undefined,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Title, value, and subtitle all render
    await expect(canvas.getByText("Total Medicines")).toBeInTheDocument();
    await expect(canvas.getByText("142")).toBeInTheDocument();
    await expect(canvas.getByText("Products in catalog")).toBeInTheDocument();

    // No "View details" affordance on non-clickable default cards
    await expect(canvas.queryByText(/view details/i)).not.toBeInTheDocument();
  },
};

export const Warning: Story = {
  args: {
    title: "Low Stock",
    value: 7,
    subtitle: "Needs restock",
    variant: "warning",
    onClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("Low Stock")).toBeInTheDocument();
    await expect(canvas.getByText("7")).toBeInTheDocument();

    // Clickable cards expose the "View details →" link text
    await expect(canvas.getByText(/view details/i)).toBeInTheDocument();

    // Clicking calls the onClick handler
    await userEvent.click(canvasElement.querySelector("div")!);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const Danger: Story = {
  args: {
    title: "Expired Batches",
    value: 3,
    subtitle: "Remove soon",
    variant: "danger",
    onClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("Expired Batches")).toBeInTheDocument();
    await expect(canvas.getByText("3")).toBeInTheDocument();
    await expect(canvas.getByText(/view details/i)).toBeInTheDocument();

    await userEvent.click(canvasElement.querySelector("div")!);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const LoadingState: Story = {
  args: {
    title: "Out of Stock",
    value: "...",
    subtitle: "No units available",
    variant: "default",
    onClick: undefined,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Loading state displays ellipsis placeholder while data is fetched
    await expect(canvas.getByText("...")).toBeInTheDocument();
  },
};

export const ZeroValue: Story = {
  args: {
    title: "Expired Batches",
    value: 0,
    subtitle: "All clear",
    variant: "danger",
    onClick: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Zero is a valid and meaningful value — should render explicitly
    await expect(canvas.getByText("0")).toBeInTheDocument();
  },
};
