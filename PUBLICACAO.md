# Como o site é publicado

O site (React) e a API (PHP) são publicados no InfinityFree **automaticamente**.
A cada `git push` na branch principal, o GitHub compila o site e envia tudo por FTP para a
pasta `htdocs` do InfinityFree. Ninguém precisa rodar `npm run build` nem mexer nas pastas
`dist` e `assets` do servidor. Quem faz isso é o arquivo `.github/workflows/publicar.yml`.

## Configuração (uma vez só)

1. **Dados de FTP do InfinityFree.** No painel (Client Area > sua conta de hospedagem > FTP Details),
   anote o servidor (normalmente `ftpupload.net`), o usuário (começa com `if0_`) e a senha.
2. **Segredos no GitHub.** No repositório, vá em *Settings > Secrets and variables > Actions >
   New repository secret* e crie três segredos:
   - `FTP_SERVER`: o servidor FTP
   - `FTP_USERNAME`: o usuário
   - `FTP_PASSWORD`: a senha

   Nunca coloque essas informações dentro do código.
3. **Primeira publicação.** Faça um `git push` (ou vá em *Actions > Publicar no InfinityFree >
   Run workflow*). A primeira vez demora alguns minutos, porque envia tudo.

## No dia a dia

1. Mexa no código e teste no computador com `npm run dev`.
2. `git add .`, `git commit -m "o que mudou"` e `git push`.
3. Acompanhe na aba **Actions** do GitHub: bolinha verde = publicado; vermelha = deu erro
   (clique para ver o motivo).
4. Depois de publicado, abra o site com Ctrl+Shift+R para não ver a versão antiga em cache.

## O que não vai para o servidor

- `api/env.php`: a senha do banco continua só no servidor (nunca no GitHub).
- `api/diagnostico.php` e `api/env.php.example`.

## Se algo der errado

- **Erro de login ou de conexão FTP:** confira os três segredos e se `server-dir` no workflow
  é `/htdocs/`.
- **Alguém apagou ou mudou algo na htdocs na mão:** o GitHub lembra do que já enviou (arquivo
  `.ftp-deploy-sync-state.json` na htdocs). Apague esse arquivo no servidor e rode o workflow de
  novo: ele reenvia tudo. Por isso, evite mexer em arquivos do site direto no servidor.
- **Sobras antigas em `assets` (opcional):** as próximas publicações já apagam sozinhas os arquivos
  que deixaram de existir. As sobras de antes da automação só saem se você apagar a pasta `assets`
  do servidor pouco antes da primeira publicação.
- **Servidor da chamada (opcional):** para usar um servidor PeerJS próprio, crie em *Settings >
  Secrets and variables > Actions > Variables* a variável `VITE_PEER_HOST` com o endereço (sem
  `https://`) e publique de novo.
