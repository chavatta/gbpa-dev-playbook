**Veredito:** APROVADO

# Code Review (3ª rodada): Pendências ISO — competência, runbook, PII e campos 🔒

**Task ID:** 2026-08-31_pendencias-iso
**Status:** completed
**Próximo Agente:** orchestrator

---

## Sumário

Terceira rodada, escopo limitado ao `ISO-MAPPING` conforme combinado na 2ª. O único bloqueante restante foi corrigido e conferido mecanicamente: o resumo 27001 agora fecha com a tabela (25 OK · 9 PARCIAL · 0 LACUNA · 6 ORG = 40 controles), e a raiz do off-by-one — o `**OK**` em negrito da A.8.25, que escapava de contagem por token — foi normalizada em vez de apenas contornada. Nenhuma outra mudança de conteúdo entrou desde a 2ª rodada. Task pronta para o fechamento do Orchestrator.

**Contagem de Issues:**
- 🔴 CRITICAL: 0 · 🟠 HIGH: 0 · 🟡 MEDIUM: 0 · 🔵 LOW: 0 · 💡 SUGGESTION: 1

---

## Verificação desta rodada

| Item | Situação | Evidência |
|---|---|---|
| Resumo 27001 fecha com a tabela | **Confirmado** | `docs/ISO-MAPPING.md:85` — "25 OK · 9 PARCIAL · 0 LACUNA · 6 ORG. *(40 controles; A.8.30 é OK por analogia.)*". Recontagem mecânica por coluna de status: A.5 = 10 OK / 4 PARCIAL / 2 ORG; A.6 = 0/2/1; A.8 = 15/3/3 → 25/9/6 = 40 ✓. A nota sobre a A.8.30 elimina a ambiguidade que permitiria duas leituras da soma |
| Raiz do off-by-one removida | **Confirmado** | `docs/ISO-MAPPING.md:74` — A.8.25 com `OK` plano na coluna de status. Os negritos remanescentes são os intencionais: legenda (linhas 17-18) e coluna de status da tabela de ações §4 (144, 148-150), que não entram na contagem dos resumos |
| Resumo 42001 intocado e correto | **Confirmado** | `docs/ISO-MAPPING.md:132` — 22 OK · 8 PARCIAL · 0 LACUNA · 3 ORG = 33 ✓ (reconferido pela mesma contagem) |
| Nenhuma mudança fora do combinado | **Confirmado** | O diff não-staged do repo (fora `tasks/`) contém exatamente as duas linhas acima; `praticas/06`, `PENDENCIAS-TECH-LEAD`, `RUNBOOK-INCIDENTE-IA` e `scripts/check-pii.sh` estão idênticos ao verificado na 2ª rodada (0 linhas alteradas). Escopo segue limpo: nada em `.claude/`, `GOVERNANCE.md` ou `settings.json` |
| "Branch sem commits" | **Retirado — não era achado** | O `check-reviewer-gate.mjs` condiciona o commit ao veredito deste artifact; a ordem correta do fluxo é commitar depois do gate. O LOW da rodada anterior está sem efeito |

## Estado final dos critérios de aceitação do brief

1. Campos 🔒 de IA/LLM preenchidos — **atendido** (`praticas/00:70-71`).
2. Contrato registra plano + consequência para `praticas/10` §3 — **atendido** (`praticas/00:74-89`, registro verificável, não otimista).
3. `COMPETENCIA.md` com cabeçalho e linhas por pessoa — **parcial por design**: estrutura completa; o preenchimento é declaração pessoal (cada um abre o próprio PR) e está rastreado em `PENDENCIAS` item 3 e `ISO-MAPPING` 4.6 (PARCIAL). Não-bloqueante.
4. Runbook com os 3 cenários completos, decisor e prazo em cada um — **atendido** (2ª rodada; `RUNBOOK-INCIDENTE-IA.md:34-45, 67, 85`).
5. Check de PII executável e somatório ao `gitleaks` — **atendido e testado** (4 cenários na 2ª rodada: prune de `node_modules`/`.git`, binário ignorado por `-I`, positivo → 1, repo limpo → 0).
6. Binários removidos sem referência órfã — **atendido**.
7. `ISO-MAPPING` §4 reflete 4.5/4.6/4.7 e `EVIDENCIAS` §4 lista os dois docs — **atendido**, agora com §2/§3 e resumos consistentes com o §4.
8. Links internos resolvem — **atendido**.

---

## Issue Registrado (não-bloqueante)

### [SUGGESTION] Delimitar o padrão de celular quando houver calibração real
**Arquivo:** `scripts/check-pii.sh` linha 9
**Ideia:** O padrão de celular casa qualquer sequência de 11 dígitos com 9 na terceira posição (timestamps e IDs longos podem cair) — limite já documentado honestamente na `praticas/06`. Quando a calibração por projeto acontecer, considerar delimitadores `(^|[^0-9])`/`([^0-9]|$)`.

---

## Pontos Positivos

- **Corrigir a raiz, não o número.** Normalizar o `**OK**` da A.8.25 em vez de só ajustar o resumo remove o landmine que produziria o mesmo off-by-one na próxima recontagem por token — é o tipo de correção que impede a reincidência.
- A nota "*(40 controles; A.8.30 é OK por analogia)*" torna a soma verificável sem ambiguidade — alinhada com a regra da §1 do próprio documento, de que o auditor confere sozinho.
- Disciplina de escopo nas três rodadas: cada retrabalho tocou exatamente o que o review pediu, zero regressão detectada em re-verificação.

## Checklist de Verificação
- [x] Corretude funcional (8 critérios do brief no estado final acima)
- [x] Corretude factual/técnica (contagens por script; comandos e regex testados nas rodadas anteriores)
- [x] Links internos
- [x] Consistência entre documentos (§2/§3/§4 do ISO-MAPPING + PENDENCIAS + EVIDENCIAS contam a mesma história)
- [x] Qualidade editorial na voz do repo
- [x] Escopo e zonas negadas
- [x] Segurança do diff

## Contexto para o Próximo Agente

Para o Orchestrator: gate de qualidade liberado nesta 3ª rodada; o gate de segurança já tinha sido liberado pelo security-sre na re-verificação de 15:45. Com os dois artifacts em ordem, o fluxo segue: commits na `feat/pendencias-iso-competencia-runbook` (o hook agora permite), PR contra `main` e marcação de `done` no run-log. Ficam vivos fora desta task: `PENDENCIAS` item 1 (classe do plano — prioridade máxima, decisão do Tech Lead), item 3 (preenchimento do `COMPETENCIA.md`, começando pelo Tech Lead) e a SUGGESTION do regex de celular para a calibração futura.
