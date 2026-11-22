import type { Meta, StoryObj } from '@storybook/react-vite'

const semanticColorSwatches = [
  { token: 'color/bg-canvas', cssVar: '--eg-bg' },
  { token: 'color/bg-surface', cssVar: '--eg-surface' },
  { token: 'color/bg-elevated', cssVar: '--eg-elevated' },
  { token: 'color/bg-tint', cssVar: '--eg-tint' },
  { token: 'color/bg-tint-strong', cssVar: '--eg-tint-strong' },
  { token: 'color/bg-action', cssVar: '--eg-action' },
  { token: 'color/bg-action-hover', cssVar: '--eg-action-hover' },
  { token: 'color/bg-brand-primary', cssVar: '--eg-primary' },
  { token: 'color/bg-brand-deep', cssVar: '--eg-primary-700' },
  { token: 'color/text-primary', cssVar: '--eg-text' },
  { token: 'color/text-secondary', cssVar: '--eg-secondary' },
  { token: 'color/text-muted', cssVar: '--eg-muted' },
  { token: 'color/text-soft', cssVar: '--eg-soft-text' },
  { token: 'color/text-accent', cssVar: '--eg-accent' },
  { token: 'color/border-default', cssVar: '--eg-border' },
  { token: 'color/border-tint', cssVar: '--eg-tint-border' },
  { token: 'color/text-danger', cssVar: '--eg-danger' },
  { token: 'color/bg-danger', cssVar: '--eg-danger-bg' },
]

const spacingScale = [0, 4, 8, 12, 16, 20, 24, 32, 48]
const negativeGaps = [-4, -8, -10, -12, -24]
const radiusScale = [
  { token: 'radius/xs', value: 6 },
  { token: 'radius/sm', value: 10 },
  { token: 'radius/input', value: 14 },
  { token: 'radius/button', value: 16 },
  { token: 'radius/card-sm', value: 20 },
  { token: 'radius/card-md', value: 24 },
  { token: 'radius/panel', value: 28 },
  { token: 'radius/hero', value: 32 },
  { token: 'radius/pill', value: 9999 },
]

function TokensOverview() {
  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gap: 36 }}>
      <header>
        <span className="eyebrow">FLUX DESIGN SYSTEM</span>
        <h1 style={{ fontSize: 36, fontWeight: 500, letterSpacing: '-0.04em', margin: '8px 0' }}>
          Design Tokens (Primitives &amp; Semantics)
        </h1>
        <p className="helper-text">
          Alterne o tema na barra superior (Dark / Light) para inspecionar a resolução dos aliases semânticos.
        </p>
      </header>

      <section className="panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">SEMANTICS · COLORS</span>
            <h2>Cores Semânticas</h2>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12 }}>
          {semanticColorSwatches.map(({ token, cssVar }) => (
            <div
              key={token}
              style={{
                border: '1px solid var(--eg-border)',
                borderRadius: 16,
                overflow: 'hidden',
                background: 'var(--eg-elevated)',
              }}
            >
              <div style={{ height: 56, background: `var(${cssVar})`, borderBottom: '1px solid var(--eg-border)' }} />
              <div style={{ padding: 10, display: 'grid', gap: 2 }}>
                <strong style={{ fontSize: 12, fontWeight: 600 }}>{token}</strong>
                <small style={{ color: 'var(--eg-muted)', fontSize: 11 }}>{`var(${cssVar})`}</small>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">SEMANTICS · SPACING &amp; NEGATIVE GAPS</span>
            <h2>Gaps Positivos e Negativos</h2>
          </div>
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          {spacingScale.map((px) => (
            <div key={px} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 48px', alignItems: 'center', gap: 12 }}>
              <code style={{ fontSize: 12, color: 'var(--eg-secondary)' }}>{`gap/space-${px}`}</code>
              <div style={{ height: 10, width: Math.max(4, px * 3), borderRadius: 99, background: 'var(--eg-action)' }} />
              <span style={{ fontSize: 12, color: 'var(--eg-muted)', textAlign: 'right' }}>{px}px</span>
            </div>
          ))}
          <hr style={{ border: 0, borderTop: '1px solid var(--eg-border)', margin: '8px 0' }} />
          {negativeGaps.map((px) => (
            <div key={px} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 48px', alignItems: 'center', gap: 12 }}>
              <code style={{ fontSize: 12, color: 'var(--eg-soft-text)' }}>{`gap-negative/space-neg-${Math.abs(px)}`}</code>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--eg-primary)' }} />
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--eg-action)', marginLeft: px, opacity: 0.85 }} />
              </div>
              <span style={{ fontSize: 12, color: 'var(--eg-muted)', textAlign: 'right' }}>{px}px</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">SEMANTICS · RADIUS</span>
            <h2>Border Radius</h2>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {radiusScale.map(({ token, value }) => (
            <div key={token} style={{ display: 'grid', gap: 8, placeItems: 'center' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: value,
                  border: '1px solid var(--eg-accent)',
                  background: 'var(--eg-tint)',
                }}
              />
              <code style={{ fontSize: 11 }}>{token}</code>
              <small style={{ color: 'var(--eg-muted)', fontSize: 10 }}>{value === 9999 ? 'full' : `${value}px`}</small>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

const meta: Meta<typeof TokensOverview> = {
  title: 'Foundations/Design Tokens',
  component: TokensOverview,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof TokensOverview>

export const Overview: Story = {}
