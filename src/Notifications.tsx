import { useState } from 'react'
import { categoryTotals, money, pct, type FinanceData, type IconName } from './finance'
import { Empty, Icon, PageHeader, Sheet } from './ui'

export type NotificationCategory = 'support' | 'goals' | 'balance' | 'limits' | 'account'

export type NotificationPrefs = Record<NotificationCategory, boolean>

export type AppNotification = {
  id: string
  category: NotificationCategory
  title: string
  description: string
  time: string
  icon: IconName
  tone?: 'warning' | 'positive' | 'neutral'
}

const PREFS_KEY = 'flux-notification-prefs'
const READ_KEY = 'flux-notifications-read'
const DISMISSED_KEY = 'flux-notifications-dismissed'

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  support: 'Suporte e atendimento',
  goals: 'Metas',
  balance: 'Saldo',
  limits: 'Limites de gastos',
  account: 'Conta e aplicativo',
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  support: true,
  goals: true,
  balance: true,
  limits: true,
  account: true,
}

export function loadNotificationPrefs(): NotificationPrefs {
  try {
    const raw = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null')
    if (raw && typeof raw === 'object') {
      return {
        support: typeof raw.support === 'boolean' ? raw.support : true,
        goals: typeof raw.goals === 'boolean' ? raw.goals : true,
        balance: typeof raw.balance === 'boolean' ? raw.balance : true,
        limits: typeof raw.limits === 'boolean' ? raw.limits : true,
        account: typeof raw.account === 'boolean' ? raw.account : true,
      }
    }
  } catch {
    /* Ignore storage errors */
  }
  return { ...DEFAULT_NOTIFICATION_PREFS }
}

export function saveNotificationPrefs(prefs: NotificationPrefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {
    /* Ignore storage errors */
  }
}

export function loadReadIds(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(READ_KEY) || '[]')
    return Array.isArray(raw) ? raw.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

export function saveReadIds(ids: string[]) {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify(ids.slice(0, 100)))
  } catch {
    /* Ignore storage errors */
  }
}

export function loadDismissedIds(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]')
    return Array.isArray(raw) ? raw.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

export function saveDismissedIds(ids: string[]) {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids.slice(0, 100)))
  } catch {
    /* Ignore storage errors */
  }
}

export function buildNotifications(
  data: FinanceData,
  balance: number,
  prefs: NotificationPrefs,
  dismissedIds: string[] = [],
): AppNotification[] {
  const items: AppNotification[] = []

  if (prefs.limits) {
    const totals = categoryTotals(data.transactions, data.categories)
    totals.forEach((cat) => {
      const limit = data.limits[cat.name] || 0
      if (!limit) return
      const ratio = pct(cat.value, limit)
      if (ratio >= 100) {
        items.push({
          id: `limit-over-${cat.name}`,
          category: 'limits',
          title: `Limite de ${cat.name} ultrapassado`,
          description: `Você já gastou ${money(cat.value)} de ${money(limit)} (${ratio}%).`,
          time: 'Este mês',
          icon: 'repeat',
          tone: 'warning',
        })
      } else if (ratio >= 80) {
        items.push({
          id: `limit-near-${cat.name}`,
          category: 'limits',
          title: `${cat.name} perto do limite`,
          description: `Você atingiu ${ratio}% do limite mensal (${money(cat.value)} de ${money(limit)}).`,
          time: 'Este mês',
          icon: 'repeat',
          tone: 'neutral',
        })
      }
    })
  }

  if (prefs.balance) {
    if (balance < 0) {
      items.push({
        id: 'balance-negative',
        category: 'balance',
        title: 'Saldo disponível negativo',
        description: `Seu saldo atual está em ${money(balance)}. Revise seus últimos lançamentos.`,
        time: 'Agora',
        icon: 'wallet',
        tone: 'warning',
      })
    } else if (balance < 500) {
      items.push({
        id: 'balance-low',
        category: 'balance',
        title: 'Saldo disponível baixo',
        description: `Você tem ${money(balance)} disponíveis no momento.`,
        time: 'Agora',
        icon: 'wallet',
        tone: 'neutral',
      })
    }
  }

  if (prefs.goals) {
    data.goals.forEach((goal) => {
      const ratio = pct(goal.saved, goal.target)
      if (ratio >= 100) {
        items.push({
          id: `goal-done-${goal.id}`,
          category: 'goals',
          title: `Meta "${goal.name}" concluída!`,
          description: `Você alcançou ${money(goal.target)}. Parabéns pela conquista!`,
          time: 'Metas',
          icon: 'target',
          tone: 'positive',
        })
      } else if (ratio >= 65) {
        items.push({
          id: `goal-progress-${goal.id}`,
          category: 'goals',
          title: `Meta "${goal.name}" em ${ratio}%`,
          description: `Faltam apenas ${money(Math.max(0, goal.target - goal.saved))} para concluir.`,
          time: 'Metas',
          icon: 'target',
          tone: 'positive',
        })
      }
    })
  }

  if (prefs.support) {
    try {
      const tickets = JSON.parse(localStorage.getItem('flux-support-tickets') || '[]')
      if (Array.isArray(tickets) && tickets.length > 0) {
        const latest = tickets[0]
        items.push({
          id: `support-${latest.id}`,
          category: 'support',
          title: `Atendimento #${latest.id} registrado`,
          description: `Recebemos sua mensagem sobre "${latest.subject}".`,
          time: String(latest.createdAt || 'Recente'),
          icon: 'send',
          tone: 'neutral',
        })
      }
    } catch {
      /* Ignore storage errors */
    }
  }

  if (prefs.account) {
    items.push({
      id: 'account-welcome',
      category: 'account',
      title: 'Seu espaço Flux está atualizado',
      description: 'Personalize sua foto de perfil e preferências em Configurações.',
      time: 'Conta',
      icon: 'spark',
      tone: 'neutral',
    })
  }

  return dismissedIds.length > 0 ? items.filter((item) => !dismissedIds.includes(item.id)) : items
}

