<?php
// GET  /api/reviews/index.php?jogoId=&minhas=1&ordem=recentes|antigas|melhores|piores&pagina=&limite=
//      -> { reviews: [...], hasMore, total, resumo? }   (resumo só quando filtra por jogoId)
// POST /api/reviews/index.php  (exige login)
//      { jogoId? , jogoNome?, titulo, texto, nota (0-10), horasJogadas?, precoPago?, plataforma?, recomenda? }
//      -> { review } (201)
require_once __DIR__ . '/../base_conteudo.php';
require_once __DIR__ . '/_comum.php';

$metodo = exigirMetodo(['GET', 'POST']);
$pdo = conectarBanco();

if ($metodo === 'POST') {
    $usuario = exigirLogin($pdo);
    $corpo = lerCorpoJson();
    $campos = lerCamposReview($corpo, true);

    // Qual jogo? Pelo id do catálogo ou pelo nome (se o nome existir no catálogo, os dois são ligados).
    $jogoId = null;
    if (isset($corpo['jogoId']) && $corpo['jogoId'] !== '' && $corpo['jogoId'] !== null) {
        if (!is_numeric($corpo['jogoId'])) {
            responderErro('jogoId inválido', 400);
        }
        $jogo = consultar($pdo, 'SELECT id, titulo FROM jogos WHERE id = :id', [':id' => (int) $corpo['jogoId']])->fetch();
        if (!$jogo) {
            responderErro('Jogo não encontrado', 404);
        }
        $jogoId = (int) $jogo['id'];
        $jogoNome = $jogo['titulo'];
    } else {
        $jogoNome = limparTexto($corpo['jogoNome'] ?? '', 150);
        if (tamanhoChars($jogoNome) < 2) {
            responderErro('Informe o jogo (jogoId ou jogoNome)', 400);
        }
        $achado = consultar($pdo, 'SELECT id, titulo FROM jogos WHERE titulo = :t LIMIT 1', [':t' => $jogoNome])->fetch();
        if ($achado) {
            $jogoId = (int) $achado['id'];
            $jogoNome = $achado['titulo'];
        }
    }

    if ($jogoId !== null) {
        $ja = consultar(
            $pdo,
            'SELECT id FROM reviews WHERE usuario_id = :u AND jogo_id = :j LIMIT 1',
            [':u' => (string) $usuario['id'], ':j' => $jogoId]
        )->fetch();
        if ($ja) {
            responderErro('Você já avaliou este jogo. Edite a sua review.', 409);
        }
    }

    // Freio simples contra spam: no máximo 10 reviews por hora por usuário.
    $recentes = (int) consultar(
        $pdo,
        'SELECT COUNT(*) FROM reviews WHERE usuario_id = :u AND criado_em > :desde',
        [':u' => (string) $usuario['id'], ':desde' => gmdate('Y-m-d H:i:s', time() - 3600)]
    )->fetchColumn();
    if ($recentes >= 10) {
        responderErro('Muitas reviews em pouco tempo. Tente de novo mais tarde.', 429);
    }

    $id = gerarIdConteudo('review');
    $agora = agoraUtc();
    try {
        consultar(
            $pdo,
            'INSERT INTO reviews (id, jogo_id, jogo_nome, usuario_id, autor_nome, origem, titulo, texto, nota,
                                  horas_jogadas, preco_pago, plataforma, recomenda, criado_em, atualizado_em)
             VALUES (:id, :jogo_id, :jogo_nome, :usuario_id, NULL, :origem, :titulo, :texto, :nota,
                     :horas, :preco, :plataforma, :recomenda, :criado, :atualizado)',
            [
                ':id' => $id,
                ':jogo_id' => $jogoId,
                ':jogo_nome' => $jogoNome,
                ':usuario_id' => (string) $usuario['id'],
                ':origem' => 'usuario',
                ':titulo' => $campos['titulo'],
                ':texto' => $campos['texto'],
                ':nota' => (string) $campos['nota'],
                ':horas' => isset($campos['horas_jogadas']) ? (string) $campos['horas_jogadas'] : null,
                ':preco' => isset($campos['preco_pago']) ? (string) $campos['preco_pago'] : null,
                ':plataforma' => $campos['plataforma'] ?? null,
                ':recomenda' => $campos['recomenda'] ?? null,
                ':criado' => $agora,
                ':atualizado' => $agora,
            ]
        );
    } catch (PDOException $e) {
        if (isset($e->errorInfo[1]) && (int) $e->errorInfo[1] === 1062) {
            responderErro('Você já avaliou este jogo. Edite a sua review.', 409);
        }
        throw $e;
    }

    $linha = buscarReviewPorId($pdo, $id);
    $review = mapearReviews($pdo, [$linha], $usuario)[0];
    responderJson(['review' => $review], 201);
}

// ---------------------------------------------------------------- GET (lista)
$usuarioAtual = usuarioLogado($pdo);
[$pagina, $limite, $deslocamento] = lerPaginacao(10, 50);

$onde = ['1 = 1'];
$params = [];
$jogoId = paramIdOpcional('jogoId');
if ($jogoId !== null) {
    $onde[] = 'r.jogo_id = :jogo';
    $params[':jogo'] = $jogoId;
}
if (paramTexto('minhas', 1) === '1') {
    if ($usuarioAtual === null) {
        responderErro('Não autenticado', 401);
    }
    $onde[] = 'r.usuario_id = :usuario';
    $params[':usuario'] = (string) $usuarioAtual['id'];
}

$ordens = [
    'recentes' => 'r.criado_em DESC, r.id DESC',
    'antigas' => 'r.criado_em ASC, r.id ASC',
    'melhores' => 'r.nota DESC, r.criado_em DESC',
    'piores' => 'r.nota ASC, r.criado_em DESC',
];
$ordem = $ordens[paramTexto('ordem', 20)] ?? $ordens['recentes'];

$condicao = implode(' AND ', $onde);
$total = (int) consultar($pdo, "SELECT COUNT(*) FROM reviews r WHERE $condicao", $params)->fetchColumn();

$params[':lim'] = $limite + 1;
$params[':off'] = $deslocamento;
$linhas = consultar($pdo, REVIEWS_SELECT . " WHERE $condicao ORDER BY $ordem LIMIT :lim OFFSET :off", $params)->fetchAll();
$temMais = count($linhas) > $limite;
$linhas = array_slice($linhas, 0, $limite);

$resposta = [
    'reviews' => mapearReviews($pdo, $linhas, $usuarioAtual),
    'hasMore' => $temMais,
    'total' => $total,
];
if ($jogoId !== null) {
    $r = consultar($pdo, 'SELECT AVG(nota) AS media, COUNT(*) AS total FROM reviews WHERE jogo_id = :j', [':j' => $jogoId])->fetch();
    $resposta['resumo'] = [
        'notaMedia' => $r && $r['media'] !== null ? round((float) $r['media'], 1) : null,
        'totalReviews' => (int) ($r['total'] ?? 0),
    ];
}
responderJson($resposta);
