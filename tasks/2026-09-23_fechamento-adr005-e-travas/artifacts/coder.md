# Coder — 2026-09-23_fechamento-adr005-e-travas (parte: travas, fluxo, pendências)

**Agente:** coder (sessão principal, no papel de Coder) · **Status:** needs_review · **Próximo:** security-sre ∥ reviewer
A parte de consistência documental está em `coder-docs.md` (segundo Coder, arquivos disjuntos).

## files_changed (esta parte)

| Arquivo | Mudança |
|---|---|
| `docs/patches/block-dangerous-git.mjs` | Proposta nova: heredoc (corpo de dado sai da análise; corpo para interpretador liga modo conservador, olhando a linha inteira — `cat <<EOF \| bash` conta); quebra de linha só é separador fora de aspas (aspas desbalanceadas → comportamento anterior); token de argumento não atravessa separador; opções globais do git (`-C`, `-c`, `--git-dir`…) antes do subcomando; zona protegida por **segmento** de comando, com exceção para `cd`/`pushd` para dentro da zona; verbo mutante como palavra inteira; zona estendida a `.claude/workflows/` e `.claude/agents/` |
| `docs/patches/test-block-dangerous-git.mjs` | +78 casos (estado final, após as três rodadas) — produção falha em 31 (15 falsos positivos, 11 bypasses, 5 da zona nova); os outros 47 são guardas de regressão, inclusive tudo o que os gates pegaram |
| `docs/patches/check-reviewer-gate.mjs` | Regex sem flag `m` — veredito na primeira linha de fato (admite BOM e linhas em branco) |
| `docs/patches/test-check-reviewer-gate.mjs` | Novo — 14 casos com `tasks/` temporário |
| `docs/patches/protect-guardrails.mjs` | Bloqueia `.claude/workflows/` e `.claude/agents/`; `.claude/skills/` e `.claude/worktrees/` seguem livres |
| `docs/patches/test-protect-guardrails.mjs` | Novo — 22 casos |
| `docs/patches/settings.proposto.json` | +8 entradas de `deny` (Write/Edit nas pastas novas; Read de `.env`/`.env.*`), nenhuma removida |
| `docs/patches/GOVERNANCE.proposto.md` | Arquivo inteiro proposto; 7 trechos diferentes do vigente (cabeçalho, §2.6, §3.1, §3.4, §5.4, §6.2, §6.4) |
| `docs/patches/GOVERNANCE-fluxo-por-script.md` | Removido — absorvido pelo `GOVERNANCE.proposto.md` |
| `docs/patches/README.md` | Reescrito: lote pendente com prova por arquivo, passo a passo de aplicação, limites conhecidos, histórico |
| `.claude/workflows/gbpa-task.js` | Refutador cego sem retorno → `blocked` (era `done`: fail-open); lente ou Reviewer sem retorno → `blocked` sem gastar rodada (estado final, rodada 2); épica sem fatias → `blocked`; Coder é dono dos testes quando o Tester não roda (trivial, rodada 2); `sensitive` e `task_id` em todo retorno via `result()` |
| `.claude/skills/task/SKILL.md` | Passo 6 grava `Sensível: sim` no brief quando o recon eleva; `blocked em refutador cego` explicado; smoke test nas armadilhas |
| `scripts/test-gbpa-task.mjs` | Novo — smoke test com `agent()` simulado, 13 cenários, todos os status de retorno |
| `scripts/check-pii.sh` | Padrões delimitados por não-dígito (SUGGESTION da task 2026-08-31) |
| `praticas/06-devsecops.md` | Descrição do check de PII alinhada ao padrão delimitado; data |
| `docs/PENDENCIAS-TECH-LEAD.md` | Aberto reordenado 1–5 (só o que depende de pessoa); item 5 antigo absorvido pelo item 2 com o diagnóstico corrigido; 4.1 como PARCIAL; "até 5 anos (desidentificado)"; status e data |
| `README.md`, `DESENVOLVIMENTO-COM-IA.md`, `docs/EVIDENCIAS-E-METRICAS.md` | Ajustes pós-`coder-docs`: descrição errada do `check-pii.sh` na árvore; "nascem vazios" contradizia o `cp -R docs`; a restrição de `Write` do Reviewer é de manual, não de ferramenta; smoke test na tabela de cadência |

## Verificação

