import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  STORAGE_KEY, addCategory, calculateBalance, categoryTotals, cents, importInvoiceBatch, initialData, numberValue, readData,
  removeCard, removeCategory, removeExpense, removeGoal, removeInvoiceBatch, sampleInvoice, today, updateCategory, upsertExpense, upsertGoal,
} from '../src/finance.ts'

test('os dados de referência fecham saldo e orçamento', () => {
  const data = initialData()
  assert.equal(data.theme, 'dark')
  const total = cents(data.transactions.reduce((sum, item) => sum + item.amount, 0))
  assert.equal(total, 2340)
  assert.equal(cents(16840 - total), 14500)
  assert.equal(data.budget - total, 860)
  assert.equal(categoryTotals(data.transactions).reduce((sum, c) => cents(sum + c.value), 0), total)
})

test('inclusão, edição entre cartões e exclusão são consistentes', () => {
  const seed = initialData()
  const expense = { id: 'test', name: 'Compra teste', category: 'Alimentação', cardId: 'principal', date: today(), amount: 100 }
  const added = upsertExpense(seed, expense)
  assert.equal(added.cards[0].bill, 1384)
  assert.equal(categoryTotals(added.transactions).find((c) => c.name === 'Alimentação').value, 802)
  const edited = upsertExpense(added, { ...expense, amount: 50, cardId: 'salario' })
  assert.equal(edited.cards[0].bill, 1284)
  assert.equal(edited.cards[1].bill, 690)
  assert.deepEqual(removeExpense(edited, edited.transactions[0]), seed)
})

test('uma compra de outro mês não altera o orçamento atual', () => {
  const data = upsertExpense(initialData(), { id: 'old', name: 'Compra antiga', category: 'Alimentação', cardId: '', date: '2020-01-01', amount: 50 })
  assert.equal(categoryTotals(data.transactions).find((c) => c.name === 'Alimentação').value, 702)
})

test('valores em português são interpretados e arredondados em centavos', () => {
  assert.equal(numberValue('1.284,50'), 1284.5)
  assert.equal(numberValue('R$ 500,00'), 500)
  assert.equal(cents(0.1 + 0.2), 0.3)
  assert.equal(Number.isFinite(numberValue('valor inválido')), false)
})

test('fatura demonstrativa tem 34 compras, 6 assinaturas e total de R$ 1.284', () => {
  const invoice = sampleInvoice()
  assert.equal(invoice.length, 34)
  assert.equal(invoice.filter((item) => item.category === 'Assinaturas').length, 6)
  assert.equal(cents(invoice.reduce((sum, item) => sum + item.amount, 0)), 1284)
  assert.equal(new Set(invoice.map((item) => item.id)).size, 34)
})

test('armazenamento inválido não bloqueia o protótipo e registros anteriores são migrados', () => {
  globalThis.localStorage = { getItem: () => '{invalid' }
  assert.equal(readData().transactions.length, 8)
  globalThis.localStorage = {
    getItem: (key) => key === STORAGE_KEY ? null : JSON.stringify([{ id: 123, name: 'Gasto anterior', category: 'Alimentação', amount: 25, card: 'Principal •• 4552', date: 'Agora' }]),
  }
  const migrated = readData()
  assert.equal(migrated.transactions[0].name, 'Gasto anterior')
  assert.equal(migrated.transactions[0].cardId, 'principal')
  assert.equal(migrated.transactions[0].date, today())
  delete globalThis.localStorage
})

test('dados anteriores recebem o tema escuro sem perder registros ou preferências', () => {
  const stored = { ...initialData(), hideOnOpen: true }
  delete stored.theme
  try {
    globalThis.localStorage = { getItem: (key) => key === STORAGE_KEY ? JSON.stringify(stored) : null }
    assert.deepEqual(readData(), { ...stored, theme: 'dark' })
  } finally {
    delete globalThis.localStorage
  }
})

test('o tema salvo é restaurado e valores desconhecidos voltam ao escuro', () => {
  try {
    for (const [value, expected] of [['light', 'light'], ['dark', 'dark'], ['system', 'system'], ['unknown', 'dark']]) {
      const stored = { ...initialData(), theme: value }
      globalThis.localStorage = { getItem: (key) => key === STORAGE_KEY ? JSON.stringify(stored) : null }
      const restored = readData()
      assert.equal(restored.theme, expected)
      const expense = { id: 'theme-test', name: 'Café', amount: 10, category: 'Alimentação', cardId: '', date: today() }
      assert.equal(removeExpense(upsertExpense(restored, expense), expense).theme, expected)
    }
  } finally {
    delete globalThis.localStorage
  }
})

