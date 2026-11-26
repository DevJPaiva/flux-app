import { useState, type FormEvent } from 'react'
import { Brand, Icon, SuccessState } from './ui'

export type AuthMode = 'login' | 'signup' | 'forgot' | 'reset' | 'signupSuccess' | 'resetSuccess'
export type AuthField = 'name' | 'email' | 'password' | 'confirmPassword'
export type AuthFieldErrors = Partial<Record<AuthField, string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type PasswordStrength = {
  score: number
  label: string
  tone: 'weak' | 'fair' | 'good' | 'strong'
  checks: {
    minLength: boolean
    mixedCase: boolean
    hasNumber: boolean
    hasSymbol: boolean
  }
}

export function evaluatePassword(password: string): PasswordStrength {
  const checks = {
    minLength: password.length >= 6,
    mixedCase: /[a-z]/.test(password) && /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSymbol: /[^A-Za-z0-9]/.test(password),
  }
  const met = Object.values(checks).filter(Boolean).length
  const score = password.length === 0 ? 0 : Math.max(1, met)
  if (score <= 1) return { score, label: 'Fraca', tone: 'weak', checks }
  if (score === 2) return { score, label: 'Razoável', tone: 'fair', checks }
  if (score === 3) return { score, label: 'Boa', tone: 'good', checks }
  return { score, label: 'Forte', tone: 'strong', checks }
}

function PasswordInput({
  id,
  name,
  value,
  onChange,
  placeholder,
  autoComplete,
  invalid,
  describedBy,
}: {
  id: string
  name: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  autoComplete: string
  invalid?: boolean
  describedBy?: string
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className={`password-field${invalid ? ' is-invalid' : ''}`}>
      <input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
      />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        aria-pressed={visible}
      >
        <Icon name={visible ? 'eyeOff' : 'eye'} size={18} />
      </button>
    </div>
  )
}

