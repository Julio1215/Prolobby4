-- ProLobby — dados iniciais dos módulos de conteúdo (fontes de notícias, catálogo de jogos e reviews de exemplo)
--
-- Rode DEPOIS do schema-conteudo.sql. Pode rodar de novo sem duplicar nada (INSERT IGNORE).
-- Os preços (R$) e as horas para zerar são VALORES DE REFERÊNCIA aproximados: confira/ajuste na tabela `jogos`.
-- As reviews 'editorial' são exemplos para a tela não começar vazia. Para apagar todas:
--   DELETE FROM reviews WHERE origem = 'editorial';

SET NAMES utf8mb4;

-- Fontes de notícias (a URL do feed pode ser trocada à vontade; 'categoria' = games ou esports)
INSERT IGNORE INTO fontes_noticias (nome, site_url, feed_url, idioma, categoria) VALUES
('IGN Brasil', 'https://br.ign.com', 'https://br.ign.com/feed.xml', 'pt', 'games'),
('Critical Hits', 'https://criticalhits.com.br', 'https://criticalhits.com.br/feed/', 'pt', 'games'),
('Adrenaline', 'https://adrenaline.com.br', 'https://adrenaline.com.br/feed/', 'pt', 'games'),
('Mais Esports', 'https://maisesports.com.br', 'https://maisesports.com.br/feed/', 'pt', 'esports'),
('GameSpot', 'https://www.gamespot.com', 'https://www.gamespot.com/feeds/news/', 'en', 'games'),
('PC Gamer', 'https://www.pcgamer.com', 'https://www.pcgamer.com/rss/', 'en', 'games'),
('Eurogamer', 'https://www.eurogamer.net', 'https://www.eurogamer.net/feed', 'en', 'games'),
('Rock Paper Shotgun', 'https://www.rockpapershotgun.com', 'https://www.rockpapershotgun.com/feed', 'en', 'games'),
('Polygon', 'https://www.polygon.com', 'https://www.polygon.com/rss/index.xml', 'en', 'games'),
('Dot Esports', 'https://dotesports.com', 'https://dotesports.com/feed', 'en', 'esports'),
('Esports Insider', 'https://esportsinsider.com', 'https://esportsinsider.com/feed', 'en', 'esports');

