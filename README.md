# Deadsmile Games Website 1.7.1

React e Vite. Requer Node.js 24 ou superior. Execute `npm ci`, copie `.env.example` para `.env` e configure a chave pública reCAPTCHA. `npm run dev` usa a API local na porta 5000; `npm run build` gera `dist`.

Em produção, deixe `VITE_API_URL` vazio para usar `/api` no domínio do site. `vercel.json` encaminha para `https://api-ust8.onrender.com/api`. `VITE_REALTIME_URL` pode ajustar o WebSocket, que usa o Render com ticket autenticado. Mude rewrite, CSP e URLs dos três projetos juntos se trocar o backend.

## Jogos e launcher

Detalhes de jogos reutilizam o layout de `/launcher`: título à esquerda, ícone Microsoft à direita e ações abaixo do título; em telas estreitas, as colunas se empilham. Paleta, fontes, botões e painéis são os existentes. Descrição e screenshots do cadastro permanecem. Informações extras da Store ficam no painel recolhido `game-meta`; classificação mostra somente ícone e legenda do mercado escolhido.

Jogos gratuitos publicados mostram as opções cadastradas de itch.io, Microsoft Store e download direto. O download consulta a API, sem expor configuração de download no catálogo. Jogos pagos mostram as lojas para compra, sem download direto público. Somente o campo `accessType` do cadastro determina gratuito ou pago. Um download gratuito com sessão registra o jogo na biblioteca da conta antes de entregar o link. Badges Microsoft usam o tema dark e o idioma da interface; ícones de jogos aparecem apenas quando encontrados na Microsoft Store, sem fallback de capa.

Verificação itch.io e `Play in Launcher` permanecem quando o jogo suporta instalação e o usuário possui acesso. A detecção de `deadsmile://launch?gameId=...` preserva aviso e link `/launcher`; foco/visibilidade são uma heurística, pois o navegador não confirma universalmente se o handler está instalado.

`/launcher` usa seis screenshots locais de Abby no fundo, com troca a cada cinco segundos e fade de 800 ms. Pausa, aba oculta e movimento reduzido suspendem a troca. Galeria separada, descrição, ícone e classificação do launcher vêm da Store. Badge acompanha en/pt-BR/es. Página e skeleton compartilham classes e dimensões de layout.

Sem classificação, RP é um placeholder acompanhado de aviso e “Visit esrb.org for rating information.”, sem indicar certificação. Fonte oficial: https://www.esrb.org/wp-content/uploads/2019/05/RP.svg.

## Hero, idiomas e conteúdo

O hero inicial mantém jogos em destaque, com capas nos demais jogos e vídeo `7huKuYunpPU`, trecho 0–30 segundos, para Abby. A screenshot local aparece antes do vídeo e quando o player opcional não pode carregar. O vídeo fica sem som e controles; mouse e foco não o pausam. O botão de pausa controla a reprodução. Detalhes e trailer apontam para o jogo selecionado.

YouTube controla autoplay e overlays do provedor; `controls=0` não garante remover toda identificação visual. Um fundo totalmente independente exige MP4/WebM autorizado. Nenhum vídeo é baixado do YouTube nesta entrega.

Inglês, português brasileiro e espanhol mudam toda a interface e os erros imediatamente. Textos dos jogos e newswire permanecem como cadastrados. Não há tradutor automático, Azure ou cobrança por tradução.

Newswire usa `/newswire` e `/newswire/:slug`; `/news` redireciona. Posts podem referenciar um jogo e incluir badges oficiais Microsoft no body. API e navegador sanitizam HTML. Se uma versão antiga descartou o badge de um post, ele precisa ser colado e salvo novamente. `npm run content:sync` na API sincroniza a política HTML.

O CRUD atualiza a aba imediatamente; eventos de edição e exclusão sincronizam outras sessões por WebSocket, com polling de recuperação. Validações mostram campo rejeitado e mensagem da API. Fallbacks de erro são gerados por `npm run errors:sync` na API.

## UX e privacidade

Rotas possuem skeletons próprios, shimmer arredondado e movimento reduzido. Layout usa colunas flexíveis, imagens proporcionais, quebra de texto, gaps, navegação compacta e rolagem de modais. Controles têm foco visível, Escape, contenção e retorno de foco. Administração é carregada somente para administradores.

Consentimento opcional controla o carregamento real do iframe e API YouTube; revogação desmonta o player. reCAPTCHA pede autorização separada. Cookies de sessão e CSRF são essenciais. Não há analytics opcional fictício.

Links da conta abrem a seção correta, login preserva retorno ao jogo e falha de logout mantém a sessão visível. Login, verificação de duas etapas e cadastro bloqueiam envios duplicados; respostas antigas de sessão não invalidam uma autenticação concluída. O cadastro mantém a conta sem sessão até a verificação do e-mail e valida nome de usuário e senha conforme a API. Respostas atrasadas não substituem o jogo atual em busca, wishlist e saves. Saves PICO-8 mantêm limite de 1 KiB e exportação `.p8d.txt`.

Arquivos JavaScript/CSS enviados ao navegador podem ser copiados. Minificação e ausência de source maps não são criptografia; segredos e autorização ficam no backend. A configuração Vercel inclui CSP, proteção de abas externas, cache de assets e revalidação de páginas.

## Validação e publicação

`npm test` verifica CSRF, mensagens da API, validação de campos, transporte e traduções. Builds e testes React DOM de layouts, skeletons, compra/download, consentimento, idiomas, painel Store, lightbox e CRUD foram executados.

Publique com API e launcher 1.7.1 e banco migrado até `013_game_download_links.sql`. Não publique `.env`, logs, backups ou credenciais. Chromium não executou neste ambiente; inspeção visual em navegadores/dispositivos reais, OAuth e Windows continuam necessários antes da liberação.

## Correções desta revisão

O transporte rejeita caminhos que escapem da API e respostas sem o envelope esperado. Escritas paralelas compartilham a inicialização CSRF; respostas antigas não substituem tokens novos. Um desafio de duas etapas expirado volta ao login, e a redefinição de senha bloqueia envios duplicados. Logout após uma sessão já removida conclui normalmente; falhas reais continuam visíveis. Notificações acompanham o idioma atual. O skeleton de jogo acompanha a ordem Sobre e Capturas, e saves não mantêm um jogo removido como seleção. Os 12 testes passaram, o build foi concluído e 27 rotas/abas passaram nos testes DOM.
