import { Link } from 'react-router-dom'

const ABAS = [
  { para: '/rpg', chave: 'geral', icone: 'bi-grid-1x2-fill', label: 'Visão Geral' },
  { para: '/rpg/campanhas', chave: 'campanhas', icone: 'bi-shield-fill', label: 'Campanhas' },
  { para: '/rpg/fichas', chave: 'fichas', icone: 'bi-card-list', label: 'Fichas' },
  { para: '/rpg/mesa', chave: 'mesa', icone: 'bi-dice-5-fill', label: 'Mesa' },
  { para: '/rpg/ferramentas', chave: 'ferramentas', icone: 'bi-tools', label: 'Ferramentas' },
  { para: '/rpg/mestre', chave: 'mestre', icone: 'bi-robot', label: 'Mestre IA' },
]

export default function RpgSubNav({ ativa }) {
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
