<?php
// Integração com a API externa de e-sports (PandaScore, plano grátis: 1000 requisições/hora).
// O token fica só no servidor (PANDASCORE_TOKEN no env.php). Cada resposta é transformada num formato
// simples em português (camelCase) e guardada no banco (tabela cache_externo) por alguns minutos,
// então a cota da API não acaba e a tela continua funcionando mesmo se a PandaScore cair.
if (!defined('PROLOBBY_CONTEUDO')) {
    http_response_code(403);
    exit;
}

// Jogos aceitos (o nome do jogo vai para a URL da API, então só vale o que está nesta lista).
const ESPORTS_JOGOS = ['valorant', 'csgo', 'lol', 'dota2'];

function esportsLerJogo(): string
{
    $jogo = strtolower(paramTexto('jogo', 20));
    if ($jogo === '') {
        $jogo = 'valorant';
    }
    if (!in_array($jogo, ESPORTS_JOGOS, true)) {
        responderErro('Jogo inválido (use valorant, csgo, lol ou dota2)', 400);
    }
    return $jogo;
}

function esportsIso($valor): ?string
{
    if (!is_string($valor) || $valor === '') {
        return null;
    }
    $ts = strtotime($valor);
    return $ts === false ? null : gmdate('Y-m-d\TH:i:s\Z', $ts);
}

function esportsIdOuNull($valor): ?int
{
    return (is_int($valor) || (is_string($valor) && ctype_digit($valor))) ? (int) $valor : null;
}

function esportsMapearTimeResumo(array $t): array
{
    return [
        'id' => esportsIdOuNull($t['id'] ?? null),
        'nome' => (string) ($t['name'] ?? ''),
        'sigla' => isset($t['acronym']) ? (string) $t['acronym'] : null,
        'logoUrl' => urlHttp($t['image_url'] ?? null),
        'pais' => isset($t['location']) ? (string) $t['location'] : null,
    ];
}

function esportsMapearPartida(array $m): array
{
    $times = [];
    foreach (($m['opponents'] ?? []) as $o) {
        if (isset($o['opponent']) && is_array($o['opponent'])) {
            $times[] = esportsMapearTimeResumo($o['opponent']);
        }
    }
    $placar = [];
    foreach (($m['results'] ?? []) as $r) {
        $placar[] = ['timeId' => esportsIdOuNull($r['team_id'] ?? null), 'pontos' => (int) ($r['score'] ?? 0)];
    }
    $statusPt = [
        'not_started' => 'agendada',
        'running' => 'ao_vivo',
        'finished' => 'encerrada',
        'canceled' => 'cancelada',
        'postponed' => 'adiada',
    ];
    $status = $statusPt[$m['status'] ?? ''] ?? 'agendada';

    $streams = [];
    foreach (($m['streams_list'] ?? []) as $s) {
        $link = urlHttp($s['raw_url'] ?? null);
        if ($link !== null) {
            $streams[] = [
                'url' => $link,
                'idioma' => isset($s['language']) ? (string) $s['language'] : null,
                'principal' => (bool) ($s['main'] ?? false),
                'oficial' => (bool) ($s['official'] ?? false),
            ];
        }
    }

    $torneio = null;
    if (isset($m['tournament']) && is_array($m['tournament'])) {
        $torneio = [
            'id' => esportsIdOuNull($m['tournament']['id'] ?? null),
            'nome' => (string) ($m['tournament']['name'] ?? ''),
            'tier' => isset($m['tournament']['tier']) ? (string) $m['tournament']['tier'] : null,
        ];
    }
    $serie = null;
    if (isset($m['serie']) && is_array($m['serie'])) {
        $serie = [
            'id' => esportsIdOuNull($m['serie']['id'] ?? null),
            'nome' => (string) ($m['serie']['full_name'] ?? $m['serie']['name'] ?? ''),
        ];
    }
    $liga = null;
    if (isset($m['league']) && is_array($m['league'])) {
        $liga = [
            'id' => esportsIdOuNull($m['league']['id'] ?? null),
            'nome' => (string) ($m['league']['name'] ?? ''),
            'imagemUrl' => urlHttp($m['league']['image_url'] ?? null),
        ];
    }

    return [
        'id' => esportsIdOuNull($m['id'] ?? null),
        'nome' => (string) ($m['name'] ?? ''),
        'status' => $status,
        'aoVivo' => $status === 'ao_vivo',
        'agendadaPara' => esportsIso($m['scheduled_at'] ?? null),
        'inicioEm' => esportsIso($m['begin_at'] ?? null),
        'fimEm' => esportsIso($m['end_at'] ?? null),
        'melhorDe' => (($m['match_type'] ?? '') === 'best_of' && isset($m['number_of_games'])) ? (int) $m['number_of_games'] : null,
        'torneio' => $torneio,
        'serie' => $serie,
        'liga' => $liga,
        'times' => $times,
        'placar' => $placar,
        'vencedorId' => esportsIdOuNull($m['winner_id'] ?? null),
        'streams' => $streams,
    ];
}

