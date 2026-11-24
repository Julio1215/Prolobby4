// Um "relógio" que continua batendo com a aba em segundo plano.
// O setInterval comum fica lento (ou quase parado) numa aba escondida; um Worker não. A chamada precisa disso
// para avisar o servidor de salas e as outras pessoas de que continua viva (senão a vaga é liberada e outra
// pessoa pode ocupá-la, e as duas ficam em salas separadas).
export function iniciarPulso(funcao, ms) {
  let trabalhador = null
  let endereco = null
  let intervalo = null
  const usarRelogioComum = () => { if (!intervalo) intervalo = setInterval(funcao, ms) }
  try {
    endereco = URL.createObjectURL(new Blob(['setInterval(function () { postMessage(1) }, ' + ms + ')'], { type: 'text/javascript' }))
    trabalhador = new Worker(endereco)
    trabalhador.onmessage = () => funcao()
    trabalhador.onerror = () => { trabalhador.terminate(); trabalhador = null; usarRelogioComum() } // sem Worker: relógio comum
  } catch {
    usarRelogioComum()
  }
  return () => {
    if (trabalhador) trabalhador.terminate()
    if (endereco) URL.revokeObjectURL(endereco)
    if (intervalo) clearInterval(intervalo)
  }
}
