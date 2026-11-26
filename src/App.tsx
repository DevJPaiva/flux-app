import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import {
  PAYMENT_METHOD_LABELS, STORAGE_KEY, addCategory, calculateBalance, categoryIcon, categoryTotals, cents,
  importInvoiceBatch, initialData, isCustomCategory, isDebitCard, isIncome, money, monthExpenses,
  paymentLabel, pct, prettyDate, readData, removeCard, removeCategory, removeExpense, removeGoal,
  removeInvoiceBatch, resolvePaymentMethod, updateCategory, upsertExpense, upsertGoal,
  type Card, type FinanceData, type Goal, type InvoiceBatch, type PaymentMethod, type Transaction, type TransactionType, type View,
} from './finance'
import { AccessTransition, Avatar, Brand, Empty, Icon, PageHeader, Progress, Sheet, SplashScreen, SuccessState, Toast, type ToastTone } from './ui'
import { runAccessTransition, useHomeEntrance, useViewEntrance, useWalletCardPulse } from './animations'
import { BalanceForm, BudgetForm, CardForm, CategoryForm, ExpenseForm, GoalForm, SaveForm } from './forms'
import Auth, { type AuthField, type AuthFieldErrors, type AuthMode } from './Auth'
import Onboarding from './Onboarding'
import Notifications, {
  buildNotifications, loadDismissedIds, loadNotificationPrefs, loadReadIds,
  saveDismissedIds, saveNotificationPrefs, saveReadIds, type NotificationPrefs,
} from './Notifications'
import Settings from './Settings'
import BottomNavigation from './BottomNavigation'
import Transactions from './Transactions'
import Premium from './Premium'
import { getRememberSession, isSupabaseConfigured, setRememberSession, supabase } from './lib/supabase'
import {
  addCategoryDb, deleteAccountDataDb, deleteCardDb, deleteCategoryDb,
  deleteGoalDb, deleteInvoiceBatchDb, deleteTransactionDb, importInvoiceBatchDb, loadUserFinanceData,
  removeAvatarDb, saveToGoalDb, updateCategoryDb, updateProfileDb, uploadAvatarDb, upsertCardDb, upsertGoalDb, upsertTransactionDb,
} from './lib/fluxApi'
const Invoice = lazy(() => import('./Invoice'))
const Assistant = lazy(() => import('./Assistant'))
const Support = lazy(() => import('./Support'))

type Overlay =
  | { type: 'expense'; transaction?: Transaction; initialType?: TransactionType }
  | { type: 'balance' }
  | { type: 'transaction'; transaction: Transaction }
  | { type: 'card'; card?: Card }
  | { type: 'deleteCard'; card: Card }
  | { type: 'goal'; goal?: Goal }
  | { type: 'goalDetail'; goal: Goal }
  | { type: 'deleteGoal'; goal: Goal }
  | { type: 'save'; goal: Goal }
  | { type: 'budget'; category?: string }
  | { type: 'category' }
  | { type: 'deleteCategory'; category: string }
  | { type: 'account' }
  | { type: 'logout'; fromSettings?: boolean }
  | { type: 'deleteAccount' }
  | { type: 'deleteBatch'; batch: InvoiceBatch; activeCount: number }
  | { type: 'delete'; transaction: Transaction }
  | { type: 'success'; title: string; message: string; actionLabel?: string; goHome?: boolean }

function Home({ data, hidden, setHidden, balance, unreadCount, open, navigate }: {
  data: FinanceData; hidden: boolean; setHidden: (value: boolean) => void; balance: number; unreadCount: number; open: (sheet: Overlay) => void; navigate: (view: View) => void
}) {
  const [showCategories, setShowCategories] = useState(false)
  const homeRef = useRef<HTMLDivElement>(null)
  useHomeEntrance(homeRef)
  const month = monthExpenses(data.transactions)
  const total = cents(month.reduce((sum, item) => sum + item.amount, 0))
  const categories = categoryTotals(data.transactions, data.categories).filter((c) => c.value > 0)
  const comparison = Math.round((total / (2340 / .88) - 1) * 100)
  const transactions = [...data.transactions].sort((a, b) => b.date.localeCompare(a.date))
  return <div ref={homeRef}>
    <header className="home-header">
      <button className="avatar" onClick={() => open({ type: 'account' })} aria-label="Abrir conta"><Avatar name={data.profile.name} src={data.profile.avatarUrl} /></button>
      <div><span>Olá,</span><strong>{data.profile.name.split(' ')[0]}</strong></div>
      <div className="home-header-right">
        <button className="icon-button home-bell" type="button" onClick={() => navigate('notifications')} aria-label="Central de notificações">
          <Icon name="bell" size={20} />
          {unreadCount > 0 && <span className="bell-badge" aria-label={`${unreadCount} não lidas`} />}
        </button>
        <Brand showMark={false} />
      </div>
    </header>
    <section className="balance-card">
      <div className="balance-top"><span className="card-brand">flux</span><span className="mono">SEU DINHEIRO, EM FLUXO</span></div>
      <div className="balance-copy"><span>Seu saldo disponível</span><div><strong aria-label={hidden ? 'Saldo oculto' : undefined}>{hidden ? <>R$ <span style={{ letterSpacing: '.12em' }}>******</span></> : money(balance)}</strong><button onClick={() => setHidden(!hidden)} aria-label={hidden ? 'Mostrar saldo' : 'Ocultar saldo'}><Icon name={hidden ? 'eye' : 'eyeOff'} /></button><button onClick={() => open({ type: 'balance' })} aria-label="Ajustar saldo inicial" title="Ajustar saldo inicial"><Icon name="edit" size={18} /></button></div></div>
      <span className="balance-foot">Registros manuais · atualizado agora</span>
    </section>
    <section className="shortcuts home-secondary-shortcuts" aria-label="Atalhos">
      <button className="shortcut" onClick={() => navigate('invoice')}><span><Icon name="file" /></span><strong>Fatura</strong></button>
      <button className="shortcut" onClick={() => navigate('cards')}><span><Icon name="card" /></span><strong>Cartões</strong></button>
    </section>
    <div className="home-grid">
      <section className="panel month-panel">
        <div className="section-heading"><div><span className="eyebrow">ESTE MÊS</span><h2>{money(total)}</h2></div><span className="comparison">{comparison <= 0 ? '↓' : '↑'} {Math.abs(comparison)}% <em>vs. mês anterior</em></span></div>
        {categories.length ? <>
          <div className="category-bars" aria-hidden="true">{categories.map((c) => <div key={c.name} className={`category-bar ${c.tone}`} style={{ flex: c.value }} />)}</div>
          <div className="category-list">{categories.slice(0, showCategories ? undefined : 3).map((c) => <div key={c.name}><span><i className={c.tone} />{c.name}</span><strong>{money(c.value)}</strong><small>{pct(c.value, total)}%</small></div>)}</div>
          {categories.length > 3 && <button className="text-button section-link" onClick={() => setShowCategories(!showCategories)}>{showCategories ? 'Ver menos' : 'Ver todas as categorias'}</button>}
        </> : <Empty title="Um mês para começar"><p>Adicione sua primeira compra para acompanhar os gastos.</p></Empty>}
      </section>
      <section className="panel transactions-panel">
        <div className="section-heading"><div><span className="eyebrow">MOVIMENTAÇÕES</span><h2>Últimas transações</h2></div></div>
        {transactions.length ? <div className="transactions-list">{transactions.slice(0, 3).map((item) => {
          const income = isIncome(item)
          return <button className="transaction-row" key={item.id} onClick={() => open({ type: 'transaction', transaction: item })}>
            <span className={`row-icon${income ? ' income' : ''}`}><Icon name={income ? 'wallet' : categoryIcon(item.category)} /></span><span className="transaction-copy"><strong>{item.name}</strong><small>{item.category} · {prettyDate(item.date)}</small></span><strong className={`transaction-value${income ? ' income' : ''}`}>{income ? '+' : '−'} {money(item.amount)}</strong><Icon name="chevron" size={16} />
          </button>
        })}</div> : <Empty title="Nenhuma compra registrada"><p>Seu próximo gasto ou receita pode entrar por aqui.</p><button className="text-button" onClick={() => open({ type: 'expense' })}>Adicionar movimentação</button></Empty>}
        {transactions.length > 0 && <button className="text-button section-link" onClick={() => navigate('transactions')}>Analisar todas as transações<Icon name="arrow" size={15} /></button>}
      </section>
    </div>
  </div>
}

