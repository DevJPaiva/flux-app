import {
  CATEGORY_NAMES,
  COLORS,
  cents,
  isIncome,
  type Card,
  type FinanceData,
  type Goal,
  type InvoiceBatch,
  type Theme,
  type Transaction,
} from '../finance'
import { supabase } from './supabase'

const num = (value: unknown, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? cents(parsed) : fallback
}

export async function loadUserFinanceData(userId: string): Promise<FinanceData> {
  if (!supabase) throw new Error('Supabase não configurado.')

  const [profileRes, categoriesRes, cardsRes, batchesRes, txRes, goalsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('categories').select('*').eq('user_id', userId).order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
    supabase.from('cards').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
    supabase.from('invoice_batches').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('transactions').select('*').eq('user_id', userId).order('occurred_at', { ascending: false }).order('created_at', { ascending: false }),
    supabase.from('goals').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
  ])

  const firstError = [profileRes.error, categoriesRes.error, cardsRes.error, batchesRes.error, txRes.error, goalsRes.error].find(Boolean)
  if (firstError) throw firstError

  const profileRow = profileRes.data
  const categoryRows = categoriesRes.data || []
  const categories = categoryRows.length ? categoryRows.map((c) => String(c.name)) : [...CATEGORY_NAMES]
  const limits: Record<string, number> = {}
  if (categoryRows.length) {
    categoryRows.forEach((c) => { limits[String(c.name)] = num(c.monthly_limit, 300) })
  } else {
    CATEGORY_NAMES.forEach((name) => { limits[name] = 300 })
  }

  const cards: Card[] = (cardsRes.data || []).map((c) => ({
    id: String(c.id),
    name: String(c.name),
    end: String(c.last4).trim(),
    bill: num(c.bill_amount),
    limit: num(c.credit_limit),
    due: Number(c.due_day) || 8,
    tone: (c.tone === 'white' || c.tone === 'lilac' || c.tone === 'gradient' ? c.tone : 'gradient'),
  }))

  const invoiceBatches: InvoiceBatch[] = (batchesRes.data || []).map((b) => ({
    id: String(b.id),
    fileName: String(b.file_name),
    cardId: b.card_id ? String(b.card_id) : '',
    createdAt: String(b.imported_at),
    itemsCount: Number(b.items_count) || 0,
    total: num(b.total_amount),
  }))

  const transactions: Transaction[] = (txRes.data || []).map((t) => ({
    id: String(t.id),
    type: t.type === 'income' ? 'income' : 'expense',
    name: String(t.name),
    category: String(t.category),
    cardId: t.card_id ? String(t.card_id) : '',
    date: String(t.occurred_at),
    amount: num(t.amount),
    batch: t.batch_id ? String(t.batch_id) : undefined,
  }))

  const goals: Goal[] = (goalsRes.data || []).map((g) => ({
    id: String(g.id),
    name: String(g.name),
    saved: num(g.saved_amount),
    target: num(g.target_amount),
    date: g.target_date ? String(g.target_date) : '',
  }))

  const theme: Theme = profileRow?.theme === 'light' || profileRow?.theme === 'system' ? profileRow.theme : 'dark'

  return {
    transactions,
    cards,
    goals,
    categories,
    budget: num(profileRow?.monthly_budget, 3200),
    limits,
    initialBalance: num(profileRow?.initial_balance, 16840),
    cashAdjustment: num(profileRow?.cash_adjustment, 0),
    hideOnOpen: Boolean(profileRow?.hide_on_open),
    theme,
    profile: {
      name: String(profileRow?.name || 'Usuário'),
      email: String(profileRow?.email || ''),
      role: profileRow?.role === 'admin' ? 'admin' : 'user',
    },
    importedBatches: invoiceBatches.map((b) => b.id),
    invoiceBatches,
  }
}

export async function updateProfileDb(
  userId: string,
  patch: Partial<{
    name: string
    email: string
    initial_balance: number
    cash_adjustment: number
    monthly_budget: number
    hide_on_open: boolean
    theme: Theme
  }>,
) {
  if (!supabase) return
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId)
  if (error) throw error
}

async function syncCardBills(userId: string, cards: Card[]) {
  if (!supabase || !cards.length) return
  await Promise.all(
    cards.map(async (card) => {
      const { error } = await supabase!.from('cards').update({ bill_amount: card.bill }).eq('id', card.id).eq('user_id', userId)
      if (error) throw error
    }),
  )
}

export async function upsertTransactionDb(userId: string, tx: Transaction, updatedCards: Card[]) {
  if (!supabase) return
  const income = isIncome(tx)
  const { error } = await supabase.from('transactions').upsert({
    id: tx.id,
    user_id: userId,
    card_id: income ? null : (tx.cardId || null),
    batch_id: tx.batch || null,
    type: income ? 'income' : 'expense',
    name: tx.name,
    category: tx.category,
    amount: tx.amount,
    occurred_at: tx.date,
  })
  if (error) throw error
  await syncCardBills(userId, updatedCards)
}

export async function deleteTransactionDb(userId: string, txId: string, updatedCards: Card[]) {
  if (!supabase) return
  const { error } = await supabase.from('transactions').delete().eq('id', txId).eq('user_id', userId)
  if (error) throw error
  await syncCardBills(userId, updatedCards)
}

