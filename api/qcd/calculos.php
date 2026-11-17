<?php
// POST   /api/qcd/calculos.php   { jogoId?, jogoNome?, preco, horas, nota?, score? }
//        -> { calculo, salvo }   Qualquer pessoa calcula; só quem está logado tem o cálculo salvo no histórico.
// GET    /api/qcd/calculos.php?pagina=&limite=   (exige login) -> { calculos: [...], hasMore }
// DELETE /api/qcd/calculos.php?id=qcd_xxx        (exige login, só o dono) -> { ok: true }
require_once __DIR__ . '/../base_conteudo.php';

$metodo = exigirMetodo(['GET', 'POST', 'DELETE']);
$pdo = conectarBanco();

function mapearCalculo(array $l): array
{
    $faixa = calcularQcd((float) $l['preco'], (float) $l['horas']);
    return [
        'id' => $l['id'],
        'jogoId' => $l['jogo_id'] !== null ? (int) $l['jogo_id'] : null,
        'jogoNome' => $l['jogo_nome'],
        'preco' => (float) $l['preco'],
        'horas' => (float) $l['horas'],
        'nota' => $l['nota'] !== null ? (float) $l['nota'] : null,
        'score' => $l['score'] !== null ? (float) $l['score'] : null,
        'custoPorHora' => (float) $l['custo_por_hora'],
        'nivel' => $l['nivel'],
        'rotulo' => $faixa ? $faixa['rotulo'] : $l['nivel'],
        'criadoEm' => dataIso($l['criado_em']),
    ];
}

if ($metodo === 'GET') {
    $usuario = exigirLogin($pdo);
    [$pagina, $limite, $deslocamento] = lerPaginacao(10, 50);
    $linhas = consultar(
        $pdo,
        'SELECT * FROM qcd_calculos WHERE usuario_id = :u ORDER BY criado_em DESC, id DESC LIMIT :lim OFFSET :off',
        [':u' => (string) $usuario['id'], ':lim' => $limite + 1, ':off' => $deslocamento]
    )->fetchAll();
    $temMais = count($linhas) > $limite;
    $linhas = array_slice($linhas, 0, $limite);
    responderJson(['calculos' => array_map('mapearCalculo', $linhas), 'hasMore' => $temMais]);
}

if ($metodo === 'DELETE') {
    $usuario = exigirLogin($pdo);
    $id = paramTexto('id', 40);
    if (!preg_match('/^[A-Za-z0-9_]{3,40}$/', $id)) {
        responderErro('Informe o id do cálculo', 400);
    }
    $linha = consultar($pdo, 'SELECT usuario_id FROM qcd_calculos WHERE id = :id', [':id' => $id])->fetch();
    if (!$linha) {
        responderErro('Cálculo não encontrado', 404);
    }
    if ((string) $linha['usuario_id'] !== (string) $usuario['id']) {
        responderErro('Você só pode apagar os seus próprios cálculos', 403);
    }
    consultar($pdo, 'DELETE FROM qcd_calculos WHERE id = :id', [':id' => $id]);
    responderJson(['ok' => true]);
}

// ------------------------------------------------------------------ POST
$corpo = lerCorpoJson();

$preco = $corpo['preco'] ?? null;
$horas = $corpo['horas'] ?? null;
if (!is_numeric($preco) || $preco < 0 || $preco > 10000) {
    responderErro('Informe um preço válido (de 0 a 10000)', 400);
}
if (!is_numeric($horas) || $horas <= 0 || $horas > 100000) {
    responderErro('Informe as horas jogadas (maior que 0)', 400);
}
$nota = null;
if (isset($corpo['nota']) && $corpo['nota'] !== '') {
    if (!is_numeric($corpo['nota']) || $corpo['nota'] < 0 || $corpo['nota'] > 10) {
        responderErro('A nota precisa estar entre 0 e 10', 400);
    }
    $nota = round((float) $corpo['nota'], 1);
}
$score = null;
if (isset($corpo['score']) && $corpo['score'] !== '') {
    if (!is_numeric($corpo['score']) || $corpo['score'] < 0 || $corpo['score'] > 9999) {
        responderErro('Score inválido', 400);
    }
    $score = round((float) $corpo['score'], 2);
}

$jogoId = null;
$jogoNome = limparTexto($corpo['jogoNome'] ?? '', 150);
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
}
if ($jogoNome === '') {
    $jogoNome = 'Jogo sem nome';
}

$preco = round((float) $preco, 2);
$horas = round((float) $horas, 1);
$qcd = calcularQcd($preco, $horas);
if ($qcd === null) {
    responderErro('Não foi possível calcular com esses valores', 400);
}

$calculo = [
    'id' => null,
    'jogoId' => $jogoId,
    'jogoNome' => $jogoNome,
    'preco' => $preco,
    'horas' => $horas,
    'nota' => $nota,
    'score' => $score,
    'custoPorHora' => $qcd['custoPorHora'],
    'nivel' => $qcd['nivel'],
    'rotulo' => $qcd['rotulo'],
    'criadoEm' => null,
];

// Token inválido/expirado não atrapalha quem só quer calcular: apenas não salva.
$usuario = usuarioLogado($pdo);
if ($usuario === null) {
    responderJson(['calculo' => $calculo, 'salvo' => false]);
}

$id = gerarIdConteudo('qcd');
$agora = agoraUtc();
consultar(
    $pdo,
    'INSERT INTO qcd_calculos (id, usuario_id, jogo_id, jogo_nome, preco, horas, nota, custo_por_hora, nivel, score, criado_em)
     VALUES (:id, :u, :jogo, :nome, :preco, :horas, :nota, :custo, :nivel, :score, :criado)',
    [
        ':id' => $id,
        ':u' => (string) $usuario['id'],
        ':jogo' => $jogoId,
        ':nome' => $jogoNome,
        ':preco' => (string) $preco,
        ':horas' => (string) $horas,
        ':nota' => $nota !== null ? (string) $nota : null,
        ':custo' => (string) $qcd['custoPorHora'],
        ':nivel' => $qcd['nivel'],
        ':score' => $score !== null ? (string) $score : null,
        ':criado' => $agora,
    ]
);
$calculo['id'] = $id;
$calculo['criadoEm'] = dataIso($agora);
responderJson(['calculo' => $calculo, 'salvo' => true], 201);