const PREF_ROWS: { key: NotificationCategory; title: string; description: string }[] = [
  {
    key: 'support',
    title: 'Notificações de suporte e atendimento',
    description: 'Confirmações de protocolo e respostas do Fale Conosco.',
  },
  {
    key: 'goals',
    title: 'Atualizações e progresso de metas',
    description: 'Avisos quando suas metas avançarem ou forem concluídas.',
  },
  {
    key: 'balance',
    title: 'Alertas de saldo',
    description: 'Notificações quando seu saldo disponível estiver baixo ou negativo.',
  },
  {
    key: 'limits',
    title: 'Alertas de limites de gastos',
    description: 'Avisos ao se aproximar ou ultrapassar o limite mensal de uma categoria.',
  },
  {
    key: 'account',
    title: 'Outros avisos importantes relacionados à conta e ao aplicativo',
    description: 'Novidades de segurança, acesso e recursos importantes do Flux.',
  },
]

export default function Notifications({
  data,
  balance,
  prefs,
  readIds,
  dismissedIds,
  onChangeReadIds,
  onChangeDismissedIds,
  onChangePrefs,
  onBack,
}: {
  data: FinanceData
  balance: number
  prefs: NotificationPrefs
  readIds: string[]
  dismissedIds: string[]
  onChangeReadIds: (next: string[]) => void
  onChangeDismissedIds: (next: string[]) => void
  onChangePrefs: (next: NotificationPrefs) => void
  onBack: () => void
}) {
  const [tab, setTab] = useState<'center' | 'prefs'>('center')
  const [selected, setSelected] = useState<AppNotification | null>(null)

  const items = buildNotifications(data, balance, prefs, dismissedIds)
  const unreadCount = items.filter((item) => !readIds.includes(item.id)).length

  const markRead = (id: string) => {
    if (readIds.includes(id)) return
    onChangeReadIds([id, ...readIds])
  }

  const markAllRead = () => {
    onChangeReadIds([...new Set([...readIds, ...items.map((item) => item.id)])])
  }

  const dismissOne = (id: string) => {
    if (!dismissedIds.includes(id)) {
      onChangeDismissedIds([id, ...dismissedIds])
    }
    if (selected?.id === id) setSelected(null)
  }

  const clearAll = () => {
    const allIds = [...new Set([...dismissedIds, ...items.map((item) => item.id)])]
    onChangeDismissedIds(allIds)
    setSelected(null)
  }

  const openNotification = (item: AppNotification) => {
    markRead(item.id)
    setSelected(item)
  }

  const togglePref = (key: NotificationCategory) => {
    const next = { ...prefs, [key]: !prefs[key] }
    onChangePrefs(next)
  }

  return (
    <div className="view-page notifications-page">
      <PageHeader title="Notificações" onBack={onBack} />
      <div className="page-intro">
        <span className="eyebrow">AVISOS E PREFERÊNCIAS</span>
        <h2>Fique por dentro<br />do seu fluxo.</h2>
        <p>Acompanhe alertas de saldo, limites, metas e escolha o que deseja receber.</p>
      </div>

      <div className="support-tabs" role="tablist" aria-label="Seções de notificações">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'center'}
          className={tab === 'center' ? 'active' : undefined}
          onClick={() => setTab('center')}
        >
          <Icon name="bell" size={16} />
          Central {unreadCount > 0 ? `(${unreadCount})` : ''}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'prefs'}
          className={tab === 'prefs' ? 'active' : undefined}
          onClick={() => setTab('prefs')}
        >
          <Icon name="edit" size={16} />
          Configurações
        </button>
      </div>

      {tab === 'center' ? (
        <section className="panel notifications-panel" aria-labelledby="notifications-center-title">
          <div className="support-panel-head">
            <div>
              <span className="eyebrow">CENTRAL DE NOTIFICAÇÕES</span>
              <h2 id="notifications-center-title">Avisos recentes</h2>
            </div>
            {items.length > 0 && (
              <div className="notifications-bulk-actions">
                {unreadCount > 0 && (
                  <button type="button" className="text-button" onClick={markAllRead}>
                    Marcar todas como lidas
                  </button>
                )}
                <button type="button" className="text-button notifications-clear-btn" onClick={clearAll}>
                  Limpar tudo
                </button>
              </div>
            )}
          </div>

          {items.length === 0 ? (
            <Empty icon="bell" title="Nenhum aviso no momento">
              <p>Quando houver atualizações de saldo, limites, metas ou conta, elas aparecerão aqui.</p>
            </Empty>
          ) : (
            <ul className="notifications-list">
              {items.map((item) => {
                const unread = !readIds.includes(item.id)
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`notification-item${unread ? ' unread' : ''}${item.tone ? ` tone-${item.tone}` : ''}`}
                      onClick={() => openNotification(item)}
                    >
                      <span className="row-icon"><Icon name={item.icon} size={18} /></span>
                      <div className="notification-copy">
                        <div className="notification-top">
                          <strong>{item.title}</strong>
                          <small>{item.time}</small>
                        </div>
                        <p>{item.description}</p>
                      </div>
                      {unread && <span className="notification-dot" aria-label="Não lida" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      ) : (
        <section className="panel notifications-prefs-panel" aria-labelledby="notifications-prefs-title">
          <span className="eyebrow">PREFERÊNCIAS</span>
          <h2 id="notifications-prefs-title">Configurações de Notificações</h2>
          <p className="helper-text settings-description">Ative ou desative individualmente cada tipo de alerta.</p>

          <div className="notifications-switches">
            {PREF_ROWS.map((row) => (
              <button
                key={row.key}
                type="button"
                className="settings-switch"
                role="switch"
                aria-checked={prefs[row.key]}
                onClick={() => togglePref(row.key)}
              >
                <span>
                  <strong>{row.title}</strong>
                  <small>{row.description}</small>
                </span>
                <i className={`toggle ${prefs[row.key] ? 'on' : ''}`} aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
      )}

      {selected && (
        <Sheet title="Detalhes do aviso" close={() => setSelected(null)}>
          <div className="notification-modal">
            <div className="notification-modal-head">
              <span className={`row-icon large${selected.tone ? ` tone-${selected.tone}` : ''}`}>
                <Icon name={selected.icon} size={22} />
              </span>
              <div>
                <span className="eyebrow">{CATEGORY_LABELS[selected.category]}</span>
                <h3>{selected.title}</h3>
                <small>{selected.time}</small>
              </div>
            </div>
            <p className="notification-modal-body">{selected.description}</p>
            <div className="notification-modal-actions">
              <button type="button" className="danger-button" onClick={() => dismissOne(selected.id)}>
                <Icon name="trash" size={16} />
                Remover aviso
              </button>
              <button type="button" className="secondary-button" onClick={() => setSelected(null)}>
                Fechar
              </button>
            </div>
          </div>
        </Sheet>
      )}
    </div>
  )
}
