<?php
// GET /api/jogos/filtros.php -> { generos: [{nome, total}], plataformas: [{nome, total}] }
// Serve para montar os filtros do Guia de Jogos direto do que existe no banco.
require_once __DIR__ . '/../base_conteudo.php';
require_once __DIR__ . '/_comum.php';

exigirMetodo(['GET']);
$pdo = conectarBanco();

$generos = [];
foreach (consultar($pdo, 'SELECT genero, COUNT(*) AS total FROM jogos GROUP BY genero ORDER BY genero')->fetchAll() as $g) {
    $generos[] = ['nome' => $g['genero'], 'total' => (int) $g['total']];
}

$contagem = [];
foreach (consultar($pdo, 'SELECT plataformas FROM jogos')->fetchAll() as $linha) {
    foreach (listaPlataformas($linha['plataformas']) as $p) {
        $contagem[$p] = ($contagem[$p] ?? 0) + 1;
    }
}
ksort($contagem);
$plataformas = [];
foreach ($contagem as $nome => $total) {
    $plataformas[] = ['nome' => (string) $nome, 'total' => $total];
}

responderJson(['generos' => $generos, 'plataformas' => $plataformas]);
