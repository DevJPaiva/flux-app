import { lazy, Suspense, useEffect, useLayoutEffect, useState, type CSSProperties, type FormEvent } from 'react'
import {
  STORAGE_KEY, addCategory, calculateBalance, categoryIcon, categoryTotals, cents, importInvoiceBatch,
  initialData, isCustomCategory, isIncome, money, monthExpenses, pct, prettyDate, readData, removeCard,
  removeCategory, removeExpense, removeGoal, removeInvoiceBatch, updateCategory, upsertExpense, upsertGoal,
  type Card, type FinanceData, type Goal, type InvoiceBatch, type Transaction, type TransactionType, type View,
} from './finance'
import { Brand, Empty, Icon, PageHeader, Progress, Sheet } from './ui'
import { BalanceForm, BudgetForm, CardForm, CategoryForm, ExpenseForm, GoalForm, SaveForm } from './forms'
import Settings from './Settings'
import BottomNavigation from './BottomNavigation'
import Transactions from './Transactions'
import Premium from './Premium'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import {
  addCategoryDb, deleteAccountDataDb, deleteCardDb, deleteCategoryDb,
  deleteGoalDb, deleteInvoiceBatchDb, deleteTransactionDb, importInvoiceBatchDb, loadUserFinanceData,
  saveToGoalDb, updateCategoryDb, updateProfileDb, upsertCardDb, upsertGoalDb, upsertTransactionDb,
} from './lib/fluxApi'
const Invoice = lazy(() => import('./Invoice'))
const Assistant = lazy(() => import('./Assistant'))

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

function Auth({
  mode,
  switchMode,
  enter,
  busy,
  error,
}: {
  mode: 'login' | 'signup'
  switchMode: () => void
  enter: (name: string, email: string, password: string) => Promise<void>
  busy: boolean
  error: string
}) {
  const signup = mode === 'signup'
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fields = new FormData(e.currentTarget)
    void enter(
      signup ? String(fields.get('name') || '') : '',
      String(fields.get('email') || ''),
      String(fields.get('password') || ''),
    )
  }
  return <div className="auth-page">
    <header className="auth-header"><Brand showMark={false} /></header>
    <div className="auth-layout">
      <section className="auth-story">
        <span className="eyebrow">SEU DINHEIRO. SUAS CONQUISTAS.</span>
        <h1>Mais clareza.<br /><span>Mais possibilidades.</span></h1>
        <p>Entenda o fluxo do seu dinheiro. Um lugar para cuidar do hoje e planejar tudo que vem depois.</p>
        <div className="auth-visual" aria-hidden="true">
          <article className="auth-mini-card"><div><span>Flux</span><Icon name="card" /></div><small>Seu saldo</small><strong>R$ 14.500</strong><span>O próximo passo é seu.</span></article>
          <div className="auth-mini-goal"><span className="row-icon"><Icon name="target" /></span><div><strong>Viagem ao Japão</strong><small>68% mais perto de acontecer</small><Progress value={68} tone="dark" /></div></div>
        </div>
      </section>
      <section className="auth-form-panel" key={mode}>
        {signup && <span className="eyebrow">COMECE DO SEU JEITO</span>}
        <h2>{signup ? 'Grandes planos\ncomeçam aqui.' : 'Seu dinheiro,\ncom mais clareza.'}</h2>
        <p>{signup ? 'Crie seu espaço para organizar e conquistar.' : 'Entre e continue cuidando do que importa.'}</p>
        <form className="form" noValidate onSubmit={submit}>
          {signup && <label><span>Seu nome</span><input name="name" placeholder="Como podemos chamar você?" autoComplete="name" /></label>}
          <label><span>E-mail</span><input name="email" type="email" placeholder="seu@email.com" autoComplete="email" /></label>
          <label><span>Senha</span><input name="password" type="password" placeholder="Sua senha" autoComplete={signup ? 'new-password' : 'current-password'} /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button" disabled={busy}>{busy ? 'Conectando…' : signup ? 'Criar conta' : 'Entrar'}<Icon name="arrow" /></button>
        </form>
        <p className="auth-switch">{signup ? 'Já tem uma conta?' : 'Primeira vez por aqui?'} <button className="text-button" type="button" onClick={switchMode}>{signup ? 'Entrar' : 'Criar conta'}</button></p>
      </section>
    </div>
    <footer className="auth-footer">Feito para os seus próximos passos.</footer>
  </div>
}

