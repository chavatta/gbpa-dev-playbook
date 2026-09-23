# Coder — 2026-09-23_modelo-topo-opus-5-5

**Agente:** coder (sessão principal no papel de Coder) · **Modelo em que rodou:** `claude-opus-5-5` · **Status:** needs_review · **Próximo:** reviewer

## files_changed

| Arquivo | Mudança |
|---|---|
| `.claude/agents/orchestrator.md` | `model: claude-opus-5-5`; auto-verificação espera Opus 5.5 |
| `.claude/agents/architect.md`, `.claude/agents/reviewer.md` | `name: architect-opus` / `reviewer-opus`; `model: claude-opus-5-5`; auto-verificação espera Opus 5.5 |
| `.claude/agents/security-sre.md` | Segue `security-sre-fable`; `model: fable` → `claude-fable-5-1`; auto-verificação espera Fable 5.1 |
| `.claude/workflows/gbpa-task.js` | `agentType` `architect-opus`, `reviewer-opus`, `security-sre-fable`; campo `model` do ponteiro registra o ID exato |
| `docs/ADR-001-modelos-por-agente.md` | Status, contexto, tabela, alternativas e nomenclatura atualizados; nova seção "Revisão de 2026-09-23" (ID fixo em vez de alias; dois gates em famílias diferentes; o que mudou junto; reinício das sessões; evidência antiga intocada) |
| `docs/ADR-002`, `ADR-003`, `ADR-005` | Modelo do Security-SRE (Fable 5.1 fixado); nós de topo a jusante; `agentType` sufixados |
| `multi-agents/HANDOFF-PROTOCOL.md` | Campo `model` do ponteiro passa a ser o ID exato (achado LOW do review) |
| `multi-agents/ARCHITECTURE.md` | Lead em Opus 5.5 |
| `multi-agents/agents/{00,01,04,12}-*.md` | Data de revisão (a cadência é "a cada mudança de modelo") |
| `DESENVOLVIMENTO-COM-IA.md`, `ONBOARDING.md`, `README.md`, `praticas/00` | Tabelas e listas de modelo: Opus 5.5 nos três nós, Fable 5.1 no Security-SRE |
| `docs/PENDENCIAS-TECH-LEAD.md` | Decisões 2 e 4 marcadas como superadas/atualizadas, sem apagar o registro original |
| `docs/patches/test-block-dangerous-git.mjs` | Payload `sed -i s/fable/haiku/` → `s/opus/haiku/` (mesmo caso, nome atual) |

## Verificação

- 7/7 `agentType` do script existem como `name:` em `.claude/agents/`.
- `node scripts/test-gbpa-task.mjs` → 15/15; `node docs/patches/test-block-dangerous-git.mjs docs/patches/block-dangerous-git.mjs` → 145/145.
- `grep -rni fable` fora de `tasks/`: só menções datadas à troca ou ao Security-SRE.
- Nenhuma menção a "Opus 5" que não seja 5.5 (não havia nenhuma no repo antes da task).
- Links relativos: 0 quebrados.

## Retrabalho — rodada 2 (achados do reviewer + ajuste do Tech Lead)

- HIGH: segunda frase do ADR-003 §3 ainda falava em "nó Fable" e `Architect-fable`/`Reviewer-fable` — corrigida.
- MEDIUM: decisão 2 do `PENDENCIAS` se contradizia na mesma célula — texto original tachado, supersessão datada.
- MEDIUM: este artifact não existia — criado.
- LOW: campo `model` do ponteiro passa a ser o ID exato (`HANDOFF-PROTOCOL`, `gbpa-task.js`); "Mudou junto" do ADR-001 completo.
- SUGGESTION: datas de revisão dos 4 manuais afetados.
- **Tech Lead, durante o review:** "mantém o Fable 5.1 somente no agente de sec" — Security-SRE revertido para `security-sre-fable`, agora fixado em `claude-fable-5-1`; ADR-001/002/003/005, tabelas e script ajustados.
