# Brief — 2026-09-23_executores-opus-5-5

**Criado por:** Orchestrator
**Data:** 2026-09-23
**Complexidade:** simples — troca mecânica de modelo em 8 agentes, no script do fluxo e nas tabelas de documentação
**Sensível (security gate):** não — não toca auth, dado pessoal, dinheiro, superfície externa nem pipeline
**Classe de dado:** Interna — configuração e documentação do próprio playbook
**Avaliação de impacto de IA:** não
**Fluxo escolhido:** manual (Coder → Reviewer)

## Objetivo (verificável)
Os oito agentes em Sonnet 5 (planner, coder, tester, debugger, devops, spec-writer, data-engineer, ai-engineer) passam a Opus 5.5 (`claude-opus-5-5`), com sufixo `-opus`. O ADR-001 registra a decisão e os dois custos que ela traz: cota, e Reviewer no mesmo modelo do Coder. Nenhum documento vigente designa Sonnet a um agente.

## Escopo
- Dentro: `.claude/agents/` dos oito; `agentType` do `gbpa-task.js` e o exemplo do campo `model`; smoke test; ADR-001 (segunda etapa da revisão de 2026-09-23), ADR-002 e ADR-003; tabelas de modelo do `DESENVOLVIMENTO-COM-IA`, `ONBOARDING`, `README` e `praticas/00`; exemplo do `HANDOFF-PROTOCOL`; `ARCHITECTURE`; decisão 2 do `PENDENCIAS`; datas dos oito manuais.
- Fora: Security-SRE (fica em Fable 5.1), Documenter (fica em Haiku 4.5), artifacts de tasks anteriores.

## Critérios de sucesso / aceitação
- [ ] Os oito agentes declaram `model: claude-opus-5-5`, nome `-opus` e auto-verificação esperando Opus 5.5.
- [ ] Todo `agentType` do `gbpa-task.js` existe como `name:`; smoke test 15/15.
- [ ] Toda menção a Sonnet fora de `tasks/` é histórica ou se refere ao estudo citado no `ARCHITECTURE`.
- [ ] O ADR-001 registra que a alternativa 1, antes rejeitada, foi adotada, e diz com que custo e com que mitigação.
- [ ] Links relativos resolvem.

## Contexto e constraints
Pedido do Tech Lead nesta sessão: "os do sonnet também pra opus 5.5". Vem depois da task 2026-09-23_modelo-topo-opus-5-5, já mergeada no PR #7.

## Agentes previstos
coder, reviewer
