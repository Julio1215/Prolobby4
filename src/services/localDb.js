// services/localDb.js
//
// "Banco de dados" 100% local — guardado no localStorage do navegador.
// Criado para o ProLobby rodar só com frontend, sem precisar de nenhum
// servidor (Express/Prisma/Postgres). Tudo que antes ia para a API
// agora é lido e salvo aqui.
//
// Limitações importantes (por não ter backend de verdade):
// - Os dados ficam só neste navegador — não sincronizam entre pessoas nem aparelhos
// - Se limpar os dados do site no navegador, tudo se perde
// - Senha não é criptografada de verdade (não tem como, sem servidor).
//   Serve só para simular o fluxo de login/cadastro.

// ================================================================
// Helpers genéricos de leitura/escrita no localStorage
// ================================================================
function ler(chave, valorPadrao) {
  const salvo = localStorage.getItem(chave)
  return salvo ? JSON.parse(salvo) : valorPadrao
}

function escrever(chave, valor) {
  localStorage.setItem(chave, JSON.stringify(valor))
}

function gerarId(prefixo) {
  return prefixo + '_' + Date.now()
}

// Converte um arquivo (imagem) escolhido pelo usuário em uma Data URL,
// que é só um texto que já contém a imagem dentro — dá pra salvar
// direto no localStorage, sem precisar de um servidor para guardar o arquivo.
export function arquivoParaDataUrl(arquivo) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader()
    leitor.onload = () => resolve(leitor.result)
    leitor.onerror = () => reject(new Error('Erro ao ler o arquivo'))
    leitor.readAsDataURL(arquivo)
  })
}

// ================================================================
// USUÁRIOS — login/cadastro/perfil
// ================================================================
const CHAVE_USUARIOS = 'hg_db_users'

export function registrarUsuario({ email, username, displayName, password }) {
  const usuarios = ler(CHAVE_USUARIOS, [])

  const jaExiste = usuarios.some(u => u.username === username || u.email === email)
  if (jaExiste) throw new Error('Username ou email já cadastrado')

  const novoUsuario = {
    id: gerarId('user'),
    email,
    username,
    displayName: displayName || username,
    password,
    bio: '',
    avatarUrl: null,
    role: 'USER',
    createdAt: new Date().toISOString(),
  }

  usuarios.push(novoUsuario)
  escrever(CHAVE_USUARIOS, usuarios)
  return novoUsuario
}

export function autenticarUsuario({ login, password }) {
  const usuarios = ler(CHAVE_USUARIOS, [])
  const usuario = usuarios.find(u => u.username === login || u.email === login)

  if (!usuario || usuario.password !== password) {
    throw new Error('Login ou senha incorretos')
  }
  return usuario
}

export function atualizarUsuarioSalvo(usuarioAtualizado) {
  const usuarios = ler(CHAVE_USUARIOS, [])
  const index = usuarios.findIndex(u => u.id === usuarioAtualizado.id)
  if (index !== -1) {
    usuarios[index] = { ...usuarios[index], ...usuarioAtualizado }
    escrever(CHAVE_USUARIOS, usuarios)
  }
  return usuarios[index]
}

// ================================================================
// RECUPERAÇÃO DE SENHA — sem servidor de email, o "link" é gerado na hora
// ================================================================
const CHAVE_RESET_TOKENS = 'hg_db_reset_tokens'

export function solicitarResetSenha(email) {
  const usuarios = ler(CHAVE_USUARIOS, [])
  const usuario = usuarios.find(u => u.email === email)
  if (!usuario) return null // email não cadastrado — não geramos token, mas não avisamos (mesma UX de antes)

  const token = gerarId('reset')
  const tokens = ler(CHAVE_RESET_TOKENS, {})
  tokens[token] = { userId: usuario.id, criadoEm: Date.now() }
  escrever(CHAVE_RESET_TOKENS, tokens)
  return token
}

export function redefinirSenhaComToken(token, novaSenha) {
  const tokens = ler(CHAVE_RESET_TOKENS, {})
  const entrada = tokens[token]
  if (!entrada) throw new Error('Token inválido ou expirado.')

  const usuarios = ler(CHAVE_USUARIOS, [])
  const index = usuarios.findIndex(u => u.id === entrada.userId)
  if (index === -1) throw new Error('Token inválido ou expirado.')

  usuarios[index].password = novaSenha
  escrever(CHAVE_USUARIOS, usuarios)

  delete tokens[token]
  escrever(CHAVE_RESET_TOKENS, tokens)
}

