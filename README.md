# Deadsmile Games · Website

> Frontend oficial da Deadsmile Games.

| Item | Configuração |
| --- | --- |
| Stack | React · React Router · Vite |
| Produção | `https://deadsmilegames.vercel.app` |
| API | `https://deadsmile.vercel.app/api` |
| Deploy | Vercel |

## Integração

O site consome a API com `credentials: include`, inicializa CSRF antes de métodos de escrita e nunca trata o estado do navegador como autoridade. Login, 2FA, conta, itch.io, entitlement, wishlist, cloud saves, administração, status e realtime são confirmados novamente pelo backend.

Cloud saves usam o mesmo contrato do launcher: usuário autenticado, jogo, slot, revisão e SHA-256 calculado no servidor. O perfil expõe atividade pública sem dar ao frontend acesso a dados privados de outro usuário.

## Segurança do cliente

URLs externas e mídias passam por validadores antes de navegação ou renderização. URLs com credenciais, protocolos inseguros, hosts falsos e caminhos protocol-relative são rejeitadas. O projeto não usa `dangerouslySetInnerHTML`, `eval` ou execução dinâmica de JavaScript.

O `vercel.json` aplica CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` e proteção contra framing. A API de produção só é aceita por HTTPS; a configuração também rejeita credenciais, query string e fragmento dentro de `VITE_API_URL`.

## Realtime

O site tenta `wss://deadsmile.vercel.app/api/live`, usa ticket quando autenticado e reconecta com backoff. Em paralelo, `/platform/events` é consultado com cursor persistido em `sessionStorage`, evitando depender exclusivamente do WebSocket.

## Produção

```bash
npm ci
npm audit
npm run build
```

Depois valide cadastro com reCAPTCHA, login/logout, 2FA, recuperação de senha, conta, itch.io, wishlist, cloud saves, catálogo, notícias, vídeos, downloads, suporte, status, pesquisa, administração e realtime.

O `.env` deste snapshot foi preservado sem alteração durante a revisão.
