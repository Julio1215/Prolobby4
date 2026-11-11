// pages/QcdScore.jsx
//
// Versão sem backend: sem RAWG, sem chave de API, sem chamada ao servidor.
// A calculadora QCD (preço ÷ horas de jogo) continua funcionando 100% localmente,
// e a lista de jogos é o catálogo fixo logo abaixo, no mesmo arquivo.
//
// Pra colocar uma imagem em algum jogo, é só colar o link dentro das
// aspas de "imagem". Ex: imagem: 'https://site.com/foto-do-jogo.jpg'
// Se deixar vazio (''), aparece o emoji do gênero no lugar.

import { useState, useEffect } from 'react'
import { listarJogos } from '../../services/conteudoApi'
import { useNavigate } from 'react-router-dom'
import CapaDoJogo from '../ui/CapaDoJogo';

const CATALOGO_JOGOS = [
  { id: 1,  name: 'Elden Ring',                      imagem: 'https://imgs.search.brave.com/SURZwdns-bi9yiBN-LQxfBHwHYcXGnG0yuFaYSvD0VA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9wcmV2/aWV3LnJlZGQuaXQv/ZWxkZW4tcmluZy1j/b3Zlci1pbnNwaXJh/dGlvbnMtdjAtN211/b3NqNnU3czRlMS5q/cGc_d2lkdGg9Mzg0/MCZmb3JtYXQ9cGpw/ZyZhdXRvPXdlYnAm/cz0yMGUwMzg3ZjVh/YmFlY2FiYjZjMTdk/ZWY0ZTY0MmNjNWNl/ZTUxNWQz', rating: 4.6, metacritic: 96, released: '2022-02-25', playtime: 55, genres: ['RPG', 'Action'],           description_raw: 'RPG de ação em mundo aberto ambientado nas Terras Intermédias, com combate desafiador e exploração não-linear.' },
  { id: 2,  name: 'The Witcher 3: Wild Hunt',        imagem: 'https://imgs.search.brave.com/9qUu7mZ920W1Nl5jpHHljOFOZWdCMDiUdSmbmNs-Lxk/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9hc3Nl/dHMubmludGVuZG8u/Y29tL2ltYWdlL3Vw/bG9hZC9hcl8xNjo5/LGNfbHBhZCx3XzEy/NDAvYl93aGl0ZS9m/X2F1dG8vcV9hdXRv/L3N0b3JlL3NvZnR3/YXJlL3N3aXRjaC83/MDAxMDAwMDAzMzA3/MS8zZjdlZTZhYTM0/ODJiNTE0YmQ0NDNl/MTE2MDIyYjAzOGE5/NzI4ZjAxNzkxNmVk/MzdkYTNmMDlmNzMx/YTdkNWYy', rating: 4.8, metacritic: 93, released: '2015-05-19', playtime: 65, genres: ['RPG', 'Adventure'],        description_raw: 'RPG narrativo com Geralt de Rívia em busca de sua filha adotiva em um mundo repleto de escolhas morais.' },
  { id: 3,  name: 'Hades',                           imagem: 'https://imgs.search.brave.com/w_o1mSr1GA9741qGUkJNvcSKbgxo-OsQQsqM_Zd_D5s/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9hc3Nl/dHMubmludGVuZG8u/Y29tL2ltYWdlL3Vw/bG9hZC9mX2F1dG8v/cV9hdXRvL2Rwcl8x/LjUvc3RvcmUvc29m/dHdhcmUvc3dpdGNo/LzcwMDEwMDAwMDMz/MTMxL2RiYzhjNTVh/MjE2ODhiNDQ2YTVj/NTc3MTFiNzI2OTU2/NDgzYTE0ZWY4YzVk/ZGI4NjFmODk3YzA1/OTVjY2I2YjU', rating: 4.7, metacritic: 93, released: '2020-09-17', playtime: 25, genres: ['Action', 'Indie'],         description_raw: 'Roguelike de ação em que o príncipe do submundo tenta escapar do próprio reino, com narrativa que evolui a cada tentativa.' },
  { id: 4,  name: 'Stardew Valley',                  imagem: 'https://imgs.search.brave.com/lbkq-15PPU7qOTMdQ66eyS4Uc22txwYUSgPbDbVagYA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93YWxs/cGFwZXJzLmNvbS9p/bWFnZXMvaGQvMmQt/c3RhcmRldy12YWxs/ZXktZmFybS1sYW5k/c2NhcGUtd3J6M2l0/YWJiMjBiN2VjNy5q/cGc', rating: 4.7, metacritic: 89, released: '2016-02-26', playtime: 50, genres: ['Simulation', 'RPG'],      description_raw: 'Simulador de fazenda relaxante onde o jogador reconstrói uma propriedade herdada e se conecta com a comunidade local.' },
  { id: 5,  name: 'Hollow Knight',                   imagem: 'https://imgs.search.brave.com/3RkIaYJQVkrBhnLlOr4EDw2wUd6_yFhf7bHHjGGSdEU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tLm1l/ZGlhLWFtYXpvbi5j/b20vaW1hZ2VzL00v/TVY1Qk1HSXlZbUpt/WkRndE9XUTFOeTAw/TkRGaUxUazJPVGd0/TTJRMlpXUTRPV0l4/WmpnM1hrRXlYa0Zx/Y0djQC5qcGc', rating: 4.6, metacritic: 90, released: '2017-02-24', playtime: 30, genres: ['Action', 'Indie'],        description_raw: 'Metroidvania sombrio ambientado em um reino subterrâneo de insetos, conhecido pela exploração desafiadora e trilha sonora marcante.' },
  { id: 6,  name: 'Baldur\u2019s Gate 3',            imagem: 'https://imgs.search.brave.com/UB8RO81kkmn07k5j84-8HhD7-FIEKhev2L7bxdAcCXk/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly91cGxv/YWQud2lraW1lZGlh/Lm9yZy93aWtpcGVk/aWEvcHQvdGh1bWIv/MS8xOC9CYWxkdXIn/c19HYXRlX0lJSV9M/YXJpYW5fU3R1ZGlv/c19rZXlfYXJ0LnBu/Zy8zMzBweC1CYWxk/dXInc19HYXRlX0lJ/SV9MYXJpYW5fU3R1/ZGlvc19rZXlfYXJ0/LnBuZw', rating: 4.8, metacritic: 96, released: '2023-08-03', playtime: 75, genres: ['RPG', 'Strategy'],        description_raw: 'RPG por turnos baseado em D&D 5e, com liberdade narrativa extensa e consequências reais para cada escolha.' },
  { id: 7,  name: 'Red Dead Redemption 2',           imagem: 'https://imgs.search.brave.com/hf8wgCx6irXdUJH5kQoNAI-dp6AXjlVoxSYU4Ckw2uo/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWFn/ZXMtd2l4bXAtZWQz/MGE4NmI4YzRjYTg4/Nzc3MzU5NGMyLndp/eG1wLmNvbS9mL2U1/ZDZmMTc1LTNhMmUt/NDkzZC1iN2YyLTVm/NzA4NTJiNGYyZS9k/ZXJtdTRkLTNkMjJh/NDM1LWY2MzktNGZj/NS04NjRkLTBjNzhh/YzQ1MGVmZi5qcGcv/djEvZmlsbC93XzEy/ODAsaF8yMTk1LHFf/NzUsc3RycC9yZWRf/ZGVhZF9yZWRlbXB0/aW9uXzJfZ2FtZV9j/b3Zlcl9ieV9sb3Zl/X215YXJ0X2Rlcm11/NGQtZnVsbHZpZXcu/anBnP3Rva2VuPWV5/SjBlWEFpT2lKS1Yx/UWlMQ0poYkdjaU9p/SklVekkxTmlKOS5l/eUp6ZFdJaU9pSjFj/bTQ2WVhCd09qZGxN/R1F4T0RnNU9ESXlO/alF6TnpOaE5XWXda/RFF4TldWaE1HUXlO/bVV3SWl3aWFYTnpJ/am9pZFhKdU9tRndj/RG8zWlRCa01UZzRP/VGd5TWpZME16Y3pZ/VFZtTUdRME1UVmxZ/VEJrTWpabE1DSXNJ/bTlpYWlJNlcxdDdJ/bWhsYVdkb2RDSTZJ/anc5TWpFNU5TSXNJ/bkJoZEdnaU9pSXZa/aTlsTldRMlpqRTNO/UzB6WVRKbExUUTVN/MlF0WWpkbU1pMDFa/amN3T0RVeVlqUm1N/bVV2WkdWeWJYVTBa/QzB6WkRJeVlUUXpO/UzFtTmpNNUxUUm1Z/elV0T0RZMFpDMHdZ/emM0WVdNME5UQmxa/bVl1YW5Cbklpd2lk/MmxrZEdnaU9pSThQ/VEV5T0RBaWZWMWRM/Q0poZFdRaU9sc2lk/WEp1T25ObGNuWnBZ/MlU2YVcxaFoyVXVi/M0JsY21GMGFXOXVj/eUpkZlEuSUVGbUlB/THhKaFV0aHJyMXB3/ZE1kV1VwLTVaLUhz/Y19YSUxMUWNvQmE4/SQ', rating: 4.7, metacritic: 97, released: '2018-10-26', playtime: 60, genres: ['Action', 'Adventure'],    description_raw: 'Faroeste de mundo aberto que acompanha um fora da lei em uma América em transformação no início do século 20.' },
  { id: 8,  name: 'Portal 2',                        imagem: 'https://imgs.search.brave.com/pLxekUzKRokwufhN0CjHkF8HKregIxmsLKfQU9jX6XM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tLm1l/ZGlhLWFtYXpvbi5j/b20vaW1hZ2VzL00v/TVY1Qk16Z3pPVEEy/WVRJdFl6QmhOaTAw/TnpNeExXRTVOR1F0/T0daaE9UY3pOV1F5/TlRVNVhrRXlYa0Zx/Y0djQC5qcGc', rating: 4.6, metacritic: 95, released: '2011-04-19', playtime: 12, genres: ['Puzzle', 'Shooter'],      description_raw: 'Sequência do premiado jogo de quebra-cabeças com portais, com campanha cooperativa e humor ácido.' },
  { id: 9,  name: 'Disco Elysium',                   imagem: 'https://imgs.search.brave.com/6KxclfwwA_Az8Q5MQBhw6w0NGxTgE09UbAM4f9bjTUg/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tLm1l/ZGlhLWFtYXpvbi5j/b20vaW1hZ2VzL00v/TVY1Qll6YzVZbUV3/T1RJdE1XSTVOaTAw/WVRNNExUazNOemt0/WVdWbU5XVTROekU0/TkRKbVhrRXlYa0Zx/Y0djQC5qcGc', rating: 4.5, metacritic: 91, released: '2019-10-15', playtime: 30, genres: ['RPG', 'Adventure'],       description_raw: 'RPG investigativo sem combate tradicional, focado em diálogo, introspecção e um sistema de habilidades único.' },
  { id: 10, name: 'Persona 5 Royal',                 imagem: 'https://imgs.search.brave.com/N63rs967hZR1DNuD_EJdiQy4Txp9RRxYAM3XSejlGwY/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9uZWVk/Z2FtZXMuY29tLmJy/L3dwLWNvbnRlbnQv/dXBsb2Fkcy8yMDIz/LzAxL1BlcnNvbmEt/NS1Sb3lhbC5qcGc', rating: 4.7, metacritic: 95, released: '2020-03-31', playtime: 100, genres: ['RPG'],                   description_raw: 'RPG estiloso que mistura vida escolar cotidiana com incursões a mundos oníricos ao lado de um grupo de rebeldes mascarados.' },
  { id: 11, name: 'Dark Souls III',                  imagem: 'https://imgs.search.brave.com/jFrV-9Iwp2jtjstZJn5UNunOwl2A03jvvNKky05VLds/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9hc3Nl/dHMubnV1dmVtLmNv/bS9pbWFnZS91cGxv/YWQvdF9ib3hzaG90/X2JpZy92MS9wcm9k/dWN0cy81NzAzYjg4/ZWQyNzczNDU2NWEw/MDAwNDUvYm94c2hv/dHMvc3E3aW5sY3pp/ZjV2NWpqbWdjcHku/anBn', rating: 4.5, metacritic: 89, released: '2016-04-12', playtime: 45, genres: ['RPG', 'Action'],          description_raw: 'Ação e RPG punitivo em um mundo em decadência, marcado por chefes memoráveis e level design intrincado.' },
  { id: 12, name: 'Minecraft',                       imagem: 'https://imgs.search.brave.com/19FyznLSJekXM9n3pLzsC2tjLEFM5TJRBRzVrl-_TTM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/bWluZWNyYWZ0Lm5l/dC9jb250ZW50L2Rh/bS9taW5lY3JhZnRu/ZXQvZ2FtZXMvbWlu/ZWNyYWZ0L2tleS1h/cnQvSG9tZXBhZ2Vf/RGlzY292ZXItb3Vy/LWdhbWVzX01DLVZh/bmlsbGEtS2V5QXJ0/Xzg2NHg4NjQuanBn', rating: 4.4, metacritic: 83, released: '2011-11-18', playtime: 200, genres: ['Simulation', 'Adventure'], description_raw: 'Sandbox de construção e sobrevivência em mundos gerados proceduralmente, com modo criativo e de sobrevivência.' },
  { id: 13, name: 'Terraria',                        imagem: 'https://imgs.search.brave.com/9PdKGcwKDgmW9WhG6Y8_K2Vaw5IIZ_BLtr3tPT6fxFg/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93YWxs/cGFwZXJzLmNvbS9p/bWFnZXMvaGlnaC90/ZXJyYXJpYS1jb3Zl/ci13YWxscGFwZXIt/bTdoNXZpazBoZ25t/c3d3dS5qcGc', rating: 4.6, metacritic: 83, released: '2011-05-16', playtime: 80, genres: ['Action', 'Adventure'],    description_raw: 'Sandbox 2D de exploração, construção e combate, com progressão vasta e conteúdo cooperativo.' },
  { id: 14, name: 'Cyberpunk 2077',                  imagem: 'https://imgs.search.brave.com/WYSG9xq7-MDa41sPh7A8x7danZKeeX3KdmjAMbf-6AU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tLm1l/ZGlhLWFtYXpvbi5j/b20vaW1hZ2VzL00v/TVY1QlpXWXlORFJr/TnpBdE9USTBOeTAw/TkRRd0xXRTVNMll0/TVdGaVpEZG1NRGM0/TW1RMFhrRXlYa0Zx/Y0djQC5qcGc', rating: 4.2, metacritic: 86, released: '2020-12-10', playtime: 55, genres: ['RPG', 'Action'],          description_raw: 'RPG de ação em mundo aberto ambientado em Night City, com narrativa ramificada e customização profunda de personagem.' },
  { id: 15, name: 'Animal Crossing: New Horizons',   imagem: 'https://imgs.search.brave.com/8d4ci9eth_1gwPxGf8P0-g5jsXITx6FgI1T7otr-7_w/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tLm1l/ZGlhLWFtYXpvbi5j/b20vaW1hZ2VzL0kv/ODFLdFFjeHdMU0wu/anBn', rating: 4.5, metacritic: 90, released: '2020-03-20', playtime: 70, genres: ['Simulation'],             description_raw: 'Simulador de vida em uma ilha deserta, com decoração, coleta de recursos e interações sociais no seu próprio ritmo.' },
  { id: 16, name: 'Super Mario Odyssey',             imagem: 'https://imgs.search.brave.com/egXdYsMTPDut7m2e7IsLBOFRVMU3Vtd73qc4pmobWxI/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9zdGF0/aWMwLnBvbHlnb25p/bWFnZXMuY29tL3dv/cmRwcmVzcy93cC1j/b250ZW50L3VwbG9h/ZHMvc2hhcmVkaW1h/Z2VzLzIwMjUvMDIv/c3VwZXItbWFyaW8t/b2R5c3NleS1jb3Zl/ci1hcnQuanBnP3E9/NTAmZml0PWNvbnRh/aW4mdz00ODAmZHBy/PTEuNQ', rating: 4.7, metacritic: 97, released: '2017-10-27', playtime: 20, genres: ['Platformer'],             description_raw: 'Plataforma 3D com Mario explorando reinos variados usando o chapéu Cappy para capturar criaturas e objetos.' },
  { id: 17, name: 'It Takes Two',                    imagem: 'https://imgs.search.brave.com/bbgeeakGaj8ewsmS0pgOPAmZLMNUVc_V29IkotOXSpg/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9hc3Nl/dHMtcHJkLmlnbmlt/Z3MuY29tLzIwMjEv/MDIvMTIvaXQtdGFr/ZXMtdHdvLWJ1dHRv/bi1maW4tMTYxMzA4/ODQxOTQ3MC5qcGc_/Y3JvcD0xOjEsc21h/cnQmZm9ybWF0PWpw/ZyZhdXRvPXdlYnAm/cXVhbGl0eT04MA', rating: 4.6, metacritic: 88, released: '2021-03-26', playtime: 14, genres: ['Adventure', 'Platformer'], description_raw: 'Aventura cooperativa obrigatória para dois jogadores, repleta de mecânicas criativas que mudam a cada capítulo.' },
  { id: 18, name: 'Ori and the Blind Forest',        imagem: 'https://imgs.search.brave.com/acu-qgqo5srsMYAekFKMv7MsGgzXdPC5VDfO7Ixsk54/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWFn/ZXMtd2l4bXAtZWQz/MGE4NmI4YzRjYTg4/Nzc3MzU5NGMyLndp/eG1wLmNvbS9mLzk1/YTkzZDhjLWY3MDEt/NGNkNC05Y2Y5LWZm/YzY0YmY3NzBhMC9k/OXV4aG0yLTJhMGEz/NjQ4LWRlMDMtNDU1/OC04ZDZkLWUwMmZj/MGMyNTU4NC5qcGc_/dG9rZW49ZXlKMGVY/QWlPaUpLVjFRaUxD/SmhiR2NpT2lKSVV6/STFOaUo5LmV5Snpk/V0lpT2lKMWNtNDZZ/WEJ3T2pkbE1HUXhP/RGc1T0RJeU5qUXpO/ek5oTldZd1pEUXhO/V1ZoTUdReU5tVXdJ/aXdpYVhOeklqb2lk/WEp1T21Gd2NEbzNa/VEJrTVRnNE9UZ3lN/alkwTXpjellUVm1N/R1EwTVRWbFlUQmtN/alpsTUNJc0ltOWlh/aUk2VzF0N0luQmhk/R2dpT2lKY0wyWmNM/emsxWVRrelpEaGpM/V1kzTURFdE5HTmtO/QzA1WTJZNUxXWm1Z/elkwWW1ZM056QmhN/Rnd2WkRsMWVHaHRN/aTB5WVRCaE16WTBP/QzFrWlRBekxUUTFO/VGd0T0dRMlpDMWxN/REptWXpCak1qVTFP/RFF1YW5CbkluMWRY/U3dpWVhWa0lqcGJJ/blZ5YmpwelpYSjJh/V05sT21acGJHVXVa/RzkzYm14dllXUWlY/WDAuTTg2WUJrT21y/cUFTa2pzX0VGZ01Q/SnNPak0xdDRKcnRI/NU9zRE83S2stdw', rating: 4.6, metacritic: 88, released: '2015-03-11', playtime: 10, genres: ['Platformer', 'Indie'],    description_raw: 'Metroidvania visualmente deslumbrante sobre um espírito da floresta em uma jornada emocional de resgate.' },
  { id: 19, name: 'Slay the Spire',                  imagem: 'https://imgs.search.brave.com/qOjk3TEXYNzhIpb7o87CHJKpilmdPU1hutrUXaquo64/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9zeWx0/ZWZhci5jb20vY292/ZXJzX2Z1bGwvc2xh/eV90aGVfc3BpcmVf/eGIxLnBuZw', rating: 4.5, metacritic: 89, released: '2019-01-23', playtime: 35, genres: ['Strategy', 'Indie'],      description_raw: 'Roguelike de deck-building em que cada subida da torre exige decisões estratégicas sobre cartas e relíquias.' },
  { id: 20, name: 'Outer Wilds',                     imagem: 'https://imgs.search.brave.com/dtcTAnsDhh45brVKphKeczbBCivArSTunnXlYqCzEQM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzLzhjL2Mz/L2FhLzhjYzNhYTM4/MjgxNjA3YWM3Mzk1/ZmYwNjM5MTc4ZGY5/LmpwZw', rating: 4.6, metacritic: 85, released: '2019-05-28', playtime: 15, genres: ['Adventure', 'Puzzle'],   description_raw: 'Exploração espacial em um loop temporal de 22 minutos, com mistérios que se resolvem através do conhecimento do jogador.' },
  { id: 21, name: 'Sekiro: Shadows Die Twice',       imagem: 'https://imgs.search.brave.com/G_oPK76v9JtY990hwvkpDdFLM3uicflioT9PAdcdopE/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tLm1l/ZGlhLWFtYXpvbi5j/b20vaW1hZ2VzL00v/TVY1Qk16RmlNMlkz/Tm1NdE5EWTNNQzAw/TVRoaExXRmhObVl0/WmpJek1ETmpabU5o/TVRkaFhrRXlYa0Zx/Y0djQC5qcGc', rating: 4.5, metacritic: 90, released: '2019-03-22', playtime: 30, genres: ['Action'],                 description_raw: 'Ação ambientada no Japão feudal com foco em combate de espadas preciso e um sistema de postura único.' },
  { id: 22, name: 'Celeste',                         imagem: 'https://imgs.search.brave.com/i9wRGMnlNQGAbHQCIAK758wF5w7l1oYHz3iQ1JiksUQ/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzLzE2LzJk/L2ZmLzE2MmRmZjAw/NzdmOWZlZWE3ZWI1/YzBhOTEzY2RlMWUy/LmpwZw', rating: 4.6, metacritic: 92, released: '2018-01-25', playtime: 10, genres: ['Platformer', 'Indie'],   description_raw: 'Plataforma desafiador sobre escalar uma montanha, com uma narrativa sensível sobre saúde mental.' },
  { id: 23, name: 'God of War',                      imagem: 'https://imgs.search.brave.com/dioN3LDZpaJdk5txbO1ec9hVJFxy35CrBEjnRQMU2E4/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly91cGxv/YWQud2lraW1lZGlh/Lm9yZy93aWtpcGVk/aWEvZW4vdGh1bWIv/YS9hNy9Hb2Rfb2Zf/V2FyXzRfY292ZXIu/anBnLzI1MHB4LUdv/ZF9vZl9XYXJfNF9j/b3Zlci5qcGc', rating: 4.7, metacritic: 94, released: '2018-04-20', playtime: 25, genres: ['Action', 'Adventure'],   description_raw: 'Reinício da franquia com Kratos e seu filho Atreus em uma jornada pela mitologia nórdica.' },
  { id: 24, name: 'The Legend of Zelda: Breath of the Wild', imagem: 'https://imgs.search.brave.com/CbauzM_XH3jQcHow5CEo9tYvBCfz0drA3c2Pb4-mn6k/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tLm1l/ZGlhLWFtYXpvbi5j/b20vaW1hZ2VzL0kv/NTFsVHRlMTFWRkwu/anBn', rating: 4.8, metacritic: 97, released: '2017-03-03', playtime: 50, genres: ['Adventure', 'RPG'], description_raw: 'Mundo aberto que reinventou a franquia Zelda com liberdade de exploração quase total e física emergente.' },
]

