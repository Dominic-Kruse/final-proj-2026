import { fn } from "storybook/test";
import type { Meta, StoryObj } from '@storybook/react-vite';

import { DispenseList } from '../../components/DispenseList';

const meta = {
  component: DispenseList,
  decorators: [
    (Story) => (
      <div className="bg-[#F8F9FA] p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DispenseList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    "items": [],
    "onUpdateQuantity": fn(),
    "onUpdateReason": fn(),
    "onRemove": fn(),
    "onConfirm": fn()
  },
};