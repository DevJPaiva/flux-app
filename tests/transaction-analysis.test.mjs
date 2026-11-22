import assert from 'node:assert/strict'
import { test } from 'node:test'
import { initialData, today } from '../src/finance.ts'
import { defaultFilters, filterTransactions } from '../src/transaction-analysis.ts'

test('o histórico completo é o padrão e a busca ignora acentos', () => {
  const { transactions } = initialData()
  assert.equal(filterTransactions(transactions, defaultFilters).length, 8)
  const matches = filterTransactions(transactions, { ...defaultFilters, search: '  ALIMENTACAO  ' })
  assert.equal(matches.length, 3)
  assert(matches.every((t) => t.category === 'Alimentação'))
})

test('categoria e pagamento são combinados, incluindo dinheiro e Pix', () => {
  const { transactions } = initialData()
  const matches = filterTransactions(transactions, { ...defaultFilters, category: 'Alimentação', cardId: 'principal' })
  assert.equal(matches.length, 2)
  assert(matches.every((t) => t.category === 'Alimentação' && t.cardId === 'principal'))
  assert.equal(filterTransactions(transactions, { ...defaultFilters, cardId: '' }).length, 2)
})

test('o período personalizado inclui os limites e rejeita datas invertidas', () => {
  const transactions = initialData().transactions.slice(0, 3).map((item, i) => ({ ...item, date: `2026-01-0${i + 1}` }))
  const filters = { ...defaultFilters, period: 'custom', start: '2026-01-02', end: '2026-01-03' }
  assert.equal(filterTransactions(transactions, filters).length, 2)
  assert.equal(filterTransactions(transactions, { ...filters, start: '2026-01-04' }).length, 0)
})

test('o filtro deste mês exclui compras de outros meses', () => {
  const transactions = initialData().transactions.slice(0, 2).map((t, i) => ({ ...t, date: i ? '2020-01-01' : today() }))
  assert.equal(filterTransactions(transactions, { ...defaultFilters, period: 'month' }).length, 1)
})

test('ordenação por valor não altera os dados originais e busca sem resultado é vazia', () => {
  const { transactions } = initialData()
  const before = [...transactions]
  assert.equal(filterTransactions(transactions, { ...defaultFilters, sort: 'highest' })[0].name, 'Aluguel')
  assert.equal(filterTransactions(transactions, { ...defaultFilters, sort: 'lowest' })[0].name, 'Padaria')
  assert.deepEqual(transactions, before)
  assert.equal(filterTransactions(transactions, { ...defaultFilters, search: 'inexistente' }).length, 0)
})