// Palavras que bloqueiam jogos adultos (mantido caso o catálogo cresça)
const BLOQUEADOS = ['sex', 'hentai', 'porn', 'adult', 'erotic', 'nsfw', '18+', 'ecchi']

function jogoPermitido(game) {
  const texto = `${game.name} ${game.tags?.map(t => t.name).join(' ') || ''}`.toLowerCase()
  return !BLOQUEADOS.some(p => texto.includes(p))
}

function catalogoParaJogos(lista) {
  return lista
    .map(g => ({
      ...g,
      genres: g.genres.map(nome => ({ name: nome })),
      platforms: [],
      background_image: g.imagem || null,
    }))
    .filter(jogoPermitido)
}

// Emoji e cor por gênero — usamos isso no lugar de capa/imagem real
// enquanto o campo "imagem" do jogo estiver vazio
const GENERO_VISUAL = {
  RPG:         { emoji: '⚔️', bgClass: 'bg-purple-600/20' },
  Action:      { emoji: '💥', bgClass: 'bg-red-600/20' },
  Adventure:   { emoji: '🗺️', bgClass: 'bg-emerald-600/20' },
  Simulation:  { emoji: '🌾', bgClass: 'bg-amber-600/20' },
  Strategy:    { emoji: '♟️', bgClass: 'bg-blue-600/20' },
  Puzzle:      { emoji: '🧩', bgClass: 'bg-pink-600/20' },
  Shooter:     { emoji: '🎯', bgClass: 'bg-orange-600/20' },
  Platformer:  { emoji: '🏃', bgClass: 'bg-cyan-600/20' },
  Indie:       { emoji: '🎨', bgClass: 'bg-teal-600/20' },
}

