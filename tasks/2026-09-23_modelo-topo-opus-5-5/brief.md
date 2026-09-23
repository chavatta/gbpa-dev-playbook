# Brief — 2026-09-23_modelo-topo-opus-5-5

**Criado por:** Orchestrator
**Data:** 2026-09-23
**Complexidade:** simples — troca mecânica de modelo em 3 agentes (e fixação de versão em 1), no script do fluxo e nas tabelas de documentação
**Sensível (security gate):** não — não toca auth, dado pessoal, dinheiro, superfície externa nem pipeline; o gate muda de modelo, não de regra
**Classe de dado:** Interna — configuração e documentação do próprio playbook
**Avaliação de impacto de IA:** não
**Fluxo escolhido:** manual (Coder → Reviewer) — correção de configuração; o `/task` depende do lote de patches pendente

## Objetivo (verificável)
Orchestrator, Architect e Reviewer passam de Fable para Opus 5.5 (`claude-opus-5-5`); o Security-SRE fica em Fable, fixado em Fable 5.1 (`claude-fable-5-1`) — ajuste do Tech Lead durante a task. Nenhum documento vigente contradiz essa designação, e não há menção a "Opus 5" que não seja 5.5.

## Escopo
- Dentro: `.claude/agents/{orchestrator,architect,reviewer}.md` (`name:`, `model:`, auto-verificação) e `security-sre.md` (`model:` fixado, auto-verificação); `agentType` do `gbpa-task.js`; ADR-001 (revisão registrada), ADR-002/003/005; tabelas de modelo do `DESENVOLVIMENTO-COM-IA`, `ONBOARDING`, `README`, `praticas/00`; `HANDOFF-PROTOCOL` (valores do campo `model`); `ARCHITECTURE`; decisões 2 e 4 do `PENDENCIAS`.
- Fora: artifacts de tasks anteriores (evidência do modelo em que de fato rodaram); agentes Sonnet e Haiku.

## Critérios de sucesso / aceitação
- [ ] Orchestrator, Architect e Reviewer declaram `model: claude-opus-5-5`, com nome `-opus` (o orchestrator sem sufixo) e auto-verificação esperando Opus 5.5; o Security-SRE declara `model: claude-fable-5-1`, segue `security-sre-fable` e espera Fable 5.1.
- [ ] Todo `agentType` do `gbpa-task.js` existe como `name:` em `.claude/agents/`; smoke test 15/15.
- [ ] Toda menção a Fable fora de `tasks/` é histórica (datada) ou se refere ao Security-SRE.
- [ ] Nenhuma menção a "Opus 5" que não seja 5.5.
- [ ] Links relativos resolvem.

## Contexto e constraints
Pedido direto do usuário (Tech Lead) nesta sessão: "alterar tudo que for modelo fable para Opus 5.5, e o que for Opus 5 também"; depois, durante o review: "mantém o Fable 5.1 somente no agente de sec". Não havia menção a Opus 5 no repo. `.claude/agents/` ainda não é zona protegida (o patch que a protege está pendente), e a mudança é do Tech Lead, que a pediu.

## Agentes previstos
coder, reviewer
