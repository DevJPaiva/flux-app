import { isIncome, resolvePaymentMethod, today, type Transaction } from './finance.ts'

export type TransactionFilters = {
  search: string
  period: 'all' | 'month' | 'custom'
  category: string
  cardId: string
  start: string
  end: string
  sort: 'newest' | 'oldest' | 'highest' | 'lowest'
}
export const defaultFilters: TransactionFilters = {
  search: '', period: 'all', category: '', cardId: 'all', start: '', end: '', sort: 'newest',
}
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
export function filterTransactions(transactions: Transaction[], filters: TransactionFilters): Transaction[] {
  if (filters.period === 'custom' && filters.start && filters.end && filters.start > filters.end) return []
  const search = normalize(filters.search)
  return transactions.filter((item) => {
    if (search && !normalize(`${item.name} ${item.category}`).includes(search)) return false
    if (filters.category && item.category !== filters.category) return false
    if (filters.cardId !== 'all') {
      if (filters.cardId.startsWith('method:')) {
        const method = filters.cardId.slice(7)
        if (isIncome(item) || resolvePaymentMethod(item) !== method) return false
      } else if (item.cardId !== filters.cardId) {
        return false
      }
    }
    if (filters.period === 'month' && item.date.slice(0, 7) !== today().slice(0, 7)) return false
    if (filters.period === 'custom' && ((filters.start && item.date < filters.start) || (filters.end && item.date > filters.end))) return false
    return true
  }).sort((a, b) => {
    if (filters.sort === 'highest') return b.amount - a.amount || b.date.localeCompare(a.date)
    if (filters.sort === 'lowest') return a.amount - b.amount || b.date.localeCompare(a.date)
    return filters.sort === 'oldest' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)
  })
}