export async function upsertCardDb(userId: string, card: Card) {
  if (!supabase) return
  const { error } = await supabase.from('cards').upsert({
    id: card.id,
    user_id: userId,
    name: card.name,
    last4: card.end,
    bill_amount: card.bill,
    credit_limit: card.limit,
    due_day: card.due,
    tone: card.tone,
  })
  if (error) throw error
}

export async function deleteCardDb(userId: string, cardId: string) {
  if (!supabase) return
  const { error } = await supabase.from('cards').delete().eq('id', cardId).eq('user_id', userId)
  if (error) throw error
}

export async function upsertGoalDb(userId: string, goal: Goal, cashAdjustment: number) {
  if (!supabase) return
  const { error } = await supabase.from('goals').upsert({
    id: goal.id,
    user_id: userId,
    name: goal.name,
    saved_amount: goal.saved,
    target_amount: goal.target,
    target_date: goal.date || null,
  })
  if (error) throw error
  await updateProfileDb(userId, { cash_adjustment: cashAdjustment })
}

export async function saveToGoalDb(userId: string, goal: Goal, amount: number, cashAdjustment: number) {
  if (!supabase) return
  const nextSaved = cents(goal.saved + amount)
  const [goalRes, contribRes] = await Promise.all([
    supabase.from('goals').update({ saved_amount: nextSaved }).eq('id', goal.id).eq('user_id', userId),
    supabase.from('goal_contributions').insert({ goal_id: goal.id, user_id: userId, amount }),
  ])
  if (goalRes.error) throw goalRes.error
  if (contribRes.error) throw contribRes.error
  await updateProfileDb(userId, { cash_adjustment: cashAdjustment })
}

export async function deleteGoalDb(userId: string, goalId: string, cashAdjustment: number) {
  if (!supabase) return
  const { error } = await supabase.from('goals').delete().eq('id', goalId).eq('user_id', userId)
  if (error) throw error
  await updateProfileDb(userId, { cash_adjustment: cashAdjustment })
}

export async function addCategoryDb(userId: string, name: string, limit: number, sortOrder: number) {
  if (!supabase) return
  const tone = COLORS[sortOrder % COLORS.length]
  const { error } = await supabase.from('categories').insert({
    user_id: userId,
    name: name.trim(),
    monthly_limit: limit,
    tone,
    is_default: false,
    sort_order: sortOrder,
  })
  if (error) throw error
}

export async function updateCategoryDb(userId: string, oldName: string, newName: string, limit: number) {
  if (!supabase) return
  const trimmed = newName.trim()
  const { error } = await supabase
    .from('categories')
    .update({ name: trimmed, monthly_limit: limit })
    .eq('user_id', userId)
    .eq('name', oldName)
  if (error) throw error

  if (trimmed !== oldName) {
    const { error: txErr } = await supabase
      .from('transactions')
      .update({ category: trimmed })
      .eq('user_id', userId)
      .eq('type', 'expense')
      .eq('category', oldName)
    if (txErr) throw txErr
  }
}

export async function deleteCategoryDb(userId: string, name: string) {
  if (!supabase) return
  const { error } = await supabase.from('categories').delete().eq('user_id', userId).eq('name', name)
  if (error) throw error
}

export async function importInvoiceBatchDb(
  userId: string,
  batch: InvoiceBatch,
  items: Transaction[],
  updatedCards: Card[],
  file?: File | null,
) {
  if (!supabase) return
  let storagePath: string | null = null
  if (file) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${userId}/${batch.id}-${safeName}`
    const { error: uploadErr } = await supabase.storage.from('invoices').upload(path, file, { upsert: true })
    if (!uploadErr) storagePath = path
  }

  const { error: batchErr } = await supabase.from('invoice_batches').insert({
    id: batch.id,
    user_id: userId,
    card_id: batch.cardId || null,
    file_name: batch.fileName,
    storage_path: storagePath,
    items_count: items.length,
    total_amount: batch.total,
    imported_at: batch.createdAt,
  })
  if (batchErr) throw batchErr

  if (items.length) {
    const { error: txErr } = await supabase.from('transactions').insert(
      items.map((tx) => ({
        id: tx.id,
        user_id: userId,
        card_id: tx.cardId || null,
        batch_id: batch.id,
        type: 'expense' as const,
        name: tx.name,
        category: tx.category,
        amount: tx.amount,
        occurred_at: tx.date,
      })),
    )
    if (txErr) throw txErr
  }

  await syncCardBills(userId, updatedCards)
}

export async function deleteInvoiceBatchDb(userId: string, batchId: string, updatedCards: Card[]) {
  if (!supabase) return
  const { data: batchRow } = await supabase.from('invoice_batches').select('storage_path').eq('id', batchId).eq('user_id', userId).maybeSingle()
  const { error } = await supabase.from('invoice_batches').delete().eq('id', batchId).eq('user_id', userId)
  if (error) throw error
  if (batchRow?.storage_path) {
    await supabase.storage.from('invoices').remove([batchRow.storage_path])
  }
  await syncCardBills(userId, updatedCards)
}

export async function deleteAccountDataDb(userId: string) {
  if (!supabase) return
  const { error } = await supabase.from('profiles').delete().eq('id', userId)
  if (error) throw error
  await supabase.auth.signOut()
}
