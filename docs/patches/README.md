# Patches em arquivos protegidos

> **Dono:** Tech Lead · **Revisão:** esvaziar conforme aplicado — patch pendente é dívida, não acervo · **Última revisão:** 2026-09-29

Arquivos que agentes não podem escrever (`GOVERNANCE.md` §6.2: `GOVERNANCE.md`, `.claude/settings.json`, `.claude/hooks/`, `.claude/workflows/`, `.claude/agents/`) chegam aqui prontos e testados, para o **Tech Lead aplicar à mão, no próprio terminal, fora da sessão do agente** — de dentro do Claude Code a própria trava bloqueia a cópia, e é para bloquear.

## Pendente

Nada. Os três lotes anteriores (travas de 2026-09-23, contrato de telemetria do ADR-008 e orçamento de contexto do ADR-009) foram aplicados em 2026-09-29 — ver "Histórico". As suítes `test-*.mjs` ficam aqui como teste de regressão das travas.

## Como aplicar um patch

Patch novo entra aqui com o arquivo proposto (`<nome>.mjs`, `<arquivo>.proposto.<ext>`), a suíte e uma tabela com destino, o que muda e a prova.

**1. Rodar as suítes** — cada uma contra a versão em produção e contra a proposta. Aplicar só se a proposta fechar 100%: caso de bloqueio falhando significa que o patch afrouxou uma trava.

```bash
node docs/patches/test-<hook>.mjs .claude/hooks/<hook>.mjs
node docs/patches/test-<hook>.mjs docs/patches/<hook>.mjs
node scripts/test-gbpa-task.mjs
```

**2. Ler os diffs de texto** — são lei, não código, e ninguém além do Tech Lead os revisa na forma final:

```bash
git diff --no-index GOVERNANCE.md docs/patches/GOVERNANCE.proposto.md
git diff --no-index .claude/settings.json docs/patches/settings.proposto.json
```

**3. Copiar** — numa branch, fora do Claude Code, para o destino da tabela do patch.

**4. Fechar o ciclo:** rodar a suíte de novo contra `.claude/hooks/` (tem de dar 100%), apagar daqui os arquivos propostos — as suítes `test-*.mjs` ficam —, registrar a linha no "Histórico" abaixo e **reiniciar as sessões do Claude Code**: hooks e `settings.json` carregam no startup. Depois de reiniciar, confira que os gates continuam disparando (peça na sessão `git push --dry-run --force origin HEAD`: tem de ser bloqueado — e, se passar, o `--dry-run` garante que nada foi enviado).

**Opcional:** para `/task` não pedir aprovação a cada execução em sessão não-interativa, acrescente `Workflow(gbpa-task)` em `permissions.allow` do `settings.json`. Em sessão interativa não é necessário.

## Limites conhecidos das travas (não corrigidos, de propósito)

- **Variável de shell esconde o caminho:** `H=.claude/hooks; cp x $H/y` passa. Casar variável exigiria interpretar shell; a trava primária é a branch protection no servidor, e o PR mostra a mudança.
- **`Read` negado não impede `cat .env`** pela ferramenta de shell. O deny cobre a ferramenta de leitura; o que protege o segredo de fato é ele não estar no disco do dev (`praticas/06`) e o `gitleaks` no CI.
- **Escrita na zona protegida por `node -e` / `perl -e` / `ruby -e`** passa (só `python3 -c` está na lista de verbos, como em produção). Incluir os três bloquearia também a *leitura* por essas vias — `node -e` lendo o `settings.json` é uso comum —, e o `protect-guardrails` e o `deny` já cobrem as ferramentas de edição.
- **Heredoc cujo corpo pode ser executado liga o modo conservador:** se o comando, fora dos corpos, tiver um interpretador, uma CLI de banco (`psql`, `mysql`, `sqlite3`…), `eval`/`xargs`/`source` ou um caminho `./…` (`python3 - <<EOF`, `psql <<EOF`, `cat <<EOF | bash`, `cat > s.sh <<EOF … ; sh s.sh`), o corpo é analisado em qualquer posição — e um script que só *mencione* `git push origin main` num comentário é bloqueado. Para gravar documentação, use a ferramenta de escrita ou `cat > arquivo.md <<EOF` num comando que não execute nada.
- **Caminho escondido por escape ou montagem:** `cp x .cla\ude/hooks/y`, verbo vindo de crase (`` `echo cp` x .claude/hooks/y ``) e `git apply` de um patch que só *dentro* toca a zona passam — mesma classe da variável de shell acima.
- **Copiar *da* zona para fora também bloqueia** (`cp .claude/hooks/x.mjs /tmp/`): o verbo e o caminho estão no mesmo comando e a trava não distingue origem de destino. Para ler, use `cat` ou a ferramenta de leitura.
- **Vários heredocs na mesma linha** têm os corpos lidos em sequência, como o shell faz; heredoc aninhado dentro de `$(…)` noutra linha é tratado como texto comum (conservador).

## Manutenção

As suítes são o teste de regressão das travas — toda mudança futura acrescenta o caso novo ao banco e roda tudo contra a versão antiga e a nova antes de aplicar. Caso que deve bloquear e caso que deve passar têm o mesmo peso: guardrail que gera falso positivo é contornado, e guardrail contornado não protege nada.

## Histórico

| Data | Patch | Suíte |
|---|---|---|
| 2026-08-04 | `check-reviewer-gate.mjs`, `block-dangerous-git.mjs`, `settings.json`, `GOVERNANCE.md` | 26 casos |
| 2026-08-31 | `block-dangerous-git.mjs` — casamento por posição de comando, ofuscação por aspas, wrappers, escrita em zona protegida via shell; `GOVERNANCE.md` §7 | 60 casos (38/45 na versão anterior) |
| 2026-09-29 | Três lotes de uma vez. **Travas (2026-09-23):** `block-dangerous-git.mjs` (falsos positivos e onze bypasses; zona protegida estendida a `.claude/workflows/` e `.claude/agents/`), `check-reviewer-gate.mjs` (veredito lido na primeira linha de fato), `protect-guardrails.mjs` (as duas pastas novas), `settings.json` (deny nas pastas novas e em `Read` de `.env`), `GOVERNANCE.md` (fluxo por script, zona protegida). **Telemetria (ADR-008):** `telemetry-emit.mjs` e as entradas dele nos 13 eventos. **Orçamento de contexto (ADR-009):** `context-budget.mjs` e a entrada dele em `PostToolUse` | Contra `.claude/hooks/` depois de copiar: block-dangerous-git 145/145, check-reviewer-gate 14/14, protect-guardrails 22/22, telemetry-emit 19/19, context-budget 17/17, `test-gbpa-task` 30/30. Em sessão nova: force push bloqueado; nota `[orçamento de contexto]` e registro em `.claude/context-budget.jsonl` com `seq 1 10000`; spool de telemetria recebendo `session.*`, `tool.*`, `prompt.submit`, `notification` |
| 2026-09-29 | `context-budget.mjs` — mede só o que o modelo lê do resultado (`stdout`/`stderr` no Bash, conteúdo no Read, nada em Write/Edit); a versão anterior contava `bashEditDiff` e o conteúdo do Write e dava falso positivo | 20/20 contra `.claude/hooks/` (17/20 na versão anterior); `scripts/smoke-harness.mjs` 7/7 |
