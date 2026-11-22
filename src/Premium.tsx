import { Icon, PageHeader } from './ui'

export default function Premium({ onBack }: { onBack: () => void }) {
  return <div className="view-page premium-page">
    <PageHeader title="Flux Plus" onBack={onBack} />
    <section className="premium-hero" aria-labelledby="premium-title">
      <div className="premium-hero-top"><span className="premium-wordmark">flux <span>PLUS</span></span><span className="premium-spark"><Icon name="spark" size={26} /></span></div>
      <div className="premium-content">
        <div className="premium-copy">
          <span className="eyebrow">UM NOVO PASSO PARA O SEU DINHEIRO</span>
          <h2 id="premium-title">Mais clareza hoje.<br /><span>Maiores conquistas amanhã.</span></h2>
          <p>Conheça o Flux Plus. Seu próximo aliado para transformar números em decisões e planos em conquistas.</p>
          <span className="premium-coming-soon"><span />EM BREVE NO FLUX</span>
        </div>
        <div className="premium-benefits">
          <span className="eyebrow">MAIS TEMPO PARA O QUE IMPORTA</span>
          <article><span className="premium-benefit-icon"><Icon name="file" /></span><div><h3>Da fatura para a clareza.</h3><p>Leitura de PDF ou foto para organizar suas compras com menos trabalho.</p></div></article>
          <article><span className="premium-benefit-icon"><Icon name="spark" /></span><div><h3>Seus números fazem sentido.</h3><p>Insights sobre gastos e assinaturas para enxergar novas possibilidades.</p></div></article>
          <article><span className="premium-benefit-icon"><Icon name="target" /></span><div><h3>Uma conversa. Um próximo passo.</h3><p>Um assistente com o contexto do seu dinheiro e das suas metas.</p></div></article>
        </div>
      </div>
      <div className="premium-hero-bottom"><p>Seu dinheiro continua nas suas mãos.<br /><strong>O Plus vem para simplificar o caminho.</strong></p><button className="premium-back" onClick={onBack}>Continuar no flux<Icon name="arrow" size={18} /></button></div>
    </section>
  </div>
}
