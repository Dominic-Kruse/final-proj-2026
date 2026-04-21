import { fn } from "storybook/test";
import type { Meta, StoryObj } from '@storybook/react-vite';

import { SortFilterChips } from '../../components/SortFilterChips';

const meta = {
  component: SortFilterChips,
  decorators: [
    (Story) => (
      <div className="bg-[#F8F9FA] p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SortFilterChips>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    "activeFilters": [
      "alphabetical"
    ],
    "onToggle": fn()
  },
};