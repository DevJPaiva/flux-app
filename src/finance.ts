export type View = 'home' | 'transactions' | 'cards' | 'goals' | 'invoice' | 'assistant' | 'settings' | 'premium'
export type IconName = 'plus' | 'card' | 'target' | 'file' | 'eye' | 'eyeOff' | 'home' | 'arrow' | 'close' | 'market' | 'repeat' | 'car' | 'wallet' | 'spark' | 'trash' | 'edit' | 'chevron' | 'send' | 'camera' | 'upload' | 'calendar' | 'check' | 'moon' | 'sun' | 'monitor'
export type TransactionType = 'expense' | 'income'
export type Transaction = { id: string; type?: TransactionType; name: string; category: string; cardId: string; date: string; amount: number; batch?: string }
export type Card = { id: string; name: string; end: string; bill: number; limit: number; due: number; tone: 'white' | 'lilac' | 'gradient' }
export type Goal = { id: string; name: string; saved: number; target: number; date: string }
export type InvoiceBatch = { id: string; fileName: string; cardId: string; createdAt: string; itemsCount: number; total: number }
export type Theme = 'dark' | 'light' | 'system'
export type UserRole = 'user' | 'admin'
export type FinanceData = {
  transactions: Transaction[]; cards: Card[]; goals: Goal[]; categories: string[]
  budget: number; limits: Record<string, number>; initialBalance: number; cashAdjustment: number
  hideOnOpen: boolean; theme: Theme; profile: { name: string; email: string; role?: UserRole }; importedBatches: string[]; invoiceBatches: InvoiceBatch[]
}
export const CATEGORY_NAMES = ['Moradia', 'Alimentação', 'Transporte', 'Lazer', 'Assinaturas', 'Outros']
export const INCOME_CATEGORIES = ['Salário', 'Freelance', 'Rendimentos', 'Reembolso', 'Outros']
export const COLORS = ['lime', 'lilac', 'white', 'muted', 'lilac', 'muted']
export const isIncome = (transaction: Pick<Transaction, 'type'>) => transaction.type === 'income'
export const isCustomCategory = (name: string) => !CATEGORY_NAMES.includes(name)
export const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2 })
export const cents = (value: number) => Math.round(value * 100) / 100
export const numberValue = (value: string) => {
  const cleaned = value.replace(/R\$\s?/g, '').replace(/\s/g, '')
  return Number(cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned)
}
export const today = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export const prettyDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR')
export const categoryIcon = (category: string): IconName => ({ Alimentação: 'market', Assinaturas: 'repeat', Transporte: 'car', Moradia: 'home', Lazer: 'spark' }[category] as IconName || 'wallet')
export const pct = (value: number, target: number) => target > 0 ? Math.round(value / target * 100) : 0
export const monthTransactions = (transactions: Transaction[]) => transactions.filter((t) => t.date.slice(0, 7) === today().slice(0, 7))
export const monthExpenses = (transactions: Transaction[]) => monthTransactions(transactions).filter((t) => !isIncome(t))
export const categoryTotals = (transactions: Transaction[], categories: string[] = CATEGORY_NAMES) => categories.map((name, i) => ({
  name, value: cents(monthExpenses(transactions).filter((t) => t.category === name).reduce((sum, t) => sum + t.amount, 0)), tone: COLORS[i % COLORS.length],
}))
export const calculateBalance = (data: FinanceData) => {
  const incomes = data.transactions.filter(isIncome).reduce((sum, item) => sum + item.amount, 0)
  const expenses = data.transactions.filter((item) => !isIncome(item)).reduce((sum, item) => sum + item.amount, 0)
  return cents(data.initialBalance + data.cashAdjustment + incomes - expenses)
}
export function initialData(): FinanceData {
  return {
    transactions: [
      { id: 'seed-1', name: 'Mercado', category: 'Alimentação', cardId: 'principal', date: today(), amount: 286 },
      { id: 'seed-2', name: 'Netflix', category: 'Assinaturas', cardId: 'principal', date: today(), amount: 55.9 },
      { id: 'seed-3', name: 'Uber', category: 'Transporte', cardId: 'salario', date: today(), amount: 32 },
      { id: 'seed-4', name: 'Padaria', category: 'Alimentação', cardId: '', date: today(), amount: 24 },
      { id: 'seed-5', name: 'Aluguel', category: 'Moradia', cardId: '', date: today().slice(0, 8) + '01', amount: 936 },
      { id: 'seed-6', name: 'Compras do mês', category: 'Alimentação', cardId: 'principal', date: today().slice(0, 8) + '01', amount: 392 },
      { id: 'seed-7', name: 'Combustível', category: 'Transporte', cardId: 'salario', date: today().slice(0, 8) + '01', amount: 436 },
      { id: 'seed-8', name: 'Cinema e passeios', category: 'Lazer', cardId: 'principal', date: today().slice(0, 8) + '01', amount: 178.1 },
    ],
    cards: [
      { id: 'principal', name: 'Principal', end: '4552', bill: 1284, limit: 3000, due: 8, tone: 'gradient' },
      { id: 'salario', name: 'Salário', end: '6917', bill: 640, limit: 5000, due: 12, tone: 'lilac' },
      { id: 'viagem', name: 'Viagem', end: '1180', bill: 98, limit: 8000, due: 27, tone: 'white' },
    ],
    goals: [
      { id: 'japao', name: 'Viagem ao Japão', saved: 13600, target: 20000, date: '2027-12-01' },
      { id: 'reserva', name: 'Reserva', saved: 7200, target: 10000, date: '' },
      { id: 'curso', name: 'Curso', saved: 2700, target: 3000, date: '' },
      { id: 'carro', name: 'Carro novo', saved: 9600, target: 40000, date: '' },
    ],
    categories: [...CATEGORY_NAMES],
    budget: 3200, limits: { Alimentação: 1132, Moradia: 936, Transporte: 1170, Lazer: 228, Assinaturas: 150, Outros: 300 },
    initialBalance: 16840, cashAdjustment: 0, hideOnOpen: false, theme: 'dark', profile: { name: 'Lucas Almeida', email: 'lucas@exemplo.com' }, importedBatches: [], invoiceBatches: [],
  }
}

