import { useRef, useState } from 'react'
import { useOnboardingStepAnimation } from './animations'
import type { IconName } from './finance'
import { Brand, Icon } from './ui'

const SLIDES: {
  eyebrow: string
  title: string
  description: string
  icon: IconName
  highlight: string
}[] = [
  {
    eyebrow: 'PASSO 1 DE 3',
    title: 'Seu dinheiro,\ncom clareza total.',
    description: 'Acompanhe seu saldo disponível, receitas e gastos do mês em um único lugar, com opção de ocultar valores ao entrar.',
    icon: 'wallet',
    highlight: 'Visão rápida do saldo e dos gastos por categoria',
  },
  {
    eyebrow: 'PASSO 2 DE 3',
    title: 'Cartões, faturas\ne metas no ritmo.',
    description: 'Importe lançamentos de faturas, defina limites mensais por categoria e acompanhe cada aporte das suas metas.',
    icon: 'target',
    highlight: 'Controle de limites e evolução de objetivos',
  },
  {
    eyebrow: 'PASSO 3 DE 3',
    title: 'Decisões melhores\ntodo mês.',
    description: 'Receba alertas inteligentes sobre saldo, limites e metas, e conte com o Assistente Flux sempre que precisar.',
    icon: 'spark',
    highlight: 'Alertas personalizados e apoio do Assistente',
  },
]

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const stageRef = useRef<HTMLElement>(null)
  useOnboardingStepAnimation(stageRef, step)
  const slide = SLIDES[step]
  const isLast = step === SLIDES.length - 1

  return (
    <div className="onboarding-page" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="onboarding-aura" aria-hidden="true" />
      <header className="onboarding-header">
        <Brand showMark={false} />
        <button type="button" className="text-button" onClick={onComplete}>
          Pular
        </button>
      </header>

      <section className="onboarding-stage" ref={stageRef} key={step}>
        <div className="onboarding-visual" aria-hidden="true">
          <span className="onboarding-icon-ring">
            <Icon name={slide.icon} size={38} />
          </span>
          <span className="onboarding-pill">{slide.highlight}</span>
        </div>

        <div className="onboarding-copy">
          <span className="eyebrow">{slide.eyebrow}</span>
          <h1 id="onboarding-title">{slide.title}</h1>
          <p>{slide.description}</p>
        </div>
      </section>

      <footer className="onboarding-footer">
        <div className="onboarding-dots" role="tablist" aria-label="Etapas do onboarding">
          {SLIDES.map((item, idx) => (
            <button
              key={item.eyebrow}
              type="button"
              role="tab"
              aria-selected={idx === step}
              aria-label={`Ir para etapa ${idx + 1}`}
              className={idx === step ? 'active' : undefined}
              onClick={() => setStep(idx)}
            />
          ))}
        </div>

        <div className="onboarding-actions">
          {step > 0 && (
            <button type="button" className="secondary-button" onClick={() => setStep((s) => s - 1)}>
              Voltar
            </button>
          )}
          <button
            type="button"
            className="primary-button"
            onClick={() => (isLast ? onComplete() : setStep((s) => s + 1))}
          >
            {isLast ? 'Começar agora' : 'Próximo'}
            <Icon name="arrow" size={18} />
          </button>
        </div>
      </footer>
    </div>
  )
}
