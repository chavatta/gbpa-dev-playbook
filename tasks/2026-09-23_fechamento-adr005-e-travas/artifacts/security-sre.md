**Veredito:** APROVADO

# Security Review (rodada 4, final): 2026-09-23_fechamento-adr005-e-travas

**Task ID:** 2026-09-23_fechamento-adr005-e-travas
**Status:** completed
**Modelo:** fable (Fable 5.1) — família confere com o agente designado (ADR-002)
**HEAD auditado:** dc2929b (mudança de código em c39b058)
**Próximo Agente:** orchestrator (Tech Lead aplica o lote; 2 MEDIUMs em backlog com dono e prazo abaixo)

---

## Sensibilidade da Entrega
Infra/pipeline do próprio processo (travas mecânicas + script que devolve `done`). Classe Interna, confere com o brief. Escopo desta rodada: só o residual da r3 (heredoc gravado por `tee`/`dd` e executado por caminho), variantes da mesma classe e falso positivo da regra nova de `executa()` ("caminho em posição de comando é execução").

## Histórico das rodadas

| Rodada | Veredito | Achado bloqueante | Estado |
|--------|----------|-------------------|--------|
| 1 | REPROVADO (4) | HIGH: `interpretador<<EOF` colado descartava o corpo do heredoc | fechado na r2 |
| 2 | REPROVADO (1) | HIGH: heredoc para `psql`/`mysql` descartava o SQL e cegava a trava de DDL | fechado na r3 |
| 3 | REPROVADO (1) | HIGH: heredoc gravado por `tee`/`dd of=` e executado por caminho absoluto descartava o corpo | fechado na r4 (regra genérica de caminho em posição de comando) |
| 4 | **APROVADO** | nenhum CRITICAL/HIGH; 2 MEDIUMs em backlog | — |

## Re-verificação do residual da r3 e variantes (execução diferencial, `scratchpad/probe6.mjs`)

| Caso | Proposta | Produção |
|------|----------|----------|
| `cat <<EOF \| tee /tmp/s … ; chmod +x /tmp/s; /tmp/s` (r3) | **BLOCK** | BLOCK |
| `dd of=/tmp/s <<EOF … ; /tmp/s` (r3) | **BLOCK** | BLOCK |
| `D=/tmp; "$D"/s` | BLOCK | BLOCK |
| `~/s` | BLOCK | BLOCK |
| `"/tmp/s"` (caminho entre aspas) | BLOCK | BLOCK |
| `time /tmp/s` · `command -p /tmp/s` · `nohup /tmp/s &` · `env -i /tmp/s` | BLOCK | BLOCK |
| `( /tmp/s )` · `true && /tmp/s` · `echo $(/tmp/s)` · `echo \| xargs /tmp/s` | BLOCK | BLOCK |
| `sudo -u x /tmp/s` | **ALLOW** | BLOCK — achado #1 |
| `timeout 5 /tmp/s` | **ALLOW** | BLOCK — achado #1 |
| Doc por heredoc em caminho absoluto, sem execução | ALLOW | ALLOW (sem FP) |
| Doc por heredoc citando comando perigoso + `git add docs/x.md` na mesma chamada | **BLOCK** | ALLOW — achado #2 (FP) |
| Idem + `npx prettier docs/x.md` · idem + `/usr/bin/git add docs/x.md` | BLOCK | ALLOW — achado #2 (FP) |

A classe "grava e roda por caminho" está fechada na forma geral: qualquer palavra com `/` em posição de comando (início, quebra de linha, `; & | (`), inclusive após `exec`/`env`/`nohup`/`sudo`/`time`/`command` com flags. Suíte 142/142 proposta · 110/142 produção, reconfirmada.

## Achados