function visualDoJogo(game) {
  const primeiroGenero = game.genres?.[0]?.name || game.genres?.[0]
  return GENERO_VISUAL[primeiroGenero] || { emoji: '🎮', bgClass: 'bg-gray-600/20' }
}

// Estima horas de gameplay com base nos gêneros (fallback, caso algum jogo não tenha playtime definido)
function estimarHoras(generos = []) {
  let horas = 15
  if (generos.includes('RPG'))        horas += 40
  if (generos.includes('Adventure'))  horas += 15
  if (generos.includes('Action'))     horas += 10
  if (generos.includes('Shooter'))    horas += 5
  if (generos.includes('Strategy'))   horas += 25
  return horas
}

// Card de jogo no grid
function CardJogo({ game, onClick }) {
  const visual = visualDoJogo(game)
  return (
    <div
      onClick={onClick}
      className="bg-dark-card/40 border border-dark-border rounded-xl overflow-hidden hover:border-purple-500/50 transition-all group cursor-pointer text-dark-text-1"
    >
      <div className="aspect-[2/3] overflow-hidden">
        <CapaDoJogo nome={game.name} url={game.background_image} emoji={visual.emoji} fundo={visual.bgClass} />
      </div>
      <div className="p-3">
        <h3 className="font-bold text-sm group-hover:text-purple-400 transition-colors line-clamp-2 mb-2">
          {game.name}
        </h3>
        <div className="flex justify-between text-xs text-dark-text-2">
          <span>⭐ {game.rating?.toFixed(1) || '—'}</span>
          <span className={game.metacritic >= 75 ? 'text-emerald-400' : 'text-amber-400'}>
            {game.metacritic ? `MC ${game.metacritic}` : ''}
          </span>
        </div>
      </div>
    </div>
  )
}

