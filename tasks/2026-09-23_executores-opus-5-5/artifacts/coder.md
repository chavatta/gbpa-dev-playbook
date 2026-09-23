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
