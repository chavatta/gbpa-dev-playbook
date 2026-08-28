# Desenvolvimento com IA — Como Trabalhamos, Riscos e Cuidados

> **Leia este documento antes de qualquer outro.** Ele explica por que nosso fluxo de desenvolvimento com IA é estruturado do jeito que é.

---

## 1. Por que este documento existe

IA acelera desenvolvimento de forma real — mas **sabemos que implementar com IA tem riscos e exige cuidados**. Sem método, os problemas aparecem rápido:

- Código gerado que **parece certo e está errado** (APIs alucinadas, edge cases ignorados, lógica sutilmente quebrada).
- Mudanças grandes demais para alguém revisar de verdade — o review vira teatro.
- Ações destrutivas executadas com confiança: push em `main`, `rm -rf`, reset de histórico.
- Segredos e credenciais parando em código ou em contexto de IA.
- Perda de rastreabilidade: ninguém sabe o que foi decidido, por quem, nem por quê.

Nossa postura é simples: **IA com processo de engenharia, não IA no improviso.** Cada risco acima tem uma mitigação concreta neste playbook — por método e por trava mecânica, não por confiança.

---

## 2. Como funciona o time de agentes

Não usamos "uma IA que faz tudo". Usamos um **time de agentes especializados**, espelhando um time real de desenvolvimento:

```
                    ORCHESTRATOR  (coordena — como um tech lead)
                         │
   ┌──────────┬──────────┼──────────┬──────────┬──────────┐
SPEC-WRITER ARCHITECT  PLANNER    CODER     REVIEWER   TESTER
(especifica) (projeta)  (fatia) (implementa) (audita)  (valida)
                         │
   ┌──────────┬──────────┼──────────┬──────────┬──────────┐
DEBUGGER  DOCUMENTER   DEVOPS  DATA-ENGINEER AI-ENGINEER SECURITY-SRE
(diagnostica)(documenta) (infra)   (dados)     (IA/RAG)  (gate de segurança)
```

| Agente | Papel no time | Equivalente humano |
|---|---|---|
| **Orchestrator** | Decompõe o pedido, delega, coordena, sintetiza. Não escreve código. | Tech Lead |
| **Architect** | Design de sistema e decisões técnicas, antes de qualquer código | Arquiteto de Software |
| **Planner** | Quebra o design em tasks pequenas com critérios de aceitação | Analista / PO técnico |
| **Coder** | Implementa exatamente o que a spec pede | Desenvolvedor |
| **Reviewer** | Audita segurança, performance e correção — **gate obrigatório** | Revisor sênior |
| **Tester** | Escreve e executa testes; valida critérios de aceitação | QA |
| **Debugger** | Reproduz, isola e diagnostica root cause | Especialista em troubleshooting |
| **Documenter** | READMEs, API docs, runbooks — só após aprovação | Technical Writer |
| **DevOps** | CI/CD, deploy, infra — com checklist pré-deploy | Engenheiro DevOps |
| **Spec-Writer** | Spec formal e verificável antes de arquitetura e código (SDD) | Analista de Requisitos |
| **Data-Engineer** | Schema, migrations seguras, RLS, pgvector — dono da camada de dados | Engenheiro de Dados / DBA |
| **AI-Engineer** | RAG, agentes, prompts, evals, guardrails — dono do subsistema de IA | Engenheiro de IA/ML |
| **Security-SRE** | Segurança sistêmica (threat model, supply chain, secrets, pipeline) + prontidão de produção — **gate das tasks sensíveis** | Engenheiro de Segurança / SRE |

**Por que separar papéis reduz erro:**

1. **Especialização** — cada agente faz uma coisa e faz bem; não mistura responsabilidades.
2. **Revisão cruzada** — quem escreve o código nunca é quem aprova. O Coder não revisa o próprio trabalho, exatamente como num time maduro.
3. **Escopo limitado por ferramenta** — cada agente só tem acesso às ferramentas do seu papel. O Reviewer não edita código (só lê); o Planner não executa comandos; o Debugger não corrige em produção (entrega diagnóstico ao Coder).
4. **Handoff estruturado** — o trabalho passa de agente para agente via artifacts gravados em disco, com rastro auditável (`tasks/{id}/run-log.md`). Nada se perde em "telefone sem fio".

Detalhe completo: [multi-agents/ARCHITECTURE.md](multi-agents/ARCHITECTURE.md) e [multi-agents/HANDOFF-PROTOCOL.md](multi-agents/HANDOFF-PROTOCOL.md).

---

## 3. O modelo certo para cada função

Modelos de IA têm capacidades e custos diferentes. Concentramos o modelo mais capaz **onde o erro custa caro** — decisão, design e o gate de qualidade — e usamos modelos eficientes na execução, que já trabalha sob spec fechada e passa pelo Reviewer de qualquer forma.

