// Layouts da chamada. Todos recebem a mesma lista de pessoas e só mudam como desenhar.
//   todos: eu + os outros, cada um com { id, nome, personagem, mestre, mesa, camera, voz }
//   telas: telas compartilhadas, cada uma com { id, nome, tela }

// Coloca o fluxo de vídeo/áudio no elemento assim que ele aparece na tela
export const colocarFluxo = (elemento, fluxo) => { if (elemento && elemento.srcObject !== fluxo) elemento.srcObject = fluxo }

// Quadro de uma pessoa: câmera (ou a inicial do nome) e o áudio dela.
// "fixo" usa as cores do layout de RPG, que tem visual fixo de propósito (estilo overlay de stream)
export function Quadro({ legenda, camera, fixo }) {
  const cores = fixo ? 'border-cyan-800 bg-slate-950' : 'border-dark-border bg-dark-card'
  return (
    <div className={'relative grid aspect-video place-items-center overflow-hidden rounded-xl border ' + cores}>
      {camera ? (
        <video autoPlay playsInline muted ref={(el) => colocarFluxo(el, camera)} className="absolute inset-0 h-full w-full bg-black object-contain" />
      ) : (
        <div className="grid h-14 w-14 place-items-center rounded-full bg-purple-600 text-xl font-bold text-white">
          {(legenda[0] || '?').toUpperCase()}
        </div>
      )}
      <span className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-0.5 text-center text-sm text-white">{legenda}</span>
    </div>
  )
}

// Palco: onde aparece a tela compartilhada (no RPG, a mesa virtual)
function Palco({ telas, telaLigada, vazio }) {
  const atual = telas[0]
  return (
    <div className="relative grid min-h-[40vh] place-items-center overflow-hidden rounded-xl bg-black lg:min-h-[60vh]">
      {atual ? (
        <>
          {/* o som da tela toca no <audio> da Chamada.jsx, que continua tocando em qualquer página */}
          <video autoPlay playsInline muted ref={(el) => colocarFluxo(el, atual.tela)} className="absolute inset-0 h-full w-full object-contain" />
          <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-sm text-white">Tela de {atual.nome}</span>
        </>
      ) : (
        <p className="px-4 text-center text-sm text-white/70">{telaLigada ? 'Você está compartilhando a tela.' : vazio}</p>
      )}
    </div>
  )
}

// 1) Conversa: todo mundo em grade, telas compartilhadas grandes no topo
export function LayoutConversa({ todos, telas }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {telas.map((t) => (
        <div key={t.id + 'tela'} className="col-span-full"><Palco telas={[t]} /></div>
      ))}
      {todos.map((p) => <Quadro key={p.id} legenda={p.nome} camera={p.camera} voz={p.voz} />)}
    </div>
  )
}

// 2) Apresentação: a tela fica grande e as câmeras numa faixa ao lado
export function LayoutApresentacao({ todos, telas, telaLigada }) {
  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
      <Palco telas={telas} telaLigada={telaLigada} vazio="Clique em Compartilhar tela para apresentar." />
      <div className="grid grid-cols-2 content-start gap-3 sm:grid-cols-3 lg:grid-cols-1">
        {todos.map((p) => <Quadro key={p.id} legenda={p.nome} camera={p.camera} voz={p.voz} />)}
      </div>
    </div>
  )
}

// 3) RPG: mestre e dados à esquerda, mesa virtual no centro, jogadores embaixo ("Personagem | Jogador")
export function LayoutRpg({ todos, telas, telaLigada, painel }) {
  const mestre = todos.find((p) => p.mestre)
  const jogadores = todos.filter((p) => !p.mestre)
  const legenda = (p) => (p.personagem ? p.personagem + ' | ' + p.nome : p.nome)
  return (
    <div className="grid gap-3 rounded-2xl border-2 border-cyan-800 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-3 text-white lg:grid-cols-[minmax(220px,24%)_1fr]">
      <div className="grid content-start gap-3">
        {mestre ? (
          <Quadro fixo legenda={'Mestre ' + mestre.nome} camera={mestre.camera} voz={mestre.voz} />
        ) : (
          <div className="grid aspect-video place-items-center rounded-xl border border-cyan-800 bg-slate-950 text-sm text-cyan-100/70">Sem mestre na sala</div>
        )}
        {painel}
      </div>
      <Palco telas={telas} telaLigada={telaLigada} vazio="Aguardando alguém compartilhar a tela da mesa virtual." />
      <div className="col-span-full grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {jogadores.map((p) => <Quadro fixo key={p.id} legenda={legenda(p)} camera={p.camera} voz={p.voz} />)}
      </div>
      {mestre && mestre.mesa && <p className="col-span-full text-right text-lg font-bold tracking-wide text-cyan-200">{mestre.mesa}</p>}
    </div>
  )
}

// Painel de dados: última rolagem em destaque (de qualquer pessoa da sala) e as anteriores
export function PainelDados({ rolagens, expressao, setExpressao, rotulo, setRotulo, aoRolar }) {
  const ultima = rolagens[0]
  const campo = 'min-w-0 rounded-lg border border-cyan-800 bg-slate-900 px-2 py-1 text-sm text-white placeholder:text-cyan-100/50'
  return (
    <div className="rounded-xl border border-cyan-800 bg-slate-950/80 p-3 text-white">
      {ultima ? (
        <div className="text-center">
          <p className="text-sm font-semibold text-cyan-100">{ultima.quem}</p>
          {ultima.rotulo && <p className="text-sm text-cyan-200">{ultima.rotulo}</p>}
          <p className="text-xs text-cyan-100/80">{ultima.expressao}</p>
          <p className="text-4xl font-bold">{ultima.total}</p>
          <p className="text-xs text-cyan-100/70">[{ultima.dados.join(', ')}]</p>
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-cyan-100/70">Nenhuma rolagem ainda</p>
      )}
      <form onSubmit={(e) => { e.preventDefault(); aoRolar() }} className="mt-2 grid grid-cols-[1fr_1fr_auto] gap-2">
        <input value={expressao} onChange={(e) => setExpressao(e.target.value)} aria-label="Dados" placeholder="1d20+5" className={campo} />
        <input value={rotulo} onChange={(e) => setRotulo(e.target.value)} aria-label="Motivo da rolagem" placeholder="Iniciativa" className={campo} />
        <button type="submit" className="rounded-lg bg-purple-600 px-3 py-1 text-sm font-semibold text-white hover:bg-purple-500">Rolar</button>
      </form>
      {rolagens.length > 1 && (
        <ul className="mt-2 grid gap-0.5 text-xs text-cyan-100/70">
          {rolagens.slice(1, 5).map((r, i) => (
            <li key={i}>{r.quem}: {r.expressao} = {r.total}{r.rotulo ? ' (' + r.rotulo + ')' : ''}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
