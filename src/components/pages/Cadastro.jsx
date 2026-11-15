import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registrarUsuario } from '../../services/localDb'
import { useAuth } from '../../contexts/AuthContext'

function Field({ name, value, onChange, label, type = 'text', placeholder, required, hint, mostrarSenha, onToggleSenha }) {
  const isSenha = name === 'password' || name === 'confirm'

  // Decide qual tipo o input deve ter
  let tipoDoInput = type
  if (isSenha) {
    tipoDoInput = 'password'
    if (mostrarSenha) {
      tipoDoInput = 'text'
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold text-purple-100/50 uppercase tracking-wider">
        {label} {required && <span className="text-purple-400">*</span>}
      </label>
      <div className="relative">
        <input
          type={tipoDoInput}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-purple-500 transition ${
            isSenha ? 'pr-11' : ''
          }`}
        />
        {name === 'password' && (
          <button
            type="button"
            onClick={onToggleSenha}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer text-slate-400 text-sm p-1 leading-none"
          >
            {mostrarSenha ? '🙈' : '👁️'}
          </button>
        )}
      </div>
      {hint && <p className="text-[11px] text-purple-100/35">{hint}</p>}
    </div>
  )
}

export default function Cadastro() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', username: '', displayName: '', password: '', confirm: '' })
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')

    if (!form.email || !form.username || !form.password) {
      setErro('Preencha todos os campos obrigatórios')
      return
    }
    if (form.password !== form.confirm) {
      setErro('As senhas não coincidem')
      return
    }
    if (form.password.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setCarregando(true)
    try {
      const usuario = registrarUsuario({
        email: form.email,
        username: form.username,
        displayName: form.displayName || form.username,
        password: form.password,
      })
      const tokenFalso = 'local-' + usuario.id
      login(usuario, tokenFalso)
      navigate('/')
    } catch (err) {
      setErro(err.message || 'Erro ao criar conta')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#060610] via-[#0d0d1a] to-[#060610] p-6 relative overflow-hidden">
      <div className="fixed -top-24 -right-24 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
      <div className="fixed -bottom-20 -left-20 w-80 h-80 rounded-full bg-fuchsia-600/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-950/80 backdrop-blur-2xl border border-purple-500/20 rounded-3xl p-10 shadow-[0_0_60px_rgba(124,58,237,0.12)]">
        <div className="text-center mb-8">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center text-2xl mx-auto mb-3 shadow-[0_0_20px_rgba(191,0,255,0.35)]">
            🎮
          </div>
          <h1 className="font-bold text-2xl text-white mb-1">
            Criar conta
          </h1>
          <p className="text-xs text-purple-100/45">Junte-se ao ProLobby</p>
        </div>

        {erro && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs flex gap-2">
            <span>⚠️</span><span>{erro}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <Field name="email"       value={form.email}       onChange={handleChange} label="Email"              type="email" placeholder="seu@email.com"           required />
          <Field name="username"    value={form.username}    onChange={handleChange} label="Username"                        placeholder="gamer123"                 required hint="Será seu identificador único" />
          <Field name="displayName" value={form.displayName} onChange={handleChange} label="Nome de exibição"               placeholder="Seu nome público (opcional)" />
          <Field name="password"    value={form.password}    onChange={handleChange} label="Senha"              type="password" placeholder="Min. 6 caracteres"    required mostrarSenha={mostrarSenha} onToggleSenha={() => setMostrarSenha(s => !s)} />
          <Field name="confirm"     value={form.confirm}     onChange={handleChange} label="Confirmar senha"    type="password" placeholder="Repita a senha"        required mostrarSenha={mostrarSenha} />

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold p-3 text-sm rounded-xl mt-2 transition cursor-pointer flex justify-center items-center"
          >
            {carregando ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Criando conta...
              </span>
            ) : 'Criar conta grátis 🚀'}
          </button>
        </form>

        <p className="text-center mt-6 text-xs text-purple-100/40">
          Já tem conta?{' '}
          <Link to="/login" className="text-purple-400 font-bold hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}