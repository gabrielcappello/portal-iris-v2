<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Convenções e pegadinhas do projeto (aprendidas doendo)

## Acesso a dados
- A maior parte do painel usa `sb` (lib/supabase.ts) com a **chave anon** + RLS `allow_all`, filtrando por `clinica_id`. Pacientes, agendamentos, clínicas, financeiro/orçamento seguem esse padrão.
- **Odontograma é exceção:** vai por um **proxy server-side** (`/api/odontograma`) com a **chave secreta** (`SUPABASE_SECRET || SUPABASE_SERVICE_KEY`), header `apikey` + `Authorization: Bearer`. Chave secreta NUNCA no bundle do browser.
- **Toda tabela nova criada por migration precisa de GRANT:** `grant select,insert,update,delete on <tabela> to anon, authenticated;` — senão dá `permission denied for table X` (RLS allow_all não basta; falta privilégio de tabela).
- Tipos do banco: `src/lib/database.types.ts` é **gerado** (MCP generate_typescript_types). Não editar à mão; regerar quando o schema mudar. Preferir esses tipos a escrever à mão (evita drift tipo `origem`→`origem_tipo`, `eventos`≠`observacoes`).

## Build / CI / lint
- `next build` (Next 16) **type-checka** e é o portão real (CI roda ele). NÃO roda ESLint no build por padrão.
- Dívida de lint tolerada e que **não bloqueia** deploy: `react-hooks/set-state-in-effect` (vários `useEffect` antigos). Ao adicionar um novo, suprimir com `// eslint-disable-next-line react-hooks/set-state-in-effect` em vez de refatorar.
- Aviso `LF will be replaced by CRLF` no `git add` é normal no Windows — ignorar.

## Deploy / fluxo
- `main` → Vercel (`painel.cappia.app`). Preferir **branch + PR** (Vercel gera preview) para poder testar antes de ir a produção.
- Odontograma/financeiro só funcionam com a env do service key (não roda local sem `.env.local`).
