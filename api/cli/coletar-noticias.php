<?php
// Coleta as notícias pela linha de comando (útil no XAMPP ou em hospedagem com cron).
//   php api/cli/coletar-noticias.php            -> respeita o intervalo mínimo
//   php api/cli/coletar-noticias.php --forcar   -> ignora intervalo e pausas por erro
if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('Somente pela linha de comando');
}
require __DIR__ . '/../base_conteudo.php';
require __DIR__ . '/../noticias/_coletor.php';

$pdo = conectarBanco();
$forcar = in_array('--forcar', $argv, true);
$intervalo = $forcar ? 0 : max(1, (int) valorEnv('NOTICIAS_INTERVALO_MIN', 30)) * 60;

if (!reivindicarExecucao($pdo, 'noticias', $intervalo, 120)) {
    echo "Notícias atualizadas há pouco tempo (use --forcar para coletar mesmo assim)\n";
    exit(0);
}
try {
    $r = coletarNoticias($pdo, $forcar);
} finally {
    liberarExecucao($pdo, 'noticias');
}

echo "Notícias novas: {$r['novas']} | removidas por idade: {$r['removidas']}\n";
foreach ($r['fontes'] as $f) {
    if ($f['ok']) {
        $info = 'ok, ' . ($f['novas'] ?? 0) . ' novas' . (!empty($f['naoModificado']) ? ' (feed não mudou)' : '');
    } else {
        $info = 'ERRO: ' . ($f['erro'] ?? 'desconhecido');
    }
    printf("- %-22s %s\n", $f['nome'], $info);
}
