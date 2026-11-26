import { useState, type FormEvent } from 'react'
import type { FinanceData } from './finance'
import { Icon, PageHeader } from './ui'

type Profile = FinanceData['profile']

type SupportTicket = {
  id: string
  subject: string
  name: string
  email: string
  message: string
  createdAt: string
}

type FaqCategory = 'Todas' | 'Conta' | 'Gastos e Saldo' | 'Cartões' | 'Metas'

const FAQ_ITEMS: { id: string; category: Exclude<FaqCategory, 'Todas'>; question: string; answer: string }[] = [
  {
    id: 'faq-1',
    category: 'Conta',
    question: 'Como altero meu nome ou redefino minha senha?',
    answer: 'Você pode atualizar seu nome e e-mail em Configurações → Dados pessoais. Para redefinir a senha, use a opção "Esqueci minha senha" na tela de entrada.',
  },
  {
    id: 'faq-2',
    category: 'Conta',
    question: 'Como funciona a opção "Manter sessão ativa"?',
    answer: 'Quando marcada no login, sua sessão permanece salva no navegador mesmo após fechar a aba. Se desmarcada, o acesso dura apenas enquanto a janela estiver aberta.',
  },
  {
    id: 'faq-3',
    category: 'Gastos e Saldo',
    question: 'Como o saldo disponível é calculado?',
    answer: 'O saldo disponível soma seu saldo inicial, os ajustes manuais e todas as receitas cadastradas, subtraindo os gastos registrados.',
  },
  {
    id: 'faq-4',
    category: 'Cartões',
    question: 'Posso importar lançamentos de uma fatura?',
    answer: 'Sim! Acesse o atalho Fatura na Home para enviar o arquivo da sua fatura e revisar os lançamentos antes de confirmar a importação.',
  },
  {
    id: 'faq-5',
    category: 'Metas',
    question: 'Como acompanho o progresso de uma meta?',
    answer: 'Na aba Metas, toque em qualquer objetivo para registrar novos aportes e visualizar o percentual concluído em tempo real.',
  },
]

const SUBJECT_OPTIONS = [
  'Dúvida sobre o app',
  'Conta e acesso',
  'Cartões e faturas',
  'Metas e saldo',
  'Sugestão de melhoria',
  'Outro',
]

const TICKETS_STORAGE_KEY = 'flux-support-tickets'
const SUPPORT_EMAIL = 'suporte@flux.app'

