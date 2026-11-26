import { useState } from 'react'
import { INCOME_CATEGORIES, categoryIcon, cents, isDebitCard, isIncome, money, paymentLabel, prettyDate, type FinanceData, type Transaction } from './finance'
import { defaultFilters, filterTransactions, type TransactionFilters } from './transaction-analysis'
import { Empty, Icon, PageHeader } from './ui'

export default function Transactions({ data, onBack, onSelect, onAdd }: {
  data: FinanceData
  onBack: () => void
  onSelect: (transaction: Transaction) => void
  onAdd: () => void
}) {
  const [filters, setFilters] = useState<TransactionFilters>(defaultFilters)
  const update = (patch: Partial<TransactionFilters>) => setFilters((current) => ({ ...current, ...patch }))
  const filtered = filterTransactions(data.transactions, filters)
  const expenseItems = filtered.filter((item) => !isIncome(item))
  const incomeItems = filtered.filter(isIncome)
  const total = cents(expenseItems.reduce((sum, item) => sum + item.amount, 0))
  const totalIncome = cents(incomeItems.reduce((sum, item) => sum + item.amount, 0))
  const groups = new Map<string, Transaction[]>()
  filtered.forEach((item) => groups.set(item.date, [...(groups.get(item.date) || []), item]))
  const allCategories = [...new Set([...data.categories, ...(data.transactions.some(isIncome) ? INCOME_CATEGORIES : [])])]
  const categorySpending = data.categories.map((name) => ({ name, amount: cents(expenseItems.filter((t) => t.category === name).reduce((sum, t) => sum + t.amount, 0)) })).sort((a, b) => b.amount - a.amount)
  const top = categorySpending[0]
  const activeCount = Number(Boolean(filters.search)) + Number(filters.period !== 'all') + Number(Boolean(filters.category)) + Number(filters.cardId !== 'all')
  const invalidDates = filters.period === 'custom' && filters.start && filters.end && filters.start > filters.end
  const sortedByDate = filters.sort === 'newest' || filters.sort === 'oldest'
  const row = (item: Transaction) => {
    const income = isIncome(item)
    return <button className="transaction-row analysis-transaction-row" key={item.id} onClick={() => onSelect(item)}>
      <span className={`row-icon${income ? ' income' : ''}`}><Icon name={income ? 'wallet' : categoryIcon(item.category)} /></span>
      <span className="transaction-copy"><strong>{item.name}</strong><small>{item.category} · {paymentLabel(item, data.cards)}{!sortedByDate && ` · ${prettyDate(item.date)}`}</small></span>
      <strong className={`transaction-value${income ? ' income' : ''}`}>{income ? '+' : '−'} {money(item.amount)}</strong><Icon name="chevron" size={16} />
    </button>
  }

  return <div className="view-page transactions-page">
    <PageHeader title="Transações" onBack={onBack} />
    <div className="page-intro"><span className="eyebrow">CADA COMPRA CONTA</span><h2 style={{ textAlign: 'left' }}>Seu dinheiro,<br />em detalhe.</h2><p>Encontre uma compra, compare categorias e entenda seus gastos com calma.</p></div>
    <section className="analysis-filters" aria-labelledby="transaction-filters-title" style={{ width: '100%', padding: 0, background: 'none', border: 'none', borderColor: 'transparent' }}>
      <style>{`
        .analysis-filters .compact-search-row { display: grid; grid-template-columns: minmax(0, 1fr) 48px; align-items: center; gap: 10px; }
        .analysis-filters .compact-search-input { width: 100%; min-width: 0; min-height: 48px; padding: 12px 14px; border: 1px solid var(--eg-border); border-radius: 14px; background: var(--eg-elevated); color: var(--eg-text); font-size: 14px; }
        .analysis-filters .compact-filter-button { position: relative; display: grid; place-items: center; width: 48px; height: 48px; border: 1px solid var(--eg-border); border-radius: 14px; background: var(--eg-elevated); color: var(--eg-text); cursor: pointer; }
        .analysis-filters .compact-filter-button[data-active="true"] { border-color: var(--eg-accent); color: var(--eg-accent); }
        .analysis-filters .compact-filter-count { position: absolute; top: -6px; right: -5px; display: grid; place-items: center; min-width: 19px; height: 19px; padding-inline: 4px; border-radius: 99px; background: var(--eg-action); color: var(--eg-on-brand); font-size: 10px; font-weight: 600; }
        .analysis-filters-dialog { position: fixed; inset: 0; width: min(calc(100% - 32px), 520px); max-height: 88svh; height: fit-content; margin: auto; padding: 24px; border: 1px solid var(--eg-border); border-radius: 28px; background: var(--eg-elevated); color: var(--eg-text); overflow-y: auto; overscroll-behavior: contain; }
        .analysis-filters-dialog::backdrop { background: var(--eg-backdrop); backdrop-filter: blur(7px); }
        .analysis-filters-dialog .filter-dialog-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 24px; }
        .analysis-filters-dialog .filter-dialog-heading h2 { margin: 0; font-size: 23px; font-weight: 500; letter-spacing: -.04em; }
        .analysis-filters-dialog .filter-dialog-dates { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        .analysis-filters-dialog .filter-dialog-actions { display: grid; gap: 10px; margin-top: 24px; }
        .analysis-filters-dialog .filter-dialog-actions .primary-button { margin-top: 0; }
      `}</style>
      <h2 id="transaction-filters-title" className="sr-only">Pesquisar e filtrar transações</h2>
      <div className="compact-search-row">
        <label><span className="sr-only">Buscar compra</span><input className="compact-search-input" type="search" value={filters.search} onChange={(event) => update({ search: event.target.value })} placeholder="Buscar nome ou categoria" /></label>
        <button className="compact-filter-button" type="button" aria-label="Abrir filtros de transações" aria-haspopup="dialog" aria-controls="transaction-filter-dialog" data-active={activeCount > Number(Boolean(filters.search))} onClick={(event) => event.currentTarget.closest('section')?.querySelector('dialog')?.showModal()}>
          <Icon name="tune" size={21} />
          {activeCount > Number(Boolean(filters.search)) && <span className="compact-filter-count" aria-hidden="true">{activeCount - Number(Boolean(filters.search))}</span>}
        </button>
      </div>
      <dialog id="transaction-filter-dialog" className="analysis-filters-dialog" aria-labelledby="transaction-filter-dialog-title" onClick={(event) => {
        if (event.target !== event.currentTarget) return
        const bounds = event.currentTarget.getBoundingClientRect()
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.currentTarget.close()
      }}>
        <div className="filter-dialog-heading"><h2 id="transaction-filter-dialog-title">Filtrar transações</h2><button className="icon-button" type="button" aria-label="Fechar filtros" onClick={(event) => event.currentTarget.closest('dialog')?.close()}><Icon name="close" /></button></div>
        <div className="form">
          <label><span>Período</span><select aria-label="Período" value={filters.period} onChange={(event) => update({ period: event.target.value as TransactionFilters['period'] })}><option value="all">Todo o histórico</option><option value="month">Este mês</option><option value="custom">Escolher datas</option></select></label>
          {filters.period === 'custom' && <div className="filter-dialog-dates"><label><span>De</span><input type="date" value={filters.start} max={filters.end || undefined} onChange={(event) => update({ start: event.target.value })} /></label><label><span>Até</span><input type="date" value={filters.end} min={filters.start || undefined} onChange={(event) => update({ end: event.target.value })} /></label></div>}
          <label><span>Categoria</span><select aria-label="Categoria" value={filters.category} onChange={(event) => update({ category: event.target.value })}><option value="">Todas as categorias</option>{allCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
          <label><span>Pagamento</span><select aria-label="Pagamento" value={filters.cardId} onChange={(event) => update({ cardId: event.target.value })}><option value="all">Todos os pagamentos</option><option value="method:pix">Pix</option><option value="method:cash">Dinheiro</option><option value="method:debit">Cartão de Débito</option><option value="method:credit">Cartão de Crédito</option>{data.cards.map((card) => <option key={card.id} value={card.id}>{card.name} •• {card.end} ({isDebitCard(card) ? 'Débito' : 'Crédito'})</option>)}</select></label>
        </div>
        {invalidDates && <p className="form-error" role="alert">A data inicial precisa ser anterior ou igual à data final.</p>}
        <div className="filter-dialog-actions">
          <button className="primary-button" type="button" disabled={Boolean(invalidDates)} onClick={(event) => event.currentTarget.closest('dialog')?.close()}>Ver {filtered.length} {filtered.length === 1 ? 'transação' : 'transações'}<Icon name="arrow" size={17} /></button>
          <button className="text-button" type="button" onClick={() => update({ period: 'all', category: '', cardId: 'all', start: '', end: '' })}>Limpar filtros</button>
        </div>
      </dialog>
    </section>
    <div className="analysis-summary" aria-live="polite">
      <section className="analysis-stat analysis-stat-total"><span className="eyebrow">GASTOS NO PERÍODO</span><strong>{money(total)}</strong><small>{totalIncome > 0 ? `+ ${money(totalIncome)} em receitas` : activeCount ? 'Considerando os filtros selecionados' : 'Todos os seus registros'}</small></section>
      <section className="analysis-stat"><span className="eyebrow">LANÇAMENTOS</span><strong>{filtered.length}</strong><small>Média de {money(expenseItems.length ? cents(total / expenseItems.length) : 0)} por gasto</small></section>
      <section className="analysis-stat"><span className="eyebrow">MAIOR CATEGORIA</span><strong className="analysis-category-name">{total ? top.name : '—'}</strong><small>{total ? `${money(top.amount)} · ${Math.round(top.amount / total * 100)}% do total` : 'Adicione gastos para comparar'}</small></section>
    </div>
    <section className="panel analysis-results" aria-labelledby="transaction-results-title">
      <div className="analysis-results-heading"><div><span className="eyebrow">{activeCount ? 'RESULTADO DOS FILTROS' : 'HISTÓRICO COMPLETO'}</span><h2 id="transaction-results-title">{filtered.length} {filtered.length === 1 ? 'transação' : 'transações'}</h2></div>
        <label><span>Ordenar por</span><select aria-label="Ordenar por" value={filters.sort} onChange={(event) => update({ sort: event.target.value as TransactionFilters['sort'] })}><option value="newest">Mais recentes</option><option value="oldest">Mais antigas</option><option value="highest">Maior valor</option><option value="lowest">Menor valor</option></select></label>
      </div>
      {filtered.length ? <>
        {sortedByDate ? [...groups.entries()].map(([date, transactions]) => <section className="analysis-date-group" key={date}><div className="analysis-date-heading"><h3>{prettyDate(date)}</h3><span>{money(cents(transactions.reduce((sum, t) => sum + t.amount, 0)))}</span></div>{transactions.map(row)}</section>) : <div>{filtered.map(row)}</div>}
        <p className="analysis-results-hint">Toque em uma compra para ver os detalhes, editar ou apagar.</p>
      </> : <Empty icon="repeat" title={data.transactions.length ? 'Nenhum resultado por aqui' : 'Seu histórico começa aqui'}><p>{data.transactions.length ? 'Tente outro nome, período ou categoria.' : 'Registre sua primeira compra para começar a acompanhar.'}</p><button className="text-button" onClick={() => data.transactions.length ? setFilters(defaultFilters) : onAdd()}>{data.transactions.length ? 'Limpar filtros' : 'Adicionar gasto'}</button></Empty>}
    </section>
  </div>
}
