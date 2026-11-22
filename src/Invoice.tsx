import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { CATEGORY_NAMES, cents, money, numberValue, prettyDate, sampleInvoice, today, type Card, type InvoiceBatch, type Transaction } from './finance'
import { Empty, Icon, PageHeader, Progress } from './ui'

type Draft = Transaction & { checked: boolean; amountText: string }
export default function Invoice({
  cards,
  categories = CATEGORY_NAMES,
  batches = [],
  transactions = [],
  onBack,
  onConfirm,
  onDeleteBatch,
}: {
  cards: Card[]
  categories?: string[]
  batches?: InvoiceBatch[]
  transactions?: Transaction[]
  onBack: () => void
  onConfirm: (items: Transaction[], batch: InvoiceBatch, file?: File | null) => boolean
  onDeleteBatch?: (batch: InvoiceBatch, activeCount: number) => void
}) {
  const [stage, setStage] = useState<'pick' | 'ready' | 'reading' | 'review' | 'done'>('pick')
  const [fileName, setFileName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState('PDF')
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [cardId, setCardId] = useState(cards[0]?.id || '')
  const [savedCount, setSavedCount] = useState(0)
  const pdf = useRef<HTMLInputElement>(null)
  const photo = useRef<HTMLInputElement>(null)
  const confirmed = useRef(false)
  const selected = drafts.filter((item) => item.checked)
  const total = cents(selected.reduce((sum, item) => sum + (numberValue(item.amountText) || 0), 0))
  const patch = (id: string, update: Partial<Draft>) => setDrafts((items) => items.map((item) => item.id === id ? { ...item, ...update } : item))
  const cardName = (id: string) => cards.find((card) => card.id === id)?.name || 'Dinheiro / Pix'

  const choose = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Formato não aceito. Escolha PDF, JPG, PNG ou WebP.'); return
    }
    if (file.size > 10 * 1024 * 1024 || file.size === 0) { setError('O arquivo precisa ter conteúdo e no máximo 10 MB.'); return }
    setSelectedFile(file); setFileName(file.name); setFileType(file.type === 'application/pdf' ? 'PDF' : 'FOTO'); setStage('ready'); setError('')
  }
  const start = () => { setError(''); setProgress(0); setStage('reading') }
  useEffect(() => {
    if (stage !== 'reading') return
    let current = 0
    const timer = window.setInterval(() => {
      current = Math.min(100, current + 10)
      setProgress(current)
      if (current === 100) {
        window.clearInterval(timer)
        setDrafts(sampleInvoice().map((item) => ({ ...item, checked: true, amountText: item.amount.toFixed(2).replace('.', ',') })))
        setStage('review')
      }
    }, 150)
    return () => window.clearInterval(timer)
  }, [stage])
  const confirm = () => {
    if (confirmed.current) return
    if (!selected.length) return setError('Selecione ao menos um lançamento.')
    if (selected.some((item) => !item.name.trim() || !Number.isFinite(numberValue(item.amountText)) || numberValue(item.amountText) <= 0 || numberValue(item.amountText) > 1e9)) {
      return setError('Revise nomes e valores. Cada compra precisa ter um valor maior que zero.')
    }
    confirmed.current = true
    const batchId = crypto.randomUUID()
    const items = selected.map(({ checked: _checked, amountText, ...item }) => ({ ...item, name: item.name.trim(), id: crypto.randomUUID(), cardId, amount: cents(numberValue(amountText)), batch: batchId }))
    const batch: InvoiceBatch = {
      id: batchId,
      fileName: fileName || 'Fatura importada',
      cardId,
      createdAt: today(),
      itemsCount: items.length,
      total: cents(items.reduce((sum, item) => sum + item.amount, 0)),
    }
    if (onConfirm(items, batch, selectedFile)) { setSavedCount(items.length); setStage('done') }
    else { confirmed.current = false }
  }
  const reset = () => { confirmed.current = false; setStage('pick'); setSelectedFile(null); setFileName(''); setError(''); setDrafts([]) }
  return <div className="view-page">
    <PageHeader title="Importar fatura" onBack={onBack} />
    <div className="page-intro"><span className="eyebrow">MENOS TRABALHO, MAIS CLAREZA</span><h2>Da fatura para o controle.</h2><p>Revise cada compra antes de adicionar ao seu dinheiro.</p></div>
    <div className="invoice-layout">
      <section className="invoice-upload">
        <div className={`reading-card ${stage}`} aria-live="polite">
          <div><span>{fileType}</span><strong>{stage === 'reading' ? `${progress}%` : stage === 'done' ? 'CONCLUÍDO' : stage === 'review' ? 'REVISÃO' : 'SUA FATURA'}</strong></div>
          <span className="file-name">{fileName || 'PDF ou foto · até 10 MB'}</span>
          <h2>{stage === 'reading' ? 'Preparando lançamentos' : stage === 'review' ? 'Tudo pronto para revisar.' : stage === 'done' ? 'Fatura organizada.' : 'Sua fatura, mais clara.'}</h2>
          <p>{stage === 'done' ? 'Fatura confirmada. Seus lançamentos estão na Home.' : 'Confira os valores e as categorias antes de confirmar seus lançamentos.'}</p>
          {(stage === 'reading' || stage === 'review' || stage === 'done') && <Progress value={stage === 'reading' ? progress : 100} tone="dark" label="Preparação dos lançamentos" />}
        </div>
        <input ref={pdf} type="file" accept="application/pdf" onChange={choose} hidden aria-label="Escolher arquivo PDF" />
        <input ref={photo} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={choose} hidden aria-label="Escolher foto" />
        {stage === 'pick' && <>
          <div className="upload-actions"><button onClick={() => pdf.current?.click()}><Icon name="upload" />Escolher PDF</button><button onClick={() => photo.current?.click()}><Icon name="camera" />Foto da fatura</button></div>
        </>}
        {stage === 'ready' && <><button className="primary-button" onClick={start}>Continuar<Icon name="arrow" /></button><button className="text-button example-button" onClick={reset}>Remover e escolher outro arquivo</button></>}
        {stage === 'review' && <button className="secondary-button" onClick={reset}><Icon name="upload" />Substituir arquivo</button>}
        {stage === 'reading' && <button className="secondary-button" onClick={reset}>Cancelar leitura</button>}
        {stage === 'done' && <><button className="primary-button" onClick={onBack}>Ver transações na Home<Icon name="arrow" /></button><button className="secondary-button" onClick={reset}><Icon name="upload" />Importar outra fatura</button></>}
        {error && <div className="form-error" role="alert">{error}<button className="text-button" onClick={() => { setError(''); if (stage === 'pick') pdf.current?.click() }}>Tentar novamente</button></div>}
      </section>
      <section className="panel found-panel">
        <div className="section-heading"><div><span className="eyebrow">REVISÃO</span><h2>{stage === 'review' ? 'Seus lançamentos' : stage === 'done' ? 'Tudo organizado' : 'Você tem a última palavra.'}</h2></div></div>
        {stage === 'review' ? <>
          <div className="invoice-summary"><div><span>Compras selecionadas</span><strong>{selected.length}</strong></div><div><span>Assinaturas</span><strong>{selected.filter((item) => item.category === 'Assinaturas').length}</strong></div><div><span>Total</span><strong>{money(total)}</strong></div></div>
          <label className="payment-select"><span>Registrar no cartão</span><select aria-label="Registrar no cartão" value={cardId} onChange={(e) => setCardId(e.target.value)}><option value="">Dinheiro / Pix</option>{cards.map((card) => <option key={card.id} value={card.id}>{card.name} •• {card.end}</option>)}</select></label>
          <p className="helper-text">Desmarque o que não quer importar. Nome, valor e categoria podem ser corrigidos abaixo.</p>
          <div className="invoice-items">
            {drafts.map((item) => <div className={`invoice-item ${item.checked ? '' : 'unchecked'}`} key={item.id}>
              <label className="invoice-check"><input type="checkbox" checked={item.checked} onChange={(e) => patch(item.id, { checked: e.target.checked })} aria-label={`Incluir ${item.name}`} /><span>Incluir</span></label>
              <label className="invoice-name"><span>Compra</span><input value={item.name} maxLength={70} onChange={(e) => patch(item.id, { name: e.target.value })} /></label>
              <label><span>Categoria</span><select aria-label={`Categoria de ${item.name}`} value={item.category} onChange={(e) => patch(item.id, { category: e.target.value })}>{categories.map((name) => <option key={name}>{name}</option>)}</select></label>
              <label><span>Valor (R$)</span><input inputMode="decimal" value={item.amountText} onChange={(e) => patch(item.id, { amountText: e.target.value })} /></label>
            </div>)}
          </div>
          <button className="primary-button" disabled={!selected.length} onClick={confirm}><Icon name="check" />Confirmar {selected.length} lançamentos</button>
        </> : stage === 'done' ? <Empty icon="check" title={`${savedCount} lançamentos adicionados`}><p>Saldo, gastos e cartão foram atualizados. Você pode consultar ou excluir este lote no histórico abaixo.</p></Empty>
          : <Empty icon="file" title={stage === 'reading' ? 'Preparando sua revisão…' : 'Nenhum lançamento ainda'}><p>Escolha o arquivo da sua fatura. Nenhum gasto entra sem sua confirmação.</p></Empty>}
      </section>
    </div>
    <section className="panel invoice-history" aria-labelledby="invoice-history-title">
      <div className="section-heading">
        <div><span className="eyebrow">HISTÓRICO DE LOTES</span><h2 id="invoice-history-title">Faturas importadas</h2></div>
        <span className="count-label">{batches.length} {batches.length === 1 ? 'lote' : 'lotes'}</span>
      </div>
      {batches.length ? <div className="invoice-batches">
        {batches.map((batch) => {
          const linked = transactions.filter((t) => t.batch === batch.id)
          const activeCount = linked.length
          const activeTotal = cents(linked.reduce((sum, t) => sum + t.amount, 0))
          return <div className="invoice-batch-row" key={batch.id}>
            <span className="row-icon"><Icon name="file" /></span>
            <span className="invoice-batch-copy">
              <strong>{batch.fileName}</strong>
              <small>{prettyDate(batch.createdAt)} · {cardName(batch.cardId)} · {activeCount} {activeCount === 1 ? 'lançamento ativo' : 'lançamentos ativos'}</small>
            </span>
            <strong className="invoice-batch-total">{money(activeTotal)}</strong>
            {onDeleteBatch && <button className="invoice-batch-delete" type="button" onClick={() => onDeleteBatch(batch, activeCount)} aria-label={`Excluir lote ${batch.fileName}`} title="Excluir lote"><Icon name="trash" size={16} /><span>Excluir</span></button>}
          </div>
        })}
      </div> : <p className="helper-text">Nenhuma fatura importada ainda. Quando você confirmar uma importação, o lote aparece aqui para consulta ou exclusão em conjunto.</p>}
    </section>
  </div>
}
