<?php
// Coletor de notícias: lê feeds RSS/Atom das fontes cadastradas e grava no banco.
// Guarda só título, resumo curto, link e miniatura — o texto completo continua no site de origem.
if (!defined('PROLOBBY_CONTEUDO')) {
    http_response_code(403);
    exit;
}

// Tira tags e entidades HTML e resume o texto.
function htmlParaTexto(string $html, int $max): string
{
    $html = garantirUtf8($html);
    $html = preg_replace('~<(script|style)\b[^>]*>.*?</\1>~is', ' ', $html) ?? $html;
    $html = preg_replace('~<(br|/p|/div|/li|/h[1-6])\b[^>]*>~i', ' ', $html) ?? $html;
    $t = strip_tags($html);
    $t = html_entity_decode($t, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $t = str_replace("\xC2\xA0", ' ', $t);
    $t = preg_replace('/\s+/u', ' ', $t) ?? $t;
    $t = trim($t);
    // Rodapé comum de WordPress: "The post X appeared first on Y." / "O post X apareceu primeiro em Y."
    $t = preg_replace('/\s*(The post|O post|A matéria|O artigo)\s.{0,300}?\s(appeared first on|apareceu primeiro em|apareceu primeiro no|apareceu primeiro na)\s.*$/iu', '', $t) ?? $t;
    return resumirTexto(trim($t), $max);
}

// Normaliza o link: só http/https, sem #fragmento e sem parâmetros de rastreamento (utm_*, fbclid, gclid).
function normalizarUrlNoticia(string $url): string
{
    $url = trim($url);
    if (!preg_match('~^https?://~i', $url)) {
        return '';
    }
    $p = parse_url($url);
    if (!$p || empty($p['host'])) {
        return '';
    }
    $final = strtolower($p['scheme']) . '://' . strtolower($p['host']);
    if (isset($p['port'])) {
        $final .= ':' . $p['port'];
    }
    $final .= $p['path'] ?? '/';
    if (!empty($p['query'])) {
        $consulta = preg_replace('/(^|&)(utm_[^=&]*|fbclid|gclid)=[^&]*/i', '', $p['query']);
        $consulta = trim((string) $consulta, '&');
        if ($consulta !== '') {
            $final .= '?' . $consulta;
        }
    }
    return urlHttp($final, 700) ?? '';
}

// Completa imagens com endereço relativo ("//cdn..." ou "/img/x.jpg") usando o site da notícia.
function urlImagemAbsoluta(string $imagem, string $paginaUrl): string
{
    $imagem = trim(html_entity_decode($imagem, ENT_QUOTES | ENT_HTML5, 'UTF-8'));
    if (strpos($imagem, '//') === 0) {
        return 'https:' . $imagem;
    }
    if (isset($imagem[0]) && $imagem[0] === '/') {
        $p = parse_url($paginaUrl);
        if ($p && !empty($p['scheme']) && !empty($p['host'])) {
            return $p['scheme'] . '://' . $p['host'] . $imagem;
        }
    }
    return $imagem;
}

// Converte um <item> (RSS) ou <entry> (Atom) no formato interno. Devolve null se não servir.
function normalizarItemFeed(SimpleXMLElement $item, bool $ehAtom): ?array
{
    $titulo = htmlParaTexto((string) $item->title, 250);
    if ($titulo === '') {
        return null;
    }

    // Link da matéria
    $url = '';
    if ($ehAtom) {
        foreach ($item->link as $l) {
            $rel = (string) $l['rel'];
            $href = (string) $l['href'];
            if ($href !== '' && ($rel === '' || $rel === 'alternate')) {
                $url = $href;
                break;
            }
        }
    } else {
        $url = trim((string) $item->link);
        if ($url === '' && isset($item->guid)) {
            $guid = trim((string) $item->guid);
            if (preg_match('~^https?://~i', $guid)) {
                $url = $guid;
            }
        }
    }
    $url = normalizarUrlNoticia($url);
    if ($url === '') {
        return null; // sem link válido (ou link perigoso, como javascript:) não entra
    }

    $conteudoNs = $item->children('http://purl.org/rss/1.0/modules/content/');
    $mediaNs = $item->children('http://search.yahoo.com/mrss/');
    $dcNs = $item->children('http://purl.org/dc/elements/1.1/');

    // Resumo: usa o resumo do feed; só cai no corpo completo se não houver resumo.
    $descricaoHtml = (string) $item->description;
    if ($descricaoHtml === '') {
        $descricaoHtml = (string) $item->summary;
    }
    $corpoHtml = isset($conteudoNs->encoded) ? (string) $conteudoNs->encoded : (string) $item->content;
    $resumo = htmlParaTexto($descricaoHtml !== '' ? $descricaoHtml : $corpoHtml, 300);
    if ($resumo === $titulo || $resumo === '') {
        $resumo = null;
    }

    // Imagem: media:thumbnail > media:content > enclosure > primeira <img> do texto
    $imagem = '';
    if (isset($mediaNs->thumbnail)) {
        $imagem = (string) $mediaNs->thumbnail[0]->attributes()['url'];
    }
    if ($imagem === '' && isset($mediaNs->content)) {
        foreach ($mediaNs->content as $c) {
            $a = $c->attributes();
            $tipo = (string) $a['type'];
            $medio = (string) $a['medium'];
            $endereco = (string) $a['url'];
            if ($endereco !== '' && ($medio === 'image' || strpos($tipo, 'image/') === 0 || preg_match('/\.(jpe?g|png|webp|gif)(\?|$)/i', $endereco))) {
                $imagem = $endereco;
                break;
            }
        }
    }
    if ($imagem === '') {
        foreach ($item->enclosure as $e) {
            if (strpos((string) $e['type'], 'image/') === 0) {
                $imagem = (string) $e['url'];
                break;
            }
        }
    }
    if ($imagem === '') {
        foreach ([$corpoHtml, $descricaoHtml] as $html) {
            if ($html !== '' && preg_match('/<img[^>]+src=["\']([^"\']+)["\']/i', $html, $m)) {
                $imagem = $m[1];
                break;
            }
        }
    }
    $imagem = $imagem !== '' ? urlHttp(urlImagemAbsoluta($imagem, $url), 700) : null;

    // Data de publicação (UTC). Sem data ou com data no futuro: usa o momento da coleta.
    $dataBruta = (string) $item->pubDate;
    if ($dataBruta === '') {
        $dataBruta = (string) $item->published;
    }
    if ($dataBruta === '' && isset($dcNs->date)) {
        $dataBruta = (string) $dcNs->date;
    }
    if ($dataBruta === '') {
        $dataBruta = (string) $item->updated;
    }
    $ts = $dataBruta !== '' ? strtotime($dataBruta) : false;
    if ($ts === false || $ts <= 0 || $ts > time() + 6 * 3600) {
        $ts = time();
    }

    return [
        'titulo' => $titulo,
        'url' => $url,
        'resumo' => $resumo,
        'imagem' => $imagem,
        'publicadaEm' => gmdate('Y-m-d H:i:s', $ts),
    ];
}

// Lê o texto de um feed (RSS 2.0, RSS 1.0/RDF ou Atom). Lança RuntimeException se não for um feed.
function interpretarFeed(string $texto): array
{
    if (!function_exists('simplexml_load_string')) {
        throw new RuntimeException('A extensão SimpleXML do PHP não está ativa neste servidor');
    }
    $texto = ltrim((string) preg_replace('/^\xEF\xBB\xBF/', '', $texto));
    if ($texto === '') {
        throw new RuntimeException('Resposta vazia');
    }
    if (stripos($texto, '<!ENTITY') !== false) {
        throw new RuntimeException('Feed com entidades XML não é aceito');
    }

    $anterior = libxml_use_internal_errors(true);
    $xml = simplexml_load_string($texto, 'SimpleXMLElement', LIBXML_NOCDATA | LIBXML_NONET);
    libxml_clear_errors();
    libxml_use_internal_errors($anterior);
    if ($xml === false) {
        throw new RuntimeException('XML inválido (a URL talvez não seja um feed RSS/Atom)');
    }

    $raiz = $xml->getName();
    if ($raiz === 'rss' && isset($xml->channel->item)) {
        $brutos = $xml->channel->item;
    } elseif ($raiz === 'feed') {
        $brutos = $xml->entry;
    } elseif ($raiz === 'RDF') {
        $brutos = $xml->item;
    } elseif ($raiz === 'rss') {
        return []; // feed válido, só que vazio
    } else {
        throw new RuntimeException('Formato de feed não reconhecido');
    }

    $itens = [];
    $vistos = [];
    foreach ($brutos as $bruto) {
        $item = normalizarItemFeed($bruto, $raiz === 'feed');
        // link repetido dentro do mesmo feed: vale a primeira ocorrência
        if ($item === null || isset($vistos[$item['url']])) {
            continue;
        }
        $vistos[$item['url']] = true;
        $itens[] = $item;
    }
    return $itens;
}

function registrarFalhaFonte(PDO $pdo, array $fonte, string $mensagem): void
{
    $falhas = (int) $fonte['falhas_seguidas'] + 1;
    // pausa cresce a cada falha: 15 min, 30, 60, 120... no máximo 24 h
    $pausaMin = min(1440, 15 * (2 ** min($falhas - 1, 7)));
    consultar(
        $pdo,
        'UPDATE fontes_noticias SET ultimo_erro = :erro, falhas_seguidas = :falhas, proxima_tentativa_em = :proxima WHERE id = :id',
        [
            ':erro' => cortarChars($mensagem, 250),
            ':falhas' => $falhas,
            ':proxima' => gmdate('Y-m-d H:i:s', time() + $pausaMin * 60),
            ':id' => (int) $fonte['id'],
        ]
    );
}

// Coleta as fontes ativas (as que estão há mais tempo sem coleta primeiro). Os downloads rodam em paralelo.
function coletarNoticias(PDO $pdo, bool $ignorarPausa = false): array
{
    @set_time_limit(60);
    $agora = agoraUtc();
    $maxFontes = max(1, (int) valorEnv('NOTICIAS_MAX_FONTES', 12));
    $maxPorFonte = max(1, (int) valorEnv('NOTICIAS_MAX_POR_FONTE', 30));

    $sql = 'SELECT * FROM fontes_noticias WHERE ativa = 1';
    $params = [];
    if (!$ignorarPausa) {
        $sql .= ' AND (proxima_tentativa_em IS NULL OR proxima_tentativa_em <= :agora)';
        $params[':agora'] = $agora;
    }
    $sql .= ' ORDER BY (ultima_coleta IS NULL) DESC, ultima_coleta ASC LIMIT ' . $maxFontes;
    $fontes = consultar($pdo, $sql, $params)->fetchAll();

    $pedidos = [];
    foreach ($fontes as $f) {
        $url = urlHttp($f['feed_url'], 500);
        if ($url === null) {
            continue; // URL inválida: tratada abaixo como erro
        }
        $pedidos[$f['id']] = [
            'url' => $url,
            'cabecalhos' => ['Accept: application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.5'],
            'etag' => $f['etag'],
            'modificado' => $f['ultima_modificacao'],
        ];
    }
    $respostas = $pedidos ? httpBaixar($pedidos, 8) : [];

    $inserir = $pdo->prepare(
        'INSERT INTO noticias (fonte_id, titulo, resumo, url, url_hash, imagem_url, publicada_em, coletada_em)
         VALUES (:f, :t, :r, :u, :h, :i, :p, :c)'
    );

    $totalNovas = 0;
    $resumoFontes = [];
    foreach ($fontes as $f) {
        $id = (int) $f['id'];
        $linha = ['id' => $id, 'nome' => $f['nome'], 'ok' => false, 'novas' => 0];

        if (!isset($respostas[$f['id']])) {
            $linha['erro'] = 'URL do feed inválida';
            registrarFalhaFonte($pdo, $f, $linha['erro']);
            $resumoFontes[] = $linha;
            continue;
        }
        $r = $respostas[$f['id']];

        if ($r['erro'] !== null) {
            $linha['erro'] = $r['erro'];
            registrarFalhaFonte($pdo, $f, $r['erro']);
            $resumoFontes[] = $linha;
            continue;
        }
        if ($r['codigo'] === 304) { // nada mudou desde a última coleta
            consultar(
                $pdo,
                'UPDATE fontes_noticias SET ultima_coleta = :agora, ultimo_erro = NULL, falhas_seguidas = 0, proxima_tentativa_em = NULL WHERE id = :id',
                [':agora' => $agora, ':id' => $id]
            );
            $linha['ok'] = true;
            $linha['naoModificado'] = true;
            $resumoFontes[] = $linha;
            continue;
        }
        if ($r['codigo'] < 200 || $r['codigo'] >= 300) {
            $linha['erro'] = $r['codigo'] === 0 ? 'Sem resposta do servidor' : 'HTTP ' . $r['codigo'];
            registrarFalhaFonte($pdo, $f, $linha['erro']);
            $resumoFontes[] = $linha;
            continue;
        }

        try {
            $itens = interpretarFeed($r['corpo']);
        } catch (RuntimeException $e) {
            $linha['erro'] = $e->getMessage();
            registrarFalhaFonte($pdo, $f, $linha['erro']);
            $resumoFontes[] = $linha;
            continue;
        }

        usort($itens, function ($a, $b) {
            return strcmp($b['publicadaEm'], $a['publicadaEm']);
        });
        $novas = 0;
        $erroBanco = null;
        foreach (array_slice($itens, 0, $maxPorFonte) as $item) {
            try {
                $inserir->execute([
                    ':f' => $id,
                    ':t' => $item['titulo'],
                    ':r' => $item['resumo'],
                    ':u' => $item['url'],
                    ':h' => sha1($item['url']),
                    ':i' => $item['imagem'],
                    ':p' => $item['publicadaEm'],
                    ':c' => $agora,
                ]);
                $novas++;
            } catch (PDOException $e) {
                // 1062 = notícia repetida (mesmo link): é esperado, só ignora
                if (!isset($e->errorInfo[1]) || (int) $e->errorInfo[1] !== 1062) {
                    $erroBanco = $e->getMessage(); // outro erro: não derruba a coleta das outras fontes
                    break;
                }
            }
        }
        if ($erroBanco !== null) {
            $linha['erro'] = 'Erro ao gravar no banco: ' . cortarChars($erroBanco, 180);
            registrarFalhaFonte($pdo, $f, $linha['erro']);
            $resumoFontes[] = $linha;
            continue;
        }

        consultar(
            $pdo,
            'UPDATE fontes_noticias SET ultima_coleta = :agora, ultimo_erro = NULL, falhas_seguidas = 0, proxima_tentativa_em = NULL,
                    etag = :etag, ultima_modificacao = :modificado, total_coletado = total_coletado + :novas WHERE id = :id',
            [
                ':agora' => $agora,
                ':etag' => isset($r['cabecalhos']['etag']) ? cortarChars($r['cabecalhos']['etag'], 250) : null,
                ':modificado' => isset($r['cabecalhos']['last-modified']) ? cortarChars($r['cabecalhos']['last-modified'], 95) : null,
                ':novas' => $novas,
                ':id' => $id,
            ]
        );
        $linha['ok'] = true;
        $linha['novas'] = $novas;
        $linha['lidas'] = count($itens);
        $totalNovas += $novas;
        $resumoFontes[] = $linha;
    }

    $removidas = limparNoticiasAntigas($pdo);
    return ['novas' => $totalNovas, 'removidas' => $removidas, 'fontes' => $resumoFontes];
}

// Mantém o banco pequeno (hospedagem grátis tem limite): apaga notícias velhas e limita o total.
function limparNoticiasAntigas(PDO $pdo): int
{
    $dias = max(7, (int) valorEnv('NOTICIAS_RETENCAO_DIAS', 60));
    $maximo = max(100, (int) valorEnv('NOTICIAS_MAX_TOTAL', 2000));
    $removidas = consultar(
        $pdo,
        'DELETE FROM noticias WHERE publicada_em < :limite',
        [':limite' => gmdate('Y-m-d H:i:s', time() - $dias * 86400)]
    )->rowCount();

    $total = (int) $pdo->query('SELECT COUNT(*) FROM noticias')->fetchColumn();
    if ($total > $maximo) {
        $corte = consultar(
            $pdo,
            'SELECT publicada_em FROM noticias ORDER BY publicada_em DESC, id DESC LIMIT 1 OFFSET :off',
            [':off' => $maximo - 1]
        )->fetchColumn();
        if ($corte) {
            $removidas += consultar($pdo, 'DELETE FROM noticias WHERE publicada_em < :corte', [':corte' => $corte])->rowCount();
        }
    }
    return $removidas;
}

// Quando foi a última coleta e se já passou do intervalo (o front usa isso para disparar a atualização).
function estadoColetaNoticias(PDO $pdo): array
{
    $ultima = consultar($pdo, "SELECT ultima_execucao FROM controle_execucao WHERE chave = 'noticias'")->fetchColumn();
    $ultima = $ultima ?: null;
    $intervalo = max(1, (int) valorEnv('NOTICIAS_INTERVALO_MIN', 30)) * 60;
    $precisa = $ultima === null || (time() - strtotime($ultima . ' UTC')) >= $intervalo;
    return ['atualizadoEm' => dataIso($ultima), 'precisaAtualizar' => $precisa];
}