export const STORAGE_KEY = 'eskgo-frontend-v2'
export function readData(): FinanceData {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as FinanceData | null
    if (stored && Array.isArray(stored.transactions) && Array.isArray(stored.cards) && Array.isArray(stored.goals) && stored.profile && stored.limits && Array.isArray(stored.importedBatches)) {
      const categories = Array.isArray(stored.categories) && stored.categories.length ? stored.categories : [...CATEGORY_NAMES]
      const initialBalance = typeof stored.initialBalance === 'number' && Number.isFinite(stored.initialBalance) ? stored.initialBalance : 16840
      const baseBatches = Array.isArray(stored.invoiceBatches) ? stored.invoiceBatches : []
      const existingBatchIds = new Set(baseBatches.map((b) => b.id))
      const legacyBatchIds = [...new Set(stored.transactions.map((t) => t.batch).filter((b): b is string => typeof b === 'string' && b.length > 0 && !existingBatchIds.has(b)))]
      const invoiceBatches: InvoiceBatch[] = [
        ...baseBatches,
        ...legacyBatchIds.map((id) => {
          const items = stored.transactions.filter((t) => t.batch === id)
          return {
            id,
            fileName: id === SAMPLE_BATCH ? 'Fatura importada (anterior)' : `Fatura ${id.slice(0, 8)}`,
            cardId: items[0]?.cardId || '',
            createdAt: items[0]?.date || today(),
            itemsCount: items.length,
            total: cents(items.reduce((sum, item) => sum + item.amount, 0)),
          }
        }),
      ]
      return { ...stored, categories, initialBalance, invoiceBatches, theme: stored.theme === 'light' || stored.theme === 'system' ? stored.theme : 'dark' }
    }
  } catch { /* A damaged or unavailable browser store must not prevent demo access. */ }
  const seed = initialData()
  try {
    const legacy = JSON.parse(localStorage.getItem('eskgo-transactions') || 'null')
    if (Array.isArray(legacy)) {
      const migrated = legacy.filter((item) => item && Number.isFinite(item.amount) && item.amount > 0 && typeof item.name === 'string')
        .map((item) => ({
          id: `legacy-${item.id}`, name: item.name,
          category: CATEGORY_NAMES.includes(item.category) ? item.category : 'Outros',
          cardId: seed.cards.find((card) => String(item.card).includes(card.end))?.id || '',
          date: /^\d{4}-\d{2}-\d{2}$/.test(item.date) ? item.date : today(), amount: item.amount,
        }))
      return { ...seed, transactions: [...migrated, ...seed.transactions.slice(4)] }
    }
  } catch { /* Preserve the original store and use the example if migration is unavailable. */ }
  return seed
}