function esportsMapearTime(array $t): array
{
    $resumo = esportsMapearTimeResumo($t);
    $jogadores = [];
    foreach (($t['players'] ?? []) as $p) {
        $jogadores[] = [
            'id' => esportsIdOuNull($p['id'] ?? null),
            'nick' => (string) ($p['name'] ?? ''),
            'nome' => trim(((string) ($p['first_name'] ?? '')) . ' ' . ((string) ($p['last_name'] ?? ''))),
            'funcao' => isset($p['role']) ? (string) $p['role'] : null,
            'fotoUrl' => urlHttp($p['image_url'] ?? null),
            'nacionalidade' => isset($p['nationality']) ? (string) $p['nationality'] : null,
        ];
    }
    return $resumo + ['slug' => isset($t['slug']) ? (string) $t['slug'] : null, 'jogadores' => $jogadores];
}

// "Série" da PandaScore = uma edição de um campeonato (ex.: um Masters, um Champions) -> "evento" no site.
function esportsMapearSerie(array $s): array
{
    $inicio = esportsIso($s['begin_at'] ?? null);
    $fim = esportsIso($s['end_at'] ?? null);
    $agora = time();
    if ($inicio !== null && strtotime($inicio) > $agora) {
        $status = 'proximo';
    } elseif ($fim !== null && strtotime($fim) < $agora) {
        $status = 'encerrado';
    } else {
        $status = 'em_andamento';
    }

    $liga = null;
    if (isset($s['league']) && is_array($s['league'])) {
        $liga = [
            'id' => esportsIdOuNull($s['league']['id'] ?? null),
            'nome' => (string) ($s['league']['name'] ?? ''),
            'slug' => isset($s['league']['slug']) ? (string) $s['league']['slug'] : null,
            'imagemUrl' => urlHttp($s['league']['image_url'] ?? null),
        ];
    }
    return [
        'id' => esportsIdOuNull($s['id'] ?? null),
        'nome' => (string) ($s['full_name'] ?? $s['name'] ?? ''),
        'temporada' => isset($s['season']) ? (string) $s['season'] : null,
        'ano' => isset($s['year']) ? (int) $s['year'] : null,
        'inicioEm' => $inicio,
        'fimEm' => $fim,
        'status' => $status,
        'liga' => $liga,
        'vencedorId' => esportsIdOuNull($s['winner_id'] ?? null),
    ];
}

// Limite de chamadas por hora à API (a cota grátis é 1000/h; deixamos folga).
function esportsOrcamentoOk(PDO $pdo): bool
{
    $limite = (int) valorEnv('ESPORTS_ORCAMENTO_HORA', 700);
    $janela = gmdate('YmdH');
    consultar(
        $pdo,
        'INSERT INTO limite_uso (chave, janela, usos) VALUES (:c, :j, 1) ON DUPLICATE KEY UPDATE usos = usos + 1',
        [':c' => 'pandascore', ':j' => $janela]
    );
    $usos = (int) consultar($pdo, 'SELECT usos FROM limite_uso WHERE chave = :c AND janela = :j', [':c' => 'pandascore', ':j' => $janela])->fetchColumn();
    if (random_int(1, 50) === 1) {
        consultar($pdo, 'DELETE FROM limite_uso WHERE janela < :antiga', [':antiga' => gmdate('YmdH', time() - 7200)]);
    }
    return $usos <= $limite;
}

