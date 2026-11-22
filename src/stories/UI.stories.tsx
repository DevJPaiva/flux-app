import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Brand, Empty, Icon, PageHeader, Progress, Sheet } from '../ui'
import type { IconName } from '../finance'

const ALL_ICONS: IconName[] = [
  'plus', 'card', 'target', 'file', 'eye', 'eyeOff', 'home', 'arrow',
  'close', 'market', 'repeat', 'car', 'wallet', 'spark', 'trash', 'edit',
  'chevron', 'send', 'camera', 'upload', 'calendar', 'check', 'moon', 'sun', 'monitor',
]

const meta: Meta<typeof Progress> = {
  title: 'Components/UI Primitives',
  component: Progress,
  tags: ['autodocs'],
}

export default meta

export const IconsGallery: StoryObj = {
  name: 'Icon (Galeria Completa)',
  render: () => (
    <div className="panel" style={{ maxWidth: 820, margin: '0 auto' }}>
      <div className="section-heading">
        <div>
          <span className="eyebrow">ICONOGRAFIA · STROKE 1.8PX</span>
          <h2>25 ícones do Flux</h2>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 12 }}>
        {ALL_ICONS.map((name) => (
          <div
            key={name}
            style={{
              display: 'grid',
              placeItems: 'center',
              gap: 8,
              padding: 14,
              borderRadius: 16,
              border: '1px solid var(--eg-border)',
              background: 'var(--eg-elevated)',
            }}
          >
            <Icon name={name} size={22} />
            <code style={{ fontSize: 11, color: 'var(--eg-secondary)' }}>{name}</code>
          </div>
        ))}
      </div>
    </div>
  ),
}

export const BrandMark: StoryObj = {
  name: 'Brand',
  render: () => (
    <div className="panel" style={{ maxWidth: 420, margin: '0 auto', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
      <div style={{ display: 'flex' }}><Brand showMark /></div>
      <div style={{ display: 'flex' }}><Brand showMark={false} /></div>
    </div>
  ),
}

export const Header: StoryObj = {
  name: 'PageHeader',
  render: () => (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <PageHeader
        title="Meus cartões"
        onBack={() => alert('Voltar')}
        action={
          <button className="icon-button" aria-label="Novo cartão" onClick={() => alert('Adicionar')}>
            <Icon name="plus" />
          </button>
        }
      />
    </div>
  ),
}

export const ProgressBars: StoryObj<typeof Progress> = {
  name: 'Progress',
  args: {
    value: 68,
    tone: 'lime',
    label: 'Meta alcançada',
  },
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    tone: { control: 'select', options: ['lime', 'lilac', 'dark', 'white', 'muted'] },
  },
  render: (args) => (
    <div className="panel" style={{ maxWidth: 520, margin: '0 auto', display: 'grid', gap: 18 }}>
      <div>
        <small className="eyebrow">INTERATIVO ({args.value}%)</small>
        <div style={{ marginTop: 8 }}><Progress {...args} /></div>
      </div>
      <div>
        <small className="eyebrow">TONE: LIME (75%)</small>
        <div style={{ marginTop: 8 }}><Progress value={75} tone="lime" /></div>
      </div>
      <div>
        <small className="eyebrow">TONE: LILAC (42%)</small>
        <div style={{ marginTop: 8 }}><Progress value={42} tone="lilac" /></div>
      </div>
      <div>
        <small className="eyebrow">TONE: DARK (90%)</small>
        <div style={{ marginTop: 8 }}><Progress value={90} tone="dark" /></div>
      </div>
    </div>
  ),
}

export const EmptyState: StoryObj = {
  name: 'Empty',
  render: () => (
    <div className="panel" style={{ maxWidth: 460, margin: '0 auto' }}>
      <Empty icon="target" title="Qual é seu próximo plano?">
        <p>Crie uma meta e acompanhe cada valor guardado no seu ritmo.</p>
        <button className="primary-button" type="button">Criar primeira meta</button>
      </Empty>
    </div>
  ),
}

export const BottomSheet: StoryObj = {
  name: 'Sheet (Modal / Drawer)',
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <div style={{ minHeight: 360, display: 'grid', placeItems: 'center' }}>
        <button className="primary-button" style={{ maxWidth: 260 }} onClick={() => setOpen(true)}>
          Abrir Sheet
        </button>
        {open && (
          <Sheet title="Detalhe da compra" close={() => setOpen(false)}>
            <p className="helper-text">
              Este componente implementa focus trap com Tab/Shift+Tab, fechamento por Escape e clique no backdrop.
            </p>
            <button className="primary-button" onClick={() => setOpen(false)}>
              Fechar
            </button>
          </Sheet>
        )}
      </div>
    )
  },
}
