# Skill Backlog — {nome do projeto}

> Instanciado por projeto em `docs/skill-backlog.md`, versionado com o código.
> **Escritor único: Orchestrator** (`GOVERNANCE.md §4` — um dono por arquivo). Os demais agentes propõem candidates via artifact + campo `skill_candidates` do ponteiro; o Orchestrator consolida aqui no gate de skills.
> Regra de ouro: **candidate sem evidência não entra.** Evidência é (a) padrão declarado da casa — aponte o doc/campo que o declara — ou (b) repetição observada — aponte as tasks. Opinião ("acho que vai precisar") não é evidência.

## Ciclo de vida

`candidate` → `aprovada` (gate do Orchestrator/Tech Lead) → `autorada` (Documenter via `skill-creator`, nasce em `<projeto>/.claude/skills/`) → `arquivada` (não usada / superada — ver SKILLS-GOVERNANCE §7).
Candidate reprovado no gate **permanece** como `candidate` com a decisão anotada — reavaliação futura quando a evidência crescer.

## Backlog

| Skill proposta | Trigger previsto | Evidência (fonte) | Ocorrências | Status | Origem | Notas |
|---|---|---|---|---|---|---|
| {nome-kebab} | {"quando X", "ao fazer Y"} | {padrão declarado em `praticas/00-...md` §Z **ou** tasks `2026-xx-xx_a`, `2026-xx-xx_b`} | {n} | candidate | {agente que detectou} | {decisões de gate, links} |

## Como preencher

- **Skill proposta:** nome em kebab-case, como ficará em `.claude/skills/`.
- **Trigger previsto:** rascunho do "quando usar" — vira a `description` quando o Documenter autorar.
- **Evidência (fonte):** o que prova a necessidade. Padrão declarado cita o documento; repetição cita os `task_id`s.
- **Ocorrências:** contador da regra dos 3. Candidate que reaparece em nova task não gera linha nova — incrementa esta.
- **Status:** `candidate | aprovada | autorada | arquivada`.
- **Origem:** agente que registrou primeiro (architect, coder, tester...).
