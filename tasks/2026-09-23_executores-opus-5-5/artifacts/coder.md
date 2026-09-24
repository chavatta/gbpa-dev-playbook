# Coder — 2026-09-23_executores-opus-5-5

**Agente:** coder (sessão principal no papel de Coder) · **Modelo em que rodou:** `claude-opus-5-5` · **Status:** needs_review · **Próximo:** reviewer

## files_changed

| Arquivo | Mudança |
|---|---|
| `.claude/agents/{planner,coder,tester,debugger,devops,spec-writer,data-engineer,ai-engineer}.md` | `name: X-sonnet` → `X-opus`; `model: sonnet` → `claude-opus-5-5`; auto-verificação espera Opus 5.5 |
| `.claude/workflows/gbpa-task.js` | `agentType` `planner-opus`, `spec-writer-opus`, `coder-opus`, `tester-opus`; exemplo do campo `model` sem Sonnet |
| `scripts/test-gbpa-task.mjs` | Ponteiro simulado com `model: "claude-opus-5-5"` |
| `docs/ADR-001-modelos-por-agente.md` | Status; tabela (com "era sonnet"); alternativa 1 marcada como adotada em grande parte; nomenclatura e lista de `agentType`; "segunda etapa" na revisão de 2026-09-23, com os custos de cota e de gate no mesmo modelo, a mitigação e o recuo se a cota não fechar |
| `docs/ADR-002`, `docs/ADR-003` | DevOps "rodava" em Sonnet; decisão 3 do ADR-003 marcada como superada |
| `DESENVOLVIMENTO-COM-IA.md` | Parágrafo de abertura da §3 reescrito (o racional deixou de ser "eficiente na execução"); tabela |
| `ONBOARDING.md`, `README.md`, `praticas/00` | Tabela e listas de modelos |
| `multi-agents/HANDOFF-PROTOCOL.md`, `multi-agents/ARCHITECTURE.md` | Exemplos de ID; nota do estudo citado |
| `docs/PENDENCIAS-TECH-LEAD.md` | Decisão 2: todos em Opus 5.5, exceto Security-SRE e Documenter |
| `multi-agents/agents/{02,03,05,06,08,09,10,11}-*.md` | Data de revisão (a cadência é "a cada mudança de modelo") |

## Verificação

- 13 agentes: 11 em `claude-opus-5-5`, `security-sre-fable` em `claude-fable-5-1`, `documenter-haiku` em `haiku`.
- 7/7 `agentType` do script existem como `name:`; `node scripts/test-gbpa-task.mjs` → 15/15; suíte do hook → 145/145.
- Menções a Sonnet fora de `tasks/`: só registros históricos (ADR-001/002/003) e o estudo citado no `ARCHITECTURE`.
- Links relativos: 0 quebrados.

## Retrabalho — rodada 2 (achados do reviewer)

| Achado | Correção |
|---|---|
| HIGH — ADR-005:41 ainda citava `planner-sonnet`, `spec-writer-sonnet`, `coder-sonnet` e `tester-sonnet` (o grep da rodada 1 cortava a linha antes deles) | Nomes `-opus` |
| HIGH — "Consequências" positivas do ADR-001 ainda diziam "gate de review mais confiável que o código que audita" | Positivas originais tachadas como superadas; positivas desde 2026-09-23; os dois custos novos nas negativas |
| MEDIUM — "perfil balanceado" contradizia a tabela | Frase datada: perfil original e perfil desde 2026-09-23 |
| MEDIUM — mitigação punha o refutador cego "fora da família" | Só o Security-SRE é outra família; o refutador cego roda como `reviewer-opus` e protege por não ler os vereditos anteriores |
| MEDIUM — PENDENCIAS dizia "todos pelo ID completo" | O Documenter usa o alias `haiku`; só Opus e Fable estão fixados |
| LOW — racionais de sonnet nas tabelas | ADR-001: marcados como "(racional do sonnet)"; DESENVOLVIMENTO §3: reescritos para o modelo atual |
| LOW — alternativa 1 do ADR-003 sem nota | Marcada como adotada em 2026-09-23 |
| LOW — HANDOFF falava em "agentes de topo" | "Agentes em Opus e Fable" |
| LOW — recuo de cota e nota de evidência | Recuo explica por que Coder e os demais ficam; nota cita `sonnet` nos oito executores |

**Saída do grep `sonnet` (fora de `tasks/`), todas históricas ou do estudo citado:**

```
docs/ADR-002-agente-security-sre.md:27   DevOps "rodava" em Sonnet (datado)
docs/ADR-002-agente-security-sre.md:28   alternativa "Security-SRE em Sonnet" (rejeitada, registro)
docs/ADR-001-modelos-por-agente.md:13    contexto de 2026-07-31 (modelos disponíveis à época)
docs/ADR-001-modelos-por-agente.md:26-30 "era sonnet" / "(racional do sonnet)"
docs/ADR-001-modelos-por-agente.md:38    alternativa 2 "Tudo Sonnet" (rejeitada, registro)
docs/ADR-001-modelos-por-agente.md:77-81 revisão de 2026-09-23 (a própria troca, recuo, evidência antiga)
docs/ADR-003-agentes-sdd-dados-ia.md:21  decisão 3 marcada como superada
multi-agents/ARCHITECTURE.md:20          estudo citado da Anthropic
```

Smoke test 15/15; links relativos: 0 quebrados.

## Retrabalho — rodada 3 (achados do reviewer, rodada 2)

| Achado | Correção |
|---|---|
| MEDIUM — ADR-001: "o tipo que o ADR sempre pôs no topo" era falso (Debugger e os três do ADR-003 ficaram em Sonnet) | Declarado como decisão do Tech Lead; pelo critério original, os quatro seriam o segundo passo do recuo |
| MEDIUM — ADR-001: "com o ID fixado, nada muda sozinho" era falso para o Documenter (alias `haiku`) | Opus e Fable fixados; o Documenter acompanha o Haiku mais novo |
| LOW — título e frase de abertura da revisão cobriam só a primeira etapa | Título "Opus 5.5 em quase todo o time"; frase marcada como primeira etapa, com ponte para a segunda |
| LOW — racionais de Spec-Writer, Data-Engineer e AI-Engineer no DESENVOLVIMENTO §3 argumentavam por modelo menor | Reescritos para o custo de erro de cada papel |

Grep `sonnet` fora de `tasks/`: mesmas 14 ocorrências históricas da rodada 2 — esta rodada não introduziu nenhuma.