export function upsertExpense(data: FinanceData, transaction: Transaction): FinanceData {
  const normalized: Transaction = isIncome(transaction) ? { ...transaction, cardId: '' } : transaction
  const old = data.transactions.find((t) => t.id === normalized.id)
  return {
    ...data,
    transactions: old ? data.transactions.map((t) => t.id === normalized.id ? normalized : t) : [normalized, ...data.transactions],
    cards: data.cards.map((card) => ({
      ...card,
      bill: cents(Math.max(
        0,
        card.bill
        - (old && !isIncome(old) && old.cardId === card.id ? old.amount : 0)
        + (!isIncome(normalized) && normalized.cardId === card.id ? normalized.amount : 0),
      )),
    })),
  }
}
export function removeExpense(data: FinanceData, transaction: Transaction): FinanceData {
  return {
    ...data,
    transactions: data.transactions.filter((t) => t.id !== transaction.id),
    cards: data.cards.map((card) => ({
      ...card,
      bill: cents(Math.max(0, card.bill - (!isIncome(transaction) && transaction.cardId === card.id ? transaction.amount : 0))),
    })),
  }
}
export function removeCard(data: FinanceData, cardId: string): FinanceData {
  return {
    ...data,
    cards: data.cards.filter((card) => card.id !== cardId),
    transactions: data.transactions.map((t) => t.cardId === cardId ? { ...t, cardId: '' } : t),
  }
}
export function upsertGoal(data: FinanceData, goal: Goal): FinanceData {
  const old = data.goals.find((item) => item.id === goal.id)
  const savedDelta = old ? cents(goal.saved - old.saved) : cents(goal.saved)
  return {
    ...data,
    cashAdjustment: cents(data.cashAdjustment - savedDelta),
    goals: old ? data.goals.map((item) => item.id === goal.id ? goal : item) : [goal, ...data.goals],
  }
}
export function removeGoal(data: FinanceData, goalId: string): FinanceData {
  const target = data.goals.find((item) => item.id === goalId)
  if (!target) return data
  return {
    ...data,
    cashAdjustment: cents(data.cashAdjustment + target.saved),
    goals: data.goals.filter((item) => item.id !== goalId),
  }
}
export function addCategory(data: FinanceData, name: string, limit: number): FinanceData {
  const trimmed = name.trim()
  if (!trimmed || data.categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return data
  return {
    ...data,
    categories: [...data.categories, trimmed],
    limits: { ...data.limits, [trimmed]: limit },
  }
}
export function updateCategory(data: FinanceData, oldName: string, newName: string, limit: number): FinanceData {
  const trimmed = newName.trim()
  if (!trimmed) return data
  if (trimmed !== oldName && data.categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return data
  const nextLimits = { ...data.limits }
  if (trimmed !== oldName) delete nextLimits[oldName]
  nextLimits[trimmed] = limit
  return {
    ...data,
    categories: data.categories.map((c) => c === oldName ? trimmed : c),
    limits: nextLimits,
    transactions: trimmed === oldName
      ? data.transactions
      : data.transactions.map((t) => !isIncome(t) && t.category === oldName ? { ...t, category: trimmed } : t),
  }
}
export function removeCategory(data: FinanceData, name: string): FinanceData {
  if (!isCustomCategory(name)) return data
  const nextLimits = { ...data.limits }
  delete nextLimits[name]
  return {
    ...data,
    categories: data.categories.filter((c) => c !== name),
    limits: nextLimits,
    transactions: data.transactions.map((t) => !isIncome(t) && t.category === name ? { ...t, category: 'Outros' } : t),
  }
}
export function importInvoiceBatch(data: FinanceData, batch: InvoiceBatch, items: Transaction[]): FinanceData {
  const withItems = items.reduce(upsertExpense, data)
  return {
    ...withItems,
    importedBatches: withItems.importedBatches.includes(batch.id) ? withItems.importedBatches : [...withItems.importedBatches, batch.id],
    invoiceBatches: [batch, ...withItems.invoiceBatches],
  }
}
export function removeInvoiceBatch(data: FinanceData, batchId: string): FinanceData {
  const batchItems = data.transactions.filter((t) => t.batch === batchId)
  const withoutItems = batchItems.reduce(removeExpense, data)
  return {
    ...withoutItems,
    importedBatches: withoutItems.importedBatches.filter((id) => id !== batchId),
    invoiceBatches: withoutItems.invoiceBatches.filter((b) => b.id !== batchId),
  }
}
export const SAMPLE_BATCH = 'eskgo-fatura-exemplo-v1'
export function sampleInvoice(): Transaction[] {
  const purchases: [string, string, number][] = [
    ['Supermercado', 'Alimentação', 320], ['Restaurante', 'Alimentação', 160], ['Combustível', 'Transporte', 240],
    ['Netflix', 'Assinaturas', 55.9], ['Spotify', 'Assinaturas', 21.9], ['Armazenamento', 'Assinaturas', 29.9],
    ['Clube de leitura', 'Assinaturas', 19.9], ['Aplicativo', 'Assinaturas', 14.9], ['Streaming', 'Assinaturas', 12.9],
    ...Array.from({ length: 25 }, (_, i): [string, string, number] => [
      `${['Café', 'Padaria', 'Ônibus', 'Lanchonete', 'Passeio'][i % 5]} ${Math.floor(i / 5) + 1}`,
      ['Alimentação', 'Alimentação', 'Transporte', 'Alimentação', 'Lazer'][i % 5], i === 24 ? 24.6 : 16,
    ]),
  ]
  return purchases.map(([name, category, amount], i) => ({ id: `invoice-${i}`, name, category, amount, cardId: 'principal', date: today(), batch: SAMPLE_BATCH }))
}