function Wallet({ data, onBack, open }: { data: FinanceData; onBack: () => void; open: (sheet: Overlay) => void }) {
  const [selectedId, setSelectedId] = useState(data.cards[0]?.id)
  const stackRef = useRef<HTMLDivElement>(null)
  const selected = data.cards.find((c) => c.id === selectedId) || data.cards[0]
  useWalletCardPulse(stackRef, selected?.id)
  const ordered = selected ? [selected, ...data.cards.filter((c) => c.id !== selected.id)] : []
  const selectedDebit = selected ? isDebitCard(selected) : false
  const used = selected && !selectedDebit ? pct(selected.bill, selected.limit) : 0
  const monthItems = monthExpenses(data.transactions)
  const selectedDebitSpend = selected
    ? cents(monthItems.filter((t) => t.cardId === selected.id).reduce((sum, t) => sum + t.amount, 0))
    : 0
  const creditCards = data.cards.filter((c) => !isDebitCard(c))
  const methodTotals = (['pix', 'cash', 'debit', 'credit'] as PaymentMethod[]).map((method) => ({
    method,
    label: PAYMENT_METHOD_LABELS[method],
    total: cents(monthItems.filter((t) => resolvePaymentMethod(t, data.cards) === method).reduce((sum, t) => sum + t.amount, 0)),
  }))
  const rotate = () => {
    if (!selected || data.cards.length < 2) return
    const currentIndex = data.cards.findIndex((card) => card.id === selected.id)
    setSelectedId(data.cards[(currentIndex + 1) % data.cards.length].id)
  }
  return <div className="view-page">
    <PageHeader title="Meus cartões" onBack={onBack} action={<button className="icon-button" onClick={() => open({ type: 'card' })} aria-label="Novo cartão"><Icon name="plus" /></button>} />
    <div className="page-intro"><span className="eyebrow">SUA CARTEIRA</span><h2>Todos os cartões.<br />Nenhuma surpresa.</h2><p>Crédito, débito e formas de pagamento do seu mês, em um só lugar.</p></div>
    {!selected ? (
      <div className="cards-layout">
        <section className="panel"><Empty icon="card" title="Sua carteira começa aqui"><p>Cadastre um cartão de crédito ou débito para organizar seus gastos, ou use Pix e Dinheiro direto nas transações.</p><button className="primary-button" onClick={() => open({ type: 'card' })}>Adicionar cartão</button></Empty></section>
        <section className="panel upcoming"><div className="section-heading"><div><span className="eyebrow">ESTE MÊS</span><h2>Meios de pagamento</h2></div></div>
          {methodTotals.map((item) => <div className="bill-row" key={item.method}><span className="row-icon"><Icon name={item.method === 'credit' || item.method === 'debit' ? 'card' : 'wallet'} /></span><span className="bill-copy"><strong>{item.label}</strong><small>Gastos registrados no mês</small></span><strong>{money(item.total)}</strong></div>)}
        </section>
      </div>
    ) : <div className="cards-layout">
      <section>
        <div ref={stackRef} className="card-stack standardized-stack" style={{ '--stack-count': Math.min(ordered.length, 3) } as CSSProperties} onClick={rotate} role="button" tabIndex={0} aria-label={`Cartão ${selected.name} em destaque. Ative para trocar.`} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); rotate() } }}>
          {ordered.slice(0, 3).map((card, index, visible) => {
            const debit = isDebitCard(card)
            const cardSpend = debit ? cents(monthItems.filter((t) => t.cardId === card.id).reduce((sum, t) => sum + t.amount, 0)) : card.bill
            return <article key={card.id} className={`wallet-card standardized-card ${card.tone}`} aria-hidden={index !== 0} style={{ '--index': index, '--stack-offset': visible.length - index - 1, zIndex: visible.length - index } as CSSProperties}>
              <div className="wallet-heading"><span>{card.name}</span><strong>•• {card.end}</strong></div>
              <svg className="card-chip" viewBox="0 0 42 32" width="38" height="29" aria-label="Chip" role="img"><rect x="1" y="1" width="40" height="30" rx="7" fill="#dbd2b2" stroke="#94886c" /><path d="M15 1v9l-5 6 5 6v9M27 1v9l5 6-5 6v9M1 10h14M1 22h14M27 10h14M27 22h14M15 10h12v12H15" fill="none" stroke="#94886c" strokeWidth=".8" /></svg>
              <span className="wallet-brand">flux</span><span className="wallet-label">{debit ? 'Cartão de Débito' : 'Fatura atual'}</span><h2>{money(cardSpend)}</h2>
              <div className="wallet-bottom"><span><strong>{data.profile.name.toUpperCase()}</strong><small>{debit ? 'Débito à vista' : `Vence em ${card.due} dias`}</small></span><span className="card-network" role="img" aria-label="Bandeira Mastercard ilustrativa"><i /><i /></span></div>
            </article>
          })}
        </div>
        <p className="stack-hint">Toque na pilha ou escolha um cartão abaixo</p>
        <div className="card-tabs" aria-label="Selecionar cartão">{data.cards.map((card) => <button aria-pressed={card.id === selected.id} key={card.id} onClick={() => setSelectedId(card.id)}>{card.name}<small>•• {card.end} · {isDebitCard(card) ? 'Débito' : 'Crédito'}</small></button>)}</div>
        <section className="usage usage-panel" aria-label={selectedDebit ? `Gastos no débito de ${selected.name}` : `Uso do limite de ${selected.name}`}>
          {selectedDebit ? (
            <>
              <div><span>Débito · {selected.name}</span><strong>{money(selectedDebitSpend)}</strong></div>
              <p className="helper-text">Gastos neste cartão descontam diretamente do saldo disponível, sem fatura mensal.</p>
              <button className="text-button" onClick={() => open({ type: 'card', card: selected })}><Icon name="edit" size={15} />Editar cartão</button>
            </>
          ) : (
            <>
              <div><span>Uso do limite · {selected.name}</span><strong>{used}%</strong></div><Progress value={used} label="Limite utilizado" />
              <div className="usage-amounts"><span><small>Utilizado</small><strong>{money(selected.bill)}</strong></span><span><small>Disponível</small><strong>{money(Math.max(0, cents(selected.limit - selected.bill)))}</strong></span></div>
              <p className="helper-text">Limite total: {money(selected.limit)}{used > 100 ? ' · Fatura acima do limite cadastrado' : ''}</p>
              <button className="text-button" onClick={() => open({ type: 'card', card: selected })}><Icon name="edit" size={15} />Editar cartão e fatura</button>
            </>
          )}
        </section>
      </section>
      <section className="panel upcoming">
        <div className="section-heading"><div><span className="eyebrow">VISÃO GERAL</span><h2>{creditCards.length ? 'Próximas faturas' : 'Meios de pagamento'}</h2></div></div>
        {creditCards.length > 0 ? (
          <>
            {creditCards.map((card) => <button className="bill-row bill-button" key={card.id} onClick={() => { setSelectedId(card.id); open({ type: 'card', card }) }}><span className="row-icon"><Icon name="card" /></span><span className="bill-copy"><strong>{card.name}</strong><small>Vence em {card.due} dias · •• {card.end}</small></span><strong>{money(card.bill)}</strong></button>)}
            <div className="bill-total"><span>Total em faturas</span><strong>{money(cents(creditCards.reduce((sum, card) => sum + card.bill, 0)))}</strong></div>
          </>
        ) : (
          <p className="helper-text">Nenhum cartão de crédito cadastrado. Você pode acompanhar seus gastos por Pix, Dinheiro e Débito abaixo.</p>
        )}
        <div className="wallet-methods-summary">
          <span className="eyebrow">ESTE MÊS POR PAGAMENTO</span>
          {methodTotals.map((item) => (
            <div className="bill-row" key={item.method}>
              <span className="row-icon"><Icon name={item.method === 'credit' || item.method === 'debit' ? 'card' : 'wallet'} /></span>
              <span className="bill-copy"><strong>{item.label}</strong></span>
              <strong>{money(item.total)}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>}
  </div>
}

function Goals({ data, onBack, open }: { data: FinanceData; onBack: () => void; open: (sheet: Overlay) => void }) {
  const total = cents(monthExpenses(data.transactions).reduce((sum, item) => sum + item.amount, 0))
  const available = cents(data.budget - total)
  const categories = categoryTotals(data.transactions, data.categories)
  const days = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate()
  return <div className="view-page">
    <PageHeader title="Metas" onBack={onBack} action={<button className="icon-button" onClick={() => open({ type: 'goal' })} aria-label="Nova meta"><Icon name="plus" /></button>} />
    <div className="page-intro"><span className="eyebrow">UM PASSO DE CADA VEZ</span><h2>Cuide do mês.<br />Planeje o que vem.</h2><p>Seu orçamento de hoje e as conquistas de amanhã.</p></div>
    <div className="goals-layout">
      <section className="goals-budget-col">
        <section className="spend-hero"><div className="spend-heading"><span className="eyebrow dark">{available >= 0 ? 'AINDA PODE GASTAR' : 'ACIMA DO ORÇAMENTO'}</span><button aria-label="Ajustar orçamento do mês" onClick={() => open({ type: 'budget' })}><Icon name="edit" size={17} /></button></div><h2>{money(Math.abs(available))}</h2><p>de {money(data.budget)} · faltam {days} dias</p><Progress value={pct(total, data.budget)} tone="dark" label="Orçamento utilizado" /><span className="budget-foot">{money(total)} gastos · {pct(total, data.budget)}% do teto</span></section>
        <div className="goals-limits-block">
          <div className="section-heading"><div><span className="eyebrow">ESTE MÊS</span><h2>Seus limites</h2></div><button className="text-button" onClick={() => open({ type: 'category' })}><Icon name="plus" size={15} />Nova categoria</button></div>
          <div className="limits-grid">{categories.map((category, index) => <button className="limit-card" key={category.name} onClick={() => open({ type: 'budget', category: category.name })}>
            <span>{category.name}</span><strong>{pct(category.value, data.limits[category.name] || 0)}%</strong><Progress value={pct(category.value, data.limits[category.name] || 0)} tone={index % 2 ? 'lilac' : 'lime'} label={`Teto de ${category.name}`} /><small>{money(category.value)} de {money(data.limits[category.name] || 0)}</small>
          </button>)}</div>
        </div>
      </section>
      <section className="goals-plans-col"><div className="section-heading goals-plans-heading"><div><span className="eyebrow">GUARDANDO</span><h2>Grandes planos</h2></div><button className="text-button" onClick={() => open({ type: 'goal' })}><Icon name="plus" size={15} />Nova meta</button></div>
        {data.goals.length ? <>
          {data.goals.slice(0, 1).map((goal) => <article className="featured-goal" key={goal.id}><div className="goal-top"><div><span className="eyebrow dark">{goal.date ? new Date(`${goal.date}T12:00:00`).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).toUpperCase() : 'NO SEU TEMPO'}</span><h3>{goal.name}</h3></div><div className="goal-top-actions"><button className="goal-edit-button" type="button" onClick={() => open({ type: 'goalDetail', goal })} aria-label={`Gerenciar meta ${goal.name}`} title="Editar ou excluir meta"><Icon name="edit" size={16} /></button><div className="goal-ring" style={{ '--progress': `${Math.min(100, pct(goal.saved, goal.target))}%` } as CSSProperties}><strong>{pct(goal.saved, goal.target)}%</strong></div></div></div><div className="goal-amount"><span>Já guardado de {money(goal.target)}</span><strong>{money(goal.saved)}</strong></div><button className="dark-button" disabled={goal.saved >= goal.target} onClick={() => open({ type: 'save', goal })}><Icon name={goal.saved >= goal.target ? 'check' : 'plus'} />{goal.saved >= goal.target ? 'Meta conquistada' : 'Guardar um valor'}</button></article>)}
          <div className="goals-list">{data.goals.slice(1).map((goal) => <div key={goal.id}><button className="goal-row-trigger" type="button" onClick={() => open({ type: 'goalDetail', goal })}><strong>{goal.name}</strong><small>{money(goal.saved)} de {money(goal.target)}</small></button><button className="goal-save-link" disabled={goal.saved >= goal.target} onClick={() => open({ type: 'save', goal })} aria-label={`Guardar em ${goal.name}`}>{goal.saved >= goal.target ? <Icon name="check" size={15} /> : <Icon name="plus" size={15} />}{pct(goal.saved, goal.target)}%</button><Progress value={pct(goal.saved, goal.target)} tone="lilac" label={goal.name} /></div>)}</div>
        </> : <section className="panel goals-empty-panel"><Empty icon="target" title="Qual é seu próximo plano?"><p>Crie uma meta e acompanhe cada valor guardado.</p><button className="text-button" onClick={() => open({ type: 'goal' })}>Criar primeira meta</button></Empty></section>}
      </section>
    </div>
  </div>
}

