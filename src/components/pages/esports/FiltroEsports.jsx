import { useState } from 'react'

// Botão de filtro reutilizável nas páginas de E-Sports (Notícias, Partidas, Eventos).
// Só cuida de mostrar/esconder a listinha de opções — quem decide o que fazer
// com a opção escolhida é a própria página, através do onSelecionar.
export default function FiltroEsports({ opcoes, selecionado, onSelecionar }) {
  const [aberto, setAberto] = useState(false)

  function escolher(opcao) {
    onSelecionar(opcao)
    setAberto(false)
  }

  return (
    <div className="relative inline-block mb-6">
      <button
        onClick={() => setAberto(!aberto)}
        className="bg-dark-secondary/80 hover:bg-dark-hover border border-dark-border px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer"
      >
        <i className="bi bi-funnel"></i> Filtro
      </button>

      {aberto && (
        <>
          {/* área invisível atrás da lista, só pra fechar ao clicar fora */}
          <div className="fixed inset-0 z-10" onClick={() => setAberto(false)}></div>

          <div className="absolute left-0 top-full mt-2 z-20 bg-dark-secondary border border-dark-border rounded-lg shadow-xl py-2 min-w-[200px]">
            {opcoes.map((opcao) => (
              <button
                key={opcao}
                onClick={() => escolher(opcao)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer hover:bg-dark-hover ${
                  opcao === selecionado ? 'text-purple-400 font-semibold' : 'text-dark-text-1'
                }`}
              >
                {opcao}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
