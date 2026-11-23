import { useState } from 'react'
import { Link } from 'react-router-dom'
import { solicitarResetSenha } from '../../services/localDb'

export default function EsqueciSenha() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [linkDev, setLinkDev] = useState(null)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      // Sem servidor de email: geramos o token aqui mesmo e mostramos o link direto
      const token = solicitarResetSenha(email)
      setEnviado(true)
      if (token) setLinkDev(`/reset-password?token=${token}`)
    } catch (err) {
      setErro('Erro ao processar. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#060610] via-[#0d0d1a] to-[#060610] p-6 relative">
      <div className="fixed -top-24 -right-24 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
      <div className="fixed -bottom-20 -left-20 w-80 h-80 rounded-full bg-fuchsia-600/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-950/80 backdrop-blur-2xl border border-purple-500/20 rounded-3xl p-10 shadow-[0_0_60px_rgba(124,58,237,0.12)] flex flex-col gap-5">
        {/* Logo */}
        <div className="text-center">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center text-2xl mx-auto mb-3 shadow-[0_0_20px_rgba(191,0,255,0.35)]">
            🎮
          </div>
          <h1 className="font-bold text-xl text-white">
            Recuperar senha
          </h1>
        </div>

        {!enviado ? (
          <>
            <p className="text-xs text-purple-100/50 leading-relaxed">
              Digite seu email e enviaremos um link para redefinir sua senha.
            </p>

            {erro && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs">
                ⚠️ {erro}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-purple-100/50 uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                  autoComplete="email"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-purple-500 transition"
                />
              </div>
              <button
                type="submit"
                disabled={carregando}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold p-3 text-sm rounded-xl transition cursor-pointer"
              >
                {carregando ? 'Enviando...' : 'Enviar link'}
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center py-4">
            <span className="text-5xl">✉️</span>
            <p className="text-xs text-purple-100/50 leading-relaxed">
              Se este email estiver cadastrado, você receberá as instruções em breve.
            </p>
            {linkDev && (
              <div className="w-full p-3 bg-purple-600/10 border border-purple-500/25 rounded-xl text-xs text-center flex flex-col gap-1.5">
                <span className="text-purple-100/40">🛠️ Modo dev — link de reset:</span>
                <Link to={linkDev} className="text-purple-400 font-semibold hover:underline">
                  Clique aqui para redefinir →
                </Link>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-xs text-purple-100/45">
          Lembrou a senha?{' '}
          <Link to="/login" className="text-purple-400 font-semibold hover:underline">
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  )
}