function loadTickets(): SupportTicket[] {
  try {
    const raw = JSON.parse(localStorage.getItem(TICKETS_STORAGE_KEY) || '[]')
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

function saveTickets(tickets: SupportTicket[]) {
  try {
    localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(tickets.slice(0, 10)))
  } catch {
    /* Ignore storage errors in restricted contexts. */
  }
}

async function sendSupportMessage(payload: Omit<SupportTicket, 'id' | 'createdAt'>): Promise<SupportTicket> {
  await new Promise((resolve) => window.setTimeout(resolve, 550))
  const protocol = `FLX-${Math.floor(100000 + Math.random() * 900000)}`
  return {
    ...payload,
    id: protocol,
    createdAt: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
  }
}

export default function Support({ profile, onBack }: { profile: Profile; onBack: () => void }) {
  const [tab, setTab] = useState<'contact' | 'faq'>('contact')
  const [subject, setSubject] = useState(SUBJECT_OPTIONS[0])
  const [name, setName] = useState(profile.name)
  const [email, setEmail] = useState(profile.email)
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({})
  const [sending, setSending] = useState(false)
  const [sentTicket, setSentTicket] = useState<SupportTicket | null>(null)
  const [tickets, setTickets] = useState<SupportTicket[]>(() => loadTickets())

  const [faqCategory, setFaqCategory] = useState<FaqCategory>('Todas')
  const [faqQuery, setFaqQuery] = useState('')
  const [openFaqId, setOpenFaqId] = useState<string | null>(FAQ_ITEMS[0].id)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const cleanName = name.trim()
    const cleanEmail = email.trim()
    const cleanMessage = message.trim()
    const nextErrors: { name?: string; email?: string; message?: string } = {}

    if (!cleanName) nextErrors.name = 'Informe seu nome.'
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) nextErrors.email = 'Informe um e-mail válido.'
    if (cleanMessage.length < 10) nextErrors.message = 'Descreva sua dúvida ou solicitação com pelo menos 10 caracteres.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSending(true)
    try {
      const ticket = await sendSupportMessage({
        subject,
        name: cleanName,
        email: cleanEmail,
        message: cleanMessage,
      })
      const updated = [ticket, ...tickets].slice(0, 10)
      setTickets(updated)
      saveTickets(updated)
      setSentTicket(ticket)
      setMessage('')
    } finally {
      setSending(false)
    }
  }

  const mailtoHref = (ticket: SupportTicket) => {
    const body = `Protocolo: ${ticket.id}\nNome: ${ticket.name}\nE-mail: ${ticket.email}\n\n${ticket.message}`
    return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`[Flux] ${ticket.subject}`)}&body=${encodeURIComponent(body)}`
  }

  const filteredFaq = FAQ_ITEMS.filter((item) => {
    const matchesCategory = faqCategory === 'Todas' || item.category === faqCategory
    const q = faqQuery.trim().toLowerCase()
    const matchesQuery = !q || item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q)
    return matchesCategory && matchesQuery
  })

  return (
    <div className="view-page support-page">
      <PageHeader title="Ajuda e suporte" onBack={onBack} />
      <div className="page-intro">
        <span className="eyebrow">ATENDIMENTO FLUX</span>
        <h2>Como podemos<br />ajudar você hoje?</h2>
        <p>Envie uma mensagem para nossa equipe ou consulte as dúvidas frequentes.</p>
      </div>

      <div className="support-tabs" role="tablist" aria-label="Seções de suporte">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'contact'}
          className={tab === 'contact' ? 'active' : undefined}
          onClick={() => setTab('contact')}
        >
          <Icon name="send" size={16} />
          Fale Conosco
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'faq'}
          className={tab === 'faq' ? 'active' : undefined}
          onClick={() => setTab('faq')}
        >
          <Icon name="spark" size={16} />
          Central de Ajuda (FAQ)
        </button>
      </div>

      {tab === 'contact' ? (
        <div className="support-grid">
          <section className="panel support-contact-panel" aria-labelledby="support-contact-title">
            <div className="support-panel-head">
              <div>
                <span className="eyebrow">SUPORTE POR E-MAIL</span>
                <h2 id="support-contact-title">Fale Conosco</h2>
              </div>
              <span className="support-demo-pill" title="Provedor de e-mail ainda não conectado">
                Envio simulado
              </span>
            </div>
            <p className="helper-text">
              Sua mensagem será direcionada para <strong>{SUPPORT_EMAIL}</strong>. Enquanto o provedor de e-mail não está conectado, o registro fica salvo localmente com número de protocolo.
            </p>

            {sentTicket ? (
              <div className="auth-confirmation support-success" role="status">
                <span className="auth-confirmation-icon"><Icon name="check" size={22} /></span>
                <h3>Mensagem registrada!</h3>
                <p>
                  Protocolo <strong>#{sentTicket.id}</strong> criado para <strong>{sentTicket.subject}</strong>.
                  Responderemos para <strong>{sentTicket.email}</strong>.
                </p>
                <div className="support-success-actions">
                  <button type="button" className="primary-button" onClick={() => setSentTicket(null)}>
                    Enviar outra mensagem<Icon name="arrow" />
                  </button>
                  <a className="secondary-button support-mailto" href={mailtoHref(sentTicket)}>
                    Abrir no app de e-mail
                  </a>
                </div>
              </div>
            ) : (
              <form className="form support-form" onSubmit={handleSubmit} noValidate>
                <label htmlFor="support-subject">
                  <span>Assunto</span>
                  <select
                    id="support-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  >
                    {SUBJECT_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <div className="support-row-2">
                  <div>
                    <label htmlFor="support-name">
                      <span>Seu nome</span>
                      <input
                        id="support-name"
                        value={name}
                        onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: undefined })) }}
                        className={errors.name ? 'input-invalid' : undefined}
                        placeholder="Como podemos chamar você?"
                        maxLength={70}
                      />
                    </label>
                    {errors.name && <p className="field-error" role="alert">{errors.name}</p>}
                  </div>
                  <div>
                    <label htmlFor="support-email">
                      <span>E-mail para resposta</span>
                      <input
                        id="support-email"
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: undefined })) }}
                        className={errors.email ? 'input-invalid' : undefined}
                        placeholder="seu@email.com"
                        maxLength={254}
                      />
                    </label>
                    {errors.email && <p className="field-error" role="alert">{errors.email}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="support-message">
                    <span>Mensagem</span>
                    <textarea
                      id="support-message"
                      rows={5}
                      value={message}
                      onChange={(e) => { setMessage(e.target.value); setErrors((prev) => ({ ...prev, message: undefined })) }}
                      className={errors.message ? 'input-invalid' : undefined}
                      placeholder="Conte o que aconteceu ou como podemos ajudar…"
                      maxLength={1000}
                    />
                  </label>
                  <div className="support-message-meta">
                    {errors.message ? <p className="field-error" role="alert">{errors.message}</p> : <span />}
                    <small>{message.length}/1000</small>
                  </div>
                </div>

                <button className="primary-button" disabled={sending}>
                  {sending ? 'Enviando…' : 'Enviar mensagem'}
                  <Icon name="send" size={18} />
                </button>
              </form>
            )}
          </section>

          {tickets.length > 0 && (
            <section className="panel support-history-panel" aria-labelledby="support-history-title">
              <span className="eyebrow">HISTÓRICO LOCAL</span>
              <h3 id="support-history-title">Mensagens enviadas</h3>
              <ul className="support-ticket-list">
                {tickets.map((ticket) => (
                  <li key={ticket.id}>
                    <div>
                      <strong>#{ticket.id} · {ticket.subject}</strong>
                      <small>{ticket.createdAt}</small>
                    </div>
                    <p>{ticket.message}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      ) : (
        <section className="panel support-faq-panel" aria-labelledby="support-faq-title">
          <div className="support-panel-head">
            <div>
              <span className="eyebrow">DÚVIDAS FREQUENTES</span>
              <h2 id="support-faq-title">Central de Ajuda</h2>
            </div>
          </div>

          <div className="support-faq-controls">
            <input
              type="search"
              value={faqQuery}
              onChange={(e) => setFaqQuery(e.target.value)}
              placeholder="Buscar uma dúvida…"
              aria-label="Buscar na Central de Ajuda"
            />
            <div className="support-faq-categories" role="group" aria-label="Categorias de ajuda">
              {(['Todas', 'Conta', 'Gastos e Saldo', 'Cartões', 'Metas'] as FaqCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={faqCategory === cat ? 'active' : undefined}
                  onClick={() => setFaqCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="support-faq-list">
            {filteredFaq.length === 0 ? (
              <p className="helper-text">Nenhuma dúvida encontrada para esse filtro. Tente outra palavra ou fale conosco.</p>
            ) : (
              filteredFaq.map((item) => {
                const open = openFaqId === item.id
                return (
                  <article key={item.id} className={`support-faq-item${open ? ' open' : ''}`}>
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenFaqId(open ? null : item.id)}
                    >
                      <span>
                        <small>{item.category}</small>
                        <strong>{item.question}</strong>
                      </span>
                      <Icon name="chevron" size={18} />
                    </button>
                    {open && <p>{item.answer}</p>}
                  </article>
                )
              })
            )}
          </div>
        </section>
      )}
    </div>
  )
}