| Agente | Modelo | Por quê |
|---|---|---|
| Orchestrator | **Fable 5** | A decomposição define a qualidade de tudo que vem depois |
| Architect | **Fable 5** | Decisões de arquitetura são caras de reverter |
| Reviewer | **Fable 5** | É o gate: um falso "aprovado" é o erro mais caro do fluxo |
| Planner | Sonnet 5 | Estrutura trabalho sobre design já decidido |
| Coder | Sonnet 5 | Implementa spec fechada; erro é pego pelo Reviewer |
| Tester | Sonnet 5 | Método estruturado, critérios já definidos |
| Debugger | Sonnet 5 | Segue metodologia científica de debugging |
| DevOps | Sonnet 5 | Procedural, com checklist |
| Documenter | Haiku 4.5 | Alto volume, insumo já aprovado |
| Spec-Writer | Sonnet 5 | A spec é validada na sequência pelo Architect (Fable) |
| Data-Engineer | Sonnet 5 | Trabalha sob design fechado; passa pelo Reviewer (Fable) |
| AI-Engineer | Sonnet 5 | Trabalha sob spec e evals; passa por Reviewer e Security-SRE (Fable) |
| Security-SRE | **Fable 5** | É um gate: um falso "aprovado" de segurança é vulnerabilidade em produção. Só entra em tasks sensíveis, o que limita o custo |

Racional completo e alternativas descartadas: [docs/ADR-001-modelos-por-agente.md](docs/ADR-001-modelos-por-agente.md), [docs/ADR-002-agente-security-sre.md](docs/ADR-002-agente-security-sre.md) e [docs/ADR-003-agentes-sdd-dados-ia.md](docs/ADR-003-agentes-sdd-dados-ia.md).

---

## 4. Os riscos que reconhecemos — e como cada um é mitigado

| Risco real de dev com IA | Nossa mitigação |
|---|---|
| Código errado ou alucinado que "parece certo" | **Reviewer obrigatório** (Fable 5): nenhuma task fecha sem `artifacts/reviewer.md` com aprovação explícita — verificado por hook, não por boa vontade |
| Ação destrutiva no repositório | Hooks **bloqueiam** push em `main`/`master` (inclusive `HEAD:main`), force push, `rm -rf`, `git reset --hard` |
| Mudança grande demais para revisar | Planner fatia em mudanças de ~200–400 linhas; diff maior que isso é sinalizado no review |
| Escopo descontrolado (IA "aproveita para arrumar" o que ninguém pediu) | Delegação com **LIMITES explícitos**; um dono por arquivo; agente fora do escopo = anti-padrão registrado |
| Contexto se perdendo entre etapas | Artifacts completos em disco + ponteiros leves; `run-log.md` append-only com a linha do tempo de cada task |
| Segredo/credencial em código | Regra dura no Coder (sem hardcode) + item obrigatório do checklist do Reviewer; segredos só em cofre/secrets do CI. Secret commitado = revogar e rotacionar |
| Vulnerabilidade sistêmica (dependência comprometida, pipeline inseguro, authZ falha) | **Security-SRE** como gate em toda task sensível: threat model, auditoria de supply chain, secrets, pipeline e runtime — método em [praticas/06-devsecops.md](praticas/06-devsecops.md) |
| Decisão de arquitetura/infra por moda (microsserviço prematuro, EKS sem motivo) | Biblioteca [`praticas/`](praticas/README.md): critérios de decisão explícitos que o Architect cita no ADR — "é o padrão da indústria" não é justificativa |
| Excesso de confiança ("a IA disse que está pronto") | Nada é `done` sem passar pelo gate; o dev revisa o PR antes de marcá-lo ready — **responsabilidade final é humana** |
| A própria IA alterar suas travas | `settings.json`, hooks e GOVERNANCE são zonas negadas para escrita pelos agentes |

---

## 5. As travas mecânicas (não são opcionais)

Regra de processo depende de obediência; **trava mecânica não**. O kit traz as duas camadas:

- **`.claude/settings.json` → `permissions.deny`** — nega de saída: push direto em `main`, force push, `rm -rf`, `git reset --hard`, `git clean -f` (qualquer variante com `-f`, incluindo `-fd`), e qualquer escrita em `GOVERNANCE.md`, `.claude/settings.json` e `.claude/hooks/`.
- **Hooks (scripts Node que interceptam as ações da IA — a mesma implementação roda em macOS, Linux e Windows, sem configuração por sistema):**
  - `block-dangerous-git.mjs` — analisa cada comando antes de executar; bloqueia variações que burlam o deny simples (ex.: `git push origin HEAD:main`, flags reordenadas) e os equivalentes Windows (`Remove-Item -Recurse -Force`, `rmdir /s`).
  - `protect-guardrails.mjs` — impede a IA de editar as próprias travas e a governança, cobrindo caminhos absolutos e caminhos Windows (`C:\...\.claude\settings.json`).
  - `check-reviewer-gate.mjs` — no fim de cada sessão, verifica se alguma task foi marcada `done` sem `**Veredito:** APROVADO` do Reviewer — e, em task marcada como sensível no brief, também do Security-SRE; se sim, bloqueia o encerramento.

