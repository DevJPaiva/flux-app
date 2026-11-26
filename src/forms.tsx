import { useState, type FormEvent } from 'react'
import {
  CATEGORY_NAMES, INCOME_CATEGORIES, PAYMENT_METHOD_LABELS, cents, isDebitCard, isIncome,
  money, numberValue, resolvePaymentMethod, today,
  type Card, type CardType, type Goal, type PaymentMethod, type Transaction, type TransactionType,
} from './finance'
import { Icon } from './ui'

const get = (data: FormData, key: string) => String(data.get(key) || '').trim()
const validAmount = (value: number) => Number.isFinite(value) && value > 0 && value <= 1_000_000_000

function FormError({ text }: { text: string }) { return text ? <p className="form-error" role="alert">{text}</p> : null }
export function ExpenseForm({
  transaction,
  cards,
  categories = CATEGORY_NAMES,
  initialType,
  onSave,
}: {
  transaction?: Transaction
  cards: Card[]
  categories?: string[]
  initialType?: TransactionType
  onSave: (transaction: Transaction) => void
}) {
  const [type, setType] = useState<TransactionType>(transaction ? (isIncome(transaction) ? 'income' : 'expense') : (initialType || 'expense'))
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() =>
    transaction && !isIncome(transaction) ? resolvePaymentMethod(transaction, cards) : 'pix',
  )
  const [cardId, setCardId] = useState<string>(() => transaction?.cardId || '')
  const [error, setError] = useState('')
  const income = type === 'income'
  const categoryOptions = income ? INCOME_CATEGORIES : categories
  const defaultCategory = transaction && ((income && isIncome(transaction)) || (!income && !isIncome(transaction)))
    ? transaction.category
    : (income ? INCOME_CATEGORIES[0] : (categories.includes('Alimentação') ? 'Alimentação' : categories[0]))

  const matchingCards = cards.filter((c) => (paymentMethod === 'debit' ? isDebitCard(c) : !isDebitCard(c)))
  const showCardSelect = !income && (paymentMethod === 'credit' || paymentMethod === 'debit')

  const handleMethodChange = (next: PaymentMethod) => {
    setPaymentMethod(next)
    if (next === 'pix' || next === 'cash') {
      setCardId('')
      return
    }
    const candidates = cards.filter((c) => (next === 'debit' ? isDebitCard(c) : !isDebitCard(c)))
    if (!candidates.some((c) => c.id === cardId)) {
      setCardId(candidates[0]?.id || '')
    }
  }

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const amount = cents(numberValue(get(fields, 'amount')))
    if (!validAmount(amount)) return setError('Digite um valor maior que zero, com até 2 casas decimais.')
    if (!get(fields, 'name')) return setError(income ? 'Dê um nome à receita para identificá-la depois.' : 'Dê um nome à compra para identificá-la depois.')
    if (!get(fields, 'date') || get(fields, 'date') > today()) return setError('Escolha uma data até hoje.')
    onSave({
      ...transaction,
      id: transaction?.id || crypto.randomUUID(),
      type,
      paymentMethod: income ? undefined : paymentMethod,
      amount,
      name: get(fields, 'name'),
      date: get(fields, 'date'),
      category: get(fields, 'category'),
      cardId: income || paymentMethod === 'pix' || paymentMethod === 'cash' ? '' : cardId,
    })
  }
  return <form className="form" onSubmit={save}>
    <div className="type-toggle" role="group" aria-label="Tipo de movimentação">
      <button type="button" aria-pressed={!income} onClick={() => { setType('expense'); setError('') }}>Gasto</button>
      <button type="button" aria-pressed={income} onClick={() => { setType('income'); setError('') }}>Receita</button>
    </div>
    <label className="amount-field"><span>{income ? 'Valor da receita' : 'Valor da compra'}</span><div><b>R$</b><input name="amount" aria-label={income ? 'Valor da receita' : 'Valor da compra'} inputMode="decimal" defaultValue={transaction?.amount.toFixed(2).replace('.', ',')} placeholder="0,00" required /></div></label>
    <label><span>{income ? 'Descrição da receita' : 'Nome da compra'}</span><input name="name" defaultValue={transaction?.name} placeholder={income ? 'Ex.: Salário ou Freelance' : 'Ex.: Mercado'} required maxLength={70} /></label>
    <div className={income ? undefined : 'field-grid'}>
      <label><span>Categoria</span><select key={type} name="category" aria-label="Categoria" defaultValue={defaultCategory}>{categoryOptions.map((name) => <option key={name}>{name}</option>)}</select></label>
      {!income && (
        <label>
          <span>Forma de pagamento</span>
          <select name="paymentMethod" aria-label="Forma de pagamento" value={paymentMethod} onChange={(e) => handleMethodChange(e.target.value as PaymentMethod)}>
            {(['pix', 'cash', 'debit', 'credit'] as PaymentMethod[]).map((method) => (
              <option key={method} value={method}>{PAYMENT_METHOD_LABELS[method]}</option>
            ))}
          </select>
        </label>
      )}
    </div>
    {showCardSelect && (
      <label>
        <span>{paymentMethod === 'debit' ? 'Cartão de débito' : 'Cartão de crédito'}</span>
        <select name="cardId" aria-label="Cartão" value={cardId} onChange={(e) => setCardId(e.target.value)}>
          <option value="">{paymentMethod === 'debit' ? 'Débito (sem cartão cadastrado)' : 'Crédito (sem cartão cadastrado)'}</option>
          {matchingCards.map((card) => <option key={card.id} value={card.id}>{card.name} •• {card.end}</option>)}
        </select>
      </label>
    )}
    <label><span>{income ? 'Data da receita' : 'Data da compra'}</span><input type="date" name="date" defaultValue={transaction?.date || today()} max={today()} required /></label>
    <FormError text={error} />
    <button className="primary-button">Salvar {transaction ? 'alterações' : income ? 'receita' : 'gasto'}<Icon name="check" /></button>
  </form>
}
export function BalanceForm({ value, onSave }: { value: number; onSave: (value: number) => void }) {
  const [error, setError] = useState('')
  return <form className="form" onSubmit={(event) => {
    event.preventDefault()
    const amount = cents(numberValue(get(new FormData(event.currentTarget), 'amount')))
    if (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000_000) return setError('Informe um saldo inicial válido, a partir de zero.')
    onSave(amount)
  }}>
    <p className="helper-text">Defina o saldo base da sua conta. Receitas somam e gastos ou valores guardados em metas são descontados automaticamente.</p>
    <label className="amount-field"><span>Saldo inicial (R$)</span><div><b>R$</b><input name="amount" aria-label="Saldo inicial" inputMode="decimal" defaultValue={value.toFixed(2).replace('.', ',')} required /></div></label>
    <FormError text={error} /><button className="primary-button">Salvar saldo inicial<Icon name="check" /></button>
  </form>
}
export function CardForm({ card, onSave, onDelete }: { card?: Card; onSave: (card: Card) => void; onDelete?: () => void }) {
  const [cardType, setCardType] = useState<CardType>(() => (card && isDebitCard(card) ? 'debit' : 'credit'))
  const [error, setError] = useState('')
  const debit = cardType === 'debit'
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    if (!/^\d{4}$/.test(get(fields, 'end'))) return setError('O final precisa ter exatamente 4 números.')
    if (debit) {
      onSave({
        id: card?.id || crypto.randomUUID(),
        type: 'debit',
        name: get(fields, 'name'),
        end: get(fields, 'end'),
        limit: 0,
        bill: 0,
        due: 1,
        tone: get(fields, 'tone') as Card['tone'],
      })
      return
    }
    const limit = cents(numberValue(get(fields, 'limit'))), bill = cents(numberValue(get(fields, 'bill')))
    if (!validAmount(limit)) return setError('Informe um limite maior que zero.')
    if (!Number.isFinite(bill) || bill < 0 || bill > 1e9) return setError('Informe uma fatura válida, a partir de zero.')
    onSave({
      id: card?.id || crypto.randomUUID(),
      type: 'credit',
      name: get(fields, 'name'),
      end: get(fields, 'end'),
      limit,
      bill,
      due: Number(get(fields, 'due')),
      tone: get(fields, 'tone') as Card['tone'],
    })
  }
  return <form className="form" onSubmit={save}>
    <div className="type-toggle" role="group" aria-label="Tipo de cartão">
      <button type="button" aria-pressed={!debit} onClick={() => { setCardType('credit'); setError('') }}>Crédito</button>
      <button type="button" aria-pressed={debit} onClick={() => { setCardType('debit'); setError('') }}>Débito</button>
    </div>
    <p className="helper-text">
      {debit
        ? 'Cartões de débito não possuem fatura nem limite de crédito: seus gastos abatem direto do saldo.'
        : 'Registre os dados manualmente. Não precisamos do número completo nem do código de segurança.'}
    </p>
    <label><span>Apelido</span><input name="name" defaultValue={card?.name} placeholder={debit ? 'Ex.: Conta corrente' : 'Ex.: Principal'} required maxLength={24} /></label>
    {debit ? (
      <label><span>Últimos 4 dígitos</span><input name="end" defaultValue={card?.end} inputMode="numeric" pattern="[0-9]{4}" maxLength={4} placeholder="0000" required /></label>
    ) : (
      <>
        <div className="field-grid"><label><span>Últimos 4 dígitos</span><input name="end" defaultValue={card?.end} inputMode="numeric" pattern="[0-9]{4}" maxLength={4} placeholder="0000" required /></label><label><span>Vence em quantos dias?</span><input type="number" name="due" defaultValue={card?.due ?? 8} min={1} max={31} required /></label></div>
        <div className="field-grid"><label><span>Limite total (R$)</span><input name="limit" defaultValue={card?.limit || ''} inputMode="decimal" placeholder="3.000,00" required /></label><label><span>Fatura atual (R$)</span><input name="bill" defaultValue={card?.bill ?? 0} inputMode="decimal" required /></label></div>
      </>
    )}
    <label><span>Cor do cartão</span><select name="tone" aria-label="Cor do cartão" defaultValue={card?.tone || 'gradient'}><option value="gradient">Degradê Flux</option><option value="lilac">Azul-petróleo</option><option value="white">Off-white</option></select></label>
    <FormError text={error} />
    <button className="primary-button">Salvar {card ? 'alterações' : 'cartão'}<Icon name="check" /></button>
    {card && onDelete && <button className="danger-button form-danger-button" type="button" onClick={onDelete}><Icon name="trash" size={16} />Excluir cartão</button>}
  </form>
}
export function GoalForm({ goal, onSave, onDelete }: { goal?: Goal; onSave: (goal: Goal) => void; onDelete?: () => void }) {
  const [error, setError] = useState('')
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const name = get(fields, 'name')
    const target = cents(numberValue(get(fields, 'target')))
    const saved = goal ? cents(numberValue(get(fields, 'saved'))) : 0
    if (!name) return setError('Dê um nome ao objetivo.')
    if (!validAmount(target)) return setError('Defina um valor alvo maior que zero.')
    if (!Number.isFinite(saved) || saved < 0 || saved > 1_000_000_000) return setError('Informe um valor guardado válido, a partir de zero.')
    if (saved > target) return setError('O valor guardado não pode ser maior que o valor alvo.')
    onSave({ id: goal?.id || crypto.randomUUID(), name, target, saved, date: get(fields, 'date') })
  }
  return <form className="form" onSubmit={save}>
    <p className="helper-text">{goal ? 'Atualize o nome, valor alvo, valor guardado ou a data da sua meta.' : 'Uma conquista começa com um destino. Depois você guarda no seu ritmo.'}</p>
    <label><span>Nome do objetivo</span><input name="name" defaultValue={goal?.name} placeholder="Ex.: Viagem ao Japão" required maxLength={60} /></label>
    <label className="amount-field"><span>Quanto quer guardar?</span><div><b>R$</b><input name="target" aria-label="Valor alvo" inputMode="decimal" defaultValue={goal?.target.toFixed(2).replace('.', ',')} placeholder="0,00" required /></div></label>
    {goal && <label><span>Já guardado (R$)</span><input name="saved" aria-label="Valor já guardado" inputMode="decimal" defaultValue={goal.saved.toFixed(2).replace('.', ',')} required /></label>}
    <label><span>Data desejada (opcional)</span><input name="date" type="date" defaultValue={goal?.date || ''} min={goal ? undefined : today()} /></label>
    <FormError text={error} />
    <button className="primary-button">{goal ? 'Salvar alterações' : 'Criar meta'}<Icon name={goal ? 'check' : 'target'} /></button>
    {goal && onDelete && <button className="danger-button form-danger-button" type="button" onClick={onDelete}><Icon name="trash" size={16} />Excluir meta</button>}
  </form>
}
export function SaveForm({ goal, balance, onSave }: { goal: Goal; balance: number; onSave: (amount: number) => void }) {
  const [error, setError] = useState('')
  return <form className="form" onSubmit={(event) => {
    event.preventDefault()
    const amount = cents(numberValue(get(new FormData(event.currentTarget), 'amount')))
    if (!validAmount(amount)) return setError('Digite um valor maior que zero.')
    if (amount > balance) return setError('Esse valor ultrapassa seu saldo disponível.')
    if (amount > cents(goal.target - goal.saved)) return setError(`Faltam apenas ${money(cents(goal.target - goal.saved))} para concluir esta meta.`)
    onSave(amount)
  }}>
    <p className="helper-text">Para <strong>{goal.name}</strong>. Esse valor sai do saldo disponível, mas não conta como gasto do mês.</p>
    <label className="amount-field"><span>Quanto vai guardar?</span><div><b>R$</b><input name="amount" aria-label="Valor a guardar" inputMode="decimal" defaultValue={Math.min(500, Math.max(0, cents(goal.target - goal.saved)))} required /></div></label>
    <p className="helper-text">Saldo disponível: {money(balance)}</p><FormError text={error} /><button className="primary-button">Confirmar valor<Icon name="check" /></button>
  </form>
}
export function BudgetForm({
  name,
  value,
  isCustom = false,
  existingCategories = [],
  onSave,
  onDelete,
}: {
  name: string
  value: number
  isCustom?: boolean
  existingCategories?: string[]
  onSave: (value: number, newName?: string) => void
  onDelete?: () => void
}) {
  const [error, setError] = useState('')
  return <form className="form" onSubmit={(event) => {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const amount = cents(numberValue(get(fields, 'amount')))
    if (!validAmount(amount)) return setError('Informe um teto maior que zero.')
    if (isCustom) {
      const nextName = get(fields, 'categoryName')
      if (!nextName) return setError('Informe um nome para a categoria.')
      if (nextName.toLowerCase() !== name.toLowerCase() && existingCategories.some((c) => c.toLowerCase() === nextName.toLowerCase())) {
        return setError('Já existe uma categoria com esse nome.')
      }
      onSave(amount, nextName)
      return
    }
    onSave(amount)
  }}>
    <p className="helper-text">Defina o máximo que pretende gastar em <strong>{name}</strong>. Os gastos já registrados continuam iguais.</p>
    {isCustom && <label><span>Nome da categoria</span><input name="categoryName" defaultValue={name} required maxLength={30} placeholder="Ex.: Pets" /></label>}
    <label className="amount-field"><span>Teto (R$)</span><div><b>R$</b><input name="amount" aria-label="Teto" inputMode="decimal" defaultValue={value} required /></div></label>
    <FormError text={error} />
    <button className="primary-button">Salvar teto<Icon name="check" /></button>
    {isCustom && onDelete && <button className="danger-button form-danger-button" type="button" onClick={onDelete}><Icon name="trash" size={16} />Excluir categoria</button>}
  </form>
}
export function CategoryForm({ existingCategories, onSave }: { existingCategories: string[]; onSave: (name: string, limit: number) => void }) {
  const [error, setError] = useState('')
  return <form className="form" onSubmit={(event) => {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const name = get(fields, 'name')
    const limit = cents(numberValue(get(fields, 'limit')))
    if (!name) return setError('Dê um nome à nova categoria.')
    if (existingCategories.some((c) => c.toLowerCase() === name.toLowerCase())) return setError('Já existe uma categoria com esse nome.')
    if (!validAmount(limit)) return setError('Informe um teto mensal maior que zero.')
    onSave(name, limit)
  }}>
    <p className="helper-text">Crie uma categoria do seu jeito para organizar limites e acompanhar gastos separadamente.</p>
    <label><span>Nome da categoria</span><input name="name" placeholder="Ex.: Pets, Saúde, Educação" required maxLength={30} /></label>
    <label className="amount-field"><span>Teto mensal (R$)</span><div><b>R$</b><input name="limit" aria-label="Teto mensal" inputMode="decimal" placeholder="300,00" required /></div></label>
    <FormError text={error} /><button className="primary-button">Criar categoria<Icon name="check" /></button>
  </form>
}
