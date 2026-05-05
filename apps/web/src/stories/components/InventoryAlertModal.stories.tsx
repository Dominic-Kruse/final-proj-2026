import { fn } from "storybook/test";
import type { Meta, StoryObj } from '@storybook/react-vite';

import { InventoryAlertModal } from '../../components/InventoryAlertModal';

const meta = {
  component: InventoryAlertModal,
  decorators: [
    (Story) => (
      <div className="bg-[#F8F9FA] p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InventoryAlertModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    "type": "low-stock",
    "onClose": fn()
  },
};