-- Catálogo de jogos
INSERT IGNORE INTO jogos (slug, titulo, genero, plataformas, desenvolvedora, publicadora, ano_lancamento, descricao, steam_appid, preco_atual, horas_principal, destaque) VALUES
('the-witcher-3-wild-hunt', 'The Witcher 3: Wild Hunt', 'RPG', 'PC,PS4,PS5,Xbox One,Xbox Series,Switch', 'CD Projekt RED', 'CD Projekt', 2015, 'RPG de mundo aberto em que você vive Geralt de Rívia, caçador de monstros em busca da filha adotiva, Ciri. Missões cheias de escolhas difíceis e duas grandes expansões.', 292030, 99.99, 52, 1),
('elden-ring', 'Elden Ring', 'RPG', 'PC,PS4,PS5,Xbox One,Xbox Series', 'FromSoftware', 'Bandai Namco Entertainment', 2022, 'Mundo aberto sombrio da FromSoftware, com mitologia criada em parceria com George R. R. Martin. Exploração livre, chefes desafiadores e muitas descobertas.', 1245620, 229.9, 60, 1),
('baldurs-gate-3', 'Baldur''s Gate 3', 'RPG', 'PC,Mac,PS5,Xbox Series', 'Larian Studios', 'Larian Studios', 2023, 'RPG por turnos baseado em Dungeons & Dragons, com histórias ramificadas, companheiros marcantes e liberdade para resolver quase tudo do seu jeito. Dá para jogar em cooperativo.', 1086940, 199.9, 72, 1),
('hades', 'Hades', 'Roguelike', 'PC,Mac,Switch,PS4,PS5,Xbox One,Xbox Series', 'Supergiant Games', 'Supergiant Games', 2020, 'Roguelike de ação em que você tenta escapar do submundo grego como Zagreus. A cada fuga, novas armas, bênçãos e diálogos fazem a história avançar.', 1145360, 73.99, 22, 1),
('hollow-knight', 'Hollow Knight', 'Metroidvania', 'PC,Mac,Switch,PS4,Xbox One', 'Team Cherry', 'Team Cherry', 2017, 'Aventura estilo metroidvania num reino de insetos em ruínas: exploração, combate preciso e muitos segredos. Um clássico indie.', 367520, 27.99, 27, 0),
('celeste', 'Celeste', 'Plataforma', 'PC,Mac,Switch,PS4,Xbox One', 'Maddy Makes Games', 'Maddy Makes Games', 2018, 'Plataforma desafiador sobre escalar uma montanha e lidar com as próprias dúvidas. Controles precisos, ótima trilha e opções de assistência para ajustar a dificuldade.', 504230, 36.99, 8, 0),
('stardew-valley', 'Stardew Valley', 'Simulação', 'PC,Mac,Switch,PS4,Xbox One,Mobile', 'ConcernedApe', 'ConcernedApe', 2016, 'Simulador de vida no campo: plante, crie animais, pesque, explore minas e conquiste a vizinhança. Relaxante e muito viciante.', 413150, 24.99, 53, 0),
('red-dead-redemption-2', 'Red Dead Redemption 2', 'Ação', 'PC,PS4,Xbox One', 'Rockstar Games', 'Rockstar Games', 2018, 'Faroeste de mundo aberto da Rockstar sobre a gangue de Dutch van der Linde no fim da era dos fora da lei. Narrativa longa e um mundo cheio de detalhes.', 1174180, 299.9, 51, 0),
('grand-theft-auto-v', 'Grand Theft Auto V', 'Ação', 'PC,PS3,PS4,PS5,Xbox 360,Xbox One,Xbox Series', 'Rockstar North', 'Rockstar Games', 2013, 'Ação em mundo aberto com três protagonistas em Los Santos. A campanha e o modo online mantêm o jogo vivo há anos.', 271590, 99.99, 32, 0),
('god-of-war-2018', 'God of War (2018)', 'Ação', 'PC,PS4,PS5', 'Santa Monica Studio', 'Sony Interactive Entertainment', 2018, 'Kratos recomeça nos reinos nórdicos ao lado do filho Atreus, com combate físico e câmera sem cortes. Uma reinvenção da série.', 1593500, 199.9, 20, 0),
('zelda-breath-of-the-wild', 'The Legend of Zelda: Breath of the Wild', 'Aventura', 'Switch,Wii U', 'Nintendo EPD', 'Nintendo', 2017, 'Link acorda num Hyrule aberto e livre: escale tudo, use a física a seu favor e enfrente a Calamidade Ganon na ordem que quiser.', NULL, 299.9, 50, 0),
('super-mario-odyssey', 'Super Mario Odyssey', 'Plataforma', 'Switch', 'Nintendo EPD', 'Nintendo', 2017, 'Plataforma 3D em que Mario viaja por reinos variados com o chapéu Cappy, cheio de luas para coletar e segredos.', NULL, 299.9, 13, 0),
('portal-2', 'Portal 2', 'Puzzle', 'PC,Mac,PS3,Xbox 360', 'Valve', 'Valve', 2011, 'Quebra-cabeças em primeira pessoa com a arma de portais, humor afiado e um modo cooperativo para dois jogadores.', 620, 20.99, 8, 0),
('cyberpunk-2077', 'Cyberpunk 2077', 'RPG', 'PC,PS4,PS5,Xbox One,Xbox Series', 'CD Projekt RED', 'CD Projekt', 2020, 'RPG de ação em Night City, num futuro distópico. V busca um implante que pode salvar sua vida, e a história muda conforme as suas escolhas.', 1091500, 199.9, 26, 0),
('resident-evil-4-remake', 'Resident Evil 4 (Remake)', 'Terror', 'PC,PS4,PS5,Xbox Series', 'Capcom', 'Capcom', 2023, 'Releitura do clássico de terror: Leon S. Kennedy precisa resgatar a filha do presidente numa vila espanhola infestada. Ritmo intenso entre tensão e ação.', 2050650, 249.9, 16, 0),
('doom-eternal', 'DOOM Eternal', 'FPS', 'PC,PS4,PS5,Xbox One,Xbox Series,Switch', 'id Software', 'Bethesda Softworks', 2020, 'FPS frenético em que matar demônios é o que recarrega vida e munição. Exige agressividade e leitura rápida da arena.', 782330, 99.9, 13, 0),
('sekiro-shadows-die-twice', 'Sekiro: Shadows Die Twice', 'Ação', 'PC,PS4,Xbox One', 'FromSoftware', 'Activision', 2019, 'Ação de shinobi da FromSoftware com combate baseado em postura e defesa perfeita, num Japão feudal. Difícil e muito recompensador.', 814380, 229.9, 30, 0),
('disco-elysium', 'Disco Elysium', 'RPG', 'PC,Mac,PS4,PS5,Xbox One,Xbox Series,Switch', 'ZA/UM', 'ZA/UM', 2019, 'RPG de detetive sem combate tradicional: tudo é diálogo e teste de habilidade, inclusive contra a sua própria mente. Texto brilhante.', 632470, 94.99, 24, 0),
('undertale', 'Undertale', 'RPG', 'PC,Mac,PS4,Xbox One,Switch', 'Toby Fox', 'Toby Fox', 2015, 'RPG em que ninguém precisa morrer: você pode lutar ou poupar cada monstro, e o jogo reage às suas escolhas.', 391540, 19.99, 6.5, 0),
('it-takes-two', 'It Takes Two', 'Co-op', 'PC,PS4,PS5,Xbox One,Xbox Series,Switch', 'Hazelight Studios', 'Electronic Arts', 2021, 'Aventura cooperativa feita só para dois jogadores, com mecânicas novas a cada fase.', 1426210, 129.9, 14, 0),
('persona-5-royal', 'Persona 5 Royal', 'RPG', 'PC,PS4,PS5,Xbox One,Xbox Series,Switch', 'Atlus', 'Atlus', 2019, 'JRPG de estilo marcante: estudante de dia, ladrão de corações à noite. Mistura rotina escolar com dungeons e uma trilha inesquecível.', 1687950, 199.9, 100, 0),
('clair-obscur-expedition-33', 'Clair Obscur: Expedition 33', 'RPG', 'PC,PS5,Xbox Series', 'Sandfall Interactive', 'Kepler Interactive', 2025, 'RPG por turnos com reflexos em tempo real (esquiva e defesa perfeita) e direção de arte inspirada na França da Belle Époque, do estúdio francês Sandfall Interactive.', 1903340, 199.9, 35, 1),
('counter-strike-2', 'Counter-Strike 2', 'FPS', 'PC', 'Valve', 'Valve', 2023, 'FPS tático competitivo 5x5 da Valve, grátis para jogar. Base de um dos maiores cenários de e-sports.', 730, 0.0, NULL, 0),
('valorant', 'VALORANT', 'FPS', 'PC,PS5,Xbox Series', 'Riot Games', 'Riot Games', 2020, 'FPS tático 5x5 da Riot Games com agentes de habilidades únicas. Grátis e com um dos maiores cenários de e-sports (VCT).', NULL, 0.0, NULL, 1),
('league-of-legends', 'League of Legends', 'MOBA', 'PC,Mac', 'Riot Games', 'Riot Games', 2009, 'MOBA 5x5 da Riot Games, grátis, com mais de uma centena de campeões e um dos maiores cenários de e-sports do mundo.', NULL, 0.0, NULL, 0),
('dota-2', 'Dota 2', 'MOBA', 'PC,Mac', 'Valve', 'Valve', 2013, 'MOBA 5x5 da Valve, grátis e muito técnico, conhecido pelo campeonato The International.', 570, 0.0, NULL, 0);

