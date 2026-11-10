<?php
// GET /api/jogos/index.php  — lista o catálogo (Guia de Jogos)
//   ?busca=&genero=&plataforma=&destaque=1&ordem=titulo|recentes|antigos|nota|qcd|preco&pagina=&limite=
//   -> { jogos: [...], hasMore, total }
require_once __DIR__ . '/../base_conteudo.php';
require_once __DIR__ . '/_comum.php';

exigirMetodo(['GET']);
$pdo = conectarBanco();
[$pagina, $limite, $deslocamento] = lerPaginacao(12, 50);

$onde = ['1 = 1'];
$params = [];

$genero = paramTexto('genero', 40);
if ($genero !== '') {
    $onde[] = 'j.genero = :genero';
    $params[':genero'] = $genero;
}
$plataforma = paramTexto('plataforma', 30);
if ($plataforma !== '') {
    $onde[] = 'FIND_IN_SET(:plataforma, j.plataformas) > 0';
    $params[':plataforma'] = $plataforma;
}
if (paramTexto('destaque', 1) === '1') {
    $onde[] = 'j.destaque = 1';
}
$busca = paramTexto('busca', 60);
if (tamanhoChars($busca) >= 2) {
    $like = '%' . escaparLike($busca) . '%';
    $onde[] = "(j.titulo LIKE :b1 ESCAPE '!' OR j.desenvolvedora LIKE :b2 ESCAPE '!' OR j.descricao LIKE :b3 ESCAPE '!')";
    $params[':b1'] = $like;
    $params[':b2'] = $like;
    $params[':b3'] = $like;
}

$ordens = [
    'titulo' => 'j.titulo ASC',
    'recentes' => 'j.ano_lancamento DESC, j.titulo ASC',
    'antigos' => 'j.ano_lancamento ASC, j.titulo ASC',
    'nota' => 'r.nota_media DESC, r.total_reviews DESC, j.titulo ASC',
    'preco' => 'j.preco_atual ASC, j.titulo ASC',
    // melhor custo-benefício primeiro; jogos sem preço/horas vão para o fim
    'qcd' => '(j.preco_atual IS NULL OR j.preco_atual = 0 OR j.horas_principal IS NULL OR j.horas_principal = 0) ASC,
              (j.preco_atual / j.horas_principal) ASC, j.titulo ASC',
];
$ordem = $ordens[paramTexto('ordem', 20)] ?? $ordens['titulo'];

$condicao = implode(' AND ', $onde);
$total = (int) consultar($pdo, "SELECT COUNT(*) FROM jogos j WHERE $condicao", $params)->fetchColumn();

$params[':lim'] = $limite + 1; // um a mais só para saber se existe próxima página
$params[':off'] = $deslocamento;
$linhas = consultar($pdo, JOGOS_SELECT . " WHERE $condicao ORDER BY $ordem LIMIT :lim OFFSET :off", $params)->fetchAll();

$temMais = count($linhas) > $limite;
$linhas = array_slice($linhas, 0, $limite);

responderJson([
    'jogos' => array_map('mapearJogo', $linhas),
    'hasMore' => $temMais,
    'total' => $total,
]);