**Regra de ouro:** trava disparou → **não se contorna**. Nem manualmente "só dessa vez". Se parecer falso positivo, reporte ao Tech Lead — a trava é ajustada pelo processo, nunca ignorada.

---

## 6. Boas práticas de desenvolvimento com IA

1. **Branch + draft PR sempre.** `main` é intocável. Todo trabalho nasce em branch, sobe como draft PR e só vira ready depois de revisado.
2. **Mudanças pequenas.** ~200–400 linhas por PR. Se cresceu, volta pro Planner fatiar.
3. **Critérios de aceitação antes do código.** Se você não sabe dizer quando está pronto, não está pronto para começar.
4. **Testes são contrato, não enfeite.** O Tester valida os critérios; teste falhando → Debugger, não gambiarra.
5. **Você é responsável pelo que a IA produziu em seu nome.** Leia o diff inteiro antes de abrir o PR. "Foi a IA" não é justificativa em code review.
6. **Commits limpos.** Mensagens descritivas do quê e por quê. Sem marcações de IA no código ou nos commits.
7. **Um dono por arquivo por vez.** Trabalho paralelo usa git worktrees e arquivos disjuntos (ver [GOVERNANCE.md](GOVERNANCE.md) §4).
8. **Registre decisões.** Decisão técnica relevante vira ADR em `docs/` — quem chegar depois entende o porquê.
9. **Consulte a biblioteca antes de decidir.** Modularização, monorepo, containerizar ou não, EKS ou não, clean architecture, design funcional: os critérios estão em [`praticas/`](praticas/README.md). Desvio relevante se justifica no ADR.
10. **Segurança entra no começo, não no fim.** Feature sensível ganha threat model no design e passa pelo gate do Security-SRE antes de fechar ([praticas/06-devsecops.md](praticas/06-devsecops.md)).
11. **Na dúvida, pergunte.** Ambiguidade que muda a abordagem → pergunta ao Tech Lead antes, não suposição depois.

---

## 7. O que a IA NUNCA faz aqui

- Merge ou push em `main`/`master`.
- Deploy sem o checklist pré-deploy do DevOps.
- Criar, ler ou manipular credenciais e segredos.
- Apagar dados ou histórico (`rm -rf`, force push, hard reset).
- Alterar as próprias travas: `.claude/settings.json`, `.claude/hooks/`, `GOVERNANCE.md`.
- Marcar trabalho como concluído sem passar pelo gate do Reviewer — e, em task sensível, também pelo gate do Security-SRE.
- Aceitar risco de segurança em nome do projeto — risco residual só o Tech Lead aceita, por escrito.

---

## 8. Onde aprender o resto

| Documento | O que cobre |
|---|---|
| [ONBOARDING.md](ONBOARDING.md) | Passo a passo para começar a usar o fluxo |
| [GOVERNANCE.md](GOVERNANCE.md) | Papéis, regras de git, gates e travas — a "lei" do playbook |
| [multi-agents/ARCHITECTURE.md](multi-agents/ARCHITECTURE.md) | Doutrina: topologia, fluxos, anti-padrões, scaling de esforço |
| [multi-agents/HANDOFF-PROTOCOL.md](multi-agents/HANDOFF-PROTOCOL.md) | Como os agentes trocam trabalho na prática |
| [multi-agents/SKILLS-GOVERNANCE.md](multi-agents/SKILLS-GOVERNANCE.md) | Quando reutilizar/criar skills (regra dos 3) |
| [docs/ADR-001-modelos-por-agente.md](docs/ADR-001-modelos-por-agente.md) | Por que cada agente usa o modelo que usa |
| [docs/ADR-002-agente-security-sre.md](docs/ADR-002-agente-security-sre.md) | Escopo e fronteiras do gate de segurança |
| [docs/ADR-003-agentes-sdd-dados-ia.md](docs/ADR-003-agentes-sdd-dados-ia.md) | Escopo e modelos do Spec-Writer, Data-Engineer e AI-Engineer |
| [praticas/README.md](praticas/README.md) | Biblioteca de boas práticas: código, arquitetura, repos, infra, segurança |
| `multi-agents/agents/NN-*.md` | Manual completo de cada agente |
