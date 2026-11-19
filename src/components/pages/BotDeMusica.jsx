import { useState, useEffect } from 'react'
import {
  lerPlayer, observarPlayer, adicionarFaixas, tocarFaixa, alternarPlayPause, proximaFaixa, faixaAnterior,
  irPara, definirVolumeLocal, definirRepetir, desligarPlayer,
} from '../../utils/playerMusica.js'

const tempo = (segundos) => Math.floor(segundos / 60) + ':' + String(segundos % 60).padStart(2, '0')
const botao = 'grid h-10 w-10 place-items-center rounded-lg border border-dark-border text-dark-text-1 transition-colors hover:bg-dark-secondary'
const botaoLigado = 'grid h-10 w-10 place-items-center rounded-lg border border-transparent bg-purple-600 text-white'

// Painel do bot de música da Chamada. O player em si fica em utils/playerMusica.js (continua tocando mesmo
// com este painel fechado ou em outra página); aqui só aparecem os botões.
//   musicaDeOutro = { por, titulo, tocando } quando OUTRA pessoa está com o bot ligado (senão null)
export default function BotDeMusica({ musicaDeOutro, volumeMusica, aoMudarVolumeMusica }) {
  const [player, setPlayer] = useState(lerPlayer)

  // Fica de olho no player enquanto o painel está aberto (a cada mudança, lê o estado de novo)
  useEffect(() => observarPlayer(() => setPlayer(lerPlayer())), [])

  return (
    <section aria-label="Bot de música" className="mb-4 grid gap-3 rounded-xl border border-dark-border bg-dark-card p-4 text-dark-text-1">
      <h2 className="flex items-center gap-2 text-lg font-bold">🤖 Bot de música</h2>

      {musicaDeOutro && (
        <div className="grid gap-2 rounded-lg border border-purple-500 p-3 text-sm">
          <p className="font-semibold">🎵 {musicaDeOutro.titulo || 'Bot ligado'}{musicaDeOutro.tocando ? '' : ' (pausado)'}</p>
          <p className="text-dark-text-2">Bot ligado por {musicaDeOutro.por}</p>
          <label className="flex items-center gap-2">
            Volume da música (só para você)
            <input
              type="range" min="0" max="100" aria-label="Volume da música"
              value={Math.round(volumeMusica * 100)}
              onChange={(e) => aoMudarVolumeMusica(Number(e.target.value) / 100)}
              className="accent-purple-600"
            />
          </label>
        </div>
      )}

      {player.faixas.length > 0 && (
        <ol className="grid max-h-44 gap-1 overflow-y-auto text-sm">
          {player.faixas.map((nome, i) => (
            <li key={i}>
              <button
                onClick={() => tocarFaixa(i)}
                className={'flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left ' + (i === player.indice ? 'bg-purple-600 text-white' : 'hover:bg-dark-secondary')}
              >
                <span className="w-5 text-right opacity-70">{i + 1}</span>
                <span className="truncate">{nome}</span>
                {i === player.indice && player.tocando && <span aria-hidden="true">♪</span>}
              </button>
            </li>
          ))}
        </ol>
      )}

      {player.faixas.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <button aria-label="Música anterior" title="Anterior" onClick={faixaAnterior} className={botao}><i className="bi bi-skip-backward-fill" /></button>
            <button aria-label={player.tocando ? 'Pausar' : 'Tocar'} title={player.tocando ? 'Pausar' : 'Tocar'} onClick={alternarPlayPause} className={botaoLigado}>
              <i className={player.tocando ? 'bi bi-pause-fill' : 'bi bi-play-fill'} />
            </button>
            <button aria-label="Próxima música" title="Próxima" onClick={() => proximaFaixa(false)} className={botao}><i className="bi bi-skip-forward-fill" /></button>
            <button aria-label="Repetir a lista" aria-pressed={player.repetir} title="Repetir a lista" onClick={() => definirRepetir(!player.repetir)} className={player.repetir ? botaoLigado : botao}>
              <i className="bi bi-repeat" />
            </button>
            <span className="text-sm tabular-nums text-dark-text-2">{tempo(player.posicao)} / {tempo(player.duracao)}</span>
          </div>
          <input
            type="range" aria-label="Posição da música" min="0" max={player.duracao || 0} value={Math.min(player.posicao, player.duracao || 0)}
            disabled={!player.ligado || !player.duracao}
            onChange={(e) => irPara(Number(e.target.value))}
            className="w-full accent-purple-600"
          />
          <label className="flex items-center gap-2 text-sm">
            Meu volume
            <input
              type="range" min="0" max="100" aria-label="Meu volume"
              value={Math.round(player.volume * 100)}
              onChange={(e) => definirVolumeLocal(Number(e.target.value) / 100)}
              className="accent-purple-600"
            />
          </label>
        </>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dark-border px-4 py-2 text-sm font-semibold text-dark-text-1 transition-colors hover:bg-dark-secondary">
          <i className="bi bi-plus-lg" /> Adicionar músicas
          <input
            type="file" accept="audio/*" multiple className="hidden" aria-label="Escolher arquivos de música"
            onChange={(e) => { adicionarFaixas(e.target.files); e.target.value = '' }}
          />
        </label>
        {player.ligado && (
          <button onClick={() => desligarPlayer()} className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500">
            <i className="bi bi-power" /> Desligar bot
          </button>
        )}
      </div>

      <p className="text-xs text-dark-text-3">
        Escolha músicas (mp3, wav, ogg...) do seu computador: o som sai do seu computador e todos na chamada escutam.
        Use fones para não dar eco. Para tocar YouTube ou Spotify, use "Compartilhar tela" e marque o áudio da guia.
      </p>
    </section>
  )
}