function Home({ data, hidden, setHidden, balance, open, navigate }: {
  data: FinanceData; hidden: boolean; setHidden: (value: boolean) => void; balance: number; open: (sheet: Overlay) => void; navigate: (view: View) => void
}) {
  const [showCategories, setShowCategories] = useState(false)
  const month = monthExpenses(data.transactions)
  const total = cents(month.reduce((sum, item) => sum + item.amount, 0))
  const categories = categoryTotals(data.transactions, data.categories).filter((c) => c.value > 0)
  const comparison = Math.round((total / (2340 / .88) - 1) * 100)
  const transactions = [...data.transactions].sort((a, b) => b.date.localeCompare(a.date))
  return <>
    <header className="home-header">
      <button className="avatar" onClick={() => open({ type: 'account' })} aria-label="Abrir conta"><img src="/profile-photo.png" alt="" /></button>
      <div><span>Olá,</span><strong>{data.profile.name.split(' ')[0]}</strong></div><Brand showMark={false} />
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
  </>
}

function Wallet({ data, onBack, open }: { data: FinanceData; onBack: () => void; open: (sheet: Overlay) => void }) {
  const [selectedId, setSelectedId] = useState(data.cards[0]?.id)
  const selected = data.cards.find((c) => c.id === selectedId) || data.cards[0]
  const ordered = selected ? [selected, ...data.cards.filter((c) => c.id !== selected.id)] : []
  const used = selected ? pct(selected.bill, selected.limit) : 0
  const rotate = () => {
    if (!selected || data.cards.length < 2) return
    const currentIndex = data.cards.findIndex((card) => card.id === selected.id)
    setSelectedId(data.cards[(currentIndex + 1) % data.cards.length].id)
  }
  return <div className="view-page">
    <PageHeader title="Meus cartões" onBack={onBack} action={<button className="icon-button" onClick={() => open({ type: 'card' })} aria-label="Novo cartão"><Icon name="plus" /></button>} />
    <div className="page-intro"><span className="eyebrow">SUA CARTEIRA</span><h2>Todos os cartões.<br />Nenhuma surpresa.</h2><p>Faturas e limites registrados por você, em um só lugar.</p></div>
    {!selected ? <section className="panel"><Empty icon="card" title="Sua carteira começa aqui"><p>Cadastre um cartão para acompanhar faturas e limites.</p><button className="primary-button" onClick={() => open({ type: 'card' })}>Adicionar cartão</button></Empty></section> : <div className="cards-layout">
      <section>
        <div className="card-stack standardized-stack" style={{ '--stack-count': Math.min(ordered.length, 3) } as CSSProperties} onClick={rotate} role="button" tabIndex={0} aria-label={`Cartão ${selected.name} em destaque. Ative para trocar.`} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); rotate() } }}>
          {ordered.slice(0, 3).map((card, index, visible) => <article key={card.id} className={`wallet-card standardized-card ${card.tone}`} aria-hidden={index !== 0} style={{ '--index': index, '--stack-offset': visible.length - index - 1, zIndex: visible.length - index } as CSSProperties}>
            <div className="wallet-heading"><span>{card.name}</span><strong>•• {card.end}</strong></div>
            <svg className="card-chip" viewBox="0 0 42 32" width="38" height="29" aria-label="Chip" role="img"><rect x="1" y="1" width="40" height="30" rx="7" fill="#dbd2b2" stroke="#94886c" /><path d="M15 1v9l-5 6 5 6v9M27 1v9l5 6-5 6v9M1 10h14M1 22h14M27 10h14M27 22h14M15 10h12v12H15" fill="none" stroke="#94886c" strokeWidth=".8" /></svg>
            <span className="wallet-brand">flux</span><span className="wallet-label">Fatura atual</span><h2>{money(card.bill)}</h2>
            <div className="wallet-bottom"><span><strong>{data.profile.name.toUpperCase()}</strong><small>Vence em {card.due} dias</small></span><span className="card-network" role="img" aria-label="Bandeira Mastercard ilustrativa"><i /><i /></span></div>
          </article>)}
        </div>
        <p className="stack-hint">Toque na pilha ou escolha um cartão abaixo</p>
        <div className="card-tabs" aria-label="Selecionar cartão">{data.cards.map((card) => <button aria-pressed={card.id === selected.id} key={card.id} onClick={() => setSelectedId(card.id)}>{card.name}<small>•• {card.end}</small></button>)}</div>
        <section className="usage usage-panel" aria-label={`Uso do limite de ${selected.name}`}>
          <div><span>Uso do limite · {selected.name}</span><strong>{used}%</strong></div><Progress value={used} label="Limite utilizado" />
          <div className="usage-amounts"><span><small>Utilizado</small><strong>{money(selected.bill)}</strong></span><span><small>Disponível</small><strong>{money(Math.max(0, cents(selected.limit - selected.bill)))}</strong></span></div>
          <p className="helper-text">Limite total: {money(selected.limit)}{used > 100 ? ' · Fatura acima do limite cadastrado' : ''}</p>
          <button className="text-button" onClick={() => open({ type: 'card', card: selected })}><Icon name="edit" size={15} />Editar cartão e fatura</button>
        </section>
      </section>
      <section className="panel upcoming"><div className="section-heading"><div><span className="eyebrow">VISÃO GERAL</span><h2>Próximas faturas</h2></div></div>
        {data.cards.map((card) => <button className="bill-row bill-button" key={card.id} onClick={() => { setSelectedId(card.id); open({ type: 'card', card }) }}><span className="row-icon"><Icon name="card" /></span><span className="bill-copy"><strong>{card.name}</strong><small>Vence em {card.due} dias · •• {card.end}</small></span><strong>{money(card.bill)}</strong></button>)}
        <div className="bill-total"><span>Total registrado</span><strong>{money(cents(data.cards.reduce((sum, card) => sum + card.bill, 0)))}</strong></div>
        <p className="helper-text">Os valores são manuais. Toque em uma fatura para ajustar.</p>
      </section>
    </div>}
  </div>
}

