import { useState } from 'react'

// Capa de jogo usada nas telas de Reviews e QCD Score (cards e detalhe).
//
// A API manda a capa horizontal da Steam (header.jpg), que fica cortada num card vertical.
// Por isso, nos cards usamos a capa vertical do mesmo jogo (library_600x900.jpg).
//
// Ordem de tentativas (se uma imagem não carregar, passa para a próxima):
//   1. capa vertical da Steam (quando o jogo tem)
//   2. a imagem que veio da API, inteira (sem cortar), sobre um fundo desfocado
//   3. sem imagem: o emoji do gênero com o nome do jogo

const HEADER_DA_STEAM = /\/steam\/apps\/\d+\/header\.jpg(\?.*)?$/

function capaVerticalDaSteam(url) {
  return url && HEADER_DA_STEAM.test(url)
    ? url.replace(/header\.jpg(\?.*)?$/, 'library_600x900.jpg')
    : null
}

function CapaComTentativas({ nome, url, emoji, fundo, vertical }) {
  const urlVertical = vertical ? capaVerticalDaSteam(url) : null
  const [tentativa, setTentativa] = useState(urlVertical ? 1 : url ? 2 : 3)

  // A imagem não carregou: vai para a próxima tentativa
  function proximaTentativa() {
    setTentativa(tentativa === 1 && url ? 2 : 3)
  }

  // Tentativa 3: sem imagem
  if (tentativa === 3) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center gap-2 p-3 text-center ${fundo}`}>
        <span className="text-4xl">{emoji}</span>
        <span className="text-xs font-semibold text-dark-text-2 line-clamp-3">{nome}</span>
      </div>
    )
  }

  const src = tentativa === 1 ? urlVertical : url

  return (
    <div className={`relative w-full h-full overflow-hidden ${fundo}`}>
      {/* Tentativa 2: a imagem aparece inteira e o fundo desfocado preenche as sobras */}
      {tentativa === 2 && (
        <img
          src={src}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-50"
        />
      )}
      <img
        src={src}
        alt={nome}
        loading="lazy"
        onError={proximaTentativa}
        className={`relative w-full h-full ${tentativa === 1 ? 'object-cover' : 'object-contain'} group-hover:scale-105 transition-transform duration-300`}
      />
    </div>
  )
}

// A "key" faz as tentativas recomeçarem quando a imagem do jogo muda
// (por exemplo, quando a lista fixa é trocada pela lista que veio da API).
export default function CapaDoJogo({ nome, url, emoji = '🎮', fundo = 'bg-gray-600/20', vertical = true }) {
  return (
    <CapaComTentativas
      key={`${url}|${vertical}`}
      nome={nome}
      url={url}
      emoji={emoji}
      fundo={fundo}
      vertical={vertical}
    />
  )
}
