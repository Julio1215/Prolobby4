// Servidor de sinalização do PeerJS para a Chamada do ProLobby.
// Ele só ajuda as pessoas a se encontrarem; o vídeo e o áudio vão direto entre elas.
import { PeerServer } from 'peer'

const porta = Number(process.env.PORT) || 9000

PeerServer({
  port: porta,
  host: '0.0.0.0',                // escuta em qualquer endereço (exigido por hospedagens como o Render)
  path: '/',
  proxied: true,                  // o Render coloca um proxy (HTTPS) na frente do servidor
  allow_discovery: false,         // ninguém consegue listar quem está online
  corsOptions: { origin: true },  // aceita qualquer site (ProLobby, Netlify, Discord...)
})

console.log('Servidor de sinalização no ar na porta ' + porta)
