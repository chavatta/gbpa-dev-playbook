**Veredito:** REPROVADO (4 issues)

# Reviewer — 2026-09-23_executores-opus-5-5 (rodada 2)

**Agente:** reviewer · **Modelo em que rodou:** `claude-opus-5-5` (o system prompt mostra `claude-opus-5-5[1m]`; o sufixo é só a janela de contexto, a versão é a designada) · **Status:** completed · **Próximo:** coder
**Escopo:** `git diff d22755c..9e141a3`: 6 arquivos fora de `tasks/`, cerca de 20+/20- linhas. Tamanho adequado.

## Resumo da rodada 1 (HEAD d22755c)

A rodada 1 reprovou com 9 issues: (1) HIGH, o ADR-005:41 ainda listava `agentType` `-sonnet`; (2) HIGH, as "Consequências" do ADR-001 ainda diziam que o gate era mais capaz que o código auditado; (3) MEDIUM, a "Decisão" do ADR-001 ainda falava em perfil "balanceado"; (4) MEDIUM, a mitigação punha o refutador cego fora da família Opus; (5) MEDIUM, a decisão 2 do PENDENCIAS dizia "todos pelo ID completo"; (6) LOW, os racionais das tabelas justificavam modelo menor; (7) LOW, a alternativa 1 do ADR-003 não tinha nota; (8) LOW, o HANDOFF falava em "agentes de topo"; (9) LOW, o recuo de cota não tinha critério e a nota de evidência não citava `sonnet`.

## Verificação dos 9 achados da rodada 1

| # | Situação | Evidência |
|---|---|---|
| 1 | Resolvido | ADR-005:41 agora lista `architect-opus`, `planner-opus`, `spec-writer-opus`, `coder-opus`, `tester-opus`, `reviewer-opus`, `security-sre-fable`, o mesmo conjunto dos `agentType` em `gbpa-task.js` (linhas 129-250) e do ADR-001:65. |
| 2 | Resolvido | ADR-001:43 tacha as positivas originais e as marca como superadas. A linha 45 traz positivas novas, e as linhas 49-50 registram os custos de cota e de gate no mesmo modelo nas negativas. |
| 3 | Resolvido em parte | ADR-001:19 agora é datado e bate com a tabela: os 9 agentes originais estão em Opus 5.5, exceto o Documenter. O título da seção de revisão (linha 67) não foi ajustado, ver issue 3 abaixo. |
| 4 | Resolvido | ADR-001:79 diz que só o Security-SRE (Fable 5.1) está fora da família. Diz também que o refutador cego roda como `reviewer-opus` e protege por não ler os vereditos anteriores. Confere com `gbpa-task.js:250`. |
| 5 | Resolvido | PENDENCIAS:58 diz "Haiku 4.5 (alias `haiku`). Opus e Fable ficam fixados pelo ID completo", o que confere com `.claude/agents/documenter.md:5` (`model: haiku`). O mesmo erro reaparece no ADR-001:48, ver issue 2 abaixo. |
| 6 | Resolvido em parte | No ADR-001:26-30, as linhas estão marcadas "*(racional do sonnet)*" e a linha 19 explica que a coluna é o racional original. No DESENVOLVIMENTO §3, Planner a DevOps foram reescritos. Spec-Writer, Data-Engineer e AI-Engineer continuam com o racional de "por que não precisa do topo", ver issue 4. |
| 7 | Resolvido | ADR-003:25 traz "(Rejeitada em 2026-07-31; adotada em 2026-09-23 junto com os demais executores, ver ADR-001.)". |
| 8 | Resolvido | HANDOFF-PROTOCOL:70 diz "fixa a versão dos agentes em Opus e Fable". |
| 9 | (a) Resolvido, mas com afirmação nova falsa; (b) resolvido | (a) ADR-001:78 dá o critério ("saída mais fácil de conferir") e explica por que o Coder fica. A justificativa dos outros quatro está errada, ver issue 1. (b) ADR-001:81 cita `fable` nos quatro de topo e `sonnet` nos oito executores. Confere com a evidência que existe: `tasks/2026-09-23_fechamento-adr005-e-travas/artifacts/coder-docs.md:4` registra "Modelo: sonnet". |

## grep `sonnet` fora de `tasks/` (saída completa, sem corte)

