import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { useState } from "react";
import { SortFilterChips } from "../../components/SortFilterChips";
import type { SortFilter } from "../../utils/catalogDecorators";

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<typeof SortFilterChips> = {
  title: "Components/SortFilterChips",
  component: SortFilterChips,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Filter chip bar used on the Inventory page. Each chip toggles a `SortFilter` key that feeds into `applyDecorators`, composing the active sort/filter pipeline via `DECORATOR_MAP`. Multiple chips can be active simultaneously and each is applied sequentially (Decorator pattern).",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SortFilterChips>;

// ── Controlled wrapper for interactive stories ────────────────────────────────

function ControlledChips({
  initialFilters = [],
}: {
  initialFilters?: SortFilter[];
}) {
  const [activeFilters, setActiveFilters] =
    useState<SortFilter[]>(initialFilters);

  const handleToggle = (filter: SortFilter) => {
    setActiveFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter],
    );
  };

  return (
    <div>
      <SortFilterChips activeFilters={activeFilters} onToggle={handleToggle} />
      <p className="mt-3 text-xs text-slate-400">
        Active: {activeFilters.length === 0 ? "none" : activeFilters.join(", ")}
      </p>
    </div>
  );
}

// ── Stories ───────────────────────────────────────────────────────────────────

export const NoFiltersActive: Story = {
  args: {
    activeFilters: [],
    onToggle: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // All five filter buttons should render
    await expect(
      canvas.getByRole("button", { name: /a → z/i }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: /in stock/i }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: /low stock/i }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: /near expiry/i }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: /expired/i }),
    ).toBeInTheDocument();
  },
};

export const SingleFilterActive: Story = {
  args: {
    activeFilters: ["alphabetical"],
    onToggle: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const alphabeticalBtn = canvas.getByRole("button", { name: /a → z/i });

    // Active chip carries the blue active class
    await expect(alphabeticalBtn).toHaveClass("bg-blue-600");

    // Other chips remain inactive
    const lowStockBtn = canvas.getByRole("button", { name: /low stock/i });
    await expect(lowStockBtn).not.toHaveClass("bg-blue-600");
  },
};

export const MultipleFiltersActive: Story = {
  args: {
    activeFilters: ["low-stock", "near-expiry"],
    onToggle: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const lowStockBtn = canvas.getByRole("button", { name: /low stock/i });
    const nearExpiryBtn = canvas.getByRole("button", { name: /near expiry/i });

    await expect(lowStockBtn).toHaveClass("bg-blue-600");
    await expect(nearExpiryBtn).toHaveClass("bg-blue-600");

    // Unrelated chips remain inactive
    const inStockBtn = canvas.getByRole("button", { name: /in stock/i });
    await expect(inStockBtn).not.toHaveClass("bg-blue-600");
  },
};

export const ToggleOnAndOff: Story = {
  render: () => <ControlledChips initialFilters={[]} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const alphabeticalBtn = canvas.getByRole("button", { name: /a → z/i });

    // Click to activate
    await userEvent.click(alphabeticalBtn);
    await expect(alphabeticalBtn).toHaveClass("bg-blue-600");

    // Click again to deactivate
    await userEvent.click(alphabeticalBtn);
    await expect(alphabeticalBtn).not.toHaveClass("bg-blue-600");
  },
};

export const StackingMultipleFilters: Story = {
  render: () => <ControlledChips initialFilters={[]} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Activate three filters in sequence (each feeds into the Decorator pipeline)
    await userEvent.click(canvas.getByRole("button", { name: /a → z/i }));
    await userEvent.click(canvas.getByRole("button", { name: /low stock/i }));
    await userEvent.click(canvas.getByRole("button", { name: /near expiry/i }));

    await expect(canvas.getByRole("button", { name: /a → z/i })).toHaveClass(
      "bg-blue-600",
    );
    await expect(
      canvas.getByRole("button", { name: /low stock/i }),
    ).toHaveClass("bg-blue-600");
    await expect(
      canvas.getByRole("button", { name: /near expiry/i }),
    ).toHaveClass("bg-blue-600");

    // Non-toggled chips stay inactive
    await expect(
      canvas.getByRole("button", { name: /in stock/i }),
    ).not.toHaveClass("bg-blue-600");
    await expect(
      canvas.getByRole("button", { name: /expired/i }),
    ).not.toHaveClass("bg-blue-600");
  },
};
