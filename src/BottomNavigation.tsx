import type { IconName, View } from './finance'
import { Brand, Icon } from './ui'

type MainView = Extract<View, 'home' | 'transactions' | 'goals' | 'premium'>

const destinations: { view: MainView; label: string; icon: IconName }[] = [
  { view: 'home', label: 'Home', icon: 'home' },
  { view: 'transactions', label: 'Transações', icon: 'repeat' },
  { view: 'goals', label: 'Metas', icon: 'target' },
]

export default function BottomNavigation({
  view,
  onNavigate,
  onAdd,
  profileName = 'Lucas',
  onOpenAccount,
}: {
  view: View
  onNavigate: (view: MainView) => void
  onAdd: () => void
  profileName?: string
  onOpenAccount?: () => void
}) {
  const firstName = profileName.trim().split(/\s+/)[0] || 'Lucas'
  return <div className="bottom-navigation-dock"><nav className="bottom-navigation" aria-label="Navegação principal">
    <div className="desktop-nav-bar">
      <button className="desktop-nav-brand" type="button" onClick={() => onNavigate('home')} aria-label="Flux — Ir para Home">
        <Brand showMark={false} />
      </button>
      <div className="bottom-navigation-items">
        {destinations.map((destination) => {
          const currentPage = view === destination.view
          const parentSection = (view === 'assistant' && destination.view === 'goals') || ((view === 'cards' || view === 'invoice') && destination.view === 'home')
          return <button
            className="bottom-navigation-item"
            key={destination.view}
            type="button"
            data-active={currentPage || parentSection}
            aria-current={currentPage ? 'page' : parentSection ? 'location' : undefined}
            onClick={() => onNavigate(destination.view)}
          >
            <span className="bottom-navigation-icon"><Icon name={destination.icon} /></span>
            <span>{destination.label}</span>
          </button>
        })}
        <button className="bottom-navigation-item bottom-navigation-premium" type="button" data-active={view === 'premium'} aria-current={view === 'premium' ? 'page' : undefined} aria-label="Conhecer o Flux Plus" title="Flux Plus" onClick={() => onNavigate('premium')}><span className="bottom-navigation-icon"><Icon name="spark" /><span className="bottom-navigation-premium-badge">PLUS</span></span><span>IA</span></button>
      </div>
      <button className="desktop-nav-profile" type="button" onClick={onOpenAccount} aria-label="Abrir conta">
        <span className="desktop-nav-greeting"><span>Olá,</span><strong>{firstName}</strong></span>
        <span className="avatar desktop-nav-avatar"><img src="/profile-photo.png" alt="" /></span>
      </button>
    </div>
  </nav>
    <button className="bottom-navigation-add" type="button" aria-label="Adicionar gasto" title="Adicionar gasto" onClick={onAdd}><Icon name="plus" /><span className="sr-only">Adicionar gasto</span></button>
  </div>
}
