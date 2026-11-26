import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import type { FinanceData, Theme } from './finance'
import { Avatar, Icon, PageHeader } from './ui'

type Profile = FinanceData['profile']

async function cropSquareAvatar(file: File): Promise<{ blob: Blob; dataUrl: string }> {
  const bitmap = await createImageBitmap(file)
  const size = Math.min(bitmap.width, bitmap.height)
  const sx = Math.floor((bitmap.width - size) / 2)
  const sy = Math.floor((bitmap.height - size) / 2)
  const target = 512
  const canvas = document.createElement('canvas')
  canvas.width = target
  canvas.height = target
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas indisponível')
  ctx.drawImage(bitmap, sx, sy, size, size, 0, 0, target, target)
  bitmap.close()
  const dataUrl = canvas.toDataURL('image/jpeg', 0.88)
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Falha ao gerar imagem'))), 'image/jpeg', 0.88)
  })
  return { blob, dataUrl }
}

export default function Settings({
  profile,
  hideOnOpen,
  theme,
  onBack,
  onChangeTheme,
  onSaveProfile,
  onUploadAvatar,
  onRemoveAvatar,
  onToggleBalance,
  onOpenSupport,
  onOpenNotifications,
  onReplayOnboarding,
  onLogout,
  onDeleteAccount,
}: {
  profile: Profile
  hideOnOpen: boolean
  theme: Theme
  onBack: () => void
  onChangeTheme: (theme: Theme) => void
  onSaveProfile: (profile: Profile) => void
  onUploadAvatar?: (blob: Blob, dataUrl: string) => Promise<void>
  onRemoveAvatar?: () => Promise<void>
  onToggleBalance: () => void
  onOpenSupport?: () => void
  onOpenNotifications?: () => void
  onReplayOnboarding?: () => void
  onLogout: () => void
  onDeleteAccount?: () => void
}) {
  const [name, setName] = useState(profile.name)
  const [email, setEmail] = useState(profile.email)
  const [errors, setErrors] = useState<{ name?: string; email?: string; avatar?: string }>({})
  const [avatarBusy, setAvatarBusy] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const changed = name !== profile.name || email !== profile.email

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, avatar: 'Selecione uma imagem (JPG, PNG ou WebP).' }))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, avatar: 'A imagem deve ter no máximo 5 MB.' }))
      return
    }
    setErrors((prev) => ({ ...prev, avatar: undefined }))
    setAvatarBusy(true)
    try {
      const { blob, dataUrl } = await cropSquareAvatar(file)
      if (onUploadAvatar) await onUploadAvatar(blob, dataUrl)
    } catch {
      setErrors((prev) => ({ ...prev, avatar: 'Não foi possível processar a imagem. Tente outra foto.' }))
    } finally {
      setAvatarBusy(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!onRemoveAvatar) return
    setAvatarBusy(true)
    try {
      await onRemoveAvatar()
    } finally {
      setAvatarBusy(false)
    }
  }

  const save = (event: FormEvent) => {
    event.preventDefault()
    const next = { name: name.trim(), email: email.trim() }
    const nextErrors = {
      name: next.name ? undefined : 'Informe como podemos chamar você.',
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.email) ? undefined : 'Informe um e-mail válido.',
    }
    setErrors(nextErrors)
    if (nextErrors.name || nextErrors.email) return
    setName(next.name)
    setEmail(next.email)
    onSaveProfile(next)
  }
  const reset = () => { setName(profile.name); setEmail(profile.email); setErrors({}) }

  return <div className="view-page settings-page">
    <PageHeader title="Configurações" onBack={onBack} />
    <div className="page-intro">
      <span className="eyebrow">DO SEU JEITO</span>
      <h2>Seu espaço.<br />Suas preferências.</h2>
      <p>Cuide dos seus dados e escolha como quer ver seu dinheiro.</p>
    </div>
    <div className="settings-layout">
      <section className="panel settings-profile" aria-labelledby="settings-account-title">
        <div className="settings-identity">
          <span className="settings-avatar"><Avatar name={profile.name} src={profile.avatarUrl} alt={`Foto de perfil de ${profile.name}`} /></span>
          <div><span className="eyebrow">{profile.role === 'admin' ? 'ADMINISTRADOR' : 'SUA CONTA'}</span><h2 id="settings-account-title">{profile.name}</h2><p>{profile.email}</p></div>
        </div>
        <div className={`settings-avatar-actions${profile.avatarUrl ? ' has-remove' : ''}`}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={handleFileChange}
          />
          <button
            type="button"
            className="secondary-button"
            disabled={avatarBusy}
            onClick={() => fileInputRef.current?.click()}
          >
            <Icon name="camera" size={16} />
            {avatarBusy ? 'Salvando…' : profile.avatarUrl ? 'Trocar foto' : 'Enviar foto'}
          </button>
          {profile.avatarUrl && (
            <button
              type="button"
              className="danger-button settings-remove-avatar"
              disabled={avatarBusy}
              onClick={handleRemoveAvatar}
            >
              <Icon name="trash" size={16} />
              Remover foto
            </button>
          )}
        </div>
        {errors.avatar && <p className="settings-field-error" role="alert">{errors.avatar}</p>}
        <div className="settings-section-heading"><Icon name="edit" size={17} /><h3>Dados pessoais</h3></div>
        <p className="helper-text settings-description">Mantenha suas informações sempre em dia.</p>
        <form className="form settings-form" onSubmit={save} noValidate>
          <label htmlFor="settings-name"><span>Nome</span><input id="settings-name" name="name" value={name} onChange={(event) => setName(event.target.value)} maxLength={70} autoComplete="name" required aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'settings-name-error' : undefined} placeholder="Seu nome" /></label>
          {errors.name && <p className="settings-field-error" id="settings-name-error" role="alert">{errors.name}</p>}
          <label htmlFor="settings-email"><span>E-mail</span><input id="settings-email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} autoComplete="email" required aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'settings-email-error' : undefined} placeholder="seu@email.com" /></label>
          {errors.email && <p className="settings-field-error" id="settings-email-error" role="alert">{errors.email}</p>}
          <div className="settings-form-actions">
            <button className="primary-button" disabled={!changed}>Salvar alterações<Icon name="check" size={18} /></button>
            {changed && <button className="text-button" type="button" onClick={reset}>Descartar alterações</button>}
          </div>
        </form>
      </section>
      <div className="settings-preferences">
        <section className="panel settings-appearance" aria-labelledby="settings-appearance-title">
          <div className="settings-section-heading"><h3 id="settings-appearance-title">Aparência</h3></div>
          <p className="helper-text settings-description">Escolha um tema ou acompanhe a aparência do seu dispositivo.</p>
          <div className="settings-theme-options" role="group" aria-labelledby="settings-appearance-title">
            <button type="button" aria-pressed={theme === 'dark'} onClick={() => onChangeTheme('dark')}>
              <Icon name="moon" size={22} />
              <span>Escuro</span>
              {theme === 'dark' && <span className="settings-theme-check"><Icon name="check" size={12} /></span>}
            </button>
            <button type="button" aria-pressed={theme === 'light'} onClick={() => onChangeTheme('light')}>
              <Icon name="sun" size={22} />
              <span>Claro</span>
              {theme === 'light' && <span className="settings-theme-check"><Icon name="check" size={12} /></span>}
            </button>
            <button type="button" aria-pressed={theme === 'system'} onClick={() => onChangeTheme('system')}>
              <Icon name="monitor" size={22} />
              <span>Sistema</span>
              {theme === 'system' && <span className="settings-theme-check"><Icon name="check" size={12} /></span>}
            </button>
          </div>
        </section>
        <section className="panel" aria-labelledby="settings-app-title">
          <div className="section-heading"><div><span className="eyebrow">APLICATIVO</span><h2 id="settings-app-title">Mais privacidade.</h2></div><span className="row-icon settings-feature-icon"><Icon name="eyeOff" /></span></div>
          <button className="settings-switch" role="switch" aria-checked={hideOnOpen} aria-labelledby="settings-balance-title" aria-describedby="settings-balance-description" onClick={onToggleBalance}>
            <span><strong id="settings-balance-title">Ocultar saldo ao entrar</strong><small id="settings-balance-description">Comece com os valores protegidos. Toque no olho da Home quando quiser mostrar.</small></span>
            <i className={`toggle ${hideOnOpen ? 'on' : ''}`} aria-hidden="true" />
          </button>
          <dl className="settings-details"><div><dt>Idioma</dt><dd>Português (Brasil)</dd></div><div><dt>Moeda</dt><dd>Real brasileiro · R$</dd></div></dl>
          <div className="settings-quick-links">
            {onOpenNotifications && <button type="button" className="secondary-button settings-support-btn" onClick={onOpenNotifications}>Central e preferências de notificações<Icon name="chevron" size={16} /></button>}
            {onOpenSupport && <button type="button" className="secondary-button settings-support-btn" onClick={onOpenSupport}>Central de Ajuda e Fale Conosco<Icon name="chevron" size={16} /></button>}
            {onReplayOnboarding && <button type="button" className="secondary-button settings-support-btn" onClick={onReplayOnboarding}>Rever apresentação inicial<Icon name="chevron" size={16} /></button>}
          </div>
        </section>
        <section className="panel settings-session" aria-labelledby="settings-session-title">
          <span className="eyebrow">SESSÃO</span><h2 id="settings-session-title">Até o próximo passo.</h2><p>Você pode sair da sua conta quando quiser, sem apagar seus registros.</p>
          <button className="settings-logout" onClick={onLogout}>Sair da conta<Icon name="arrow" size={18} /></button>
          {onDeleteAccount && <button className="text-button settings-delete-account" type="button" onClick={onDeleteAccount}><Icon name="trash" size={15} />Excluir conta e apagar dados</button>}
        </section>
      </div>
    </div>
  </div>
}
