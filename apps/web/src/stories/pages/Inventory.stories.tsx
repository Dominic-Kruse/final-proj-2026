import type { Meta, StoryObj } from '@storybook/react-vite';

import { Inventory } from '../../pages/Inventory';

const meta = {
  component: Inventory,
  decorators: [
    (Story) => (
      <div className="flex h-screen w-full bg-[#F8F9FA] overflow-hidden font-sans text-slate-900">
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <main className="flex-1 overflow-y-auto p-8">
            <Story />
          </main>
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof Inventory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};