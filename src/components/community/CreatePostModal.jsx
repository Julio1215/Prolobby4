import { useState, useRef } from 'react'
import { criarPost, arquivoParaDataUrl } from '../../services/localDb'
import { useAuth } from '../../contexts/AuthContext'

const TYPES = [
  { key: 'REVIEW',     icon: '⭐', label: 'Review',     desc: 'Avalie um jogo com nota e texto' },
  { key: 'SCREENSHOT', icon: '📸', label: 'Screenshot', desc: 'Compartilhe uma captura de tela' },
  { key: 'ARTWORK',    icon: '🎨', label: 'Artwork',    desc: 'Poste sua arte ou fan art' },
  { key: 'DISCUSSION', icon: '💬', label: 'Discussão',  desc: 'Inicie uma conversa' },
]

const inputCls = "w-full px-3.5 py-2.5 bg-light-secondary dark:bg-dark-secondary border border-light-border dark:border-dark-border rounded-app text-light-text-1 dark:text-dark-text-1 text-sm focus:border-brand outline-none transition-colors placeholder:text-light-text-3 dark:placeholder:text-dark-text-3 resize-y"
const labelCls = "text-xs font-semibold text-light-text-3 dark:text-dark-text-3 uppercase tracking-wide"

export default function CreatePostModal({ onClose, onCreated }) {
  const { usuario } = useAuth()
  const [step,      setStep]    = useState('type')
  const [type,      setType]    = useState(null)
  const [title,     setTitle]   = useState('')
  const [content,   setContent] = useState('')
  const [gameTitle, setGameTitle] = useState('')
  const [rating,    setRating]  = useState(0)
  const [image,     setImage]   = useState(null)
  const [preview,   setPreview] = useState(null)
  const [saving,    setSaving]  = useState(false)
  const [error,     setError]   = useState('')
  const fileRef = useRef(null)
  const needsImage = type === 'SCREENSHOT' || type === 'ARTWORK'

  const handleImg = (e) => { const f = e.target.files?.[0]; if (!f) return; setImage(f); setPreview(URL.createObjectURL(f)) }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('')
    if (needsImage && !image) { setError('Selecione uma imagem.'); return }
    if ((type === 'REVIEW' || type === 'DISCUSSION') && !content.trim()) { setError('Escreva o conteúdo.'); return }
    setSaving(true)
    try {
      const imageUrl = image ? await arquivoParaDataUrl(image) : null
      const novoPost = criarPost({ usuario, type, title, content, gameTitle, rating, imageUrl })
      onCreated(novoPost)
    } catch (err) { setError(err.message || 'Erro ao publicar.') }
    finally { setSaving(false) }
  }

  const selectedType = TYPES.find(t => t.key === type)

  return (
    <div className="fixed inset-0 z-[500] bg-black/70 flex items-center justify-center p-4" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="w-full max-w-lg bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-app-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-light-border dark:border-dark-border">
          <h2 className="text-[17px] font-semibold text-light-text-1 dark:text-dark-text-1">
            {step === 'type' ? 'O que você quer compartilhar?' : `Novo post — ${selectedType?.label}`}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-app text-light-text-3 dark:text-dark-text-3 hover:bg-light-hover dark:hover:bg-dark-hover transition-colors text-lg">✕</button>
        </div>

        {step === 'type' ? (
          <div className="grid grid-cols-2 gap-3 p-5">
            {TYPES.map(t => (
              <button key={t.key} onClick={() => { setType(t.key); setStep('form') }}
                className="flex flex-col items-center gap-1.5 p-5 bg-light-secondary dark:bg-dark-secondary border border-light-border dark:border-dark-border rounded-app hover:border-brand hover:bg-brand/5 transition-all">
                <span className="text-3xl">{t.icon}</span>
                <span className="text-sm font-semibold text-light-text-1 dark:text-dark-text-1">{t.label}</span>
                <span className="text-xs text-light-text-3 dark:text-dark-text-3 text-center">{t.desc}</span>
              </button>
            ))}
          </div>
        ) : (
          <form className="flex flex-col gap-4 p-5" onSubmit={handleSubmit}>
            {needsImage && (
              <div onClick={() => fileRef.current?.click()}
                className="w-full min-h-[180px] border-2 border-dashed border-light-border dark:border-dark-border rounded-app cursor-pointer flex flex-col items-center justify-center gap-2 hover:border-brand transition-colors overflow-hidden">
                {preview ? <img src={preview} alt="" className="w-full max-h-[300px] object-contain" />
                  : <><span className="text-3xl">⬆️</span><span className="text-sm text-light-text-3 dark:text-dark-text-3">Clique para selecionar</span></>}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImg} />
              </div>
            )}
            {(type==='REVIEW' || type==='SCREENSHOT') && (
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Jogo {type==='REVIEW' ? '*' : '(opcional)'}</label>
                <input value={gameTitle} onChange={e => setGameTitle(e.target.value)} placeholder="Nome do jogo..." required={type==='REVIEW'} className={inputCls} />
              </div>
            )}
            {type==='REVIEW' && (
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Nota *</label>
                <div className="flex gap-1.5">
                  {[1,2,3,4,5].map(i => (
                    <button key={i} type="button" onClick={() => setRating(i)}
                      className={`text-3xl bg-transparent border-none cursor-pointer transition-colors ${i<=rating ? 'text-yellow-400' : 'text-light-border dark:text-dark-border'}`}>★</button>
                  ))}
                </div>
              </div>
            )}
            {(type==='ARTWORK' || type==='DISCUSSION') && (
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Título {type==='DISCUSSION' ? '*' : '(opcional)'}</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder={type==='DISCUSSION' ? 'Qual é o assunto?' : 'Nome da arte...'} className={inputCls} />
              </div>
            )}
            {(type==='REVIEW' || type==='DISCUSSION') && (
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>{type==='REVIEW' ? 'Review *' : 'Conteúdo *'}</label>
                <textarea rows={5} value={content} onChange={e => setContent(e.target.value)}
                  placeholder={type==='REVIEW' ? 'O que você achou do jogo?' : 'O que você quer falar?'} className={inputCls} />
              </div>
            )}
            {needsImage && (
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Legenda (opcional)</label>
                <textarea rows={2} value={content} onChange={e => setContent(e.target.value)} placeholder="Adicione uma legenda..." className={inputCls} />
              </div>
            )}
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex justify-between items-center gap-3 mt-1">
              <button type="button" onClick={() => setStep('type')}
                className="px-4 py-2.5 bg-transparent border border-light-border dark:border-dark-border rounded-app text-sm text-light-text-2 dark:text-dark-text-2 hover:border-brand hover:text-light-text-1 dark:hover:text-dark-text-1 transition-all">← Voltar</button>
              <button type="submit" disabled={saving}
                className="px-6 py-2.5 bg-brand hover:bg-brand-light disabled:opacity-60 rounded-app text-sm font-semibold text-white transition-colors">
                {saving ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