// Tela de detalhe de um jogo com calculadora QCD
function DetalheJogo({ game, onVoltar }) {
  const generos  = game.genres?.map(g => g.name) || []
  const horas    = game.playtime || estimarHoras(generos)
  const visual   = visualDoJogo(game)
  const navigate = useNavigate()

  // Calculadora local — não depende de nenhum servidor
  const [preco, setPreco]         = useState('')
  const [custoHora, setCustoHora] = useState(null)
  const [veredito, setVeredito]   = useState('')

  function calcular() {
    const p = parseFloat(preco)
    if (!p || isNaN(p)) return alert('Digite um preço válido.')
    const custo = p / horas
    setCustoHora(custo)
    if (custo <= 5)       setVeredito('🔥 Excelente custo-benefício')
    else if (custo <= 10) setVeredito('✅ Bom custo-benefício')
    else if (custo <= 15) setVeredito('⚠️ Custo razoável')
    else                  setVeredito('❌ Pouco vantajoso')
  }

  function irParaReview() {
    navigate(`/reviews?jogo=${game.id}`)
  }

  return (
    <main className="max-w-7xl mx-auto px-4 mt-6">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          onClick={onVoltar}
          className="bg-dark-card/80 hover:bg-dark-hover border border-dark-border px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer text-dark-text-1"
        >
          ← Voltar para lista
        </button>
        <button
          onClick={irParaReview}
          className="bg-purple-600 hover:bg-purple-500 px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer text-white"
        >
          📝 Ver review deste jogo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Imagem e info principal */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-dark-card/40 border border-dark-border/50 rounded-xl p-6 text-dark-text-1">
            <h2 className="text-3xl font-bold text-purple-400 mb-4">{game.name}</h2>

            <div className="aspect-video overflow-hidden rounded-xl border border-dark-border mb-6">
              <CapaDoJogo nome={game.name} url={game.background_image} emoji={visual.emoji} fundo={visual.bgClass} vertical={false} />
            </div>

            <h3 className="font-bold text-lg text-purple-300 mb-2">Sobre o jogo</h3>
            <p className="text-dark-text-2 leading-relaxed text-sm">
              {game.description_raw?.slice(0, 800) || 'Descrição não disponível.'}
            </p>
          </div>
        </div>

        {/* Sidebar: especificações + calculadora */}
        <div className="space-y-6">
          <div className="bg-dark-card/40 border border-dark-border/50 rounded-xl p-5 text-sm space-y-2 text-dark-text-1">
            <h3 className="font-bold text-purple-300 text-base border-b border-dark-border pb-2 mb-3">
              Especificações
            </h3>
            <p><span className="text-dark-text-2">📅 Lançamento:</span> {game.released || '—'}</p>
            <p><span className="text-dark-text-2">⭐ Nota:</span> {game.rating?.toFixed(1) || '—'}/5</p>
            {game.metacritic && (
              <p><span className="text-dark-text-2">🏅 Metacritic:</span> {game.metacritic}/100</p>
            )}
            {game.playtime > 0 && (
              <p><span className="text-dark-text-2">⏱ Horas médias:</span> ~{game.playtime}h</p>
            )}
            <p><span className="text-dark-text-2">🏷️ Gêneros:</span> {generos.join(', ') || '—'}</p>
          </div>

          {/* Calculadora QCD local — funciona 100% sem servidor */}
          <div className="bg-dark-card/40 border border-dark-border/50 rounded-xl p-5 text-dark-text-1">
            <h3 className="font-bold text-purple-300 text-base mb-3">
              Calculadora QCD
            </h3>
            <p className="text-sm text-dark-text-2 mb-3">
              ⏳ Duração estimada: <strong className="text-dark-text-1">~{horas}h</strong>
            </p>
            <input
              type="number"
              placeholder="Preço que você pagou (R$)"
              value={preco}
              onChange={e => setPreco(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-dark-secondary border border-dark-border text-sm text-dark-text-1 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-3"
            />
            <button
              onClick={calcular}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 rounded-lg text-sm transition-colors cursor-pointer"
            >
              Calcular
            </button>

            {custoHora !== null && (
              <div className="mt-4 pt-4 border-t border-dark-border text-center space-y-1">
                <p className="text-xs text-dark-text-2">Custo por hora de jogo:</p>
                <p className="text-xl font-bold text-purple-400">R$ {custoHora.toFixed(2)}</p>
                <p className="text-sm font-semibold mt-1 text-dark-text-1">{veredito}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

export default function QcdScore() {
  const [jogos, setJogos]                 = useState([])
  const [carregando, setCarregando]       = useState(true)
  const [busca, setBusca]                 = useState('')
  const [jogoSelecionado, setJogoSelecionado] = useState(null)
  const [detalhe, setDetalhe]             = useState(null)

  // Carrega o catálogo do banco; se a API estiver indisponível, usa a lista local.
  useEffect(() => {
    if (!jogoSelecionado) carregarJogos()
  }, [jogoSelecionado])

  async function carregarJogos() {
    setCarregando(true)
    try {
      const resposta = await listarJogos({ limite: 50 })
      setJogos(resposta.jogos.map(jogo => ({
        id: jogo.id,
        name: jogo.titulo,
        genres: [{ name: jogo.genero }],
        rating: jogo.notaMedia ? jogo.notaMedia / 2 : 0,
        metacritic: null,
        released: jogo.anoLancamento ? String(jogo.anoLancamento) : '—',
        playtime: jogo.horasPrincipal || 0,
        background_image: jogo.capaUrl,
        description_raw: jogo.descricao || '',
      })))
    } catch {
      setJogos(catalogoParaJogos(CATALOGO_JOGOS))
    }
    setCarregando(false)
  }

  async function pesquisar(nome) {
    if (nome.trim().length < 2) return carregarJogos()
    setCarregando(true)
    try {
      const resposta = await listarJogos({ busca: nome.trim(), limite: 50 })
      setJogos(resposta.jogos.map(jogo => ({
        id: jogo.id, name: jogo.titulo, genres: [{ name: jogo.genero }],
        rating: jogo.notaMedia ? jogo.notaMedia / 2 : 0, metacritic: null,
        released: jogo.anoLancamento ? String(jogo.anoLancamento) : '—',
        playtime: jogo.horasPrincipal || 0, background_image: jogo.capaUrl,
        description_raw: jogo.descricao || '',
      })))
    } catch {
      const termo = nome.trim().toLowerCase()
      setJogos(catalogoParaJogos(CATALOGO_JOGOS).filter(g => g.name.toLowerCase().includes(termo)))
    }
    setCarregando(false)
  }

  function abrirDetalhe(game) {
    setJogoSelecionado(game)
    setDetalhe(game)
  }

  function voltar() {
    setJogoSelecionado(null)
    setDetalhe(null)
  }

  // Tela de detalhe
  if (jogoSelecionado && detalhe) {
    return <DetalheJogo game={detalhe} onVoltar={voltar} />
  }

  // Grade principal
  return (
    <main className="max-w-7xl mx-auto px-4 mt-6">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-wide">💎 QCD Score</h2>
          <p className="text-sm text-dark-text-2">Descubra se o jogo vale seu dinheiro</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <input
            type="search"
            placeholder="Buscar jogo... (ex: Elden Ring)"
            value={busca}
            onChange={e => { setBusca(e.target.value); pesquisar(e.target.value) }}
            className="px-4 py-2 w-full md:w-64 rounded-lg bg-dark-secondary border border-dark-border text-dark-text-1 placeholder-dark-text-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          />
          <button
            onClick={() => pesquisar(busca)}
            className="bg-purple-400 hover:bg-purple-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
          >
            Buscar
          </button>
        </div>
      </div>

      {carregando ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-dark-card/40 rounded-xl animate-pulse">
              <div className="aspect-[2/3] bg-dark-hover rounded-t-xl" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-dark-hover rounded w-3/4" />
                <div className="h-3 bg-dark-hover rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : jogos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {jogos.map(game => (
            <CardJogo key={game.id} game={game} onClick={() => abrirDetalhe(game)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-dark-text-2">
          <p className="text-4xl mb-4">🎮</p>
          <p>Nenhum jogo encontrado.</p>
        </div>
      )}
    </main>
  )
}