const sheetTitle = (sheet: Overlay) => ({
  expense: sheet.type === 'expense' && sheet.transaction ? (isIncome(sheet.transaction) ? 'Editar receita' : 'Editar gasto') : 'Nova movimentação',
  balance: 'Ajustar saldo inicial',
  transaction: sheet.type === 'transaction' && isIncome(sheet.transaction) ? 'Detalhe da receita' : 'Detalhe da compra',
  card: sheet.type === 'card' && sheet.card ? 'Editar cartão' : 'Novo cartão',
  deleteCard: 'Excluir cartão?',
  goal: sheet.type === 'goal' && sheet.goal ? 'Editar meta' : 'Nova meta',
  goalDetail: 'Detalhe da meta',
  deleteGoal: 'Excluir meta?',
  save: 'Guardar valor',
  budget: sheet.type === 'budget' && sheet.category ? `Limite · ${sheet.category}` : 'Ajustar teto',
  category: 'Nova categoria',
  deleteCategory: 'Excluir categoria?',
  account: 'Sua conta',
  logout: 'Deseja sair?',
  deleteAccount: 'Excluir conta?',
  deleteBatch: 'Excluir lote da fatura?',
  delete: sheet.type === 'delete' && isIncome(sheet.transaction) ? 'Apagar receita?' : 'Apagar compra?',
  success: 'Tudo certo!',
})[sheet.type]