function esportsResposta(array $payload, string $buscadoEm, bool $desatualizado, int $pagina, int $porPagina): array
{
    $itens = $payload['itens'] ?? [];
    $total = $payload['total'] ?? null;
    $temMais = $total !== null ? ($pagina * $porPagina < $total) : (count($itens) >= $porPagina);
    return [
        'itens' => $itens,
        'meta' => [
            'pagina' => $pagina,
            'porPagina' => $porPagina,
            'total' => $total,
            'hasMore' => $temMais,
            'desatualizado' => $desatualizado,
            'atualizadoEm' => dataIso($buscadoEm),
        ],
    ];
}

// Busca na API (ou no cache). $mapear transforma a lista da PandaScore no formato do site.
function esportsConsultar(PDO $pdo, string $caminho, array $query, int $ttlSeg, callable $mapear, int $pagina, int $porPagina): array
{
    $token = (string) valorEnv('PANDASCORE_TOKEN', '');
    if ($token === '') {
        responderErro('E-Sports indisponível: configure PANDASCORE_TOKEN no api/env.php', 503);
    }

    $chave = sha1($caminho . '?' . http_build_query($query));
    $agora = agoraUtc();

    $linha = consultar($pdo, 'SELECT corpo, buscado_em, expira_em FROM cache_externo WHERE chave = :c', [':c' => $chave])->fetch();
    $antigo = null;
    if ($linha && $linha['corpo'] !== '') {
        $decodificado = json_decode($linha['corpo'], true);
        if (is_array($decodificado) && isset($decodificado['itens'])) {
            $antigo = $decodificado;
        }
    }

    // 1) cache ainda válido
    if ($antigo !== null && $linha['expira_em'] > $agora) {
        return esportsResposta($antigo, $linha['buscado_em'], false, $pagina, $porPagina);
    }

    // 2) precisa atualizar: só uma requisição por vez chama a API (as outras usam o cache antigo)
    $ate = gmdate('Y-m-d H:i:s', time() + 20);
    if ($linha) {
        $reservou = consultar(
            $pdo,
            'UPDATE cache_externo SET refresh_ate = :ate WHERE chave = :c AND (refresh_ate IS NULL OR refresh_ate <= :agora)',
            [':ate' => $ate, ':c' => $chave, ':agora' => $agora]
        )->rowCount() === 1;
    } else {
        $reservou = consultar(
            $pdo,
            "INSERT IGNORE INTO cache_externo (chave, caminho, corpo, buscado_em, expira_em, refresh_ate)
             VALUES (:c, :p, '', :agora, '1970-01-01 00:00:01', :ate)",
            [':c' => $chave, ':p' => cortarChars($caminho, 250), ':agora' => $agora, ':ate' => $ate]
        )->rowCount() === 1;
    }
    // Outra requisição pode ter terminado a atualização entre a leitura acima e a reserva: confere de novo.
    if ($reservou && $linha) {
        $nova = consultar($pdo, 'SELECT corpo, buscado_em, expira_em FROM cache_externo WHERE chave = :c', [':c' => $chave])->fetch();
        if ($nova && $nova['corpo'] !== '' && $nova['expira_em'] > $agora) {
            $recente = json_decode($nova['corpo'], true);
            if (is_array($recente) && isset($recente['itens'])) {
                consultar($pdo, 'UPDATE cache_externo SET refresh_ate = NULL WHERE chave = :c', [':c' => $chave]);
                return esportsResposta($recente, $nova['buscado_em'], false, $pagina, $porPagina);
            }
        }
    }
    $usarAntigo = function (string $motivo) use ($antigo, $linha, $pagina, $porPagina) {
        error_log('[ProLobby][e-sports] usando cache antigo: ' . $motivo);
        return esportsResposta($antigo, $linha['buscado_em'], true, $pagina, $porPagina);
    };
    if (!$reservou && $antigo !== null) {
        return $usarAntigo('outra requisição já está atualizando');
    }

    // 3) chama a API externa
    if (!esportsOrcamentoOk($pdo)) {
        if ($antigo !== null) {
            return $usarAntigo('limite por hora atingido');
        }
        responderErro('Limite de consultas à API de e-sports atingido. Tente de novo em alguns minutos.', 429);
    }

    $base = rtrim((string) valorEnv('ESPORTS_API_BASE', 'https://api.pandascore.co'), '/');
    $resposta = httpBaixar([
        0 => [
            'url' => $base . $caminho . '?' . http_build_query($query),
            'cabecalhos' => ['Authorization: Bearer ' . $token, 'Accept: application/json'],
        ],
    ], 10)[0];

    $mensagem = null;
    $status = 502;
    if ($resposta['erro'] !== null) {
        $mensagem = 'Falha de conexão com a API: ' . $resposta['erro'];
    } elseif ($resposta['codigo'] === 401 || $resposta['codigo'] === 403) {
        $mensagem = 'A API recusou o token (HTTP ' . $resposta['codigo'] . '). Confira PANDASCORE_TOKEN';
        $status = 503;
    } elseif ($resposta['codigo'] === 429) {
        $mensagem = 'A API de e-sports devolveu 429 (limite de requisições)';
    } elseif ($resposta['codigo'] < 200 || $resposta['codigo'] >= 300) {
        $mensagem = 'A API de e-sports respondeu HTTP ' . $resposta['codigo'];
    }

    $itens = null;
    if ($mensagem === null) {
        $dados = json_decode($resposta['corpo'], true);
        $ehLista = is_array($dados) && ($dados === [] || array_keys($dados) === range(0, count($dados) - 1));
        if (!$ehLista) {
            $mensagem = 'Resposta inesperada da API de e-sports';
        } else {
            try {
                $itens = [];
                foreach ($dados as $bruto) {
                    if (is_array($bruto)) {
                        $itens[] = $mapear($bruto);
                    }
                }
            } catch (Throwable $e) {
                $mensagem = 'Não foi possível interpretar a resposta da API (' . $e->getMessage() . ')';
                $itens = null;
            }
        }
    }

    if ($mensagem !== null) {
        if ($antigo !== null) {
            return $usarAntigo($mensagem);
        }
        error_log('[ProLobby][e-sports] ' . $mensagem);
        responderErro('Não foi possível consultar a API de e-sports agora. Tente de novo em instantes.', $status);
    }

    $total = isset($resposta['cabecalhos']['x-total']) && ctype_digit($resposta['cabecalhos']['x-total'])
        ? (int) $resposta['cabecalhos']['x-total'] : null;
    $payload = ['itens' => $itens, 'total' => $total];

    consultar(
        $pdo,
        'INSERT INTO cache_externo (chave, caminho, corpo, buscado_em, expira_em, refresh_ate)
         VALUES (:c, :p, :corpo, :agora, :expira, NULL)
         ON DUPLICATE KEY UPDATE caminho = VALUES(caminho), corpo = VALUES(corpo), buscado_em = VALUES(buscado_em),
                                 expira_em = VALUES(expira_em), refresh_ate = NULL',
        [
            ':c' => $chave,
            ':p' => cortarChars($caminho, 250),
            ':corpo' => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE),
            ':agora' => $agora,
            ':expira' => gmdate('Y-m-d H:i:s', time() + $ttlSeg),
        ]
    );
    if (random_int(1, 30) === 1) { // faxina do cache antigo
        consultar($pdo, 'DELETE FROM cache_externo WHERE buscado_em < :limite', [':limite' => gmdate('Y-m-d H:i:s', time() - 7 * 86400)]);
    }

    return esportsResposta($payload, $agora, false, $pagina, $porPagina);
}