function Goals({ data, onBack, open, navigate }: { data: FinanceData; onBack: () => void; open: (sheet: Overlay) => void; navigate: (view: View) => void }) {
  const total = cents(monthExpenses(data.transactions).reduce((sum, item) => sum + item.amount, 0))
  const available = cents(data.budget - total)
  const categories = categoryTotals(data.transactions, data.categories)
  const days = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate()
  const subscriptions = categories.find((c) => c.name === 'Assinaturas')?.value || 0
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
        <button className="assistant-card" onClick={() => navigate('assistant')}><div><span className="eyebrow dark">ASSISTENTE FLUX</span><strong>{subscriptions ? `Você registrou ${money(subscriptions)} em assinaturas. Vamos olhar de perto?` : 'Seus planos começam com clareza. Vamos olhar seus números?'}</strong></div><span className="round-arrow"><Icon name="arrow" /></span></button>
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
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [history, setHistory] = useState<View[]>(['home'])
  const view = history[history.length - 1]
  const [sheet, setSheet] = useState<Overlay | null>(null)
  const [hidden, setHidden] = useState(data.hideOnOpen)
  const [toast, setToast] = useState('')
  const [storageError, setStorageError] = useState(false)
  const balance = calculateBalance(data)

  const sync = (task: Promise<void>) => {
    task.catch((err) => {
      console.error('[Flux Supabase]', err)
      setToast('Não foi possível sincronizar com o banco. Tente novamente.')
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
        setAuthenticated(true)
      } catch (err) {
        console.error('[Flux Supabase load]', err)
        if (active) setToast('Erro ao carregar seus dados do Supabase.')
      } finally {
        if (active) setAuthReady(true)
      }
    }

    void supabase.auth.getSession().then(({ data: sessionData }) => {
      const uid = sessionData.session?.user?.id
      if (uid) void hydrate(uid)
      else if (active) setAuthReady(true)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
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
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 3300); return () => window.clearTimeout(timer) }, [toast])
  useEffect(() => { window.scrollTo(0, 0); document.querySelector<HTMLElement>('.page-header h1')?.focus({ preventScroll: true }) }, [view, authenticated])
  const navigate = (next: View) => setHistory((items) => [...items, next])
  const back = () => setHistory((items) => items.length > 1 ? items.slice(0, -1) : ['home'])
  const close = () => setSheet(null)
  const saved = (text: string) => { close(); setToast(text) }

  const enter = async (name: string, email: string, password: string) => {
    setAuthError('')
    const cleanEmail = email.trim()
    const cleanName = name.trim()
    if (!supabase) {
      if (cleanName || cleanEmail) setData((current) => ({ ...current, profile: { name: cleanName || current.profile.name, email: cleanEmail || current.profile.email } }))
      try { sessionStorage.setItem('eskgo-demo-session', 'active') } catch { /* The preview also works without session storage. */ }
      setHistory(['home']); setHidden(data.hideOnOpen); setAuthenticated(true)
      return
    }
    if (!cleanEmail || !password) {
      setAuthError('Informe e-mail e senha para continuar.')
      return
    }
    setAuthBusy(true)
    try {
      if (authMode === 'signup') {
        if (!cleanName) { setAuthError('Informe seu nome para criar a conta.'); return }
        const { data: res, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { data: { name: cleanName } },
        })
        if (error) { setAuthError(error.message); return }
        if (!res.session) {
          setToast('Conta criada! Verifique seu e-mail para confirmar o acesso.')
          setAuthMode('login')
          return
        }
        setHistory(['home'])
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password })
        if (error) {
          setAuthError('E-mail ou senha incorretos. Verifique seus dados ou crie uma conta.')
          return
        }
        setHistory(['home'])
      }
    } finally {
      setAuthBusy(false)
    }
  }

  const importItems = (items: Transaction[], batch: InvoiceBatch, file?: File | null) => {
    const next = importInvoiceBatch(data, batch, items)
    setData(next)
    if (userId) sync(importInvoiceBatchDb(userId, batch, items, next.cards, file))
    setToast(`${items.length} lançamentos adicionados à Home.`)
    return true
  }

  return <main className={`app${authenticated ? ' app--with-navigation' : ''}`}>
    <div className="ambient ambient-one" /><div className="ambient ambient-two" />
    {!authReady ? <div className="app-shell"><div className="panel" role="status">Conectando ao seu espaço Flux…</div></div>
      : !authenticated ? <Auth mode={authMode} switchMode={() => { setAuthError(''); setAuthMode(authMode === 'login' ? 'signup' : 'login') }} enter={enter} busy={authBusy} error={authError} /> : <>
      <div className="app-shell">
        {view === 'home' && <Home data={data} hidden={hidden} setHidden={setHidden} balance={balance} open={setSheet} navigate={navigate} />}
        {view === 'transactions' && <Transactions data={data} onBack={back} onSelect={(transaction) => setSheet({ type: 'transaction', transaction })} onAdd={() => setSheet({ type: 'expense' })} />}
        {view === 'premium' && <Premium onBack={back} />}
        {view === 'cards' && <Wallet data={data} onBack={back} open={setSheet} />}
        {view === 'goals' && <Goals data={data} onBack={back} open={setSheet} navigate={navigate} />}
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
          onToggleBalance={() => {
            const nextHide = !data.hideOnOpen
            setData((current) => ({ ...current, hideOnOpen: nextHide }))
            setHidden(nextHide)
            if (userId) sync(updateProfileDb(userId, { hide_on_open: nextHide }))
          }}
          onLogout={() => setSheet({ type: 'logout', fromSettings: true })}
          onDeleteAccount={() => setSheet({ type: 'deleteAccount' })}
        />}
        <Suspense fallback={<div className="panel" role="status">Preparando sua tela…</div>}>
          {view === 'invoice' && <Invoice cards={data.cards} categories={data.categories} batches={data.invoiceBatches} transactions={data.transactions} onBack={back} onConfirm={importItems} onDeleteBatch={(batch, activeCount) => setSheet({ type: 'deleteBatch', batch, activeCount })} />}
          {view === 'assistant' && <Assistant data={data} onBack={back} />}
        </Suspense>
        <footer className="app-footer"><span>flux</span>Entenda seu dinheiro. Cuide do seu fluxo.</footer>
      </div>
      {!sheet && <BottomNavigation view={view} profileName={data.profile.name} onOpenAccount={() => setSheet({ type: 'account' })} onAdd={() => setSheet({ type: 'expense' })} onNavigate={(next) => {
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
          setData((current) => ({ ...current, cashAdjustment: nextCash, goals: current.goals.map((goal) => goal.id === targetGoal.id ? { ...goal, saved: cents(goal.saved + amount) } : goal) }))
          if (userId) sync(saveToGoalDb(userId, targetGoal, amount, nextCash))
          saved(`${money(amount)} guardados em ${targetGoal.name}.`)
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
            {!isIncome(sheet.transaction) && <span>Pagamento<b>{data.cards.find((card) => card.id === sheet.transaction.cardId)?.name || 'Dinheiro / Pix'}</b></span>}
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
          <button className="account-person account-settings-link" onClick={() => { close(); navigate('settings') }} aria-label="Configurações do app e da conta"><span className="account-avatar"><img src="/profile-photo.png" alt="" /></span><span className="account-settings-copy"><strong>{data.profile.name}{data.profile.role === 'admin' ? ' · Admin' : ''}</strong><span>{data.profile.email}</span><small>Configurações do app e da conta</small></span><Icon name="chevron" size={18} /></button>
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
      </Sheet>}
    </>}
    {storageError && <div className="storage-warning" role="alert">O navegador bloqueou o armazenamento. As alterações duram apenas enquanto o app estiver aberto.</div>}
    {toast && <div className="toast" role="status"><Icon name="check" />{toast}</div>}
  </main>
}