### [MEDIUM] Wrapper com argumento não-flag antes do caminho escapa da regra de execução por caminho
**Onde:** `docs/patches/block-dangerous-git.mjs` linha 41 — prefixo `(?:(?:exec|env|nohup|sudo|time|command)\s+(?:-\S+\s+)*)*`
**Cenário:** o grupo de prefixo só consome **flags** (`-\S+`); um argumento sem hífen encerra o grupo e o caminho deixa de estar em posição de comando. `sudo -u x /tmp/s` e `timeout 5 /tmp/s` (este nem está na lista) passam na proposta e bloqueiam na produção — mesmo padrão: heredoc gravado, `chmod +x`, execução por wrapper que leva argumento. Alcance estreito (a forma geral já bloqueia; exige wrapper específico com argumento numa única chamada), por isso MEDIUM e não HIGH — enfraquece a defesa em profundidade, não a remove.
**Correção proposta:** no prefixo, aceitar qualquer token que não seja caminho depois do wrapper — `(?:(?:exec|env|nohup|sudo|doas|time|timeout|nice|ionice|command)\s+(?:[^\s/;&|()<>]+\s+)*)*` — o que cobre `sudo -u x`, `timeout 5`, `nice -n 5`, `env FOO=bar`. Adicionar `sudo -u x /tmp/s` e `timeout 5 /tmp/s` ao banco como BLOCK.
**Quem corrige:** coder · **Prazo:** antes de o Tech Lead copiar o lote para `.claude/hooks/` (a suíte de aplicação é o ponto de conferência)

### [MEDIUM] Falso positivo novo: doc gravado por heredoc e referenciado como argumento na mesma chamada
**Onde:** `docs/patches/block-dangerous-git.mjs` linhas 44–47 — regra "alvo de redirect reaparece por basename ≥2×" (introduzida em 5e07166, r3)
**Cenário:** `cat > docs/x.md <<'EOF' … EOF` seguido de `git add docs/x.md` (ou `npx prettier docs/x.md`, `cat docs/x.md`) na mesma chamada: `x.md` reaparece como **argumento**, a regra liga o modo conservador e, se o corpo do doc citar um comando perigoso (neste playbook isso é rotina — `DESENVOLVIMENTO-COM-IA.md` cita `git push origin main`), bloqueia. A produção deixa passar. Não é achado de segurança — é o tipo de FP que a task existe para eliminar, e FP em guardrail vira contorno (manual: "guardrail que gera falso positivo é contornado, e guardrail contornado não protege nada"). Com a regra genérica de caminho em posição de comando (linha 41), a regra de basename ficou redundante para o caso de segurança que a motivou (`/tmp/s` em posição de comando já é pego) e sobrou só o FP.
**Correção proposta:** restringir a reaparição à **posição de comando** (mesmo âncora da linha 41) ou remover a regra de basename, mantendo a de caminho. Adicionar ao banco como ALLOW: `cat > docs/x.md <<'EOF'\n…cita git push origin main…\nEOF\ngit add docs/x.md`.
**Quem corrige:** coder · **Prazo:** mesmo lote do achado #1

## Auditoria por Camada (só o que mudou)
- **Regra de caminho em posição de comando (`executa()` linha 41):** correta e fecha a classe; sem FP relevante isolada — o `/usr/bin/git add` após heredoc de doc é raro e cai no mesmo remédio do achado #2.
- **Regra de basename (linhas 44–47):** agora redundante para segurança e fonte do FP do achado #2.
- **Demais camadas** (workflow, protect-guardrails, check-reviewer-gate, settings, check-pii, ADR-005, secrets, supply chain): fora do escopo desta rodada; auditadas e fechadas nas rodadas 1–3, sem mudança desde então.

## Riscos Aceitos
Nenhum risco aceito por mim. Os dois MEDIUMs estão em backlog com dono (coder) e prazo (antes da aplicação do lote); nenhum exige decisão do Tech Lead — só a conferência da suíte na hora de copiar. Se o Tech Lead optar por aplicar o lote **sem** a correção do achado #1, isso é aceitação de risco residual e deve ser registrada aqui com nome e data.

## Contexto para o Próximo Agente
Gate de segurança liberado. Ordem recomendada: (1) Coder aplica as duas correções de regex em `docs/patches/block-dangerous-git.mjs` + 3 casos no banco (2 BLOCK, 1 ALLOW), roda a suíte contra proposta e produção; (2) Tech Lead aplica o lote conforme `docs/patches/README.md` → "Aplicar". Nada mais nesta entrega impede a aplicação dos patches. Payloads de todas as rodadas em `scratchpad/probe.mjs` … `probe6.mjs`.
