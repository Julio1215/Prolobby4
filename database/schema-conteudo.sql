-- ProLobby — tabelas dos módulos de conteúdo (notícias, jogos, reviews, QCD e e-sports)
--
-- Como usar: phpMyAdmin → selecione o banco do ProLobby (o mesmo do schema.sql) → aba Importar.
-- É seguro rodar mais de uma vez (CREATE TABLE IF NOT EXISTS) e NÃO mexe nas tabelas que já existem.
-- Obs.: as colunas usuario_id ficam SEM chave estrangeira para a tabela "usuarios" de propósito
-- (assim a importação não falha por diferença de collation entre as tabelas).

SET NAMES utf8mb4;

-- Trava + intervalo mínimo entre execuções (ex.: coleta de notícias) — funciona sem cron
CREATE TABLE IF NOT EXISTS controle_execucao (
  chave           VARCHAR(60) NOT NULL,
  ultima_execucao DATETIME NULL,
  bloqueado_ate   DATETIME NULL,
  PRIMARY KEY (chave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contador de uso por hora (proteção da cota da API de e-sports)
CREATE TABLE IF NOT EXISTS limite_uso (
  chave  VARCHAR(60) NOT NULL,
  janela CHAR(10) NOT NULL,
  usos   INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (chave, janela)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fontes de notícias (feeds RSS/Atom). Para trocar/adicionar fonte basta editar esta tabela.
CREATE TABLE IF NOT EXISTS fontes_noticias (
  id                   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome                 VARCHAR(80) NOT NULL,
  site_url             VARCHAR(255) NULL,
  feed_url             VARCHAR(500) NOT NULL,
  idioma               VARCHAR(5) NOT NULL DEFAULT 'pt',
  categoria            VARCHAR(20) NOT NULL DEFAULT 'games',   -- 'games' ou 'esports'
  ativa                TINYINT(1) NOT NULL DEFAULT 1,
  ultima_coleta        DATETIME NULL,
  ultimo_erro          VARCHAR(255) NULL,
  falhas_seguidas      INT UNSIGNED NOT NULL DEFAULT 0,
  proxima_tentativa_em DATETIME NULL,
  etag                 VARCHAR(255) NULL,
  ultima_modificacao   VARCHAR(100) NULL,
  total_coletado       INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_fonte_feed (feed_url(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notícias coletadas (só título, resumo curto, link e miniatura — o texto completo fica no site de origem)
CREATE TABLE IF NOT EXISTS noticias (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  fonte_id     INT UNSIGNED NOT NULL,
  titulo       VARCHAR(300) NOT NULL,
  resumo       VARCHAR(600) NULL,
  url          VARCHAR(700) NOT NULL,
  url_hash     CHAR(40) NOT NULL,
  imagem_url   VARCHAR(700) NULL,
  publicada_em DATETIME NOT NULL,
  coletada_em  DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_noticia_url (url_hash),
  KEY idx_noticias_data (publicada_em),
  KEY idx_noticias_fonte (fonte_id, publicada_em),
  CONSTRAINT fk_noticias_fonte FOREIGN KEY (fonte_id) REFERENCES fontes_noticias (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Catálogo de jogos: alimenta o Guia de Jogos, o QCD e os Reviews
CREATE TABLE IF NOT EXISTS jogos (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug            VARCHAR(120) NOT NULL,
  titulo          VARCHAR(150) NOT NULL,
  genero          VARCHAR(40) NOT NULL,
  plataformas     VARCHAR(160) NOT NULL DEFAULT '',          -- separadas por vírgula, sem espaço: PC,PS5,Switch
  desenvolvedora  VARCHAR(120) NULL,
  publicadora     VARCHAR(120) NULL,
  ano_lancamento  SMALLINT UNSIGNED NULL,
  descricao       TEXT NULL,
  capa_url        VARCHAR(500) NULL,
  steam_appid     INT UNSIGNED NULL,                         -- se preenchido e sem capa_url, a capa vem da Steam
  preco_atual     DECIMAL(10,2) NULL,                        -- R$ (valor de referência: edite quando quiser)
  horas_principal DECIMAL(6,1) NULL,                         -- horas para zerar a campanha (NULL = jogo sem fim)
  horas_completo  DECIMAL(6,1) NULL,
  destaque        TINYINT(1) NOT NULL DEFAULT 0,
  criado_em       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_jogo_slug (slug),
  KEY idx_jogo_genero (genero),
  KEY idx_jogo_titulo (titulo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reviews de jogos (origem 'usuario' = feita por quem está logado; 'editorial' = exemplo da equipe)
CREATE TABLE IF NOT EXISTS reviews (
  id            VARCHAR(40) NOT NULL,
  jogo_id       INT UNSIGNED NULL,
  jogo_nome     VARCHAR(150) NOT NULL,
  usuario_id    VARCHAR(80) NULL,
  autor_nome    VARCHAR(80) NULL,
  origem        VARCHAR(12) NOT NULL DEFAULT 'usuario',
  titulo        VARCHAR(150) NOT NULL,
  texto         TEXT NOT NULL,
  nota          DECIMAL(3,1) NOT NULL,                       -- 0 a 10
  horas_jogadas DECIMAL(7,1) NULL,
  preco_pago    DECIMAL(10,2) NULL,
  plataforma    VARCHAR(40) NULL,
  recomenda     TINYINT(1) NULL,
  criado_em     DATETIME NOT NULL,
  atualizado_em DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_review_usuario_jogo (usuario_id, jogo_id),   -- 1 review por usuário em cada jogo do catálogo
  KEY idx_review_jogo (jogo_id, criado_em),
  KEY idx_review_usuario (usuario_id, criado_em),
  KEY idx_review_data (criado_em),
  CONSTRAINT fk_review_jogo FOREIGN KEY (jogo_id) REFERENCES jogos (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Histórico de cálculos do QCD de cada usuário logado
CREATE TABLE IF NOT EXISTS qcd_calculos (
  id             VARCHAR(40) NOT NULL,
  usuario_id     VARCHAR(80) NOT NULL,
  jogo_id        INT UNSIGNED NULL,
  jogo_nome      VARCHAR(150) NOT NULL,
  preco          DECIMAL(10,2) NOT NULL,
  horas          DECIMAL(7,1) NOT NULL,
  nota           DECIMAL(3,1) NULL,
  custo_por_hora DECIMAL(10,2) NOT NULL,
  nivel          VARCHAR(20) NOT NULL,
  score          DECIMAL(6,2) NULL,                          -- pontuação calculada pela tela (opcional)
  criado_em      DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_qcd_usuario (usuario_id, criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cache das respostas da API externa de e-sports (PandaScore)
CREATE TABLE IF NOT EXISTS cache_externo (
  chave       CHAR(40) NOT NULL,
  caminho     VARCHAR(255) NOT NULL,
  corpo       MEDIUMTEXT NOT NULL,
  buscado_em  DATETIME NOT NULL,
  expira_em   DATETIME NOT NULL,
  refresh_ate DATETIME NULL,
  PRIMARY KEY (chave),
  KEY idx_cache_buscado (buscado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