```
./docs/ADR-002-agente-security-sre.md:27:2. **Deixar no DevOps** — conflito de interesse (implementaria e auditaria os próprios controles) e o DevOps rodava em Sonnet, insuficiente para um gate (desde 2026-09-23 roda em Opus 5.5, mas o conflito de interesse continua).
./docs/ADR-002-agente-security-sre.md:28:3. **Security-SRE em Sonnet** — gate menos capaz que o código que audita é gate decorativo (mesmo argumento do ADR-001 contra "tudo Sonnet").
./docs/ADR-001-modelos-por-agente.md:13:O fluxo multi-agent tem 9 agentes com custos de erro muito diferentes. A cota de uso dos modelos (plano de subscrição — ⚠️ classe a confirmar, ver `docs/PENDENCIAS-TECH-LEAD.md` item 1) é compartilhada pela equipe, e os modelos disponíveis têm capacidades e custos distintos: **Opus 5.5** e **Fable 5.1** (topo de linha; até 2026-09-23 o topo era só o **Fable 5**), **Sonnet 5** (equilíbrio) e **Haiku 4.5** (rápido e barato).
./docs/ADR-001-modelos-por-agente.md:26:| `planner` | **opus** (`claude-opus-5-5`) — era sonnet | *(racional do sonnet)* Estrutura trabalho sobre design já decidido pelo Architect |
./docs/ADR-001-modelos-por-agente.md:27:| `coder` | **opus** (`claude-opus-5-5`) — era sonnet | *(racional do sonnet)* Implementa spec fechada; erro é interceptado pelo Reviewer |
./docs/ADR-001-modelos-por-agente.md:28:| `tester` | **opus** (`claude-opus-5-5`) — era sonnet | *(racional do sonnet)* Critérios de aceitação já definidos; método estruturado |
./docs/ADR-001-modelos-por-agente.md:29:| `debugger` | **opus** (`claude-opus-5-5`) — era sonnet | *(racional do sonnet)* Segue metodologia científica (skill `engineering:debug`) |
./docs/ADR-001-modelos-por-agente.md:30:| `devops` | **opus** (`claude-opus-5-5`) — era sonnet | *(racional do sonnet)* Procedural, com checklist pré-deploy |
./docs/ADR-001-modelos-por-agente.md:38:2. **Tudo Sonnet** — mais barato, mas degrada exatamente o ponto em que o fluxo deposita confiança: o review. Um gate menos capaz que o coder que ele audita é um gate decorativo.
./docs/ADR-001-modelos-por-agente.md:77:- **Segunda etapa, no mesmo dia — executores em Opus 5.5.** Por decisão do Tech Lead, os oito agentes em Sonnet 5 (`planner`, `coder`, `tester`, `debugger`, `devops`, `spec-writer`, `data-engineer`, `ai-engineer`) também passam a `claude-opus-5-5`, com sufixo `-opus`. Ficam fora o Security-SRE (Fable 5.1) e o Documenter (Haiku 4.5). Isso adota em grande parte a alternativa 1 ("tudo no modelo de topo"), que este ADR tinha rejeitado. Dois custos ficam registrados:
./docs/ADR-001-modelos-por-agente.md:78:  - **Cota.** Os executores são os agentes que mais rodam, e passam a gastar no preço do topo. O piloto do `/task` (`PENDENCIAS-TECH-LEAD.md`, item 3) é onde medir isso. Se a cota não fechar, o recuo natural é devolver ao Sonnet quem trabalha sob spec fechada e sob gate e tem saída mais fácil de conferir: Planner, Tester e DevOps. O Coder fica em Opus porque o código é o que o Reviewer audita, e manter os dois no mesmo nível evita reabrir o ciclo de retrabalho que a alternativa 3 descreve. Debugger, Spec-Writer, Data-Engineer e AI-Engineer ficam porque o erro deles é de diagnóstico ou de design, o tipo que o ADR sempre pôs no topo.
./docs/ADR-001-modelos-por-agente.md:81:- **Evidência antiga não muda:** artifacts em `tasks/` anteriores a esta revisão registram `fable` nos quatro agentes de topo e `sonnet` nos oito executores, porque foi nesses modelos que rodaram.
./docs/ADR-003-agentes-sdd-dados-ia.md:21:3. **Modelo: `sonnet` para os três** — *superado em 2026-09-23: os três passaram a Opus 5.5 (`claude-opus-5-5`), ver ADR-001 → "Revisão de 2026-09-23". O racional original fica abaixo como registro.* Pelo racional do ADR-001, o modelo de topo (Fable até 2026-09-23; desde então Opus 5.5, e Fable 5.1 no Security-SRE) fica nos nós cujo erro escapa sem gate: decomposição (Orchestrator), design (Architect) e os gates (Reviewer, Security-SRE). Os três novos agentes produzem trabalho **consumido e auditado por um nó no modelo de topo imediatamente a jusante**: a spec é validada pelo Architect-opus, e schema/subsistema de IA passam pelo Reviewer-opus (e Security-SRE-fable quando sensível). O Orchestrator pode sobrescrever o modelo na delegação em tasks épicas, como já previsto no ADR-001.
./multi-agents/ARCHITECTURE.md:20:> Dado da Anthropic: um sistema multi-agent com um modelo de topo como lead e Sonnet como subagentes superou um sistema single-agent em **90.2%** em tarefas de pesquisa complexas. (O estudo original usou Opus como lead e Sonnet nos subagentes. Desde 2026-09-23, o playbook roda lead e quase todos os subagentes em **Opus 5.5** — ver `ADR-001`.)
```

