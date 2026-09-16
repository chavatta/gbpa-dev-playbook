# Proposta — pipeline do fluxo de desenvolvimento

> **Status:** em implementação — `docs/ADR-005`, branch `feat/pipeline-fluxo-nativo`. O que ainda depende do Tech Lead: o patch do `GOVERNANCE.md` (`docs/patches/`) e o piloto.
> **Dono:** Tech Lead · **Última revisão:** 2026-09-01

---

## ⏱️ Em 30 segundos

- **O problema:** o fluxo de agentes é uma fila. Decide cedo demais, não sabe parar de repetir, e confia num revisor só.
- **A solução:** 5 mudanças pequenas. As duas primeiras são só texto.
- **Como fazer:** com a orquestração nativa do Claude Code (`Workflow`). Continua na assinatura. Sem LangGraph no processo.

---

## 🔴 O que está errado hoje

Cada item é um problema. Um por linha.

1. **Decide antes de olhar.** O Orchestrator escolhe quantos agentes rodar **antes** de alguém ler o código.
2. **Repete sem limite.** Reviewer reprova → Coder tenta de novo. E de novo. Ninguém diz quando parar.
3. **Um juiz, sem conferência.** Um único review decide. E o Orchestrator é proibido de checar.
4. **Reviewer faz 3 trabalhos em fila.** Correção, segurança e performance, um atrás do outro, sozinho.
5. **"Épica" não tem regra.** Diz só "todos os agentes, em ciclos". Isso não é um fluxo.

---

## 🟢 As 5 mudanças

### P1 · Olhar antes de decidir
🎯 **O quê:** um passo rápido de reconhecimento antes de escolher o fluxo.
💡 **Por quê:** a decisão mais cara passa a ser feita com informação real.
⚙️ **Custo:** uma chamada barata por task.

### P2 · Limite de repetições
🎯 **O quê:** reprovou 1× → volta ao Coder. Reprovou 2× → sobe pro Architect. 3× → Tech Lead.
💡 **Por quê:** duas reprovações seguidas quase nunca são culpa do Coder. É spec ruim ou task grande.
⚙️ **Custo:** três linhas de texto.

### P3 · Rigor só onde dói
🎯 **O quê:** task **sensível** (auth, dados pessoais, dinheiro) → 3 revisores em paralelo. Task normal → 1 revisor, como hoje.
💡 **Por quê:** o flag "sensível" já existe no brief. Hoje ele só adiciona um agente na fila. Deveria mudar a **forma** da revisão.
⚙️ **Custo:** mais tokens, só nas sensíveis.

### P4 · Revisores em paralelo, não em fila
🎯 **O quê:** Reviewer, Security-SRE e Tester olham o mesmo diff **ao mesmo tempo**.
💡 **Por quê:** hoje o Security-SRE lê depois de um "APROVADO" já escrito. Isso vicia o olhar.
⚙️ **Custo:** nenhum extra além do P3.

### P5 · Definir "Épica"
🎯 **O quê:** épica = várias tasks normais, uma por fatia. Ou apagar a linha.
💡 **Por quê:** regra vaga vira improviso. Improviso não deixa evidência.
⚙️ **Custo:** zero.

---

## 📋 Em que ordem

1. **P2 e P5** — só texto. Podem entrar hoje.
2. **P1** — a de maior retorno. Primeira decisão real.
3. **P3 e P4** — mexem no gate. Esperar o fluxo rodar **uma vez** num projeto piloto antes.

---

## ⚙️ Como fica na prática

Tudo vira um script dentro do Claude Code (`Workflow`), disparado pelo dev com `/task <nome>`.

```
/task minha-feature
   │
   ▼
 recon (Architect, rápido)  ──► "é trivial? é sensível? quais arquivos?"
   │
   ▼
 plan (se não for trivial)
   │
   ▼
 coder ──► review ──► reprovou? volta (máx. 2×) ──► ainda não? escala
   │
   ▼
 sensível? ──► 3 revisores em paralelo + 1 refutador cego
   │
   ▼
 done (só se o veredito validado disser APROVADO)
```

O que continua igual: agentes, hooks, travas, `tasks/{id}/artifacts/`. Nada é jogado fora.

---

## ❓ 3 decisões que faltam (Tech Lead)

| Pergunta | Recomendação |
|---|---|
| **Quem faz o recon?** | Architect em "modo levantamento". Sem agente novo. |
| **O que dispara o rigor extra?** | Flag do brief **ou** resultado do recon. Nunca tamanho do diff. |
| **Como pegar revisor que só carimba?** | Um segundo revisor cego, só em task sensível. |

---

## 📏 Como saber se funcionou

- **Repetições por task** caem para 0–1.
- **Tasks que mudaram de fluxo no meio** vão a quase zero.
- **Os 3 revisores discordam às vezes.** Se nunca discordam, não estão revisando 3 coisas. Estão revisando 1 coisa 3 vezes.

---

## ⚠️ 4 avisos

1. **Quota.** Paralelo gasta assinatura mais rápido. Começar pequeno e medir.
2. **O script não escreve arquivo.** Quem grava a evidência em `tasks/` continua sendo o agente.
3. **Máximo de agentes ao mesmo tempo:** `CPUs − 2`, até 16.
4. **A prosa dos manuais vira explicação.** O script é a fonte de verdade. Nunca os dois.

---

<details>
<summary>📂 Que documentos mudam (só se aprovado)</summary>

- `multi-agents/ARCHITECTURE.md` — fluxos apontam para o script.
- `multi-agents/HANDOFF-PROTOCOL.md` — ponteiro vira schema; entra a regra de repetições.
- `multi-agents/agents/00-orchestrator.md` — encolhe: só brief e síntese.
- `praticas/00` — linha nova: *fluxo roda na assinatura, dentro do Claude Code; automação fora exige API key e ADR*.
- `GOVERNANCE.md §3.1, §6` — só o Tech Lead aplica.

</details>

<details>
<summary>📜 Por que não LangGraph no processo</summary>

A página oficial de legal e compliance do Claude Code diz que login de assinatura é para "uso ordinário do Claude Code" e que automação via Agent SDK deve usar API key. LangGraph orquestrando o Claude Code por fora fere isso. Por dentro (Workflow) não fere. LangGraph fica no produto.

</details>