test('CRUD de receitas, saldo, cartões, metas e categorias customizadas mantém integridade', () => {
  const seed = initialData()
  assert.equal(calculateBalance(seed), 14500)

  // Receita: Create, Update, Delete (não altera fatura de cartão nem gastos do mês)
  const income = { id: 'inc-1', type: 'income', name: 'Freelance', category: 'Freelance', cardId: 'principal', date: today(), amount: 1500 }
  const withIncome = upsertExpense(seed, income)
  assert.equal(calculateBalance(withIncome), 16000)
  assert.equal(withIncome.cards[0].bill, seed.cards[0].bill)
  assert.equal(categoryTotals(withIncome.transactions, withIncome.categories).reduce((s, c) => cents(s + c.value), 0), 2340)
  const editedIncome = upsertExpense(withIncome, { ...income, amount: 2000 })
  assert.equal(calculateBalance(editedIncome), 16500)
  assert.equal(calculateBalance(removeExpense(editedIncome, editedIncome.transactions[0])), 14500)

  // Cartão: Delete desvincula compras para Dinheiro / Pix (cardId: '')
  const withoutCard = removeCard(seed, 'principal')
  assert.equal(withoutCard.cards.length, 2)
  assert.equal(withoutCard.transactions.some((t) => t.cardId === 'principal'), false)

  // Meta: Update (ajustando valor guardado) e Delete (devolvendo valor guardado ao saldo)
  const updatedGoal = upsertGoal(seed, { ...seed.goals[0], name: 'Japão 2028', target: 25000, saved: 14000 })
  assert.equal(updatedGoal.goals[0].name, 'Japão 2028')
  assert.equal(calculateBalance(updatedGoal), 14100)
  const withoutGoal = removeGoal(updatedGoal, 'japao')
  assert.equal(withoutGoal.goals.length, seed.goals.length - 1)
  assert.equal(calculateBalance(withoutGoal), 28100)

  // Categorias customizadas: Create, Update (renomeia transações), Delete (move para Outros)
  const withPets = addCategory(seed, 'Pets', 400)
  assert.equal(withPets.categories.includes('Pets'), true)
  assert.equal(withPets.limits.Pets, 400)
  const withPetExpense = upsertExpense(withPets, { id: 'pet-1', name: 'Ração', category: 'Pets', cardId: '', date: today(), amount: 120 })
  const renamed = updateCategory(withPetExpense, 'Pets', 'Animais', 500)
  assert.equal(renamed.categories.includes('Animais'), true)
  assert.equal(renamed.limits.Animais, 500)
  assert.equal(renamed.transactions.find((t) => t.id === 'pet-1').category, 'Animais')
  const removed = removeCategory(renamed, 'Animais')
  assert.equal(removed.categories.includes('Animais'), false)
  assert.equal(removed.transactions.find((t) => t.id === 'pet-1').category, 'Outros')
  // Categorias padrão não são removidas
  assert.equal(removeCategory(seed, 'Moradia').categories.includes('Moradia'), true)

  // Lotes de fatura: Create em lote + Read + Delete desfazendo transações e fatura do cartão
  const batchId = 'batch-nov-2026'
  const items = sampleInvoice().slice(0, 2).map((item, i) => ({ ...item, id: `b-item-${i}`, batch: batchId, cardId: 'principal' }))
  const batch = { id: batchId, fileName: 'fatura-nov.pdf', cardId: 'principal', createdAt: today(), itemsCount: items.length, total: 480 }
  const withBatch = importInvoiceBatch(seed, batch, items)
  assert.equal(withBatch.invoiceBatches.length, 1)
  assert.equal(withBatch.transactions.length, seed.transactions.length + 2)
  assert.equal(withBatch.cards[0].bill, seed.cards[0].bill + 480)
  assert.equal(calculateBalance(withBatch), 14020)
  const withoutBatch = removeInvoiceBatch(withBatch, batchId)
  assert.equal(withoutBatch.invoiceBatches.length, 0)
  assert.equal(withoutBatch.transactions.length, seed.transactions.length)
  assert.equal(withoutBatch.cards[0].bill, seed.cards[0].bill)
  assert.equal(calculateBalance(withoutBatch), 14500)
})
