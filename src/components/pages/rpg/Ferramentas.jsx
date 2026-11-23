import { useState } from 'react'
import RpgSubNav from './RpgSubNav'
import GeradorIA, { TIPOS_GERADOR } from './GeradorIA'

// Entende expressões simples tipo "1d20", "2d6+3", "4d6+2"
function rolarExpressao(expressao) {
  const match = expressao.trim().toLowerCase().match(/^(\d*)d(\d+)([+-]\d+)?$/)
  if (!match) return null

  const quantidade = Number(match[1] || 1)
  const lados = Number(match[2])
  const modificador = Number(match[3] || 0)
  if (quantidade < 1 || quantidade > 100 || lados < 2) return null

  const dados = Array.from({ length: quantidade }, () => Math.floor(Math.random() * lados) + 1)
  const somaDados = dados.reduce((a, b) => a + b, 0)

  return {
    expressao: expressao.trim(),
    dados,
    modificador,
    resultado: somaDados + modificador,
  }
}

function RoladorExpressoes() {
  const [expressao, setExpressao] = useState('1d20+5')
  const [historico, setHistorico] = useState([])
  const [erro, setErro] = useState('')

  function rolar(e) {
    e?.preventDefault()
    const r = rolarExpressao(expressao)
    if (!r) {
      setErro('Expressão inválida. Use algo como 1d20, 2d6 ou 1d20+5.')
      return
    }
    setErro('')
    setHistorico(prev => [r, ...prev].slice(0, 8))
  }

  const atalhos = ['1d20', '2d6', '1d20+5', '2d20', '4d6+2']

  return (
    <div className="bg-dark-card border border-dark-border rounded-2xl p-5 flex flex-col gap-4">
      <h2 className="font-bold text-dark-text-1">🎲 Rolador de expressões</h2>

      <form onSubmit={rolar} className="flex gap-2 flex-wrap">
        <input
          value={expressao}
          onChange={e => setExpressao(e.target.value)}
          placeholder="Ex: 1d20+5"
          className="flex-1 min-w-[140px] bg-dark-secondary border border-dark-border rounded-xl px-3 py-2 text-sm text-dark-text-1 outline-none focus:border-purple-500 font-mono"
        />
        <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-bold cursor-pointer">
          Rolar
        </button>
      </form>

      <div className="flex gap-1.5 flex-wrap">
        {atalhos.map(a => (
          <button
            key={a}
            onClick={() => setExpressao(a)}
            className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border border-dark-border text-dark-text-2 hover:text-purple-300 hover:border-purple-500/40 cursor-pointer transition"
          >
            {a}
          </button>
        ))}
      </div>

      {erro && <p className="text-xs text-red-400">{erro}</p>}

      {historico.length > 0 && (
        <div className="flex flex-col gap-2 pt-2 border-t border-dark-border/60">
          {historico.map((r, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-dark-text-2 font-mono">
                🎲 {r.expressao} <span className="text-dark-text-3">({r.dados.join(', ')}{r.modificador ? ` ${r.modificador > 0 ? '+' : ''}${r.modificador}` : ''})</span>
              </span>
              <span className="font-bold text-purple-300 text-lg">{r.resultado}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Ferramentas() {
  return (
    <div className="flex flex-col gap-6 text-dark-text-1">
      <RpgSubNav ativa="ferramentas" />

      <div>
        <h1 className="text-2xl font-bold text-dark-text-1">📜 Ferramentas</h1>
        <p className="text-sm text-dark-text-2 mt-1">Dados, geradores e tudo que ajuda o mestre na mesa.</p>
      </div>

      <RoladorExpressoes />

      <GeradorIA tipos={TIPOS_GERADOR} />
    </div>
  )
}
