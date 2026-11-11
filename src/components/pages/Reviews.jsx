// pages/Reviews.jsx
//
// Sem backend, sem RAWG — o catálogo de jogos é a lista fixa logo abaixo.
// Pra colocar uma imagem em algum jogo, é só colar o link dentro das
// aspas de "imagem". Se deixar vazio (''), aparece o emoji do gênero.

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listarJogos, listarReviews } from '../../services/conteudoApi';
import CapaDoJogo from '../ui/CapaDoJogo';

const CATALOGO_JOGOS = [
  { id: 1,  name: 'Elden Ring',imagem: 'https://imgs.search.brave.com/SURZwdns-bi9yiBN-LQxfBHwHYcXGnG0yuFaYSvD0VA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9wcmV2/aWV3LnJlZGQuaXQv/ZWxkZW4tcmluZy1j/b3Zlci1pbnNwaXJh/dGlvbnMtdjAtN211/b3NqNnU3czRlMS5q/cGc_d2lkdGg9Mzg0/MCZmb3JtYXQ9cGpw/ZyZhdXRvPXdlYnAm/cz0yMGUwMzg3ZjVh/YmFlY2FiYjZjMTdk/ZWY0ZTY0MmNjNWNl/ZTUxNWQz', rating: 4.6, metacritic: 96, released: '2022-02-25', playtime: 55, genres: ['RPG', 'Action'], description_raw: 'Obra-prima do gênero Soulslike que redefiniu os mundos abertos ao unir o combate exigente da FromSoftware à liberdade total de exploração orgânica e não-linear nas Terras Intermédias.' },
  { id: 2,  name: 'The Witcher 3: Wild Hunt',imagem: 'https://imgs.search.brave.com/9qUu7mZ920W1Nl5jpHHljOFOZWdCMDiUdSmbmNs-Lxk/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9hc3Nl/dHMubmludGVuZG8u/Y29tL2ltYWdlL3Vw/bG9hZC9hcl8xNjo5/LGNfbHBhZCx3XzEy/NDAvYl93aGl0ZS9m/X2F1dG8vcV9hdXRv/L3N0b3JlL3NvZnR3/YXJlL3N3aXRjaC83/MDAxMDAwMDAzMzA3/MS8zZjdlZTZhYTM0/ODJiNTE0YmQ0NDNl/MTE2MDIyYjAzOGE5/NzI4ZjAxNzkxNmVk/MzdkYTNmMDlmNzMx/YTdkNWYy', rating: 4.8, metacritic: 93, released: '2015-05-19', playtime: 65, genres: ['RPG', 'Adventure'], description_raw: 'Marco nos RPGs narrativos com Geralt de Rívia em um mundo maduro e imersivo, marcado por missões secundárias brilhantes e escolhas morais complexas com consequências duradouras.' },
  { id: 3,  name: 'Hades',imagem: 'https://imgs.search.brave.com/w_o1mSr1GA9741qGUkJNvcSKbgxo-OsQQsqM_Zd_D5s/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9hc3Nl/dHMubmludGVuZG8u/Y29tL2ltYWdlL3Vw/bG9hZC9mX2F1dG8v/cV9hdXRvL2Rwcl8x/LjUvc3RvcmUvc29m/dHdhcmUvc3dpdGNo/LzcwMDEwMDAwMDMz/MTMxL2RiYzhjNTVh/MjE2ODhiNDQ2YTVj/NTc3MTFiNzI2OTU2/NDgzYTE0ZWY4YzVk/ZGI4NjFmODk3YzA1/OTVjY2I2YjU', rating: 4.7, metacritic: 93, released: '2020-09-17', playtime: 25, genres: ['Action', 'Indie'], description_raw: 'Roguelike frenético que reinventou a narrativa no gênero ao integrar perfeitamente a morte de Zagreu a um enredo envolvente, combate extremamente ágil e arte marcante.' },
  { id: 4,  name: 'Stardew Valley',imagem: 'https://imgs.search.brave.com/lbkq-15PPU7qOTMdQ66eyS4Uc22txwYUSgPbDbVagYA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93YWxs/cGFwZXJzLmNvbS9p/bWFnZXMvaGQvMmQt/c3RhcmRldy12YWxs/ZXktZmFybS1sYW5k/c2NhcGUtd3J6M2l0/YWJiMjBiN2VjNy5q/cGc', rating: 4.7, metacritic: 89, released: '2016-02-26', playtime: 50, genres: ['Simulation', 'RPG'], description_raw: 'Simulador rural apaixonante e viciante que combina cultivo de lavouras, mineração e relacionamentos comunitários profundos com uma atmosfera relaxante e carismática.' },
  { id: 5,  name: 'Hollow Knight',imagem: 'https://imgs.search.brave.com/3RkIaYJQVkrBhnLlOr4EDw2wUd6_yFhf7bHHjGGSdEU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tLm1l/ZGlhLWFtYXpvbi5j/b20vaW1hZ2VzL00v/TVY1Qk1HSXlZbUpt/WkRndE9XUTFOeTAw/TkRGaUxUazJPVGd0/TTJRMlpXUTRPV0l4/WmpnM1hrRXlYa0Zx/Y0djQC5qcGc', rating: 4.6, metacritic: 90, released: '2017-02-24', playtime: 30, genres: ['Action', 'Indie'], description_raw: 'Metroidvania sublime em arte 2D desenhada à mão, ambientado no decadente reino de Hallownest, com exploração gratificante e combate exigente com chefes memoráveis.' },
  { id: 6,  name: 'Baldur’s Gate 3',imagem: 'https://imgs.search.brave.com/UB8RO81kkmn07k5j84-8HhD7-FIEKhev2L7bxdAcCXk/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly91cGxv/YWQud2lraW1lZGlh/Lm9yZy93aWtpcGVk/aWEvcHQvdGh1bWIv/MS8xOC9CYWxkdXIn/c19HYXRlX0lJSV9M/YXJpYW5fU3R1ZGlv/c19rZXlfYXJ0LnBu/Zy8zMzBweC1CYWxk/dXInc19HYXRlX0lJ/SV9MYXJpYW5fU3R1/ZGlvc19rZXlfYXJ0/LnBuZw', rating: 4.8, metacritic: 96, released: '2023-08-03', playtime: 75, genres: ['RPG', 'Strategy'], description_raw: 'Triunfo absoluto dos RPGs táticos baseados em D&D 5e, entregando reatividade narrativa sem precedentes, companheiros marcantes e liberdade quase ilimitada de ação.' },
  { id: 7,  name: 'Red Dead Redemption 2',imagem: 'https://imgs.search.brave.com/hf8wgCx6irXdUJH5kQoNAI-dp6AXjlVoxSYU4Ckw2uo/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWFn/ZXMtd2l4bXAtZWQz/MGE4NmI4YzRjYTg4/Nzc3MzU5NGMyLndp/eG1wLmNvbS9mL2U1/ZDZmMTc1LTNhMmUt/NDkzZC1iN2YyLTVm/NzA4NTJiNGYyZS9k/ZXJtdTRkLTNkMjJh/NDM1LWY2MzktNGZj/NS04NjRkLTBjNzhh/YzQ1MGVmZi5qcGcv/djEvZmlsbC93XzEy/ODAsaF8yMTk1LHFf/NzUsc3RycC9yZWRf/ZGVhZF9yZWRlbXB0/aW9uXzJfZ2FtZV9j/b3Zlcl9ieV9sb3Zl/X215YXJ0X2Rlcm11/NGQtZnVsbHZpZXcu/anBnP3Rva2VuPWV5/SjBlWEFpT2lKS1Yx/UWlMQ0poYkdjaU9p/SklVekkxTmlKOS5l/eUp6ZFdJaU9pSjFj/bTQ2WVhCd09qZGxN/R1F4T0RnNU9ESXlO/alF6TnpOaE5XWXda/RFF4TldWaE1HUXlO/bVV3SWl3aWFYTnpJ/am9pZFhKdU9tRndj/RG8zWlRCa01UZzRP/VGd5TWpZME16Y3pZ/VFZtTUdRME1UVmxZ/VEJrTWpabE1DSXNJ/bTlpYWlJNlcxdDdJ/bWhsYVdkb2RDSTZJ/anc5TWpFNU5TSXNJ/bkJoZEdnaU9pSXZa/aTlsTldRMlpqRTNO/UzB6WVRKbExUUTVN/MlF0WWpkbU1pMDFa/amN3T0RVeVlqUm1N/bVV2WkdWeWJYVTBa/QzB6WkRJeVlUUXpO/UzFtTmpNNUxUUm1Z/elV0T0RZMFpDMHdZ/emM0WVdNME5UQmxa/bVl1YW5Cbklpd2lk/MmxrZEdnaU9pSThQ/VEV5T0RBaWZWMWRM/Q0poZFdRaU9sc2lk/WEp1T25ObGNuWnBZ/MlU2YVcxaFoyVXVi/M0JsY21GMGFXOXVj/eUpkZlEuSUVGbUlB/THhKaFV0aHJyMXB3/ZE1kV1VwLTVaLUhz/Y19YSUxMUWNvQmE4/SQ', rating: 4.7, metacritic: 97, released: '2018-10-26', playtime: 60, genres: ['Action', 'Adventure'], description_raw: 'Épico do faroeste hiperdetalhado sobre a trágica jornada de Arthur Morgan, combinando um mundo aberto incrivelmente vivo com uma história emotiva e imersiva.' },
  { id: 8,  name: 'Portal 2',imagem: 'https://imgs.search.brave.com/pLxekUzKRokwufhN0CjHkF8HKregIxmsLKfQU9jX6XM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tLm1l/ZGlhLWFtYXpvbi5j/b20vaW1hZ2VzL00v/TVY1Qk16Z3pPVEEy/WVRJdFl6QmhOaTAw/TnpNeExXRTVOR1F0/T0daaE9UY3pOV1F5/TlRVNVhrRXlYa0Zx/Y0djQC5qcGc', rating: 4.6, metacritic: 95, released: '2011-04-19', playtime: 12, genres: ['Puzzle', 'Shooter'], description_raw: 'Referência absoluta em jogos de quebra-cabeça, unindo física espacial precisa com portais, roteiro cômico genial e um modo cooperativo impecável.' },
  { id: 9,  name: 'Disco Elysium',imagem: 'https://imgs.search.brave.com/6KxclfwwA_Az8Q5MQBhw6w0NGxTgE09UbAM4f9bjTUg/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tLm1l/ZGlhLWFtYXpvbi5j/b20vaW1hZ2VzL00v/TVY1Qll6YzVZbUV3/T1RJdE1XSTVOaTAw/WVRNNExUazNOemt0/WVdWbU5XVTROekU0/TkRKbVhrRXlYa0Zx/Y0djQC5qcGc', rating: 4.5, metacritic: 91, released: '2019-10-15', playtime: 30, genres: ['RPG', 'Adventure'], description_raw: 'RPG investigativo extraordinário e sem combate tradicional, focado inteiramente na psique humana, diálogos filosóficos marcantes e escolhas políticas complexas.' },
  { id: 10, name: 'Persona 5 Royal',imagem: 'https://imgs.search.brave.com/N63rs967hZR1DNuD_EJdiQy4Txp9RRxYAM3XSejlGwY/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9uZWVk/Z2FtZXMuY29tLmJy/L3dwLWNvbnRlbnQv/dXBsb2Fkcy8yMDIz/LzAxL1BlcnNvbmEt/NS1Sb3lhbC5qcGc', rating: 4.7, metacritic: 95, released: '2020-03-31', playtime: 100, genres: ['RPG'], description_raw: 'JRPG ultra estiloso que mescla a rotina de vida escolar em Tóquio com batalhas em turnos refinadas em dungeons metafóricas ao som de uma trilha acid jazz impecável.' },
  { id: 11, name: 'Dark Souls III',imagem: 'https://imgs.search.brave.com/jFrV-9Iwp2jtjstZJn5UNunOwl2A03jvvNKky05VLds/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9hc3Nl/dHMubnV1dmVtLmNv/bS9pbWFnZS91cGxv/YWQvdF9ib3hzaG90/X2JpZy92MS9wcm9k/dWN0cy81NzAzYjg4/ZWQyNzczNDU2NWEw/MDAwNDUvYm94c2hv/dHMvc3E3aW5sY3pp/ZjV2NWpqbWdjcHku/anBn', rating: 4.5, metacritic: 89, released: '2016-04-12', playtime: 45, genres: ['RPG', 'Action'], description_raw: 'Conclusão magistral da franquia, unindo combate ágil e responsivo, ambientação opressiva e algumas das batalhas de chefes mais memoráveis de toda a série Souls.' },
  { id: 12, name: 'Minecraft',imagem: 'https://imgs.search.brave.com/19FyznLSJekXM9n3pLzsC2tjLEFM5TJRBRzVrl-_TTM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/bWluZWNyYWZ0Lm5l/dC9jb250ZW50L2Rh/bS9taW5lY3JhZnRu/ZXQvZ2FtZXMvbWlu/ZWNyYWZ0L2tleS1h/cnQvSG9tZXBhZ2Vf/RGlzY292ZXItb3Vy/LWdhbWVzX01DLVZh/bmlsbGEtS2V5QXJ0/Xzg2NHg4NjQuanBn', rating: 4.4, metacritic: 83, released: '2011-11-18', playtime: 200, genres: ['Simulation', 'Adventure'], description_raw: 'Fenômeno sandbox definitivo que entrega mundos procedurais infinitos para criar, minerar e sobreviver com liberdade total para a imaginação do jogador.' },
  { id: 13, name: 'Terraria',imagem: 'https://imgs.search.brave.com/9PdKGcwKDgmW9WhG6Y8_K2Vaw5IIZ_BLtr3tPT6fxFg/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93YWxs/cGFwZXJzLmNvbS9p/bWFnZXMvaGlnaC90/ZXJyYXJpYS1jb3Zl/ci13YWxscGFwZXIt/bTdoNXZpazBoZ25t/c3d3dS5qcGc', rating: 4.6, metacritic: 83, released: '2011-05-16', playtime: 80, genres: ['Action', 'Adventure'], description_raw: 'Aventura sandbox 2D vibrante com foco em exploração profunda, vasta variedade de armas e acessórios e confrontos épicos contra dezenas de chefes.' },
  { id: 14, name: 'Cyberpunk 2077',imagem: 'https://imgs.search.brave.com/WYSG9xq7-MDa41sPh7A8x7danZKeeX3KdmjAMbf-6AU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tLm1l/ZGlhLWFtYXpvbi5j/b20vaW1hZ2VzL00v/TVY1QlpXWXlORFJr/TnpBdE9USTBOeTAw/TkRRd0xXRTVNMll0/TVdGaVpEZG1NRGM0/TW1RMFhrRXlYa0Zx/Y0djQC5qcGc', rating: 4.2, metacritic: 86, released: '2020-12-10', playtime: 55, genres: ['RPG', 'Action'], description_raw: 'RPG futurista que entrega uma Night City deslumbrante e vertical, com excelente combate em primeira pessoa, personalização cibernética e narrativa imersiva.' },
  { id: 15, name: 'Animal Crossing: New Horizons',imagem: 'https://imgs.search.brave.com/8d4ci9eth_1gwPxGf8P0-g5jsXITx6FgI1T7otr-7_w/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tLm1l/ZGlhLWFtYXpvbi5j/b20vaW1hZ2VzL0kv/ODFLdFFjeHdMU0wu/anBn', rating: 4.5, metacritic: 90, released: '2020-03-20', playtime: 70, genres: ['Simulation'], description_raw: 'Simulador de vida acolhedor que permite construir e personalizar seu próprio paraíso em uma ilha deserta em tempo real, num ritmo calmo e terapêutico.' },
  { id: 16, name: 'Super Mario Odyssey',imagem: 'https://imgs.search.brave.com/jvgOStXScRkzfZaMcs0YlLfpkCDSvVMDJJcw2SU9gs0/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jZG4u/bW9ieWdhbWVzLmNv/bS9jb3ZlcnMvMTAz/MzExMzEtc3VwZXIt/bWFyaW8tb2R5c3Nl/eS1uaW50ZW5kby1z/d2l0Y2gtZnJvbnQt/Y292ZXIuanBn', rating: 4.7, metacritic: 97, released: '2017-10-27', playtime: 20, genres: ['Platformer'], description_raw: 'Plataforma 3D incrivelmente criativo onde a mecânica de possessão com o chapéu Cappy transforma constantemente a movimentação e a resolução de desafios.' },
  { id: 17, name: 'It Takes Two',imagem: 'https://imgs.search.brave.com/bbgeeakGaj8ewsmS0pgOPAmZLMNUVc_V29IkotOXSpg/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9hc3Nl/dHMtcHJkLmlnbmlt/Z3MuY29tLzIwMjEv/MDIvMTIvaXQtdGFr/ZXMtdHdvLWJ1dHRv/bi1maW4tMTYxMzA4/ODQxOTQ3MC5qcGc_/Y3JvcD0xOjEsc21h/cnQmZm9ybWF0PWpw/ZyZhdXRvPXdlYnAm/cXVhbGl0eT04MA', rating: 4.6, metacritic: 88, released: '2021-03-26', playtime: 14, genres: ['Adventure', 'Platformer'], description_raw: 'Aventura cooperativa obrigatória para duas pessoas que surpreende a cada capítulo alterando totalmente suas mecânicas de jogo em prol do trabalho em equipe.' },
  { id: 18, name: 'Ori and the Blind Forest',imagem: 'https://imgs.search.brave.com/acu-qgqo5srsMYAekFKMv7MsGgzXdPC5VDfO7Ixsk54/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWFn/ZXMtd2l4bXAtZWQz/MGE4NmI4YzRjYTg4/Nzc3MzU5NGMyLndp/eG1wLmNvbS9mLzk1/YTkzZDhjLWY3MDEt/NGNkNC05Y2Y5LWZm/YzY0YmY3NzBhMC9k/OXV4aG0yLTJhMGEz/NjQ4LWRlMDMtNDU1/OC04ZDZkLWUwMmZj/MGMyNTU4NC5qcGc_/dG9rZW49ZXlKMGVY/QWlPaUpLVjFRaUxD/SmhiR2NpT2lKSVV6/STFOaUo5LmV5Snpk/V0lpT2lKMWNtNDZZ/WEJ3T2pkbE1HUXhP/RGc1T0RJeU5qUXpO/ek5oTldZd1pEUXhO/V1ZoTUdReU5tVXdJ/aXdpYVhOeklqb2lk/WEp1T21Gd2NEbzNa/VEJrTVRnNE9UZ3lN/alkwTXpjellUVm1N/R1EwTVRWbFlUQmtN/alpsTUNJc0ltOWlh/aUk2VzF0N0luQmhk/R2dpT2lKY0wyWmNM/emsxWVRrelpEaGpM/V1kzTURFdE5HTmtO/QzA1WTJZNUxXWm1Z/elkwWW1ZM056QmhN/Rnd2WkRsMWVHaHRN/aTB5WVRCaE16WTBP/QzFrWlRBekxUUTFO/VGd0T0dRMlpDMWxN/REptWXpCak1qVTFP/RFF1YW5CbkluMWRY/U3dpWVhWa0lqcGJJ/blZ5YmpwelpYSjJh/V05sT21acGJHVXVa/RzkzYm14dllXUWlY/WDAuTTg2WUJrT21y/cUFTa2pzX0VGZ01Q/SnNPak0xdDRKcnRI/NU9zRE83S2stdw', rating: 4.6, metacritic: 88, released: '2015-03-11', playtime: 10, genres: ['Platformer', 'Indie'], description_raw: 'Metroidvania poético com visual deslumbrante pintado à mão, trilha orquestral emocionante e desafios de plataforma que exigem precisão técnica.' },
  { id: 19, name: 'Slay the Spire',imagem: 'https://imgs.search.brave.com/qOjk3TEXYNzhIpb7o87CHJKpilmdPU1hutrUXaquo64/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9zeWx0/ZWZhci5jb20vY292/ZXJzX2Z1bGwvc2xh/eV90aGVfc3BpcmVf/eGIxLnBuZw', rating: 4.5, metacritic: 89, released: '2019-01-23', playtime: 35, genres: ['Strategy', 'Indie'], description_raw: 'Referência em roguelikes de montagem de cartas, exigindo alta tomada de decisão estratégica para construir sinergias eficientes a cada subida da torre.' },
  { id: 20, name: 'Outer Wilds',imagem: 'https://imgs.search.brave.com/dtcTAnsDhh45brVKphKeczbBCivArSTunnXlYqCzEQM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzLzhjL2Mz/L2FhLzhjYzNhYTM4/MjgxNjA3YWM3Mzk1/ZmYwNjM5MTc4ZGY5/LmpwZw', rating: 4.6, metacritic: 85, released: '2019-05-28', playtime: 15, genres: ['Adventure', 'Puzzle'], description_raw: 'Aventura de exploração espacial inigualável guiada pela curiosidade, onde a descoberta de segredos em um loop temporal é a única chave para a progressão.' },
  { id: 21, name: 'Sekiro: Shadows Die Twice',imagem: 'https://imgs.search.brave.com/G_oPK76v9JtY990hwvkpDdFLM3uicflioT9PAdcdopE/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tLm1l/ZGlhLWFtYXpvbi5j/b20vaW1hZ2VzL00v/TVY1Qk16RmlNMlkz/Tm1NdE5EWTNNQzAw/TVRoaExXRmhObVl0/WmpJek1ETmpabU5o/TVRkaFhrRXlYa0Zx/Y0djQC5qcGc', rating: 4.5, metacritic: 90, released: '2019-03-22', playtime: 30, genres: ['Action'], description_raw: 'Jogo de ação cirúrgico ambientado no Japão feudal com foco no ritmo perfeito de defesas (parry) e quebra de postura em combates de espada viscerais.' },
  { id: 22, name: 'Celeste',imagem: 'https://imgs.search.brave.com/i9wRGMnlNQGAbHQCIAK758wF5w7l1oYHz3iQ1JiksUQ/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzLzE2LzJk/L2ZmLzE2MmRmZjAw/NzdmOWZlZWE3ZWI1/YzBhOTEzY2RlMWUy/LmpwZw', rating: 4.6, metacritic: 92, released: '2018-01-25', playtime: 10, genres: ['Platformer', 'Indie'], description_raw: 'Plataforma de alta precisão técnica que combina fases desafiadoras milimétricas com uma mensagem emocionante e empática sobre saúde mental e superação.' },
  { id: 23, name: 'God of War',imagem: 'https://imgs.search.brave.com/dioN3LDZpaJdk5txbO1ec9hVJFxy35CrBEjnRQMU2E4/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly91cGxv/YWQud2lraW1lZGlh/Lm9yZy93aWtpcGVk/aWEvZW4vdGh1bWIv/YS9hNy9Hb2Rfb2Zf/V2FyXzRfY292ZXIu/anBnLzI1MHB4LUdv/ZF9vZl9XYXJfNF9j/b3Zlci5qcGc', rating: 4.7, metacritic: 94, released: '2018-04-20', playtime: 25, genres: ['Action', 'Adventure'], description_raw: 'Brilhante reinvenção de Kratos na mitologia nórdica, apresentando um combate visceral, plano-sequência contínuo sem cortes e uma comovente relação pai e filho.' },
  { id: 24, name: 'The Legend of Zelda: Breath of the Wild',imagem: 'https://imgs.search.brave.com/CbauzM_XH3jQcHow5CEo9tYvBCfz0drA3c2Pb4-mn6k/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tLm1l/ZGlhLWFtYXpvbi5j/b20vaW1hZ2VzL0kv/NTFsVHRlMTFWRkwu/anBn', rating: 4.8, metacritic: 97, released: '2017-03-03', playtime: 50, genres: ['Adventure', 'RPG'], description_raw: 'Revolução no design de jogos em mundo aberto que oferece física interativa e liberdade total para solucionar problemas e explorar cada canto de Hyrule.' },
]

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

