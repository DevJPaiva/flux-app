import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { initialData, type Theme } from '../finance'
import Transactions from '../Transactions'
import Settings from '../Settings'
import Premium from '../Premium'
import Invoice from '../Invoice'
import Assistant from '../Assistant'

const seed = initialData()

const meta: Meta = {
  title: 'Screens/Application Views',
  tags: ['autodocs'],
}

export default meta

export const TransactionsScreen: StoryObj = {
  name: 'Transactions',
  render: () => (
    <Transactions
      data={seed}
      onBack={() => alert('Voltar')}
      onSelect={(tx) => alert(`Selecionada: ${tx.name}`)}
      onAdd={() => alert('Adicionar gasto')}
    />
  ),
}

export const SettingsScreen: StoryObj = {
  name: 'Settings',
  render: () => {
    const [theme, setTheme] = useState<Theme>('dark')
    const [hideOnOpen, setHideOnOpen] = useState(false)
    const [profile, setProfile] = useState(seed.profile)
    return (
      <Settings
        profile={profile}
        hideOnOpen={hideOnOpen}
        theme={theme}
        onBack={() => alert('Voltar')}
        onChangeTheme={(next) => {
          setTheme(next)
          if (next === 'dark' || next === 'light') {
            document.documentElement.dataset.theme = next
          }
        }}
        onSaveProfile={(next) => setProfile(next)}
        onToggleBalance={() => setHideOnOpen((v) => !v)}
        onLogout={() => alert('Logout')}
      />
    )
  },
}

export const PremiumScreen: StoryObj = {
  name: 'Premium (Flux Plus)',
  render: () => <Premium onBack={() => alert('Voltar')} />,
}

export const InvoiceScreen: StoryObj = {
  name: 'Invoice (Importar Fatura)',
  render: () => (
    <Invoice
      cards={seed.cards}
      categories={seed.categories}
      batches={seed.invoiceBatches}
      transactions={seed.transactions}
      onBack={() => alert('Voltar')}
      onConfirm={(items) => {
        alert(`${items.length} lançamentos confirmados`)
        return true
      }}
      onDeleteBatch={(batch) => alert(`Excluir lote ${batch.fileName}`)}
    />
  ),
}

export const AssistantScreen: StoryObj = {
  name: 'Assistant (Chat IA)',
  render: () => <Assistant data={seed} onBack={() => alert('Voltar')} />,
}
