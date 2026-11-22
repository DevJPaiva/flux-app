import { useEffect, useRef, useState, type FormEvent } from 'react'
import { categoryTotals, cents, money, monthTransactions, type FinanceData } from './finance'
import { Icon, PageHeader } from './ui'

export default function Assistant({ data, onBack }: { data: FinanceData; onBack: () => void }) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([])
  const [waiting, setWaiting] = useState(false)
  const [error, setError] = useState('')
  const timer = useRef<number | null>(null)
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current) }, [])
  useEffect(() => { if (messages.length) end.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }, [messages.length, waiting])
  const respond = (question: string) => {
    const text = question.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const month = monthTransactions(data.transactions)
    const total = cents(month.reduce((sum, item) => sum + item.amount, 0))
    if (/delivery/.test(text)) {
      const spent = cents(month.filter((t) => /delivery|ifood|rappi/i.test(t.name)).reduce((sum, t) => sum + t.amount, 0))
      return `Você registrou ${money(spent)} em compras identificadas como delivery neste mês.${spent ? ` Reduzindo 25%, seriam ${money(cents(spent / 4))} a mais para guardar.` : ' Não encontrei lançamentos com esse nome; isso não significa que não houve delivery. Cadastre-os para comparar.'}`
    }
    if (/meta|viagem|guardar|objetivo/.test(text)) {
      const goal = data.goals.find((item) => /viagem/i.test(item.name)) || data.goals[0]
      if (!goal) return 'Você ainda não criou um objetivo. Em Metas, escolha um nome e o valor que quer guardar.'
      const remaining = Math.max(0, cents(goal.target - goal.saved))
      return remaining ? `${goal.name}: você já guardou ${money(goal.saved)} de ${money(goal.target)}. Faltam ${money(remaining)}. Com R$ 500 por mês, seriam aproximadamente ${Math.ceil(remaining / 500)} meses, sem considerar rendimentos.` : `${goal.name} está concluída: ${money(goal.saved)} guardados. Você pode criar sua próxima meta.`
    }
    if (/cartao|cartoes|fatura|limite/.test(text)) {
      return data.cards.length ? `Seus ${data.cards.length} cartões somam ${money(cents(data.cards.reduce((sum, c) => sum + c.bill, 0)))} em faturas registradas. ${data.cards[0].name}: ${money(data.cards[0].bill)} de ${money(data.cards[0].limit)} de limite. Os valores são os que você informou.` : 'Nenhum cartão cadastrado ainda. Adicione o primeiro na carteira.'
    }
    if (/assinatura/.test(text)) {
      const subscriptions = month.filter((t) => t.category === 'Assinaturas')
      return `Você tem ${subscriptions.length} lançamentos em Assinaturas neste mês, somando ${money(cents(subscriptions.reduce((sum, t) => sum + t.amount, 0)))}. Revise quais ainda usa antes de decidir cancelar.`
    }
    if (/gast|mes|saldo|orcamento/.test(text)) {
      const top = categoryTotals(data.transactions).sort((a, b) => b.value - a.value)[0]
      return `Neste mês, os gastos registrados somam ${money(total)}. ${total > data.budget ? `Você passou ${money(cents(total - data.budget))} do orçamento.` : `Ainda há ${money(cents(data.budget - total))} no orçamento de ${money(data.budget)}.`}${total ? ` ${top.name} lidera, com ${money(top.value)}.` : ''}`
    }
    return 'Posso ajudar com seus gastos, cartões, assinaturas, delivery e metas. Pergunte, por exemplo: “Quanto gastei este mês?”.'
  }
  const send = (question: string) => {
    if (!question.trim() || waiting) return
    if (question.trim().length > 500) return setError('Use até 500 caracteres por pergunta.')
    setError(''); setInput(''); setWaiting(true)
    setMessages((items) => [...items, { role: 'user', text: question.trim() }])
    timer.current = window.setTimeout(() => {
      setMessages((items) => [...items, { role: 'bot', text: respond(question) }])
      setWaiting(false)
    }, 750)
  }
  const submit = (e: FormEvent) => { e.preventDefault(); send(input) }
  return <div className="view-page assistant-page">
    <PageHeader title="Assistente" onBack={onBack} action={<span className="icon-button static lilac"><Icon name="spark" /></span>} />
    <div className="chat-shell">
      <div className="chat-intro"><span className="eyebrow">ASSISTENTE FLUX</span><h2>Pergunte sobre<br />seu dinheiro.</h2><p>Seus registros, explicados de um jeito simples.</p><div className="suggestions">{['Quanto gastei este mês?', 'Como está a viagem?', 'Quanto pago em assinaturas?'].map((question) => <button key={question} onClick={() => send(question)} disabled={waiting}>{question}<Icon name="arrow" size={15} /></button>)}</div></div>
      <div className="conversation">
        <div className="messages" role="log" aria-live="polite">
          {!messages.length && <div className="insight-message"><span>UM BOM COMEÇO</span><strong>{money(Math.max(0, cents(data.budget - monthTransactions(data.transactions).reduce((sum, t) => sum + t.amount, 0))))}</strong><p>disponíveis no orçamento do mês. Sobre o que vamos conversar?</p></div>}
          {messages.map((message, index) => <div className={`message ${message.role}`} key={index}>{message.text}</div>)}
          {waiting && <div className="message bot typing" role="status">Consultando seus registros<span>…</span></div>}
          <div ref={end} />
        </div>
        <form className="chat-input" onSubmit={submit}><input value={input} maxLength={501} onChange={(event) => setInput(event.target.value)} placeholder="Pergunte sobre seu dinheiro" aria-label="Mensagem" /><button disabled={waiting || !input.trim()} aria-label="Enviar"><Icon name="send" /></button></form>
        {error && <p role="alert" className="form-error">{error}</p>}
      </div>
    </div>
  </div>
}