// ================================================================
// FICHAS DE RPG
// ================================================================
const CHAVE_FICHAS = 'hg_db_rpg_characters'

export function listarFichas(userId) {
  const fichas = ler(CHAVE_FICHAS, [])
  return fichas
    .filter(f => f.userId === userId)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

export function criarFicha({ userId, name, system, data, isPublic, campanhaId }) {
  const fichas = ler(CHAVE_FICHAS, [])
  const agora = new Date().toISOString()
  const novaFicha = {
    id: gerarId('rpg'),
    userId,
    name,
    system,
    data,
    isPublic: !!isPublic,
    shareToken: isPublic ? gerarId('share') : null,
    campanhaId: campanhaId || null,
    createdAt: agora,
    updatedAt: agora,
  }
  fichas.push(novaFicha)
  escrever(CHAVE_FICHAS, fichas)
  return novaFicha
}

export function atualizarFicha(id, dados) {
  const fichas = ler(CHAVE_FICHAS, [])
  const index = fichas.findIndex(f => f.id === id)
  if (index === -1) throw new Error('Ficha não encontrada')

  const atual = fichas[index]
  const shareToken = dados.isPublic ? (atual.shareToken || gerarId('share')) : atual.shareToken

  fichas[index] = { ...atual, ...dados, shareToken, updatedAt: new Date().toISOString() }
  escrever(CHAVE_FICHAS, fichas)
  return fichas[index]
}

export function deletarFicha(id) {
  const fichas = ler(CHAVE_FICHAS, [])
  escrever(CHAVE_FICHAS, fichas.filter(f => f.id !== id))
}

export function duplicarFicha(id, userId) {
  const fichas = ler(CHAVE_FICHAS, [])
  const original = fichas.find(f => f.id === id)
  if (!original) throw new Error('Ficha não encontrada')

  const agora = new Date().toISOString()
  const copia = {
    ...original,
    id: gerarId('rpg'),
    name: `${original.name} (Cópia)`,
    isPublic: false,
    shareToken: null,
    userId,
    createdAt: agora,
    updatedAt: agora,
  }
  fichas.push(copia)
  escrever(CHAVE_FICHAS, fichas)
  return copia
}

// ================================================================
// COMUNIDADE — posts, curtidas, comentários
// ================================================================
const CHAVE_POSTS = 'hg_db_community_posts'

export function listarPosts({ pagina = 1, limite = 18, tipo = '' } = {}) {
  let posts = ler(CHAVE_POSTS, [])
  if (tipo) posts = posts.filter(p => p.type === tipo)
  posts = [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const inicio = (pagina - 1) * limite
  const pagina_atual = posts.slice(inicio, inicio + limite)

  return {
    posts: pagina_atual,
    hasMore: inicio + limite < posts.length,
  }
}

export function criarPost({ usuario, type, title, content, gameTitle, rating, imageUrl }) {
  const posts = ler(CHAVE_POSTS, [])
  const novoPost = {
    id: gerarId('post'),
    type,
    title: title || '',
    content: content || '',
    gameTitle: gameTitle || '',
    rating: rating || 0,
    imageUrl: imageUrl || null,
    user: {
      id: usuario.id,
      username: usuario.username,
      displayName: usuario.displayName,
      avatarUrl: usuario.avatarUrl,
    },
    likesCount: 0,
    likedByMe: false,
    comentarios: [],
    createdAt: new Date().toISOString(),
  }
  posts.unshift(novoPost)
  escrever(CHAVE_POSTS, posts)
  return novoPost
}

export function alternarCurtida(postId) {
  const posts = ler(CHAVE_POSTS, [])
  const post = posts.find(p => p.id === postId)
  if (!post) return
  post.likedByMe = !post.likedByMe
  post.likesCount = Math.max(0, post.likesCount + (post.likedByMe ? 1 : -1))
  escrever(CHAVE_POSTS, posts)
}

export function comentarPost(postId, usuario, texto) {
  const posts = ler(CHAVE_POSTS, [])
  const post = posts.find(p => p.id === postId)
  if (!post) throw new Error('Post não encontrado')

  const novoComentario = {
    id: gerarId('comment'),
    content: texto,
    user: {
      id: usuario.id,
      username: usuario.username,
      displayName: usuario.displayName,
      avatarUrl: usuario.avatarUrl,
    },
    createdAt: new Date().toISOString(),
  }
  post.comentarios = [...(post.comentarios || []), novoComentario]
  escrever(CHAVE_POSTS, posts)
  return novoComentario
}

export function deletarPost(postId) {
  const posts = ler(CHAVE_POSTS, [])
  escrever(CHAVE_POSTS, posts.filter(p => p.id !== postId))
}

// ================================================================
// CAMPANHAS DE RPG — mesa compartilhada (Mestre + jogadores) com
// log de rolagem em comum. É a peça que hoje só existe pro dono
// do navegador ver; quando o backend PHP entrar, criarCampanha/
// entrarCampanha/registrarRolagem passam a falar com o servidor
// de verdade em vez do localStorage, e todo mundo na mesa passa
// a ver a mesma coisa ao vivo — o resto do código (as telas) não
// precisa mudar quase nada.
// ================================================================
const CHAVE_CAMPANHAS = 'hg_db_campaigns'
const PREFIXO_ROLAGENS = 'hg_db_campaign_rolls_'

function gerarCodigoConvite() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

function resumoUsuario(usuario) {
  return {
    id: usuario.id,
    username: usuario.username,
    displayName: usuario.displayName,
    avatarUrl: usuario.avatarUrl,
  }
}

export function listarCampanhas(userId) {
  const campanhas = ler(CHAVE_CAMPANHAS, [])
  return campanhas
    .filter(c => c.mestre.id === userId || c.jogadores.some(j => j.id === userId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function criarCampanha({ usuario, nome, sistema, descricao, maxJogadores, privada, capaUrl }) {
  const campanhas = ler(CHAVE_CAMPANHAS, [])
  const novaCampanha = {
    id: gerarId('camp'),
    nome,
    sistema,
    descricao: descricao || '',
    maxJogadores: maxJogadores || null,
    privada: !!privada,
    capaUrl: capaUrl || null,
    codigo: gerarCodigoConvite(),
    mestre: resumoUsuario(usuario),
    jogadores: [],
    createdAt: new Date().toISOString(),
  }
  campanhas.push(novaCampanha)
  escrever(CHAVE_CAMPANHAS, campanhas)
  return novaCampanha
}

export function atualizarCampanha(id, dados) {
  const campanhas = ler(CHAVE_CAMPANHAS, [])
  const index = campanhas.findIndex(c => c.id === id)
  if (index === -1) throw new Error('Campanha não encontrada')
  campanhas[index] = { ...campanhas[index], ...dados }
  escrever(CHAVE_CAMPANHAS, campanhas)
  return campanhas[index]
}

export function listarFichasPorCampanha(campanhaId) {
  const fichas = ler(CHAVE_FICHAS, [])
  return fichas.filter(f => f.campanhaId === campanhaId)
}

// ----------------------------------------------------------------
// Itens genéricos de uma campanha: NPC, monstro (bestiário), missão,
// sessão (diário), lore, mapa, item de inventário e anotação. Todos
// guardados juntos por campanha, diferenciados pelo campo "tipo" —
// evita ter 8 conjuntos quase idênticos de criar/listar/editar/excluir.
// ----------------------------------------------------------------
const PREFIXO_ITENS_CAMPANHA = 'hg_db_campaign_items_'

export function listarItensCampanha(campanhaId, tipo) {
  const itens = ler(PREFIXO_ITENS_CAMPANHA + campanhaId, [])
  const filtrados = tipo ? itens.filter(i => i.tipo === tipo) : itens
  return filtrados.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function criarItemCampanha(campanhaId, item) {
  const itens = ler(PREFIXO_ITENS_CAMPANHA + campanhaId, [])
  const novoItem = { id: gerarId('item'), createdAt: new Date().toISOString(), ...item }
  itens.push(novoItem)
  escrever(PREFIXO_ITENS_CAMPANHA + campanhaId, itens)
  return novoItem
}

export function atualizarItemCampanha(campanhaId, itemId, dados) {
  const itens = ler(PREFIXO_ITENS_CAMPANHA + campanhaId, [])
  const atualizados = itens.map(i => (i.id === itemId ? { ...i, ...dados } : i))
  escrever(PREFIXO_ITENS_CAMPANHA + campanhaId, atualizados)
  return atualizados.find(i => i.id === itemId)
}

export function deletarItemCampanha(campanhaId, itemId) {
  const itens = ler(PREFIXO_ITENS_CAMPANHA + campanhaId, [])
  escrever(PREFIXO_ITENS_CAMPANHA + campanhaId, itens.filter(i => i.id !== itemId))
}

// ----------------------------------------------------------------
// Mesa / combate — lista de combatentes de uma campanha, com HP e
// iniciativa. Fica salva por campanha pra não perder o combate se
// o mestre sair da tela sem querer.
// ----------------------------------------------------------------
const PREFIXO_COMBATE = 'hg_db_campaign_combat_'

export function buscarCombate(campanhaId) {
  return ler(PREFIXO_COMBATE + campanhaId, { combatentes: [], turnoAtual: 0 })
}

export function salvarCombate(campanhaId, combate) {
  escrever(PREFIXO_COMBATE + campanhaId, combate)
  return combate
}

// ----------------------------------------------------------------
// Campanha de exemplo — cria (se ainda não existir) uma campanha
// completa, navegável, pra demonstrar o RPG funcionando de ponta a
// ponta: personagens, NPCs, monstros, missões, lore, diário e um
// combate já com iniciativa rolada.
// ----------------------------------------------------------------
export function semearCampanhaExemplo(usuario) {
  const existente = listarCampanhas(usuario.id).find(c => c.nomeExemplo)
  if (existente) return existente

  const campanha = criarCampanha({
    usuario,
    nome: 'A Queda de Valdren',
    sistema: 'D&D 5e',
    descricao:
      'Um reino à beira da guerra civil, uma antiga maldição desperta sob a capital e um grupo de aventureiros no meio de tudo isso.',
    maxJogadores: 4,
    privada: false,
  })
  atualizarCampanha(campanha.id, { nomeExemplo: true })

  const personagensExemplo = [
    { name: 'Arin Bravovento', info: { characterName: 'Arin Bravovento', race: 'Humano', class: 'Guerreiro', level: 4 } },
    { name: 'Lyra Sombraverde', info: { characterName: 'Lyra Sombraverde', race: 'Elfa', class: 'Ladina', level: 4 } },
    { name: 'Doren Punhoférreo', info: { characterName: 'Doren Punhoférreo', race: 'Anão', class: 'Clérigo', level: 4 } },
  ]
  personagensExemplo.forEach(p => {
    criarFicha({
      userId: usuario.id,
      name: p.name,
      system: 'DND5E',
      data: { info: p.info },
      isPublic: false,
      campanhaId: campanha.id,
    })
  })

  criarItemCampanha(campanha.id, {
    tipo: 'npc',
    nome: 'Conselheira Elowen',
    campos: {
      descricao: 'Conselheira real de meia-idade, sempre vestida em tons de azul profundo.',
      personalidade: 'Calculista e reservada, mas genuinamente leal à coroa.',
      funcao: 'Dá aos jogadores a missão principal da campanha.',
      historia: 'Serviu três reis diferentes e sabe onde estão enterrados os segredos do castelo.',
      segredo: 'Sabe da maldição há anos e escondeu isso da coroa para evitar pânico.',
    },
  })
  criarItemCampanha(campanha.id, {
    tipo: 'npc',
    nome: 'Bram, o Ferreiro',
    campos: {
      descricao: 'Ferreiro robusto da vila de Eldoria, braços cobertos de cicatrizes de forja.',
      personalidade: 'Direto, bem-humorado, desconfia de nobres.',
      funcao: 'Vende e conserta equipamentos para o grupo.',
      historia: 'Ex-soldado que largou as armas depois da última guerra.',
      segredo: 'Guarda uma espada élfica que não é dele.',
    },
  })

  criarItemCampanha(campanha.id, {
    tipo: 'monstro',
    nome: 'Espectro de Valdren',
    campos: { hp: 45, ataque: '+6', defesa: 14, nivel: 'Desafio 3', habilidades: 'Toque gélido, invisibilidade parcial', descricao: 'Resíduo da maldição antiga, vaga pelos corredores do castelo.' },
  })
  criarItemCampanha(campanha.id, {
    tipo: 'monstro',
    nome: 'Lobo Sombrio',
    campos: { hp: 22, ataque: '+4', defesa: 12, nivel: 'Desafio 1', habilidades: 'Ataque em matilha', descricao: 'Lobo corrompido pela energia da maldição, caça em grupo.' },
  })

  criarItemCampanha(campanha.id, {
    tipo: 'missao',
    nome: 'A Maldição Desperta',
    campos: { objetivo: 'Descobrir a origem da maldição que ameaça a capital.', recompensa: '500 peças de ouro e favor da coroa', status: 'Ativa' },
  })
  criarItemCampanha(campanha.id, {
    tipo: 'missao',
    nome: 'Suprimentos para Eldoria',
    campos: { objetivo: 'Escoltar uma carroça de suprimentos até a vila vizinha.', recompensa: '100 peças de ouro', status: 'Concluída' },
  })

  criarItemCampanha(campanha.id, {
    tipo: 'lore',
    nome: 'A Maldição de Valdren',
    campos: { texto: 'Há 200 anos, o rei Valdren fez um pacto proibido para vencer uma guerra. A vitória veio — mas o preço ainda não foi cobrado por completo.' },
  })

  criarItemCampanha(campanha.id, {
    tipo: 'mapa',
    nome: 'Capital de Eldoria',
    campos: { descricao: 'Mapa geral da capital: castelo ao norte, mercado central, portos a leste.' },
  })

  criarItemCampanha(campanha.id, {
    tipo: 'item',
    nome: 'Poção de Cura Superior',
    campos: { quantidade: 3, descricao: 'Recupera 4d4+4 pontos de vida.' },
  })
  criarItemCampanha(campanha.id, {
    tipo: 'item',
    nome: 'Espada Élfica Antiga',
    campos: { quantidade: 1, descricao: 'Guardada por Bram — pertence a Lyra, mas ela ainda não sabe.' },
  })

  criarItemCampanha(campanha.id, {
    tipo: 'sessao',
    nome: 'Sessão 01',
    campos: { texto: 'O grupo chegou a Eldoria e conheceu Bram na ferraria. À noite, testemunharam o primeiro sinal da maldição: uma névoa verde subindo do poço da praça.' },
  })
  criarItemCampanha(campanha.id, {
    tipo: 'sessao',
    nome: 'Sessão 02',
    campos: { texto: 'A Conselheira Elowen convocou o grupo e revelou a missão principal. O grupo partiu em direção ao castelo abandonado.' },
  })

  salvarCombate(campanha.id, {
    combatentes: [
      { id: gerarId('comb'), nome: 'Arin Bravovento', tipo: 'jogador', hp: 32, hpMax: 38, iniciativa: 18 },
      { id: gerarId('comb'), nome: 'Lyra Sombraverde', tipo: 'jogador', hp: 24, hpMax: 24, iniciativa: 21 },
      { id: gerarId('comb'), nome: 'Doren Punhoférreo', tipo: 'jogador', hp: 30, hpMax: 34, iniciativa: 12 },
      { id: gerarId('comb'), nome: 'Espectro de Valdren', tipo: 'inimigo', hp: 45, hpMax: 45, iniciativa: 15 },
    ],
    turnoAtual: 0,
  })

  return campanha
}

export function entrarCampanha(codigo, usuario) {
  const campanhas = ler(CHAVE_CAMPANHAS, [])
  const campanha = campanhas.find(c => c.codigo === (codigo || '').trim().toUpperCase())
  if (!campanha) throw new Error('Código de campanha não encontrado')

  const jaEstaDentro = campanha.mestre.id === usuario.id || campanha.jogadores.some(j => j.id === usuario.id)
  if (!jaEstaDentro) {
    campanha.jogadores.push(resumoUsuario(usuario))
    escrever(CHAVE_CAMPANHAS, campanhas)
  }
  return campanha
}

export function buscarCampanha(id) {
  const campanhas = ler(CHAVE_CAMPANHAS, [])
  return campanhas.find(c => c.id === id) || null
}

export function registrarRolagem(campanhaId, { usuario, dado, resultado }) {
  const chave = PREFIXO_ROLAGENS + campanhaId
  const rolagens = ler(chave, [])
  rolagens.unshift({
    id: gerarId('roll'),
    usuario: usuario.displayName || usuario.username,
    dado,
    resultado,
    createdAt: new Date().toISOString(),
  })
  escrever(chave, rolagens.slice(0, 50)) // guarda só as últimas 50 rolagens
  return rolagens
}

export function listarRolagens(campanhaId) {
  return ler(PREFIXO_ROLAGENS + campanhaId, [])
}