import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { SearchBar } from "../../components/SearchBar";

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<typeof SearchBar> = {
  title: "Components/SearchBar",
  component: SearchBar,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Generic search input used across Inventory and Dispense pages. Fires `onSearch` on every keystroke — debouncing is handled by the parent hook (`usePaginatedCatalog`).",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SearchBar>;

// ── Stories ───────────────────────────────────────────────────────────────────

export const Default: Story = {
  args: {
    placeholder: "Search...",
    onSearch: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const input = canvas.getByRole("textbox");
    await expect(input).toBeInTheDocument();
    await expect(input).toHaveAttribute("placeholder", "Search...");
  },
};

export const InventoryPlaceholder: Story = {
  args: {
    placeholder: "Search medicines, generic names...",
    onSearch: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");
    await expect(input).toHaveAttribute(
      "placeholder",
      "Search medicines, generic names...",
    );
  },
};

export const DispensePlaceholder: Story = {
  args: {
    placeholder: "Search by medicine name, generic name, or batch...",
    onSearch: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");
    await expect(input).toHaveAttribute(
      "placeholder",
      "Search by medicine name, generic name, or batch...",
    );
  },
};

export const TypingFiresCallback: Story = {
  args: {
    placeholder: "Search...",
    onSearch: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");

    await userEvent.type(input, "amoxicillin");

    // onSearch should fire once per character typed
    await expect(args.onSearch).toHaveBeenCalledTimes("amoxicillin".length);

    // The last call should carry the full query string
    await expect(args.onSearch).toHaveBeenLastCalledWith("amoxicillin");
  },
};

export const ClearingInputFiresEmptyString: Story = {
  args: {
    placeholder: "Search...",
    onSearch: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");

    // Type then clear
    await userEvent.type(input, "paracetamol");
    await userEvent.clear(input);

    // Last call should be an empty string, representing a cleared search
    await expect(args.onSearch).toHaveBeenLastCalledWith("");
  },
};
