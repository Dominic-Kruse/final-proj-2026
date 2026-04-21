import type { Meta, StoryObj } from '@storybook/react-vite';

import { Dashboard } from '../../pages/Dashboard';

const meta = {
  component: Dashboard,
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
} satisfies Meta<typeof Dashboard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAlerts: Story = {
 args: {
    showAlerts: true,
 } 
}