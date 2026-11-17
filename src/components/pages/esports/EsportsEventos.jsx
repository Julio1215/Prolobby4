import { useState } from 'react'
import EsportsSubNav from './EsportsSubNav'
import FiltroEsports from './FiltroEsports'

const eventosFuturos = [
  { id: 1, nome: 'Esports World Cup 2026', liga: 'EWC', inicio: '2026-07-03', fim: '2026-07-13', premiacao: 'US$ 2.000.000', imagem: '/eventos/EWC.png' },
  { id: 2, nome: 'VCT 2026: Americas Stage 2', liga: 'VCT', inicio: '2026-07-17', fim: '2026-09-08', premiacao: 'US$ 250.000', imagem: '/eventos/VCT Americas.png' },
  { id: 3, nome: 'Champions 2026', liga: 'VCT Champions', inicio: '2026-09-25', fim: '2026-10-19', premiacao: 'US$ 2.050.000', imagem: '/eventos/VCT champions.png' },
  { id: 4, nome: 'Esports Nations Cup 2026', liga: 'ENC', inicio: '2026-11-10', fim: '2026-11-16', premiacao: 'US$ 1.500.000', imagem: '/eventos/ENC.png' },
]

const eventosPassados = [
  { id: 5, nome: 'Valorant Masters Santiago 2026', liga: 'VCT Masters', inicio: '2026-02-29', fim: '2026-03-16', premiacao: 'US$ 1.000.000', imagem: '/eventos/VCT Masters.png' },
  { id: 6, nome: 'Game Changers 2026: Brazil Stage 1', liga: 'GameChangers', inicio: '2026-03-7', fim: '2026-04-31', premiacao: 'R$ 30.000', imagem: '/eventos/Gamechanders.png' },
  { id: 7, nome: 'VCT 2026: Americas Stage 1', liga: 'VCT americas', inicio: '2026-04-11', fim: '2026-05-26', premiacao: 'US$ 250.000', imagem: '/eventos/VCT Americas.png' },
  { id: 8, nome: 'Valorant Masters Londres 2026', liga: 'VCT Masters', inicio: '2026-06-06', fim: '2026-06-21', premiacao: 'R$ 1.000.000', imagem: '/eventos/VCT Masters.png' },
]

function formatarDataEvento(iso) {
  if (!iso) return '?'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
  })
}

// VCT ou OFF (off-season) — mesma regra usada no badge de cada card
function badgeDoEvento(evento) {
  return evento.liga.toLowerCase().includes('vct') ? 'VCT' : 'OFF'
}

function CardEvento({ evento }) {
  const inicio = formatarDataEvento(evento.inicio)
  const fim = formatarDataEvento(evento.fim)


  const badge = badgeDoEvento(evento)

  return (
    <div className="bg-dark-secondary/40 backdrop-blur-sm rounded-xl border border-dark-border/50 p-5 min-h-[90px] flex items-center gap-4 transition-all duration-300 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-950/20">

      {/* Logo do torneio (fixo, sem depender de imagem externa) */}
      <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-dark-card/60 rounded-lg border border-dark-border/30 text-amber-400">
        <img
          src={evento.imagem}
          alt={evento.nome}
          className="w-full h-full object-contain p-1"
        />
      </div>

      {/* Informações */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <span className="text-dark-text-1 font-semibold text-lg leading-tight tracking-wide">
          {evento.nome}
        </span>
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          <span className="bg-dark-hover/50 text-dark-text-1 px-2 py-0.5 rounded border border-dark-border/30 uppercase tracking-wider">
            {badge}
          </span>
          <span className="text-dark-text-2">
            {inicio} - {fim}
          </span>
          {evento.premiacao && (
            <span className="text-amber-400 font-semibold">
              · 🏆 {evento.premiacao}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function EsportsEventos() {
  const [filtro, setFiltro] = useState('Todos')

  const futurosFiltrados = filtro === 'Todos'
    ? eventosFuturos
    : eventosFuturos.filter(e => badgeDoEvento(e) === filtro)

  const passadosFiltrados = filtro === 'Todos'
    ? eventosPassados
    : eventosPassados.filter(e => badgeDoEvento(e) === filtro)

  return (
    <div className="text-dark-text-1">
      <EsportsSubNav ativa="eventos" />

      <div className="px-6 pt-6 max-w-7xl mx-auto">
        <FiltroEsports
          opcoes={['Todos', 'VCT', 'OFF']}
          selecionado={filtro}
          onSelecionar={setFiltro}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 pb-6 max-w-7xl mx-auto">

        {/* ─── Coluna: Eventos a seguir ─── */}
        <div className="flex flex-col gap-4">
          <div className="bg-dark-card border border-dark-border/50 rounded-xl px-6 py-3 text-center text-dark-text-1 font-semibold text-sm tracking-wide">
            Eventos a seguir
          </div>
          {futurosFiltrados.length === 0 && (
            <p className="text-center text-dark-text-3 text-sm py-4">Nenhum evento encontrado.</p>
          )}
          {futurosFiltrados.map(e => <CardEvento key={e.id} evento={e} />)}
        </div>

        {/* ─── Coluna: Eventos finalizados ─── */}
        <div className="flex flex-col gap-4">
          <div className="bg-dark-card border border-dark-border/50 rounded-xl px-6 py-3 text-center text-dark-text-1 font-semibold text-sm tracking-wide">
            Eventos finalizados
          </div>
          {passadosFiltrados.length === 0 && (
            <p className="text-center text-dark-text-3 text-sm py-4">Nenhum evento encontrado.</p>
          )}
          {passadosFiltrados.map(e => <CardEvento key={e.id} evento={e} />)}
        </div>
      </div>
    </div>
  )
}