export default function App() {
  const [data, setData] = useState(readData)
  const [userId, setUserId] = useState<string | null>(null)
  const [authenticated, setAuthenticated] = useState(() => {
    if (isSupabaseConfigured) return false
    try { return sessionStorage.getItem('eskgo-demo-session') === 'active' } catch { return false }
  })
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured)
  const [authBusy, setAuthBusy] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authFieldErrors, setAuthFieldErrors] = useState<AuthFieldErrors>({})
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [rememberSession, setRememberSessionState] = useState(() => getRememberSession())
  const [resetSentEmail, setResetSentEmail] = useState('')
  const [signupResult, setSignupResult] = useState<{ email: string; needsConfirmation: boolean } | null>(null)
  const [pendingEnterUser, setPendingEnterUser] = useState(false)
  const holdAuthSuccessRef = useRef(false)
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return localStorage.getItem('flux-onboarding-done') !== 'true' } catch { return false }
  })
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>(() => loadNotificationPrefs())
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => loadReadIds())
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>(() => loadDismissedIds())
  const [history, setHistory] = useState<View[]>(['home'])
  const view = history[history.length - 1]
  const [transitioning, setTransitioning] = useState(false)
  const prevAuthenticatedRef = useRef(authenticated)
  const shellRef = useRef<HTMLDivElement>(null)
  useViewEntrance(shellRef, view)
  useEffect(() => {
    if (!prevAuthenticatedRef.current && authenticated) {
      setTransitioning(true)
    }
    prevAuthenticatedRef.current = authenticated
  }, [authenticated])
  useEffect(() => {
    if (!transitioning) return
    const el = document.querySelector<HTMLElement>('.access-transition')
    return runAccessTransition(el, () => setTransitioning(false))
  }, [transitioning])
  const [sheet, setSheet] = useState<Overlay | null>(null)
  const [hidden, setHidden] = useState(data.hideOnOpen)
  const [toast, setToastState] = useState<{ message: string; tone: ToastTone } | null>(null)
  const setToast = (message: string, tone: ToastTone = 'success') => setToastState({ message, tone })
  const [storageError, setStorageError] = useState(false)
  const balance = calculateBalance(data)

  const sync = (task: Promise<void>) => {
    task.catch((err) => {
      console.error('[Flux Supabase]', err)
      setToast('Não foi possível sincronizar com o banco. Tente novamente.', 'error')
    })
  }

  useEffect(() => {
    if (!supabase) return
    let active = true
    const hydrate = async (uid: string) => {
      try {
        const remote = await loadUserFinanceData(uid)
        if (!active) return
        setUserId(uid)
        setData(remote)
        setHidden(remote.hideOnOpen)
        if (!holdAuthSuccessRef.current) setAuthenticated(true)
      } catch (err) {
        console.error('[Flux Supabase load]', err)
        if (active) setToast('Erro ao carregar seus dados do Supabase.', 'error')
      } finally {
        if (active) setAuthReady(true)
      }
    }

    void supabase.auth.getSession().then(({ data: sessionData }) => {
      const uid = sessionData.session?.user?.id
      if (uid) void hydrate(uid)
      else if (active) setAuthReady(true)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setAuthMode('reset')
        setAuthenticated(false)
        setAuthReady(true)
        return
      }
      const uid = session?.user?.id || null
      if (!uid) {
        setUserId(null)
        setAuthenticated(false)
        setAuthReady(true)
        return
      }
      void hydrate(uid)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  useLayoutEffect(() => {
    const systemTheme = data.theme === 'system' ? window.matchMedia('(prefers-color-scheme: dark)') : null
    const applyTheme = () => {
      const resolved = data.theme === 'system' ? (systemTheme?.matches ? 'dark' : 'light') : data.theme
      document.documentElement.dataset.theme = resolved
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'light' ? '#F8F7F8' : '#1A1A1A')
    }
    applyTheme()
    systemTheme?.addEventListener('change', applyTheme)
    return () => systemTheme?.removeEventListener('change', applyTheme)
  }, [data.theme])
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); setStorageError(false) }
    catch { setStorageError(true) }
  }, [data])
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToastState(null), 3500); return () => window.clearTimeout(timer) }, [toast])
  useEffect(() => { window.scrollTo(0, 0); document.querySelector<HTMLElement>('.page-header h1')?.focus({ preventScroll: true }) }, [view, authenticated])
  const navigate = (next: View) => setHistory((items) => [...items, next])
  const back = () => setHistory((items) => items.length > 1 ? items.slice(0, -1) : ['home'])
  const close = () => setSheet(null)
  const saved = (text: string) => { close(); setToast(text) }

  const clearAuthErrors = (field?: AuthField) => {
    setAuthError('')
    if (!field) setAuthFieldErrors({})
    else setAuthFieldErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleRememberSession = (remember: boolean) => {
    setRememberSessionState(remember)
    setRememberSession(remember)
  }

  const handleLogin = async (email: string, password: string) => {
    clearAuthErrors()
    setRememberSession(rememberSession)
    if (!supabase) {
      setData((current) => ({ ...current, profile: { ...current.profile, email: email || current.profile.email } }))
      try { sessionStorage.setItem('eskgo-demo-session', 'active') } catch { /* Demo mode */ }
      setHistory(['home']); setHidden(data.hideOnOpen); setAuthenticated(true)
      return
    }
    setAuthBusy(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        const msg = error.message.toLowerCase()
        if (msg.includes('email not confirmed')) {
          setAuthFieldErrors({ email: 'Confirme seu e-mail antes de entrar.' })
          setAuthError('Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada ou spam.')
        } else if (msg.includes('invalid login credentials')) {
          setAuthFieldErrors({ email: 'Verifique o e-mail digitado.', password: 'Verifique a senha digitada.' })
          setAuthError('E-mail ou senha incorretos. Confira seus dados e tente novamente.')
        } else {
          setAuthError(error.message)
        }
        return
      }
      setHistory(['home'])
    } finally {
      setAuthBusy(false)
    }
  }

  const handleSignup = async (name: string, email: string, password: string) => {
    clearAuthErrors()
    try { localStorage.removeItem('flux-onboarding-done') } catch { /* Ignore */ }
    setShowOnboarding(true)
    if (!supabase) {
      setData((current) => ({ ...current, profile: { ...current.profile, name, email, avatarUrl: undefined } }))
      try { sessionStorage.setItem('eskgo-demo-session', 'active') } catch { /* Demo mode */ }
      setSignupResult({ email, needsConfirmation: false })
      setPendingEnterUser(true)
      setAuthMode('signupSuccess')
      return
    }
    setAuthBusy(true)
    holdAuthSuccessRef.current = true
    try {
      const { data: res, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      })
      if (error) {
        holdAuthSuccessRef.current = false
        const msg = error.message.toLowerCase()
        if (msg.includes('already registered') || msg.includes('already exists')) {
          setAuthFieldErrors({ email: 'Este e-mail já está cadastrado.' })
          setAuthError('Já existe uma conta com este e-mail. Tente entrar ou redefinir sua senha.')
        } else {
          setAuthError(error.message)
        }
        return
      }
      if (!res.session) {
        holdAuthSuccessRef.current = false
        setSignupResult({ email, needsConfirmation: true })
        setPendingEnterUser(false)
        setAuthMode('signupSuccess')
        return
      }
      setSignupResult({ email, needsConfirmation: false })
      setPendingEnterUser(true)
      setAuthMode('signupSuccess')
    } finally {
      setAuthBusy(false)
    }
  }

  const handleRequestReset = async (email: string) => {
    clearAuthErrors()
    if (!supabase) {
      setResetSentEmail(email)
      return
    }
    setAuthBusy(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      })
      if (error) {
        setAuthError(error.message)
        return
      }
      setResetSentEmail(email)
    } finally {
      setAuthBusy(false)
    }
  }

  const handleUpdatePassword = async (password: string) => {
    clearAuthErrors()
    if (!supabase) {
      setPendingEnterUser(false)
      setAuthMode('resetSuccess')
      return
    }
    setAuthBusy(true)
    holdAuthSuccessRef.current = true
    try {
      const { data: res, error } = await supabase.auth.updateUser({ password })
      if (error) {
        holdAuthSuccessRef.current = false
        setAuthError(error.message)
        return
      }
      if (res.user?.id) {
        const remote = await loadUserFinanceData(res.user.id)
        setUserId(res.user.id)
        setData(remote)
        setHidden(remote.hideOnOpen)
        setPendingEnterUser(true)
      } else {
        holdAuthSuccessRef.current = false
        setPendingEnterUser(false)
      }
      setAuthMode('resetSuccess')
    } finally {
      setAuthBusy(false)
    }
  }

  const importItems = (items: Transaction[], batch: InvoiceBatch, file?: File | null) => {
    const next = importInvoiceBatch(data, batch, items)
    setData(next)
    if (userId) sync(importInvoiceBatchDb(userId, batch, items, next.cards, file))
    setSheet({
      type: 'success',
      title: 'Fatura importada!',
      message: `${items.length} lançamentos (${money(batch.total)}) foram adicionados à sua Home e à fatura do cartão.`,
      actionLabel: 'Ir para a Home',
      goHome: true,
    })
    return true
  }

  const unreadNotifications = (() => {
    const all = buildNotifications(data, balance, notificationPrefs, dismissedNotificationIds)
    return all.filter((item) => !readNotificationIds.includes(item.id)).length
  })()

  return <main className={`app${authenticated ? ' app--with-navigation' : ''}`}>
    <div className="ambient ambient-one" /><div className="ambient ambient-two" />
    {!authReady ? <SplashScreen />
      : !authenticated ? <Auth
        mode={authMode}
        setMode={(next) => { setResetSentEmail(''); setAuthMode(next) }}
        onLogin={handleLogin}
        onSignup={handleSignup}
        onRequestReset={handleRequestReset}
        onUpdatePassword={handleUpdatePassword}
        rememberSession={rememberSession}
        onChangeRememberSession={handleRememberSession}
        busy={authBusy}
        error={authError}
        fieldErrors={authFieldErrors}
        clearErrors={clearAuthErrors}
        resetSentEmail={resetSentEmail}
        signupResult={signupResult}
        onContinueAfterSignup={pendingEnterUser ? () => {
          holdAuthSuccessRef.current = false
          setPendingEnterUser(false)
          setHistory(['home'])
          setHidden(data.hideOnOpen)
          setAuthenticated(true)
        } : undefined}
        onContinueAfterReset={pendingEnterUser ? () => {
          holdAuthSuccessRef.current = false
          setPendingEnterUser(false)
          setHistory(['home'])
          setAuthenticated(true)
        } : undefined}
      /> : showOnboarding ? <Onboarding onComplete={() => {
        try { localStorage.setItem('flux-onboarding-done', 'true') } catch { /* Ignore */ }
        setShowOnboarding(false)
        setTransitioning(true)
      }} /> : <>
      <div className="app-shell" ref={shellRef}>
        {view === 'home' && <Home data={data} hidden={hidden} setHidden={setHidden} balance={balance} unreadCount={unreadNotifications} open={setSheet} navigate={navigate} />}
        {view === 'transactions' && <Transactions data={data} onBack={back} onSelect={(transaction) => setSheet({ type: 'transaction', transaction })} onAdd={() => setSheet({ type: 'expense' })} />}
        {view === 'premium' && <Premium
          onBack={back}
          onOpenAssistant={() => navigate('assistant')}
          subscriptionsTotal={categoryTotals(data.transactions, data.categories).find((c) => c.name === 'Assinaturas')?.value || 0}
        />}
        {view === 'cards' && <Wallet data={data} onBack={back} open={setSheet} />}
        {view === 'goals' && <Goals data={data} onBack={back} open={setSheet} />}
        {view === 'settings' && <Settings
          profile={data.profile}
          hideOnOpen={data.hideOnOpen}
          theme={data.theme}
          onBack={back}
          onChangeTheme={(theme) => {
            setData((current) => ({ ...current, theme }))
            if (userId) sync(updateProfileDb(userId, { theme }))
          }}
          onSaveProfile={(profile) => {
            setData((current) => ({ ...current, profile: { ...current.profile, ...profile } }))
            if (userId) sync(updateProfileDb(userId, { name: profile.name, email: profile.email }))
            setToast('Seus dados foram atualizados.')
          }}
          onUploadAvatar={async (blob, dataUrl) => {
            let nextUrl = dataUrl
            if (userId && supabase) {
              try {
                nextUrl = await uploadAvatarDb(userId, blob)
              } catch (err) {
                console.error('[Flux avatar upload]', err)
              }
            }
            setData((current) => ({ ...current, profile: { ...current.profile, avatarUrl: nextUrl } }))
            setToast('Foto de perfil atualizada.')
          }}
          onRemoveAvatar={async () => {
            if (userId && supabase) sync(removeAvatarDb(userId))
            setData((current) => ({ ...current, profile: { ...current.profile, avatarUrl: undefined } }))
            setToast('Foto de perfil removida.')
          }}
          onToggleBalance={() => {
            const nextHide = !data.hideOnOpen
            setData((current) => ({ ...current, hideOnOpen: nextHide }))
            setHidden(nextHide)
            if (userId) sync(updateProfileDb(userId, { hide_on_open: nextHide }))
          }}
          onOpenSupport={() => navigate('support')}
          onOpenNotifications={() => navigate('notifications')}
          onReplayOnboarding={() => setShowOnboarding(true)}
          onLogout={() => setSheet({ type: 'logout', fromSettings: true })}
          onDeleteAccount={() => setSheet({ type: 'deleteAccount' })}
        />}
        {view === 'notifications' && <Notifications
          data={data}
          balance={balance}
          prefs={notificationPrefs}
          readIds={readNotificationIds}
          dismissedIds={dismissedNotificationIds}
          onChangeReadIds={(next) => {
            setReadNotificationIds(next)
            saveReadIds(next)
          }}
          onChangeDismissedIds={(next) => {
            setDismissedNotificationIds(next)
            saveDismissedIds(next)
            setToast('Notificações atualizadas.')
          }}
          onChangePrefs={(next) => {
            setNotificationPrefs(next)
            saveNotificationPrefs(next)
            setToast('Preferências de notificação atualizadas.')
          }}
          onBack={back}
        />}
        <Suspense fallback={<div className="panel" role="status">Preparando sua tela…</div>}>
          {view === 'invoice' && <Invoice cards={data.cards} categories={data.categories} batches={data.invoiceBatches} transactions={data.transactions} onBack={back} onConfirm={importItems} onDeleteBatch={(batch, activeCount) => setSheet({ type: 'deleteBatch', batch, activeCount })} />}
          {view === 'assistant' && <Assistant data={data} onBack={back} />}
          {view === 'support' && <Support profile={data.profile} onBack={back} />}
        </Suspense>
        <footer className="app-footer"><span>flux</span>Entenda seu dinheiro. Cuide do seu fluxo.</footer>
      </div>
      {!sheet && <BottomNavigation view={view} profileName={data.profile.name} avatarUrl={data.profile.avatarUrl} unreadNotifications={unreadNotifications} onOpenAccount={() => setSheet({ type: 'account' })} onAdd={() => setSheet({ type: 'expense' })} onNavigate={(next) => {
        if (next === view) return
        setHistory((current) => next === 'premium' ? [...current, next] : next === 'home' ? ['home'] : ['home', next])
      }} />}
      {sheet && <Sheet key={`${sheet.type}-${sheet.type === 'expense' ? sheet.transaction?.id || 'new' : sheet.type === 'card' ? sheet.card?.id || 'new' : sheet.type === 'goal' ? sheet.goal?.id || 'new' : sheet.type === 'budget' ? sheet.category || 'month' : ''}`} title={sheetTitle(sheet)} close={close}>
        {sheet.type === 'expense' && <ExpenseForm cards={data.cards} categories={data.categories} transaction={sheet.transaction} initialType={sheet.initialType} onSave={(transaction) => {
          const next = upsertExpense(data, transaction)
          setData(next)
          if (userId) sync(upsertTransactionDb(userId, transaction, next.cards))
          saved(sheet.transaction ? 'Movimentação atualizada.' : isIncome(transaction) ? 'Receita adicionada. Saldo atualizado.' : 'Gasto adicionado. Tudo atualizado.')
        }} />}
        {sheet.type === 'balance' && <BalanceForm value={data.initialBalance} onSave={(initialBalance) => {
          setData((current) => ({ ...current, initialBalance }))
          if (userId) sync(updateProfileDb(userId, { initial_balance: initialBalance }))
          saved('Saldo inicial atualizado.')
        }} />}
        {sheet.type === 'card' && <CardForm card={sheet.card} onSave={(card) => {
          setData((current) => ({ ...current, cards: current.cards.some((item) => item.id === card.id) ? current.cards.map((item) => item.id === card.id ? card : item) : [...current.cards, card] }))
          if (userId) sync(upsertCardDb(userId, card))
          saved(sheet.card ? 'Cartão atualizado.' : 'Cartão salvo na sua carteira.')
        }} onDelete={sheet.card ? () => setSheet({ type: 'deleteCard', card: sheet.card! }) : undefined} />}
        {sheet.type === 'deleteCard' && <div className="confirmation"><p>O cartão <strong>{sheet.card.name} (•• {sheet.card.end})</strong> será removido. Compras vinculadas a ele serão mantidas como <strong>Dinheiro / Pix</strong>.</p><button className="danger-button" onClick={() => {
          const cardId = sheet.card.id
          setData((current) => removeCard(current, cardId))
          if (userId) sync(deleteCardDb(userId, cardId))
          saved('Cartão excluído.')
        }}>Sim, excluir cartão</button><button className="secondary-button" onClick={() => setSheet({ type: 'card', card: sheet.card })}>Manter cartão</button></div>}
        {sheet.type === 'goal' && <GoalForm goal={sheet.goal} onSave={(goal) => {
          const next = upsertGoal(data, goal)
          setData(next)
          if (userId) sync(upsertGoalDb(userId, goal, next.cashAdjustment))
          saved(sheet.goal ? 'Meta atualizada.' : 'Meta criada. Primeiro passo dado.')
        }} onDelete={sheet.goal ? () => setSheet({ type: 'deleteGoal', goal: sheet.goal! }) : undefined} />}
        {sheet.type === 'goalDetail' && <div className="detail-sheet">
          <span className="row-icon large"><Icon name="target" /></span><h3>{sheet.goal.name}</h3><strong>{money(sheet.goal.saved)}</strong>
          <div>
            <span>Meta total<b>{money(sheet.goal.target)}</b></span>
            <span>Progresso<b>{pct(sheet.goal.saved, sheet.goal.target)}%</b></span>
            <span>Faltam<b>{money(Math.max(0, cents(sheet.goal.target - sheet.goal.saved)))}</b></span>
            <span>Data desejada<b>{sheet.goal.date ? prettyDate(sheet.goal.date) : 'No seu tempo'}</b></span>
          </div>
          {sheet.goal.saved < sheet.goal.target && <button className="primary-button" style={{ marginTop: 0, marginBottom: 10 }} onClick={() => setSheet({ type: 'save', goal: sheet.goal })}><Icon name="plus" />Guardar valor</button>}
          <div className="detail-actions"><button onClick={() => setSheet({ type: 'goal', goal: sheet.goal })}><Icon name="edit" />Editar</button><button onClick={() => setSheet({ type: 'deleteGoal', goal: sheet.goal })}><Icon name="trash" />Excluir</button></div>
        </div>}
        {sheet.type === 'deleteGoal' && <div className="confirmation"><p>A meta <strong>{sheet.goal.name}</strong> será excluída.{sheet.goal.saved > 0 ? <> O valor já guardado de <strong>{money(sheet.goal.saved)}</strong> voltará para o seu saldo disponível.</> : ''}</p><button className="danger-button" onClick={() => {
          const goalId = sheet.goal.id
          const next = removeGoal(data, goalId)
          setData(next)
          if (userId) sync(deleteGoalDb(userId, goalId, next.cashAdjustment))
          saved('Meta excluída.')
        }}>Sim, excluir meta</button><button className="secondary-button" onClick={() => setSheet({ type: 'goalDetail', goal: sheet.goal })}>Manter meta</button></div>}
        {sheet.type === 'save' && <SaveForm goal={sheet.goal} balance={balance} onSave={(amount) => {
          const targetGoal = sheet.goal
          const nextCash = cents(data.cashAdjustment - amount)
          const nextSaved = cents(targetGoal.saved + amount)
          setData((current) => ({ ...current, cashAdjustment: nextCash, goals: current.goals.map((goal) => goal.id === targetGoal.id ? { ...goal, saved: nextSaved } : goal) }))
          if (userId) sync(saveToGoalDb(userId, targetGoal, amount, nextCash))
          if (nextSaved >= targetGoal.target) {
            setSheet({
              type: 'success',
              title: 'Meta conquistada!',
              message: `Você alcançou 100% da meta "${targetGoal.name}" com ${money(targetGoal.target)}. Parabéns!`,
              actionLabel: 'Continuar',
            })
          } else {
            saved(`${money(amount)} guardados em ${targetGoal.name}.`)
          }
        }} />}
        {sheet.type === 'budget' && <BudgetForm
          name={sheet.category || 'seu mês'}
          value={sheet.category ? (data.limits[sheet.category] || 0) : data.budget}
          isCustom={Boolean(sheet.category && isCustomCategory(sheet.category))}
          existingCategories={data.categories}
          onSave={(value, newName) => {
            if (sheet.category) {
              const oldCat = sheet.category
              const nextName = newName || oldCat
              setData((current) => updateCategory(current, oldCat, nextName, value))
              if (userId) sync(updateCategoryDb(userId, oldCat, nextName, value))
              saved('Limite da categoria atualizado.')
            } else {
              setData((current) => ({ ...current, budget: value }))
              if (userId) sync(updateProfileDb(userId, { monthly_budget: value }))
              saved('Teto atualizado.')
            }
          }}
          onDelete={sheet.category && isCustomCategory(sheet.category) ? () => setSheet({ type: 'deleteCategory', category: sheet.category! }) : undefined}
        />}
        {sheet.type === 'category' && <CategoryForm existingCategories={data.categories} onSave={(name, limit) => {
          const nextOrder = data.categories.length + 1
          setData((current) => addCategory(current, name, limit))
          if (userId) sync(addCategoryDb(userId, name, limit, nextOrder))
          saved(`Categoria ${name} criada.`)
        }} />}
        {sheet.type === 'deleteCategory' && <div className="confirmation"><p>A categoria <strong>{sheet.category}</strong> será excluída. Gastos vinculados a ela serão movidos para <strong>Outros</strong>.</p><button className="danger-button" onClick={() => {
          const catName = sheet.category
          setData((current) => removeCategory(current, catName))
          if (userId) sync(deleteCategoryDb(userId, catName))
          saved('Categoria excluída.')
        }}>Sim, excluir categoria</button><button className="secondary-button" onClick={() => setSheet({ type: 'budget', category: sheet.category })}>Manter categoria</button></div>}
        {sheet.type === 'transaction' && <div className="detail-sheet">
          <span className={`row-icon large${isIncome(sheet.transaction) ? ' income' : ''}`}><Icon name={isIncome(sheet.transaction) ? 'wallet' : categoryIcon(sheet.transaction.category)} /></span><h3>{sheet.transaction.name}</h3><strong className={isIncome(sheet.transaction) ? 'income' : undefined}>{isIncome(sheet.transaction) ? '+' : '−'} {money(sheet.transaction.amount)}</strong>
          <div>
            <span>Tipo<b>{isIncome(sheet.transaction) ? 'Receita' : 'Gasto'}</b></span>
            <span>Categoria<b>{sheet.transaction.category}</b></span>
            {!isIncome(sheet.transaction) && <span>Pagamento<b>{paymentLabel(sheet.transaction, data.cards)}</b></span>}
            <span>Data<b>{prettyDate(sheet.transaction.date)}</b></span>
          </div>
          <div className="detail-actions"><button onClick={() => setSheet({ type: 'expense', transaction: sheet.transaction })}><Icon name="edit" />Editar</button><button onClick={() => setSheet({ type: 'delete', transaction: sheet.transaction })}><Icon name="trash" />Apagar</button></div>
        </div>}
        {sheet.type === 'delete' && <div className="confirmation"><p>{isIncome(sheet.transaction) ? 'A receita' : 'A compra'} <strong>{sheet.transaction.name}</strong> de {money(sheet.transaction.amount)} será removida. Seu saldo e os totais serão recalculados.</p><button className="danger-button" onClick={() => {
          const tx = sheet.transaction
          const next = removeExpense(data, tx)
          setData(next)
          if (userId) sync(deleteTransactionDb(userId, tx.id, next.cards))
          saved(isIncome(tx) ? 'Receita apagada. Saldo atualizado.' : 'Compra apagada. Valores atualizados.')
        }}>Sim, apagar</button><button className="secondary-button" onClick={() => setSheet({ type: 'transaction', transaction: sheet.transaction })}>Manter</button></div>}
        {sheet.type === 'account' && <div className="account-sheet">
          <button className="account-person account-settings-link" onClick={() => { close(); navigate('settings') }} aria-label="Configurações do app e da conta"><span className="account-avatar"><Avatar name={data.profile.name} src={data.profile.avatarUrl} /></span><span className="account-settings-copy"><strong>{data.profile.name}{data.profile.role === 'admin' ? ' · Admin' : ''}</strong><span>{data.profile.email}</span><small>Configurações do app e da conta</small></span><Icon name="chevron" size={18} /></button>
          <button className="account-link-row" onClick={() => { close(); navigate('notifications') }}><span>Notificações {unreadNotifications > 0 ? `(${unreadNotifications})` : ''}</span><Icon name="chevron" size={18} /></button>
          <button className="account-link-row" onClick={() => { close(); navigate('support') }}><span>Ajuda e Fale Conosco</span><Icon name="chevron" size={18} /></button>
          <button role="switch" aria-checked={data.hideOnOpen} onClick={() => {
            const nextHide = !data.hideOnOpen
            setData((current) => ({ ...current, hideOnOpen: nextHide }))
            setHidden(nextHide)
            if (userId) sync(updateProfileDb(userId, { hide_on_open: nextHide }))
          }}><span>Ocultar saldo ao entrar</span><i className={`toggle ${data.hideOnOpen ? 'on' : ''}`} /></button>
          <button className="logout" onClick={() => setSheet({ type: 'logout' })}>Sair</button>
        </div>}
        {sheet.type === 'logout' && <div className="confirmation"><p>Tem certeza de que deseja sair da sua conta?</p><button className="primary-button" onClick={() => {
          try { localStorage.removeItem(STORAGE_KEY); sessionStorage.removeItem('eskgo-demo-session') } catch { /* Local demo only. */ }
          if (supabase) void supabase.auth.signOut()
          close(); setAuthMode('login'); setAuthenticated(false); setUserId(null); setHistory(['home'])
        }}>Sim, sair</button><button className="secondary-button" onClick={() => sheet.fromSettings ? close() : setSheet({ type: 'account' })}>Continuar no flux</button></div>}
        {sheet.type === 'deleteBatch' && <div className="confirmation"><p>O lote <strong>{sheet.batch.fileName}</strong>{sheet.activeCount > 0 ? <> e os <strong>{sheet.activeCount} {sheet.activeCount === 1 ? 'lançamento vinculado' : 'lançamentos vinculados'}</strong></> : ''} serão removidos. Seu saldo e a fatura do cartão serão recalculados.</p><button className="danger-button" onClick={() => {
          const batchId = sheet.batch.id
          const next = removeInvoiceBatch(data, batchId)
          setData(next)
          if (userId) sync(deleteInvoiceBatchDb(userId, batchId, next.cards))
          saved('Lote da fatura excluído.')
        }}>Sim, excluir lote</button><button className="secondary-button" onClick={close}>Manter lote</button></div>}
        {sheet.type === 'deleteAccount' && <div className="confirmation"><p>Todos os seus registros (transações, cartões, metas, categorias e perfil) serão apagados e sua sessão será encerrada.</p><button className="danger-button" onClick={() => {
          const uid = userId
          try { localStorage.removeItem(STORAGE_KEY); sessionStorage.removeItem('eskgo-demo-session') } catch { /* Local demo only. */ }
          if (uid) sync(deleteAccountDataDb(uid))
          setData(initialData()); close(); setAuthMode('login'); setAuthenticated(false); setUserId(null); setHistory(['home']); setToast('Conta e dados excluídos.')
        }}>Sim, excluir conta e dados</button><button className="secondary-button" onClick={close}>Manter minha conta</button></div>}
        {sheet.type === 'success' && <SuccessState
          title={sheet.title}
          description={sheet.message}
          actionLabel={sheet.actionLabel || 'Continuar'}
          onAction={() => {
            const goHome = sheet.goHome
            close()
            if (goHome) setHistory(['home'])
          }}
        />}
      </Sheet>}
    </>}
    {transitioning && <AccessTransition />}
    {storageError && <div className="storage-warning" role="alert">O navegador bloqueou o armazenamento. As alterações duram apenas enquanto o app estiver aberto.</div>}
    {toast && <Toast message={toast.message} tone={toast.tone} onClose={() => setToastState(null)} />}
  </main>
}
