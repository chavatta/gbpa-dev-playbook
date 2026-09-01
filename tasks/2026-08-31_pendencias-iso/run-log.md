# Run Log — 2026-08-31_pendencias-iso

Append-only. Uma linha por evento.

| timestamp        | agent        | event         | status   | ref |
|------------------|--------------|---------------|----------|-----|
| 2026-08-31 14:05 | orchestrator | task_created  | -        | brief.md |
| 2026-08-31 14:10 | orchestrator | pesquisa      | completed | Termos Comerciais e Privacy Center da Anthropic — DPA automático no comercial, ausente no consumidor |
| 2026-08-31 14:20 | coder        | started       | -        | praticas/00, praticas/06 |
| 2026-08-31 14:35 | coder        | completed     | -        | scripts/check-pii.sh validado em 3 cenários (com PII → 1, repo limpo → 0, fixtures limpas → 0) |
| 2026-08-31 14:45 | coder        | completed     | -        | docs/COMPETENCIA.md, docs/RUNBOOK-INCIDENTE-IA.md |
| 2026-08-31 14:50 | coder        | completed     | -        | binários removidos; PENDENCIAS, ISO-MAPPING e EVIDENCIAS atualizados |
| 2026-08-31 14:55 | coder        | needs_review  | -        | security-sre + reviewer |
| 2026-08-31 15:20 | security-sre | completed     | approved | artifacts/security-sre.md — APROVADO, 0 bloqueantes, 4 achados em backlog |
| 2026-08-31 15:20 | reviewer     | completed     | REPROVADO | artifacts/reviewer.md — 2 HIGH (runbook cenários 2-3 sem comunicação/prazo; ISO-MAPPING §2/§3 contradiz §4), 2 MEDIUM, 2 LOW |
| 2026-08-31 15:40 | coder        | rerouted      | -        | retrabalho: HIGH+MEDIUM+LOW do reviewer e os 4 achados do security-sre aplicados |
| 2026-08-31 15:40 | coder        | needs_review  | -        | re-review |
| 2026-08-31 15:45 | security-sre | completed     | approved | re-verificação pós-correções: 4 achados resolvidos, sem regressão; script revalidado em 4 cenários |
| 2026-08-31 16:05 | reviewer     | completed     | REPROVADO | artifacts/reviewer.md (2ª rodada) — retrabalho todo confirmado; resta 1 HIGH: resumo 27001 (ISO-MAPPING:85) diz 24 OK/39, tabela tem 25 OK/40 (contagem mecânica) |
| 2026-08-31 16:10 | coder        | rerouted      | -        | resumo 27001 → 25 OK; normalizado o `**OK**` da A.8.25 (raiz do off-by-one); bullet do `grep -I` na praticas/06 |
| 2026-08-31 16:10 | coder        | needs_review  | -        | 3º review — limitado à linha 85 do ISO-MAPPING |
| 2026-08-31 16:20 | reviewer     | completed     | APROVADO | artifacts/reviewer.md (3ª rodada) — resumo 27001 fecha com a tabela (25/9/0/6 = 40, recontado por script); raiz do off-by-one (negrito da A.8.25) removida; 42001 reconferido (22/8/3=33) |
| 2026-08-31 16:25 | orchestrator | done          | approved | ambos os gates APROVADO; run-log normalizado; commit + PR |

<!-- Eventos: started, completed, blocked, needs_review, rerouted, done -->

## Notas

**Correção durante a execução.** O check de PII nasceu com `rg -nE`, que está errado: em ripgrep `-E` é `--encoding`, não regex estendido. A primeira versão falhava com `unknown encoding`. A segunda, já com `rg -n`, funcionava mas devolvia código 2 em repo sem pasta de fixtures — que é o caso comum e não é erro. A versão final usa `find` + `grep` para não depender de `ripgrep` estar instalado no runner, e trata os três desfechos explicitamente. Testada nos três cenários antes de entrar na documentação.

**Achado que extrapola o escopo da task.** A classe do plano contratado com a Anthropic decide se a equipe pode ou não colocar código de cliente no contexto. Registrado como pendência 1 do `PENDENCIAS-TECH-LEAD` e como nota destacada no `praticas/00`; a decisão é do Tech Lead e não cabia a esta task.

**Retrabalho pós-review (15:40).** Aplicados: HIGH-1 — comunicação e prazo adicionados aos cenários 2 e 3 do runbook. HIGH-2 — os quatro controles do `ISO-MAPPING` (A.5.24–5.28 e A.8.4 → OK; A.6.3 e A.4.6 → PARCIAL com o registro criado) e os dois resumos, que estavam defasados desde antes desta task (24/9/6 e 22/8/3 conferidos por contagem). MEDIUM — razão da 4.2 e strikethrough da 4.6 corrigidos. LOW do reviewer e LOW do security-sre — `find` agora poda `.git`/`node_modules`/`vendor`/`dist`/`build` e `grep -I` ignora binário. MEDIUM do security-sre — a `praticas/06` agora diz que CPF/CNPJ só são pegos formatados (cru escapa por design; celular cru é pego); documentado o limite em vez de estender o padrão. LOW do security-sre — cenário 1 do runbook ganhou o passo de deletar a conversa no provedor **depois** de registrada a linha do tempo. Script revalidado em 6 cenários, incluindo poda de node_modules e nome de arquivo com `$(...)` (sem execução).

**Re-review (16:05).** A contagem "24/9/6 conferida" do retrabalho não confere: a tabela §2 do `ISO-MAPPING` tem 40 linhas (25 OK · 9 PARCIAL · 6 ORG); a divergência provável é a A.8.30, "OK (por analogia)". O resumo 42001 (22/8/3 = 33) está correto. Correção esperada no artifact do reviewer, opção (a) ou (b).
