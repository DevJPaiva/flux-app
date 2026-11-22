import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import BottomNavigation from '../BottomNavigation'
import type { View } from '../finance'

const meta: Meta<typeof BottomNavigation> = {
  title: 'Components/BottomNavigation',
  component: BottomNavigation,
  tags: ['autodocs'],
  argTypes: {
    view: {
      control: 'select',
      options: ['home', 'transactions', 'goals', 'premium', 'cards', 'invoice', 'assistant'],
    },
  },
}

export default meta
type Story = StoryObj<typeof BottomNavigation>

export const Interactive: Story = {
  args: {
    view: 'home',
  },
  render: (args) => {
    const [activeView, setActiveView] = useState<View>(args.view)
    return (
      <div style={{ minHeight: 160, position: 'relative' }}>
        <p className="helper-text" style={{ textAlign: 'center', marginBottom: 24 }}>
          View ativa: <strong>{activeView}</strong>
        </p>
        <BottomNavigation
          view={activeView}
          onNavigate={(next) => setActiveView(next)}
          onAdd={() => alert('Ação: Adicionar gasto')}
        />
      </div>
    )
  },
}

export const TransactionsActive: Story = {
  args: {
    view: 'transactions',
    onNavigate: () => {},
    onAdd: () => {},
  },
  render: (args) => (
    <div style={{ minHeight: 140 }}>
      <BottomNavigation {...args} />
    </div>
  ),
}

export const GoalsActive: Story = {
  args: {
    view: 'goals',
    onNavigate: () => {},
    onAdd: () => {},
  },
  render: (args) => (
    <div style={{ minHeight: 140 }}>
      <BottomNavigation {...args} />
    </div>
  ),
}

export const PremiumActive: Story = {
  args: {
    view: 'premium',
    onNavigate: () => {},
    onAdd: () => {},
  },
  render: (args) => (
    <div style={{ minHeight: 140 }}>
      <BottomNavigation {...args} />
    </div>
  ),
}