Todas as 14 ocorrências são históricas ou do estudo citado: contexto de modelos disponíveis (ADR-001:13), "era sonnet" e racional marcado (26-30), alternativas rejeitadas (ADR-001:38, ADR-002:28), passado datado (ADR-002:27, ADR-001:77, :81), recuo condicional (ADR-001:78), decisão marcada como superada (ADR-003:21) e estudo da Anthropic (ARCHITECTURE:20). Nenhuma descreve o estado atual como Sonnet. O critério do brief está cumprido.

## Outras verificações

- `node scripts/test-gbpa-task.mjs`: 15/15, 0 falhas.
- Links relativos markdown fora de `tasks/`: 100 verificados, 0 quebrados. As referências em código citadas no texto novo resolvem: `PENDENCIAS-TECH-LEAD.md` item 3 é "### 3. Rodar o piloto do fluxo por script"; `GOVERNANCE.md` §2.2 foi conferido na rodada 1.
- Frontmatter: os 8 executores e os 3 de topo em `claude-opus-5-5`, o Security-SRE em `claude-fable-5-1` e o Documenter em `haiku`. Sem mudança desde a rodada 1.
- "Positivas (desde 2026-09-23)" (ADR-001:45) conferem. "Qualidade uniforme em quase todo o fluxo" vem com ressalva. O gate de segurança em Fable 5.1 é de fato outra família que a do Reviewer e a dos executores, e essa diversidade só passou a existir em 2026-09-23 (antes Reviewer e Security-SRE eram Fable). Nenhuma afirmação falsa.
- Racionais reescritos no DESENVOLVIMENTO §3 (Planner a DevOps) conferem. O do Tester ("em paralelo ao Coder; também é uma das lentes em task sensível") bate com `gbpa-task.js:181-195` e `:210`. O paralelo só vale na rodada 1 de task não-trivial, mas o nível de detalhe é aceitável para a tabela. O do Coder ("mesmo nível do Reviewer — menos retrabalho") apresenta como vantagem o que o ADR-001:50 registra como custo (pontos cegos compartilhados). Não é falso, mas vale a leitura cruzada.
- Sem segredos nem credenciais no diff. Nada a rotear ao `security-sre`.

## Issues

