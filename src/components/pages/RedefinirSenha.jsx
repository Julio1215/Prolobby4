import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { redefinirSenhaComToken } from '../../services/localDb'

export default function RedefinirSenha() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [concluido, setConcluido] = useState(false)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')

    if (senha.length < 8) {
      setErro('A senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (senha !== confirmar) {
      setErro('As senhas não coincidem.')
      return
    }

    setCarregando(true)
    try {
      redefinirSenhaComToken(token, senha)
      setConcluido(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setErro(err.message || 'Token inválido ou expirado.')
    } finally {
      setCarregando(false)
    }
  }

  // Componente de Card Reutilizável
  const Card = ({ children }) => (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 text-white">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center text-2xl">
            🎮
          </div>
        </div>
        {children}
      </div>
    </div>
  )

  // Sem Token na URL
  if (!token) {
    return (
      <Card>
        <p className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs text-center">
          ⚠️ Link inválido.
        </p>
        <Link to="/forgot-password" className="text-purple-400 hover:underline text-xs text-center">
          Solicitar novo link
        </Link>
      </Card>
    )
  }

  return (
    <Card>
      <h1 className="text-xl font-bold text-center">Nova senha</h1>

      {!concluido ? (
        <>
          {erro && (
            <p className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs">
              ⚠️ {erro}
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Nova senha
              </label>
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                className="bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-white outline-none focus:border-purple-500 transition"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Confirmar senha
              </label>
              <input
                type="password"
                value={confirmar}
                onChange={e => setConfirmar(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="new-password"
                className="bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-white outline-none focus:border-purple-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="mt-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition text-sm"
            >
              {carregando ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </form>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 text-center py-2">
          <span className="text-4xl">✅</span>
          <p className="text-xs text-slate-400">Senha alterada! Redirecionando...</p>
          <Link to="/login" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl text-sm transition">
            Ir para o login
          </Link>
        </div>
      )}
    </Card>
  )
}