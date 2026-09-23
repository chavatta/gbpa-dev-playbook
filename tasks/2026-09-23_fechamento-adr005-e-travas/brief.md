# Brief — 2026-09-23_fechamento-adr005-e-travas

**Criado por:** Orchestrator
**Data:** 2026-09-23
**Complexidade:** complexa — ~30 arquivos, mas quase tudo documentação; o risco está em três arquivos de trava (patches) e no script do fluxo
**Sensível (security gate):** sim — mexe nas travas mecânicas (patches de hook/settings) e no script que devolve `done` (infra/pipeline do próprio processo)
**Classe de dado:** Interna — documentação e código do próprio playbook; nenhum dado de cliente ou pessoal entra no contexto
**Avaliação de impacto de IA:** não — nada aqui entrega decisão ou conteúdo de IA a usuário final
**Fluxo escolhido:** manual — Orchestrator → Coder (2 em paralelo, arquivos disjuntos) → Security-SRE ∥ Reviewer. O Workflow `gbpa-task` é justamente parte do que está em revisão, e o piloto dele é pendência do Tech Lead (registrado no run-log)

## Objetivo (verificável)
Levar o PR #6 (ADR-005) a um estado mergeável e fechar tudo o que ficou aberto desde o PR #5 que não dependa de mão humana: os falsos positivos da trava de git com patch testado, a proteção do script do fluxo, as inconsistências entre `GOVERNANCE.md`, decisões registradas e demais documentos, e os achados em backlog das rodadas anteriores.

## Escopo
- Dentro:
  - `docs/patches/`: nova versão de `block-dangerous-git.mjs` (FPs do item 5 + FP de verbo/caminho em comandos diferentes + bypasses achados), `check-reviewer-gate.mjs` (veredito na primeira linha de fato), `protect-guardrails.mjs` e `settings.proposto.json` (proteger `.claude/workflows/` e `.claude/agents/`; negar leitura de `.env*`), `GOVERNANCE.proposto.md` consolidado (ADR-005, §2.6 transição, cabeçalho, §5.4, §6.2) — cada um com suíte de payloads.
  - `.claude/workflows/gbpa-task.js` e `.claude/skills/task/SKILL.md`: fail-closed no refutador cego e em lente ausente; dono dos testes na rodada 2; brief atualizado quando o recon eleva a sensibilidade.
  - Consistência: `README`, `ONBOARDING`, `DESENVOLVIMENTO-COM-IA`, `PENDENCIAS`, `EVIDENCIAS` §4, `ISO-MAPPING`, ADR-001/002/005, `PROPOSTA`, `praticas/00` e `06`, cabeçalhos dos manuais, datas de revisão.
  - `scripts/check-pii.sh`: delimitar o padrão de celular (SUGGESTION da task 2026-08-31).
- Fora:
  - Aplicar os patches em `.claude/hooks/`, `.claude/settings.json`, `GOVERNANCE.md` — zona negada (§6.2); só o Tech Lead, à mão.
  - Confirmar a classe do plano Anthropic, preencher `COMPETENCIA.md`, replicar branch protection, piloto do `/task` — dependem de pessoa.

## Critérios de sucesso / aceitação
- [ ] Suíte de `block-dangerous-git`: versão proposta passa 100%; versão em produção falha exatamente nos casos novos (prova de que o teste distingue).
- [ ] Suíte nova de `check-reviewer-gate` e de `protect-guardrails`: proposta 100%, produção falha nos casos que o patch corrige.
- [ ] `GOVERNANCE.proposto.md` só difere do vigente nos pontos listados, e nenhum documento não-protegido contradiz o texto proposto.
- [ ] Script do fluxo: nenhum caminho devolve `done` com verificador ausente; smoke test com stub cobre os caminhos alterados.
- [ ] `check-pii.sh` deixa de casar timestamp de 13 dígitos e segue casando celular formatado e cru.
- [ ] Todos os links relativos resolvem; contagens do `ISO-MAPPING` fecham.
- [ ] `PENDENCIAS` lista, em ordem, só o que depende de pessoa, com o comando exato de aplicação dos patches.

## Contexto e constraints
- PR #6 (draft, `feat/pipeline-fluxo-nativo`) nunca passou pelo gate do playbook — sem pasta em `tasks/`. Esta task é o gate dele e das correções.
- Auditoria de consistência (subagente, read-only) em 2026-09-23 levantou 22 itens; todos cobertos no escopo acima ou registrados como pendência humana.
- Branch: `claude/practical-allen-px9mfl`, a partir de `feat/pipeline-fluxo-nativo`.

## Agentes previstos
coder (×2, arquivos disjuntos), security-sre, reviewer
