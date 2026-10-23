# Pendências para o Tech Lead

> **Dono:** Tech Lead · **Revisão:** esvaziar conforme resolvido — pendência é dívida, não acervo · **Última revisão:** 2026-10-23

Mecanismos de harness que o playbook usa sem prova no runtime em que vão rodar, e o que fazer com eles. Cada item diz o fallback em vigor enquanto a pendência não fecha.

## ADR-009 — eficiência de contexto e cache

Validado em 2026-09-29, Claude Code **2.1.220** e **2.1.284** (CLI alinhada ao app desktop), com `node scripts/smoke-harness.mjs` (7/7 nas duas): bloqueio por `PreToolUse`, `additionalContext` de `PostToolUse` na sessão principal e em subagente (com `agent_id`/`agent_type`), Bash em background e com timeout, leitura do contexto na transcrição durante a execução, e o hook proposto `context-budget.mjs` ponta a ponta. Detalhe no ADR-009, "Verificações no harness".

| # | Pendência | Por que não foi validado | Fallback em vigor | Como fechar |
|---|---|---|---|---|
| 2 | Hooks (`PostToolUse`) disparam em agentes lançados pela ferramenta **Workflow** (`gbpa-task.js`)? | O smoke test usa subagente comum (Agent); rodar Workflow exige opt-in explícito e não foi feito nesta sessão | Mesma regra por instrução: o prompt do script traz os limiares e a regra de checkpoint | Numa `/task` real com o hook aplicado, conferir linhas em `.claude/context-budget.jsonl` com `agent_type` de agente do script (`coder-opus`, …) |
| 3 | Bash com `run_in_background` dentro de agente de **Workflow** | Idem | Prompt manda usar timeout explícito quando não houver background | Mesma `/task` real: um comando longo do Tester em background |
| 5 | Transcrições de agente de Workflow ficam em `<sessão>/subagents/` como as de subagente comum? | Idem item 2 | O relatório de custos acha a sessão principal de qualquer forma; subagentes fora do lugar esperado ficariam de fora | `node scripts/telemetria/relatorio-custos.mjs --task <id>` depois da `/task` real: os papéis do script precisam aparecer |
| 6 | Plano de medição do ADR-009 | Depende de 2–3 fatias reais | — | Medir quando houver as fatias, preencher a revisão do ADR-009, decidir se vira definitivo |

## ADR-010 — família por alias, Sonnet nos executores e Security-SRE pelo plano

| # | Pendência | Por que não foi validado | Fallback em vigor | Como fechar |
|---|---|---|---|---|
| 7 | Aplicar o patch do ADR-010 (`docs/patches/agents/`, `docs/patches/gbpa-task.js`) | Arquivos protegidos: só o Tech Lead aplica | Os agentes seguem o ADR-001 (Opus 5.5 com ID fixo) até a aplicação | `docs/patches/README.md`, linha do ADR-010 |
| 8 | `ANTHROPIC_DEFAULT_FABLE_MODEL` no `env` do `settings.local.json` muda o alias `fable` de **subagente** (frontmatter) e de agente de **Workflow** | A documentação diz que a variável controla o alias; não rodou ainda com subagente nesta versão do CLI | A autoverificação do Security-SRE bloqueia Fable em plano sem Fable incluído antes de gastar mais que um turno | Numa máquina Pro: `node scripts/plano-assinatura.mjs`, reiniciar e delegar ao `security-sre-fable` uma pergunta curta; o ponteiro tem de trazer `claude-opus-5-5` |
| 9 | `claude auth status --json` traz `subscriptionType` nas máquinas da equipe | Neste ambiente (token OAuth de sessão na nuvem) o campo não veio; há relatos de Max aparecendo como `pro` | O script pede `--plano` quando o campo falta, e o erro de detecção cai no lado barato (Opus) | Rodar o script em uma máquina Pro e uma Max e conferir a detecção |
| 10 | Piloto do Coder em Sonnet 5.5 | Depende de fatias reais (junto com a pendência 6) | Escalada para Opus em fatia de alto risco | Comparar taxa de reprovação Coder→Reviewer e custo por fatia concluída com o Coder em Opus; recuo pelo critério do ADR-010 |

## Resolvidas

| Data | Pendência | Como fechou |
|---|---|---|
| 2026-09-29 | Aplicar o patch do hook `context-budget.mjs` (com os lotes de 2026-09-23 e do ADR-008) | Aplicado pelo Tech Lead. Suítes contra `.claude/hooks/` 100%; em sessão nova, force push bloqueado, aviso de orçamento e spool de telemetria funcionando (`docs/patches/README.md`, Histórico) |
| 2026-09-29 | Correção da medição do `context-budget.mjs` (falso positivo de resultado grande) | Aplicada pelo Tech Lead; 20/20 contra `.claude/hooks/` |
| 2026-09-29 | Versão da CLI ≠ versão do app desktop | CLI alinhada ao app (2.1.284) e `scripts/smoke-harness.mjs` rodado de novo: 7/7. Repetir a cada troca de versão (`EVIDENCIAS-E-METRICAS.md` §4) |
