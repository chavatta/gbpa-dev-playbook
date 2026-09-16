# Patch — `GOVERNANCE.md` §3.1 e §6: fluxo por script (ADR-005)

> Arquivo protegido (`GOVERNANCE.md` §6.2): **só o Tech Lead aplica, à mão, fora da sessão do agente.** Racional em `docs/ADR-005-orquestracao-nativa-do-fluxo.md`. Depois de aplicar, atualize a data no cabeçalho do `GOVERNANCE.md` e registre no histórico de `docs/PENDENCIAS-TECH-LEAD.md`.

## §3.1 — substituir

**De:**

> 1. **Nenhuma implementação direta** sem passar pelo fluxo: toda task de dev não-trivial entra pelo `orchestrator`, que escala o fluxo enxuto (`Plan → Coder → Reviewer`) conforme a complexidade (`multi-agents/HANDOFF-PROTOCOL.md §6`).

**Para:**

> 1. **Nenhuma implementação direta** sem passar pelo fluxo: toda task de dev entra pela skill `/task`, que executa o script `.claude/workflows/gbpa-task.js` (`docs/ADR-005`). O script faz o reconhecimento antes de rotear, escala o fluxo enxuto (`Plan → Coder → Reviewer`) conforme a complexidade real, limita o retrabalho a duas rodadas e aplica verificação em três lentes mais refutador cego em task sensível (`multi-agents/HANDOFF-PROTOCOL.md §4, §6`). Fluxo manual só quando o Workflow estiver indisponível — e, nesse caso, registrado no `run-log.md`.

## §3.4 — acrescentar ao final do item

> O gate primário é o veredito estruturado que o script valida por schema antes de devolver `done`; o hook `check-reviewer-gate.mjs` é a segunda linha, sobre o `run-log.md`.

## §6.2 — acrescentar ao final do item

> O script `gbpa-task.js` não é trava: é o fluxo. Mas ele só devolve `done` por código, após veredito validado — alterá-lo é alterar o gate, e por isso `.claude/workflows/` entra na mesma regra de mudança de `.claude/hooks/`: em branch, com o teste de sintaxe rodado, aplicado pelo Tech Lead.

## §6.4 — acrescentar ao final do item

> Dynamic workflows precisam estar habilitados (`/config` → Dynamic workflows; plano pago). Na primeira execução de `/task` em cada máquina o Claude Code pede aprovação do workflow — escolha "não perguntar de novo para `gbpa-task` neste projeto".

## Opcional — `.claude/settings.json`

Para que `/task` não peça aprovação a cada run em sessões não-interativas, adicione a regra de permissão `Workflow(gbpa-task)` em `permissions.allow`. Não é necessário em sessão interativa.

## Verificação antes de aplicar

```bash
node -e "const s=require('fs').readFileSync('.claude/workflows/gbpa-task.js','utf8');new Function('args','agent','parallel','pipeline','phase','log','return (async()=>{'+s.replace(/^export const meta/m,'const meta')+'})()');console.log('sintaxe OK')"
```
