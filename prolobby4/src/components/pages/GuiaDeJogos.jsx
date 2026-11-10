import React, { useState, useEffect } from 'react';

export default function GuiaDeJogos() {
  const [jogoSelecionado, setJogoSelecionado] = useState('Minecraft');
  const [busca, setBusca] = useState('');
  const [isDark, setIsDark] = useState(false);

  // Monitora o tema real do Pro Lobby em tempo real
  useEffect(() => {
    const verificarTema = () => {
      const htmlEscuro = document.documentElement.classList.contains('dark') || document.documentElement.getAttribute('data-theme') === 'dark';
      const bodyEscuro = document.body.classList.contains('dark');
      setIsDark(htmlEscuro || bodyEscuro);
    };

    verificarTema();

    const observador = new MutationObserver(verificarTema);
    observador.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    
    return () => observador.disconnect();
  }, []);

  // BANCO DE DADOS ATUALIZADO COM OS MAPAS DINÂMICOS
  const bancoDeDadosGuias = {
    "Minecraft": {
      tutoriais: ["Coleta de madeira", "Primeira bancada (crafting table)", "Construção de abrigo", "Sobrevivendo à primeira noite"],
      mecanicas: ["Redstone básica e avançada", "Mob grinding", "Duplicação de itens (glitches)", "Villagers e trading"],
      itens: ["Itens de madeira", "Minérios", "Materiais de Construção", "Objetos não Craftáveis"],
      farms: ["Farm de ferro", "Farm de XP (mob spawner)", "Farm de cana-de-açúcar", "Farm de ouro no Nether"],
      monstruario: [
        { inimigo: "Zumbi", comoEnfrentar: "Espada / Knockback", drops: "Carne podre" },
        { inimigo: "Creeper", comoEnfrentar: "Arco / distância", drops: "Pólvora" },
        { inimigo: "Esqueleto", comoEnfrentar: "Cobertura / escudo", drops: "Ossos / flechas" }
      ],
      colunasMonstruario: { th1: "Inimigo", th2: "Como enfrentar", th3: "Drops" },
      titulos: { bloco1: "Tutoriais Básicos", bloco2: "Mecânicas Avançadas / Bugs", bloco3: "Itens", bloco4: "Monstruário", bloco5: "Farms" },
      // Substitua as URLs abaixo pelas imagens reais das suas pastas ou links externos
      mapas: [
        { nome: "Overworld", src: "https://preview.redd.it/map-of-the-overworld-geopolitical-minecraft-server-v0-yp6i2tu7g1qb1.jpg?width=1080&crop=smart&auto=webp&s=b1175d74ca9da559c2d17b5d6e7b81a54b42b55d" },
        { nome: "Nether", src: "https://preview.redd.it/nether-map-to-netherite-treasure-v0-srxx2dwy4ar81.jpg?width=1031&format=pjpg&auto=webp&s=e201fc7ee469659e97c4cbf3510f0a3d3fa05f79" },
        { nome: "The End", src: "https://external-preview.redd.it/quick-map-view-of-new-end-generation-v0-4lwX2aifKf2f2vYpPRpz7W7P7p-zi2Fa-4ZTnBDWRRI.png?auto=webp&s=a83c6b31eff4f169bdecda9b62047838d196ed13" },
        { nome: "Cavernas", src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ9NUoQm1D0ZdJ8fLq0kwL9cF5xrfD7QhguGwBfQzjXS2wHb90iMNf8aeQ&s=10" }
      ]
    },
    "Elden Ring": {
      tutoriais: ["Como usar as Cinzas de Invocação", "Gerenciamento de Flasks", "Explorando Limgrave eficientemente", "Como dar parry perfeitamente"],
      mecanicas: ["Quebra de postura (Stagger)", "Escalonamento de atributos", "Status negativos (Bleed/Rot)", "Soft caps de níveis"],
      itens: ["Lágrimas Sagradas (Sacred Tears)", "Pedras de Forja (Smithing Stones)", "Grandes Runas", "Talismanãs Lendários"],
      farms: ["Farm de Runas inicial (Palácio Mohgwyn)", "Farm de Plantas para Itens", "Farm de Pedras de Forja 1 e 2", "Rotas de farming em Caelid"],
      monstruario: [
        { inimigo: "Margit", comoEnfrentar: "Desviar para a direita / Quebra de postura", drops: "Pouch de Talismã" },
        { inimigo: "Godrick", comoEnfrentar: "Ficar colado na fase 2 / Invocar cinzas", drops: "Runa Maior de Godrick" },
        { inimigo: "Malenia", comoEnfrentar: "Congelamento / Esquivar da Waterfowl", drops: "Lembrança da Deusa da Podridão" }
      ],
      colunasMonstruario: { th1: "Chefe / Inimigo", th2: "Estratégia", th3: "Recompensa" },
      titulos: { bloco1: "Guias Iniciais", bloco2: "Sistemas & Combate", bloco3: "Itens Chave", bloco4: "Principais Chefes", bloco5: "Rotas de Runas (Farm)" },
      // Apenas 1 mapa completo para Elden Ring
      mapas: [
        { nome: "Terras Intermédias (Mapa Completo)", src: "https://i.redd.it/xupnh55gf6l81.jpg" }
      ]
    }
  };

  const listaJogos = [
    "Minecraft", "Elden Ring", "Dead Cells", "The Last of Us", 
    "Uncharted 4", "Crash Bandicoot", "Assassin's Creed 2", 
    "Red Dead Redemption 2", "The Witcher 3", "Dark Souls", 
    "Terraria", "Good of War"
  ];

  const jogosFiltrados = listaJogos.filter(jogo => 
    jogo.toLowerCase().includes(busca.toLowerCase())
  );

  const dadosAtuais = bancoDeDadosGuias[jogoSelecionado] || {
    tutoriais: ["Guia em breve...", "Conteúdo em desenvolvimento"],
    mecanicas: ["Guia em breve..."], itens: ["Guia em breve..."], farms: ["Guia em breve..."],
    monstruario: [], colunasMonstruario: { th1: "Nome", th2: "Ação", th3: "Drop" },
    titulos: { bloco1: "Tutoriais", bloco2: "Mecânicas", bloco3: "Itens", bloco4: "Monstruário", bloco5: "Farms" },
    mapas: [] // Fallback caso o jogo não tenha mapa cadastrado ainda
  };

  return (
    <div className="w-full font-sans p-4 transition-colors duration-200">
      
      {/* Título Adaptável */}
      <h1 className={`text-center text-2xl font-bold mb-6 tracking-wide transition-colors ${
        isDark ? 'text-white' : 'text-purple-950'
      }`}>
        Guia de Jogos
      </h1>

      <div className="flex flex-col md:flex-row gap-4 max-w-[1400px] mx-auto items-stretch">
        
        {/* SIDEBAR ESQUERDA */}
        <div className={`w-full md:w-64 rounded-lg p-3 border flex flex-col h-[550px] transition-colors ${
          isDark ? 'bg-[#1a1f2c] border-purple-900/40' : 'bg-white border-purple-200 shadow-sm'
        }`}>
          <input
            type="text"
            placeholder="Pesquisar"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className={`w-full rounded px-3 py-1.5 text-sm mb-4 outline-none focus:ring-1 focus:ring-purple-500 transition-colors ${
              isDark ? 'bg-[#242b3d] text-white placeholder-gray-400 border-none' : 'bg-gray-100 text-gray-800 border border-gray-200 placeholder-gray-400'
            }`}
          />

          <div className="flex-1 overflow-y-auto pr-1 space-y-1 custom-scrollbar">
            {jogosFiltrados.map((jogo) => (
              <button
                key={jogo}
                onClick={() => setJogoSelecionado(jogo)}
                className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors cursor-pointer ${
                  jogoSelecionado === jogo 
                    ? (isDark ? 'text-purple-400 bg-purple-950/40 font-bold' : 'text-purple-700 bg-purple-100 font-bold')
                    : (isDark ? 'text-gray-300 hover:bg-gray-800/50' : 'text-gray-600 hover:bg-gray-100')
                }`}
              >
                {jogo}
              </button>
            ))}
          </div>
        </div>

        {/* ÁREA DE CONTEÚDO */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Bloco 1 */}
          <div className={`rounded-xl p-5 border transition-colors ${
            isDark ? 'bg-[#121622] text-gray-300 border-purple-600/60 shadow-[0_0_15px_rgba(147,51,234,0.1)]' : 'bg-white text-gray-700 border-purple-100 shadow-sm'
          }`}>
            <h2 className={`text-xl font-black tracking-wider uppercase mb-4 font-mono ${isDark ? 'text-gray-100' : 'text-purple-950'}`}>
              {dadosAtuais.titulos.bloco1}
            </h2>
            <ul className="space-y-2 text-xs">
              {dadosAtuais.tutoriais.map((item, i) => <li key={i}>• {item}</li>)}
            </ul>
          </div>

          {/* Bloco 2 */}
          <div className={`rounded-xl p-5 border transition-colors ${
            isDark ? 'bg-[#121622] text-gray-300 border-purple-600/60 shadow-[0_0_15px_rgba(147,51,234,0.1)]' : 'bg-white text-gray-700 border-purple-100 shadow-sm'
          }`}>
            <h2 className={`text-xl font-black tracking-wider uppercase mb-4 font-mono ${isDark ? 'text-gray-100' : 'text-purple-950'}`}>
              {dadosAtuais.titulos.bloco2}
            </h2>
            <ul className="space-y-2 text-xs">
              {dadosAtuais.mecanicas.map((item, i) => <li key={i}>• {item}</li>)}
            </ul>
          </div>

          {/* Bloco: Mapas (DINÂMICO) */}
          <div className={`rounded-xl p-5 border transition-colors ${
            isDark ? 'bg-[#121622] text-gray-300 border-purple-600/60 shadow-[0_0_15px_rgba(147,51,234,0.1)]' : 'bg-white text-gray-700 border-purple-100 shadow-sm'
          }`}>
            <h2 className={`text-xl font-black tracking-wider uppercase mb-4 font-mono ${isDark ? 'text-gray-100' : 'text-purple-950'}`}>
              Mapas
            </h2>
            
            {dadosAtuais.mapas && dadosAtuais.mapas.length > 0 ? (
              // Se tiver só 1 item, usa 1 coluna. Se tiver mais, divide em 2 colunas
              <div className={`grid gap-2 ${dadosAtuais.mapas.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {dadosAtuais.mapas.map((mapa, idx) => (
                  <div 
                    key={idx} 
                    className={`rounded overflow-hidden relative border group transition-all ${
                      dadosAtuais.mapas.length === 1 ? 'h-44' : 'h-20'
                    } ${isDark ? 'bg-gray-800 border-none' : 'bg-purple-50/60 border-purple-100'}`}
                  >
                    {/* Elemento de Imagem Real */}
                    <img 
                      src={mapa.src} 
                      alt={mapa.nome} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {/* Sombra interna e texto por cima da imagem */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                      <span className="text-[11px] font-bold text-white tracking-wide uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                        {mapa.nome}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-20 flex items-center justify-center text-xs text-gray-400 italic">
                Nenhum mapa disponível para este jogo.
              </div>
            )}
          </div>

          {/* Bloco 3 */}
          <div className={`rounded-xl p-5 border transition-colors ${
            isDark ? 'bg-[#121622] text-gray-300 border-purple-600/60 shadow-[0_0_15px_rgba(147,51,234,0.1)]' : 'bg-white text-gray-700 border-purple-100 shadow-sm'
          }`}>
            <h2 className={`text-xl font-black tracking-wider uppercase mb-4 font-mono ${isDark ? 'text-gray-100' : 'text-purple-950'}`}>
              {dadosAtuais.titulos.bloco3}
            </h2>
            <ul className="space-y-2 text-xs">
              {dadosAtuais.itens.map((item, i) => <li key={i}>• {item}</li>)}
            </ul>
          </div>

          {/* Bloco 4: Monstruário */}
          <div className={`rounded-xl p-5 border transition-colors ${
            isDark ? 'bg-[#121622] text-gray-300 border-purple-600/60 shadow-[0_0_15px_rgba(147,51,234,0.1)]' : 'bg-white text-gray-700 border-purple-100 shadow-sm'
          }`}>
            <h2 className={`text-xl font-black tracking-wider uppercase mb-4 font-mono ${isDark ? 'text-gray-100' : 'text-purple-950'}`}>
              {dadosAtuais.titulos.bloco4}
            </h2>
            <div className="overflow-x-auto text-[11px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`transition-colors ${isDark ? 'bg-[#242b3d] text-gray-300' : 'bg-purple-50 text-purple-950'}`}>
                    <th className={`p-2 border-b ${isDark ? 'border-gray-700' : 'border-purple-100'}`}>{dadosAtuais.colunasMonstruario.th1}</th>
                    <th className={`p-2 border-b ${isDark ? 'border-gray-700' : 'border-purple-100'}`}>{dadosAtuais.colunasMonstruario.th2}</th>
                    <th className={`p-2 border-b ${isDark ? 'border-gray-700' : 'border-purple-100'}`}>{dadosAtuais.colunasMonstruario.th3}</th>
                  </tr>
                </thead>
                <tbody className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  {dadosAtuais.monstruario.map((row, index) => (
                    <tr key={index} className={`border-b last:border-none ${isDark ? 'border-gray-800/60' : 'border-purple-50/50'}`}>
                      <td className={`p-2 font-medium ${isDark ? 'text-white' : 'text-purple-950'}`}>{row.inimigo}</td>
                      <td className="p-2">{row.comoEnfrentar}</td>
                      <td className="p-2">{row.drops}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bloco 5 */}
          <div className={`rounded-xl p-5 border transition-colors ${
            isDark ? 'bg-[#121622] text-gray-300 border-purple-600/60 shadow-[0_0_15px_rgba(147,51,234,0.1)]' : 'bg-white text-gray-700 border-purple-100 shadow-sm'
          }`}>
            <h2 className={`text-xl font-black tracking-wider uppercase mb-4 font-mono ${isDark ? 'text-gray-100' : 'text-purple-950'}`}>
              {dadosAtuais.titulos.bloco5}
            </h2>
            <ul className="space-y-2 text-xs">
              {dadosAtuais.farms.map((item, i) => <li key={i}>• {item}</li>)}
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}