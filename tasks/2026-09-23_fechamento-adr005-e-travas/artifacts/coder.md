# Coder — 2026-09-23_fechamento-adr005-e-travas (parte: travas, fluxo, pendências)

**Agente:** coder (sessão principal, no papel de Coder) · **Status:** needs_review · **Próximo:** security-sre ∥ reviewer
A parte de consistência documental está em `coder-docs.md` (segundo Coder, arquivos disjuntos).

## files_changed (esta parte)

| Arquivo | Mudança |
|---|---|
| `docs/patches/block-dangerous-git.mjs` | Proposta nova: heredoc (corpo de dado sai da análise; corpo para interpretador liga modo conservador, olhando a linha inteira — `cat <<EOF \| bash` conta); quebra de linha só é separador fora de aspas (aspas desbalanceadas → comportamento anterior); token de argumento não atravessa separador; opções globais do git (`-C`, `-c`, `--git-dir`…) antes do subcomando; zona protegida por **segmento** de comando, com exceção para `cd`/`pushd` para dentro da zona; verbo mutante como palavra inteira; zona estendida a `.claude/workflows/` e `.claude/agents/` |
| `docs/patches/test-block-dangerous-git.mjs` | +37 casos (17 ALLOW, 20 BLOCK) — os 2 FPs reportados, 5 variações deles, 3 FPs novos, 3 bypasses do hook em produção, 5 da zona nova, e guardas de regressão para cada relaxamento |
| `docs/patches/check-reviewer-gate.mjs` | Regex sem flag `m` — veredito na primeira linha de fato (admite BOM e linhas em branco) |
| `docs/patches/test-check-reviewer-gate.mjs` | Novo — 14 casos com `tasks/` temporário |
| `docs/patches/protect-guardrails.mjs` | Bloqueia `.claude/workflows/` e `.claude/agents/`; `.claude/skills/` e `.claude/worktrees/` seguem livres |
| `docs/patches/test-protect-guardrails.mjs` | Novo — 22 casos |
| `docs/patches/settings.proposto.json` | +8 entradas de `deny` (Write/Edit nas pastas novas; Read de `.env`/`.env.*`), nenhuma removida |
| `docs/patches/GOVERNANCE.proposto.md` | Arquivo inteiro proposto; 7 trechos diferentes do vigente (cabeçalho, §2.6, §3.1, §3.4, §5.4, §6.2, §6.4) |
| `docs/patches/GOVERNANCE-fluxo-por-script.md` | Removido — absorvido pelo `GOVERNANCE.proposto.md` |
| `docs/patches/README.md` | Reescrito: lote pendente com prova por arquivo, passo a passo de aplicação, limites conhecidos, histórico |
| `.claude/workflows/gbpa-task.js` | Refutador cego sem retorno → `blocked` (era `done`: fail-open); lente ausente vira issue HIGH explícito para o Coder da rodada 2; Coder é dono dos testes quando o Tester não roda (trivial, rodada 2); `sensitive` e `task_id` em todo retorno via `result()` |
| `.claude/skills/task/SKILL.md` | Passo 6 grava `Sensível: sim` no brief quando o recon eleva; `blocked em refutador cego` explicado; smoke test nas armadilhas |
| `scripts/test-gbpa-task.mjs` | Novo — smoke test com `agent()` simulado, 13 cenários, todos os status de retorno |
| `scripts/check-pii.sh` | Padrões delimitados por não-dígito (SUGGESTION da task 2026-08-31) |
| `praticas/06-devsecops.md` | Descrição do check de PII alinhada ao padrão delimitado; data |
| `docs/PENDENCIAS-TECH-LEAD.md` | Aberto reordenado 1–5 (só o que depende de pessoa); item 5 antigo absorvido pelo item 2 com o diagnóstico corrigido; 4.1 como PARCIAL; "até 5 anos (desidentificado)"; status e data |
| `README.md`, `DESENVOLVIMENTO-COM-IA.md`, `docs/EVIDENCIAS-E-METRICAS.md` | Ajustes pós-`coder-docs`: descrição errada do `check-pii.sh` na árvore; "nascem vazios" contradizia o `cp -R docs`; a restrição de `Write` do Reviewer é de manual, não de ferramenta; smoke test na tabela de cadência |

## Verificação

| Prova | Proposta | Produção / versão do PR #6 |
|---|---|---|
| `test-block-dangerous-git.mjs` | 97/97 | 77/97 |
| `test-check-reviewer-gate.mjs` | 14/14 | 11/14 |
| `test-protect-guardrails.mjs` | 22/22 | 16/22 |
| `scripts/test-gbpa-task.mjs` | 13/13 | 8/13 (a versão do PR #6 devolve `done` sem refutador) |
| `check-pii.sh`, 11 cenários | timestamp 13 díg., ID 12 díg., hash, CPF cru, versão → 0; celular cru/formatado, CPF/CNPJ formatados → 1; repo → 0 | — |
| `check-reviewer-gate` proposto contra o `tasks/` real | exit 0 | — |
| Links relativos | 0 quebrados | — |
| `GOVERNANCE.proposto.md` vs vigente | 7 trechos, todos intencionais | — |

**Reprodução ao vivo:** o hook em produção bloqueou quatro comandos desta sessão, todos casos do banco novo — um `sed` sobre `docs/patches/` cujo texto citava `.claude/hooks/`; um teste que combinava `rm -f` com caminho protegido em comandos diferentes; um heredoc Python cujo corpo mencionava push de branch seguido de PR com `--base main`; e o heredoc que gravaria este próprio artifact.

## Não feito (fora do alcance de agente)

Aplicar os patches; confirmar a classe do plano; preencher `COMPETENCIA.md`; replicar branch protection; piloto do `/task`. Tudo em `PENDENCIAS-TECH-LEAD.md`, em ordem.
