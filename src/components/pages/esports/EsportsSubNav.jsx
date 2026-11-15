import { Link } from 'react-router-dom'

const ABAS = [
  { para: '/esports/noticias', chave: 'noticias', icone: 'bi-newspaper', label: 'Notícias' },
  { para: '/esports/partidas', chave: 'partidas', icone: 'bi-controller', label: 'Partidas' },
  { para: '/esports/times', chave: 'times', icone: 'bi-shield-fill', label: 'Times' },
  { para: '/esports/eventos', chave: 'eventos', icone: 'bi-calendar-event', label: 'Eventos' },
]

export default function EsportsSubNav({ ativa }) {
  return (
    <nav className="flex items-center gap-1 sm:gap-2 mb-8 border-b border-dark-border/50 pb-0 overflow-x-auto scrollbar-none max-w-full">
      {ABAS.map(aba => (
        <Link
          key={aba.chave}
          to={aba.para}
          className={[
            'flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium transition-all duration-200 border-b-2 -mb-px whitespace-nowrap shrink-0',
            ativa === aba.chave
              ? 'border-purple-400 text-purple-400'
              : 'border-transparent text-dark-text-2 hover:text-purple-300 hover:border-dark-border-lt',
          ].join(' ')}
        >
          <i className={`bi ${aba.icone}`} />
          <span>{aba.label}</span>
        </Link>
      ))}
    </nav>
  )
}