| Prova | Proposta | Produção / versão do PR #6 |
|---|---|---|
| `test-block-dangerous-git.mjs` | 138/138 | 107/138 |
| `test-check-reviewer-gate.mjs` | 14/14 | 11/14 |
| `test-protect-guardrails.mjs` | 22/22 | 16/22 |
| `scripts/test-gbpa-task.mjs` | 15/15 | 8/15 (a versão do PR #6 devolve `done` sem refutador) |
| `check-pii.sh`, 11 cenários | timestamp 13 díg., ID 12 díg., hash, CPF cru, versão → 0; celular cru/formatado, CPF/CNPJ formatados → 1; repo → 0 | — |
| `check-reviewer-gate` proposto contra o `tasks/` real | exit 0 | — |
| Links relativos | 0 quebrados | — |
| `GOVERNANCE.proposto.md` vs vigente | 7 trechos, todos intencionais | — |

**Reprodução ao vivo:** o hook em produção bloqueou quatro comandos desta sessão, todos casos do banco novo — um `sed` sobre `docs/patches/` cujo texto citava `.claude/hooks/`; um teste que combinava `rm -f` com caminho protegido em comandos diferentes; um heredoc Python cujo corpo mencionava push de branch seguido de PR com `--base main`; e o heredoc que gravaria este próprio artifact.

## Não feito (fora do alcance de agente)

Aplicar os patches; confirmar a classe do plano; preencher `COMPETENCIA.md`; replicar branch protection; piloto do `/task`. Tudo em `PENDENCIAS-TECH-LEAD.md`, em ordem.

## Retrabalho — rodada 2 (achados do security-sre)

| Achado | Correção | Prova |
|---|---|---|
| HIGH — `interpretador<<'EOF'` sem espaço: corpo descartado como dado (regressão vs produção) | `isExec` separa palavra também em `<` e `>` | 5 casos BLOCK novos (`bash`, `sh`, `/bin/bash<<-`, `python3`, `node`), proposta bloqueia, produção também — guarda de regressão |
| MEDIUM — herestring para interpretador sem análise (proposta e produção) | `HERESTRING` liga o modo conservador, como `bash -c` | 2 casos BLOCK (com e sem espaço) que a produção deixa passar; `grep main <<< '…'` segue ALLOW |
| LOW — `node -e`/`perl -e`/`ruby -e` escrevendo na zona | Documentado em "Limites conhecidos" do `docs/patches/README.md`, com o porquê de não bloquear | — |
| LOW — prefixo `./` em `Read(./.env)` | Mantido: redundante com `Read(**/.env)`, não afrouxa | — |

Suíte após o retrabalho: proposta 106/106 · produção 83/106.

## Retrabalho — rodada 2 (achados do reviewer)

| Achado | Correção | Prova |
|---|---|---|
| HIGH-1 — split por segmento usava o `SEP` de ancoramento (`(`, `)`, `{`, `}`, crase, `$(`): verbo e caminho em segmentos diferentes, 8 payloads que a produção bloqueia passavam | Divisão em comandos por scanner próprio (`comandos()`): só `;`, `&`, `\|` no nível de cima — fora de aspas, `$(…)` e crase; aspas/`$(` desbalanceados → segmento único. Normalização de `/./` e `//` | Os 8 payloads como BLOCK + 2 guardas ALLOW (leitura em subshell) |
| (achado próprio ao corrigir o HIGH-1) — `cat > s.sh <<EOF … EOF; sh s.sh` descartava o corpo: regressão vs produção | "Executa o corpo" passa a olhar o comando inteiro fora dos corpos, incluindo `./…` e extensão de script; vários heredocs na mesma linha com corpos sequenciais | 2 BLOCK + 1 ALLOW |
| SUG-1 — outras vias de escrita na zona | `rsync` e `git checkout\|restore\|apply\|mv\|rm` entram nos verbos que mutam; `node -e` fica documentado como limite (bloquearia leitura) | 6 BLOCK + 3 ALLOW |
| MEDIUM-1 — tabelas de complexidade atrasadas | `HANDOFF §6` (o que o script executa e o que não), `ONBOARDING §4`, `00-orchestrator`, `ARCHITECTURE` alinhados: Tester em toda não-trivial, três lentes em paralelo, épica fatiada | Leitura |
| MEDIUM-2 — lente ausente gastava rodada e escalava com motivo falso | Verificador sem retorno (lente, Reviewer ou refutador) → `blocked`, sem consumir rodada; `SKILL.md` passo 6 explica | Smoke: 2 cenários novos |
| MEDIUM-3 — épica com Planner nulo devolvia `fatiada` vazia | `blocked em planner` | Smoke: 1 cenário novo |
| LOW-1 a LOW-5, SUG-2 | Referência ao item 2 das pendências; escalonamento só ao Architect; timestamp carimbado pela sessão principal; "esvazie" em vez de "nascem vazios" no `GOVERNANCE.proposto` e no `ONBOARDING`; zona nova na `SKILL.md`; "todo documento `.md`" no `EVIDENCIAS` | — |

Suítes após a rodada 2: `block-dangerous-git` 128/128 (produção 97/128) · `check-reviewer-gate` 14/14 · `protect-guardrails` 22/22 · smoke 15/15.

## Retrabalho — rodada 3 (achado do security-sre na re-auditoria + não-bloqueantes do reviewer)

| Achado | Correção | Prova |
|---|---|---|
| HIGH (security-sre r2) — heredoc para `psql`/`mysql` descartava o corpo e cegava a trava de DDL: regressão vs produção | CLIs de banco (`psql`, `mysql`, `mariadb`, `mongosh`, `sqlite3`, `sqlplus`, `sqlcmd`…) contam como consumidores que executam o corpo | 5 BLOCK (DROP/TRUNCATE, com e sem espaço, `-f -`) + 1 ALLOW (`SELECT`) |
| MEDIUM (reviewer r2) — extensão de script como executor só gerava falso positivo | `SCRIPT` reduzido a `./…`; quem roda o arquivo aparece como interpretador | 1 ALLOW (`cat > x.mjs <<EOF` citando push) |
| LOW-A/B, SUG-A/B (reviewer r2) | Maiúscula no `HANDOFF §6`; linhas 11 e 20 deste artifact; "Limites conhecidos" ganha escape/crase/`git apply` e cópia *da* zona | — |

| (achado próprio, ao reduzir `SCRIPT`) — script gravado por heredoc e executado por caminho absoluto, `$PWD/…` ou `exec` passaria a descartar o corpo | Arquivo alvo de redirect que reaparece no comando conta como possível execução — o corpo fica | 3 BLOCK |

Suítes após a rodada 3: `block-dangerous-git` 138/138 (produção 107/138) · `check-reviewer-gate` 14/14 · `protect-guardrails` 22/22 · smoke 15/15.