### 1. MEDIUM (bloqueante) — Afirmação nova falsa no recuo de cota: "o tipo que o ADR sempre pôs no topo"
- **Arquivo:** `docs/ADR-001-modelos-por-agente.md:78`
- **Problema:** "Debugger, Spec-Writer, Data-Engineer e AI-Engineer ficam porque o erro deles é de diagnóstico ou de design, o tipo que o ADR sempre pôs no topo." O próprio ADR desmente isso. A tabela (linha 29) mostra que o Debugger, cujo erro é de diagnóstico, ficou em Sonnet de 2026-07-31 a 2026-09-23. O Contexto (linha 15) põe no topo decomposição, design (Architect) e gate, e não diagnóstico. O ADR-003:21 deixou Spec-Writer, Data-Engineer e AI-Engineer em Sonnet justamente porque o trabalho deles é "consumido e auditado por um nó no modelo de topo imediatamente a jusante", o mesmo critério que agora justifica devolver Planner, Tester e DevOps. É texto vigente de registro de decisão e reescreve a história do ADR.
- **Correção:** tirar o "sempre" e dar o critério real. Duas opções: (a) "Debugger, Spec-Writer, Data-Engineer e AI-Engineer ficam por decisão do Tech Lead: o erro deles é de diagnóstico ou de design. Pelo racional original (ADR-003, decisão 3) eles também seriam candidatos ao recuo, e o piloto decide a ordem."; ou (b) incluí-los no recuo como segundo passo, depois de Planner, Tester e DevOps.

### 2. MEDIUM (bloqueante) — "com o ID fixado, nada muda sozinho" repete no ADR-001 o erro já corrigido no PENDENCIAS
- **Arquivo:** `docs/ADR-001-modelos-por-agente.md:48`
- **Problema:** "Três modelos para manter atualizados (Opus 5.5, Fable 5.1, Haiku) → revisão trimestral deste ADR; com o ID fixado, nada muda sozinho." O Documenter usa o alias `haiku` (`.claude/agents/documenter.md:5`), que acompanha a família sozinho. É a mesma afirmação falsa do issue 5 da rodada 1, agora em outro arquivo.
- **Correção:** "Opus e Fable têm o ID fixado e não mudam sozinhos. O Documenter segue no alias `haiku`, que acompanha a família: confira a versão na revisão trimestral."

### 3. LOW — O título da seção de revisão cobre só a primeira etapa (resto do issue 3 da rodada 1)
- **Arquivo:** `docs/ADR-001-modelos-por-agente.md:67` e `:71`
- **Problema:** o título "Opus 5.5 nos nós críticos, Fable 5.1 no gate de segurança" descreve só a primeira etapa. A linha 71 diz, no presente, "O racional de *onde* fica o modelo de topo não muda: decomposição, design e os dois gates", e a segunda etapa (linha 77) desmente isso algumas linhas abaixo.
- **Correção:** trocar o título por "Revisão de 2026-09-23 — Opus 5.5 em todos os agentes, exceto Security-SRE (Fable 5.1) e Documenter". O prefixo "Revisão de 2026-09-23", que as outras referências usam, não muda. Na linha 71, escrever "Nesta primeira etapa, o racional de *onde* fica o modelo de topo não muda (...)".

### 4. LOW — Três racionais do DESENVOLVIMENTO §3 ainda justificam um modelo menor (resto do issue 6 da rodada 1)
- **Arquivo:** `DESENVOLVIMENTO-COM-IA.md`, tabela da §3, linhas Spec-Writer, Data-Engineer e AI-Engineer
- **Problema:** "A spec é validada na sequência pelo Architect", "Trabalha sob design fechado; passa pelo Reviewer" e "Trabalha sob spec e evals; passa por Reviewer e Security-SRE" são o argumento do ADR-003 para *não* pôr esses agentes no topo. As cinco linhas acima foram reescritas para o modelo atual, e essas três não. Não são falsas, mas ao lado de "Opus 5.5" não justificam a escolha.
- **Correção:** reescrever no mesmo estilo das outras cinco. Exemplos: Spec-Writer, "A spec define o que todo o fluxo vai construir; erro de requisito é o mais caro de descobrir tarde". Data-Engineer, "Migration e schema errados são difíceis de reverter em produção". AI-Engineer, "Design de prompts, evals e guardrails é design de sistema".

## Roteamento
- Os issues 1 e 2 bloqueiam. São afirmações falsas em texto vigente, o mesmo critério que fez os issues 3, 4 e 5 da rodada 1 bloquearem. O 1 é justamente o tipo de erro que a pergunta "as frases novas criaram afirmação falsa?" devia pegar.
- Os issues 3 e 4 não bloqueiam sozinhos, mas são edições de uma linha e cabem na mesma rodada.
- Na rodada 3, bastam o diff dos quatro pontos e um novo `grep -rni sonnet` para confirmar que a linha 78 não criou menção nova.
