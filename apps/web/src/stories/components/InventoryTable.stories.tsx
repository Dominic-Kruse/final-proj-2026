import type { Meta, StoryObj } from '@storybook/react-vite';

import { InventoryTable } from '../../components/InventoryTable';

const meta = {
  component: InventoryTable,
  decorators: [
    (Story) => (
      <div className="bg-[#F8F9FA] p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InventoryTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};