-- Reviews de exemplo (origem 'editorial')
INSERT IGNORE INTO reviews (id, jogo_id, jogo_nome, usuario_id, autor_nome, origem, titulo, texto, nota, recomenda, criado_em, atualizado_em) VALUES
('review_seed_01', (SELECT id FROM jogos WHERE slug = 'the-witcher-3-wild-hunt'), 'The Witcher 3: Wild Hunt', NULL, 'Equipe ProLobby', 'editorial', 'Cada missão parece uma história', 'Até as missões secundárias têm começo, meio e fim, com escolhas que pesam de verdade. O mundo é enorme sem parecer vazio e a trilha ajuda a segurar a imersão. As 50 horas passam voando.', 9.5, 1, '2026-10-01 12:00:00', '2026-10-01 12:00:00'),
('review_seed_02', (SELECT id FROM jogos WHERE slug = 'elden-ring'), 'Elden Ring', NULL, 'Equipe ProLobby', 'editorial', 'Liberdade para se perder (e se encontrar)', 'O mundo aberto incentiva a curiosidade: quase todo canto escondido guarda algo útil ou um chefe memorável. É difícil, mas dá para voltar depois com mais nível ou com a ajuda de outros jogadores. Vale o preço cheio.', 9.0, 1, '2026-10-02 12:00:00', '2026-10-02 12:00:00'),
('review_seed_03', (SELECT id FROM jogos WHERE slug = 'hades'), 'Hades', NULL, 'Equipe ProLobby', 'editorial', 'Morrer nunca foi tão divertido', 'Cada tentativa de fuga rende novidades: uma arma, uma bênção, um diálogo novo. O combate é rápido e responde muito bem ao controle, e a história avança mesmo quando você perde.', 9.5, 1, '2026-10-03 12:00:00', '2026-10-03 12:00:00'),
('review_seed_04', (SELECT id FROM jogos WHERE slug = 'celeste'), 'Celeste', NULL, 'Equipe ProLobby', 'editorial', 'Difícil, mas justo', 'As fases exigem precisão, porém o jogo reinicia na hora e nunca pune demais. A história sobre ansiedade é sensível e bem contada, e existe modo de assistência para ajustar o desafio.', 9.0, 1, '2026-10-04 12:00:00', '2026-10-04 12:00:00'),
('review_seed_05', (SELECT id FROM jogos WHERE slug = 'stardew-valley'), 'Stardew Valley', NULL, 'Equipe ProLobby', 'editorial', 'O jogo do só mais um dia', 'Começa simples e vai ganhando camadas: fazenda, minas, pesca, amizades e festivais. Dá para jogar no ritmo que quiser, e o preço baixo deixa o custo por hora quase ridículo de tão bom.', 9.0, 1, '2026-10-05 12:00:00', '2026-10-05 12:00:00'),
('review_seed_06', (SELECT id FROM jogos WHERE slug = 'hollow-knight'), 'Hollow Knight', NULL, 'Equipe ProLobby', 'editorial', 'Um mundo enorme e cheio de personalidade', 'A exploração de Hallownest recompensa quem tem curiosidade, e o combate com a agulha é preciso. Alguns chefes são exigentes, mas o visual e a música fazem tudo valer a pena.', 9.0, 1, '2026-10-06 12:00:00', '2026-10-06 12:00:00'),
('review_seed_07', (SELECT id FROM jogos WHERE slug = 'portal-2'), 'Portal 2', NULL, 'Equipe ProLobby', 'editorial', 'Curto, afiado e engraçado', 'Os puzzles ensinam sem dar bronca e ficam mais criativos a cada câmara. O humor da GLaDOS e do Wheatley carrega a campanha, e o cooperativo é uma ótima desculpa para jogar com um amigo.', 9.5, 1, '2026-10-07 12:00:00', '2026-10-07 12:00:00'),
('review_seed_08', (SELECT id FROM jogos WHERE slug = 'undertale'), 'Undertale', NULL, 'Equipe ProLobby', 'editorial', 'Pequeno no tamanho, enorme na ideia', 'A ideia de poupar os inimigos muda a forma de jogar e de pensar cada batalha. A história é curta, cheia de humor e de momentos emocionantes, e a trilha sonora é marcante.', 8.5, 1, '2026-10-08 12:00:00', '2026-10-08 12:00:00');
