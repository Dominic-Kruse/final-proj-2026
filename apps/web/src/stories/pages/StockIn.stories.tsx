import type { Meta, StoryObj } from '@storybook/react-vite';

import { StockIn } from '../../pages/StockIn';
import { userEvent } from 'storybook/test';

const meta = {
  component: StockIn,
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
} satisfies Meta<typeof StockIn>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const fullWalkThrough: Story = {
  play: async ({canvas, userEvent}) => {
    const quantityInput = canvas.getByPlaceholderText('0');
    
    await userEvent.type(quantityInput, '100');
  }
}