export default function Reviews() {
  const [jogos, setJogos] = useState(catalogoParaJogos(CATALOGO_JOGOS));
  const [busca, setBusca] = useState("");
  const [jogoSelecionado, setJogoSelecionado] = useState(null);
  const [reviewsDoBanco, setReviewsDoBanco] = useState([]);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    let ativo = true;
    listarJogos({ limite: 50 }).then(({ jogos: catalogo }) => {
      if (!ativo) return;
      setJogos(catalogo.map(jogo => ({
        id: jogo.id,
        name: jogo.titulo,
        imagem: jogo.capaUrl,
        background_image: jogo.capaUrl,
        rating: jogo.notaMedia ? jogo.notaMedia / 2 : 0,
        metacritic: null,
        released: jogo.anoLancamento ? String(jogo.anoLancamento) : '',
        playtime: jogo.horasPrincipal || 0,
        genres: [jogo.genero],
        description_raw: jogo.descricao || '',
      })));
    }).catch(() => {});
    return () => { ativo = false };
  }, []);

  useEffect(() => {
    let ativo = true;
    if (!jogoSelecionado) {
      setReviewsDoBanco([]);
      return () => { ativo = false };
    }
    listarReviews({ jogoId: jogoSelecionado.id, limite: 10 }).then(({ reviews }) => {
      if (ativo) setReviewsDoBanco(reviews);
    }).catch(() => { if (ativo) setReviewsDoBanco([]) });
    return () => { ativo = false };
  }, [jogoSelecionado]);

  // Se a página foi aberta com ?jogo=ID (por exemplo, vindo do QCD Score),
  // já abre a review daquele jogo direto
  useEffect(() => {
    const idDaUrl = searchParams.get('jogo');
    if (idDaUrl) {
      const jogoDaUrl = jogos.find(g => g.id === Number(idDaUrl));
      if (jogoDaUrl) setJogoSelecionado(jogoDaUrl);
    }
  }, [searchParams, jogos]);

  // Se não tiver nada digitado na busca, mostra todos os jogos
  let jogosFiltrados = jogos;
  if (busca.trim()) {
    const termo = busca.trim().toLowerCase();
    jogosFiltrados = jogos.filter(g => g.name.toLowerCase().includes(termo));
  }

  function pesquisar(nome) {
    setBusca(nome);
  }

  function abrirReview(id) {
    const jogoEncontrado = jogos.find(g => g.id === id);
    setJogoSelecionado(jogoEncontrado || null);
  }

  if (jogoSelecionado) {
    return (
      <main className="max-w-7xl mx-auto px-4 mt-6">
        <div className="mb-6">
          <button onClick={() => setJogoSelecionado(null)} className="bg-dark-card/80 hover:bg-dark-hover border border-dark-border px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer text-dark-text-1">
            <i className="bi bi-arrow-left"></i> Voltar para Análises
          </button>
        </div>

        <div className="bg-dark-card/40 border border-dark-border/50 rounded-xl p-6 backdrop-blur-sm mb-8 text-dark-text-1">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full max-w-sm mx-auto lg:mx-0 lg:max-w-none lg:w-1/3 aspect-[2/3] rounded-xl overflow-hidden border border-dark-border">
              <CapaDoJogo nome={jogoSelecionado.name} url={jogoSelecionado.background_image} emoji={visualDoJogo(jogoSelecionado).emoji} fundo={visualDoJogo(jogoSelecionado).bgClass} />
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-dark-border pb-4">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-purple-400">{jogoSelecionado.name}</h2>
                <div className="shrink-0 w-fit whitespace-nowrap bg-purple-500/10 text-purple-400 px-4 py-1.5 rounded-full border border-purple-500/20 font-bold text-sm">
                  Metacritic: {jogoSelecionado.metacritic || "N/A"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-dark-secondary/50 p-4 rounded-xl border border-dark-border/40 text-dark-text-2">
                <p><strong>📅 Lançamento:</strong> {jogoSelecionado.released}</p>
                <p><strong>⭐ Avaliação:</strong> {jogoSelecionado.rating}/5</p>
                <p className="col-span-2 truncate"><strong>🖥️ Plataformas:</strong> {jogoSelecionado.platforms?.map(p => p.platform.name).join(", ")}</p>
              </div>

              <div>
                <h4 className="font-bold text-purple-300 mb-1.5 text-base">Veredito Pro Lobby</h4>
                <p className="text-dark-text-2 text-sm leading-relaxed max-h-60 overflow-y-auto pr-2">{jogoSelecionado.description_raw || "Descrição textual indisponível para esta análise."}</p>
              </div>
            </div>
          </div>
        </div>

        <section className="bg-dark-card/40 border border-dark-border/50 rounded-xl p-6 text-dark-text-1">
          <h3 className="text-xl font-bold text-purple-300 mb-4">Reviews da comunidade</h3>
          {reviewsDoBanco.length === 0 ? (
            <p className="text-sm text-dark-text-2">Ainda não há reviews cadastradas para este jogo.</p>
          ) : (
            <div className="space-y-4">
              {reviewsDoBanco.map(review => (
                <article key={review.id} className="border-b border-dark-border/60 pb-4 last:border-0">
                  <div className="flex justify-between gap-4">
                    <h4 className="font-semibold">{review.titulo || 'Review'}</h4>
                    <span className="text-purple-300">{review.nota}/10</span>
                  </div>
                  <p className="text-xs text-dark-text-3 mt-1">{review.autor?.displayName || 'Usuário'}</p>
                  <p className="text-sm text-dark-text-2 mt-2 whitespace-pre-line">{review.texto}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 mt-6">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-wide">Análises de Jogos</h2>
          <p className="text-sm text-dark-text-2">Reviews especializadas fundamentadas por dados críticos</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <input type="search" placeholder="Pesquisar análise..." value={busca} onChange={(e) => setBusca(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && pesquisar(busca)} className="px-4 py-2 w-full md:w-64 rounded-lg bg-dark-secondary border border-dark-border text-dark-text-1 placeholder-dark-text-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
          <button onClick={() => pesquisar(busca)} className="bg-purple-400 hover:bg-purple-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer">Buscar</button>
        </div>
      </div>

      {jogosFiltrados.length === 0 ? (
        <div className="text-center py-12 text-dark-text-2">Nenhum jogo encontrado.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          {jogosFiltrados.map((game) => (
            <div key={game.id} onClick={() => abrirReview(game.id)} className="bg-dark-card/40 border border-dark-border rounded-xl overflow-hidden hover:border-purple-500/50 transition-all group cursor-pointer backdrop-blur-sm flex flex-col justify-between text-dark-text-1">
              <div>
                <div className="aspect-[2/3] overflow-hidden">
                  <CapaDoJogo nome={game.name} url={game.background_image} emoji={visualDoJogo(game).emoji} fundo={visualDoJogo(game).bgClass} />
                </div>
                <h3 className="font-bold text-sm group-hover:text-purple-400 transition-colors line-clamp-2 px-3 pt-2">{game.name}</h3>
              </div>
              <div className="flex justify-between items-center text-xs text-dark-text-2 px-3 pb-3 pt-2">
                <span className="text-purple-300 font-medium"><i className="bi bi-journal-text"></i> Ler Review</span>
                <span>⭐ {game.rating}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
