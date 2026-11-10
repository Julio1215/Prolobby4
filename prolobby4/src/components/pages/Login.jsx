import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { autenticarUsuario } from '../../services/localDb'
import { useAuth } from '../../contexts/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ login: '', password: '' })
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')

    if (!form.login || !form.password) {
      setErro('Preencha todos os campos')
      return
    }

    setCarregando(true)
    try {
      const usuario = autenticarUsuario(form)
      const tokenFalso = 'local-' + usuario.id
      login(usuario, tokenFalso)
      navigate('/')
    } catch (err) {
      setErro(err.message || 'Erro ao fazer login')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#060610] via-[#0d0d1a] to-[#060610] p-6 relative overflow-hidden">
      {/* Luzes de fundo */}
      <div className="fixed -top-24 -left-24 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
      <div className="fixed -bottom-20 -right-20 w-80 h-80 rounded-full bg-fuchsia-600/10 blur-3xl pointer-events-none" />

      {/* Card Form */}
      <div className="w-full max-w-md bg-slate-950/80 backdrop-blur-2xl border border-purple-500/20 rounded-3xl p-10 relative shadow-[0_0_60px_rgba(124,58,237,0.12)]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center text-3xl mx-auto mb-4 shadow-[0_0_24px_rgba(191,0,255,0.4)]">
            🎮
          </div>
          <h1 className="font-bold text-2xl text-white mb-1">
            PRO<span className="text-purple-400">LOBBY</span>
          </h1>
          <p className="text-xs text-purple-100/50">Entre na sua conta gamer</p>
        </div>

        {/* Erro */}
        {erro && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{erro}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-purple-100/50 uppercase tracking-wider">
              Email ou Username
            </label>
            <input
              type="text"
              name="login"
              value={form.login}
              onChange={handleChange}
              placeholder="seu@email.com"
              autoComplete="username"
              required
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-purple-500 transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-purple-100/50 uppercase tracking-wider">
                Senha
              </label>
              <Link to="/forgot-password" className="text-[11px] text-purple-400 font-semibold hover:underline">
                Esqueceu?
              </Link>
            </div>
            <div className="relative">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 pr-11 text-sm text-white outline-none focus:border-purple-500 transition"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer text-slate-400 text-sm p-1 leading-none"
              >
                {mostrarSenha ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold p-3 text-sm rounded-xl mt-2 transition cursor-pointer flex justify-center items-center"
          >
            {carregando ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Entrando...
              </span>
            ) : 'Entrar'}
          </button>
        </form>

        <p className="text-center mt-6 text-xs text-purple-100/45">
          Não tem conta?{' '}
          <Link to="/register" className="text-purple-400 font-bold hover:underline">
            Criar conta grátis
          </Link>
        </p>
      </div>
    </div>
  )
}