export default function Auth({
  mode,
  setMode,
  onLogin,
  onSignup,
  onRequestReset,
  onUpdatePassword,
  rememberSession,
  onChangeRememberSession,
  busy,
  error,
  fieldErrors,
  clearErrors,
  resetSentEmail,
  signupResult,
  onContinueAfterSignup,
  onContinueAfterReset,
}: {
  mode: AuthMode
  setMode: (mode: AuthMode) => void
  onLogin: (email: string, password: string) => Promise<void>
  onSignup: (name: string, email: string, password: string) => Promise<void>
  onRequestReset: (email: string) => Promise<void>
  onUpdatePassword: (password: string) => Promise<void>
  rememberSession: boolean
  onChangeRememberSession: (remember: boolean) => void
  busy: boolean
  error: string
  fieldErrors: AuthFieldErrors
  clearErrors: (field?: AuthField) => void
  resetSentEmail: string
  signupResult?: { email: string; needsConfirmation: boolean } | null
  onContinueAfterSignup?: () => void
  onContinueAfterReset?: () => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localErrors, setLocalErrors] = useState<AuthFieldErrors>({})
  const [shakeKey, setShakeKey] = useState(0)

  const signup = mode === 'signup'
  const forgot = mode === 'forgot'
  const reset = mode === 'reset'
  const signupSuccess = mode === 'signupSuccess'
  const resetSuccess = mode === 'resetSuccess'
  const mergedErrors: AuthFieldErrors = { ...fieldErrors, ...localErrors }
  const strength = evaluatePassword(password)

  const switchTo = (next: AuthMode) => {
    setLocalErrors({})
    clearErrors()
    setPassword('')
    setConfirmPassword('')
    setMode(next)
  }

  const updateField = (field: AuthField, setter: (v: string) => void, value: string) => {
    setter(value)
    if (localErrors[field]) setLocalErrors((prev) => ({ ...prev, [field]: undefined }))
    clearErrors(field)
  }

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const nextErrors: AuthFieldErrors = {}
    const cleanName = name.trim()
    const cleanEmail = email.trim()

    if (signup && !cleanName) {
      nextErrors.name = 'Informe seu nome de exibição para continuar.'
    }

    if (!reset) {
      if (!cleanEmail) nextErrors.email = 'Informe seu e-mail.'
      else if (!EMAIL_RE.test(cleanEmail)) nextErrors.email = 'Informe um e-mail válido (ex.: nome@dominio.com).'
    }

    if (mode === 'login') {
      if (!password) nextErrors.password = 'Informe sua senha.'
    }

    if (signup || reset) {
      if (!password) nextErrors.password = 'Crie uma senha com pelo menos 6 caracteres.'
      else if (password.length < 6) nextErrors.password = 'A senha deve ter no mínimo 6 caracteres.'
      if (!confirmPassword) nextErrors.confirmPassword = 'Confirme sua senha.'
      else if (password !== confirmPassword) nextErrors.confirmPassword = 'As senhas não coincidem.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setLocalErrors(nextErrors)
      setShakeKey((k) => k + 1)
      return
    }

    setLocalErrors({})
    if (mode === 'login') void onLogin(cleanEmail, password)
    else if (signup) void onSignup(cleanName, cleanEmail, password)
    else if (forgot) void onRequestReset(cleanEmail)
    else if (reset) void onUpdatePassword(password)
  }

  const heading = signup
    ? 'Grandes planos\ncomeçam aqui.'
    : signupSuccess
      ? 'Bem-vindo\nao Flux.'
      : forgot
        ? 'Recupere o\nseu acesso.'
        : reset
          ? 'Defina sua\nnova senha.'
          : resetSuccess
            ? 'Tudo certo\npor aqui.'
            : 'Seu dinheiro,\ncom mais clareza.'

  const subtitle = signup
    ? 'Crie seu espaço para organizar e conquistar.'
    : signupSuccess
      ? 'Sua conta foi criada com sucesso.'
      : forgot
        ? 'Informe o e-mail da sua conta para receber o link de redefinição.'
        : reset
          ? 'Escolha uma senha segura para voltar a acessar o Flux.'
          : resetSuccess
            ? 'Sua senha foi atualizada e sua conta está protegida.'
            : 'Entre e continue cuidando do que importa.'

  return (
    <div className="auth-page">
      <header className="auth-header"><Brand showMark={false} /></header>
      <div className="auth-layout">
        <section className="auth-story">
          <span className="eyebrow">SEU DINHEIRO. SUAS CONQUISTAS.</span>
          <h1>Mais clareza.<br /><span>Mais possibilidades.</span></h1>
          <p>Entenda o fluxo do seu dinheiro. Um lugar para cuidar do hoje e planejar tudo que vem depois.</p>
          <div className="auth-visual" aria-hidden="true">
            <article className="auth-mini-card">
              <div><span>Flux</span><Icon name="card" /></div>
              <small>Seu saldo</small>
              <strong>R$ 14.500</strong>
              <span>O próximo passo é seu.</span>
            </article>
            <div className="auth-mini-goal">
              <span className="row-icon"><Icon name="target" /></span>
              <div>
                <strong>Viagem ao Japão</strong>
                <small>68% mais perto de acontecer</small>
                <div className="progress"><span className="dark" style={{ width: '68%' }} /></div>
              </div>
            </div>
          </div>
        </section>

        <section className="auth-form-panel" key={mode}>
          {signup && <span className="eyebrow">COMECE DO SEU JEITO</span>}
          {signupSuccess && <span className="eyebrow">CADASTRO CONCLUÍDO</span>}
          {forgot && <span className="eyebrow">RECUPERAÇÃO DE CONTA</span>}
          {reset && <span className="eyebrow">NOVA SENHA</span>}
          {resetSuccess && <span className="eyebrow">SENHA ATUALIZADA</span>}
          <h2>{heading}</h2>
          <p>{subtitle}</p>

          {signupSuccess ? (
            <SuccessState
              title={signupResult?.needsConfirmation ? 'Confirme seu e-mail' : 'Conta criada com sucesso!'}
              description={
                signupResult?.needsConfirmation ? (
                  <>
                    Enviamos um link de confirmação para <strong>{signupResult.email}</strong>. Confirme seu e-mail para liberar o acesso.
                  </>
                ) : (
                  <>
                    Tudo pronto! Seu espaço no Flux já está ativo para você começar a organizar suas finanças.
                  </>
                )
              }
              actionLabel={signupResult?.needsConfirmation ? 'Ir para o login' : 'Começar apresentação'}
              onAction={() => {
                if (!signupResult?.needsConfirmation && onContinueAfterSignup) onContinueAfterSignup()
                else switchTo('login')
              }}
            />
          ) : resetSuccess ? (
            <SuccessState
              title="Senha redefinida!"
              description="Sua nova senha já está ativa. Você já pode acessar o Flux com segurança."
              actionLabel={onContinueAfterReset ? 'Acessar o Flux' : 'Ir para o login'}
              onAction={() => {
                if (onContinueAfterReset) onContinueAfterReset()
                else switchTo('login')
              }}
            />
          ) : forgot && resetSentEmail ? (
            <SuccessState
              title="Link de redefinição enviado"
              description={
                <>
                  Enviamos as instruções para <strong>{resetSentEmail}</strong>. Confira sua caixa de entrada e a pasta de spam.
                </>
              }
              actionLabel="Voltar para o login"
              onAction={() => switchTo('login')}
            />
          ) : (
            <form className="form" noValidate onSubmit={submit} key={shakeKey > 0 ? `s-${shakeKey}` : 'clean'}>
              {signup && (
                <div className="auth-field-group">
                  <label htmlFor="auth-name">
                    <span>Seu nome <abbr title="obrigatório">*</abbr></span>
                    <input
                      id="auth-name"
                      name="name"
                      className={mergedErrors.name ? 'input-invalid' : undefined}
                      value={name}
                      onChange={(e) => updateField('name', setName, e.target.value)}
                      placeholder="Como podemos chamar você?"
                      autoComplete="name"
                      maxLength={70}
                      required
                      aria-invalid={Boolean(mergedErrors.name)}
                      aria-describedby={mergedErrors.name ? 'auth-name-error' : undefined}
                    />
                  </label>
                  {mergedErrors.name && <p className="field-error" id="auth-name-error" role="alert">{mergedErrors.name}</p>}
                </div>
              )}

              {!reset && (
                <div className="auth-field-group">
                  <label htmlFor="auth-email">
                    <span>E-mail</span>
                    <input
                      id="auth-email"
                      name="email"
                      type="email"
                      className={mergedErrors.email ? 'input-invalid' : undefined}
                      value={email}
                      onChange={(e) => updateField('email', setEmail, e.target.value)}
                      placeholder="seu@email.com"
                      autoComplete="email"
                      maxLength={254}
                      required
                      aria-invalid={Boolean(mergedErrors.email)}
                      aria-describedby={mergedErrors.email ? 'auth-email-error' : undefined}
                    />
                  </label>
                  {mergedErrors.email && <p className="field-error" id="auth-email-error" role="alert">{mergedErrors.email}</p>}
                </div>
              )}

              {!forgot && (
                <div className="auth-field-group">
                  <label htmlFor="auth-password">
                    <span>{reset ? 'Nova senha' : 'Senha'}</span>
                    <PasswordInput
                      id="auth-password"
                      name="password"
                      value={password}
                      onChange={(v) => updateField('password', setPassword, v)}
                      placeholder={signup || reset ? 'Mínimo de 6 caracteres' : 'Sua senha'}
                      autoComplete={signup || reset ? 'new-password' : 'current-password'}
                      invalid={Boolean(mergedErrors.password)}
                      describedBy={mergedErrors.password ? 'auth-password-error' : undefined}
                    />
                  </label>
                  {mergedErrors.password && <p className="field-error" id="auth-password-error" role="alert">{mergedErrors.password}</p>}

                  {(signup || reset) && password.length > 0 && (
                    <div className="password-strength" aria-live="polite">
                      <div className="password-strength-bars" data-tone={strength.tone}>
                        {[1, 2, 3, 4].map((step) => (
                          <span key={step} className={strength.score >= step ? 'active' : undefined} />
                        ))}
                      </div>
                      <div className="password-strength-meta">
                        <span>Força da senha: <strong>{strength.label}</strong></span>
                      </div>
                      <ul className="password-rules">
                        <li className={strength.checks.minLength ? 'met' : undefined}>Mínimo de 6 caracteres</li>
                        <li className={strength.checks.mixedCase ? 'met' : undefined}>Letras maiúsculas e minúsculas</li>
                        <li className={strength.checks.hasNumber ? 'met' : undefined}>Pelo menos um número</li>
                        <li className={strength.checks.hasSymbol ? 'met' : undefined}>Caractere especial (ex.: !@#$)</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {(signup || reset) && (
                <div className="auth-field-group">
                  <label htmlFor="auth-confirm-password">
                    <span>Confirmar senha</span>
                    <PasswordInput
                      id="auth-confirm-password"
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={(v) => updateField('confirmPassword', setConfirmPassword, v)}
                      placeholder="Repita a senha"
                      autoComplete="new-password"
                      invalid={Boolean(mergedErrors.confirmPassword)}
                      describedBy={mergedErrors.confirmPassword ? 'auth-confirm-error' : undefined}
                    />
                  </label>
                  {mergedErrors.confirmPassword && (
                    <p className="field-error" id="auth-confirm-error" role="alert">{mergedErrors.confirmPassword}</p>
                  )}
                </div>
              )}

              {mode === 'login' && (
                <div className="auth-options">
                  <label className="auth-remember">
                    <input
                      type="checkbox"
                      checked={rememberSession}
                      onChange={(e) => onChangeRememberSession(e.target.checked)}
                    />
                    <span>Manter sessão ativa</span>
                  </label>
                  <button type="button" className="text-button" onClick={() => switchTo('forgot')}>
                    Esqueci minha senha
                  </button>
                </div>
              )}

              {error && <p className="form-error" role="alert">{error}</p>}

              <button className="primary-button" disabled={busy}>
                {busy
                  ? 'Conectando…'
                  : signup
                    ? 'Criar conta'
                    : forgot
                      ? 'Enviar link de redefinição'
                      : reset
                        ? 'Salvar nova senha'
                        : 'Entrar'}
                <Icon name="arrow" />
              </button>
            </form>
          )}

          {!forgot && !reset && !signupSuccess && !resetSuccess && (
            <p className="auth-switch">
              {signup ? 'Já tem uma conta?' : 'Primeira vez por aqui?'}
              <button className="text-button" type="button" onClick={() => switchTo(signup ? 'login' : 'signup')}>
                {signup ? 'Entrar' : 'Criar conta'}
              </button>
            </p>
          )}
          {(forgot || reset) && !resetSentEmail && (
            <p className="auth-switch">
              Lembrou sua senha?
              <button className="text-button" type="button" onClick={() => switchTo('login')}>
                Voltar para o login
              </button>
            </p>
          )}
        </section>
      </div>
      <footer className="auth-footer">Feito para os seus próximos passos.</footer>
    </div>
  )
}
