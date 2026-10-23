# ADR-010 — Família de modelo por alias, esforço explícito e executores em Sonnet 5.5

**Status:** Proposto
**Data:** 2026-10-23
**Decisores:** Tech Lead
**Revisão:** trimestral, junto com o ADR-001
**Relacionado:** revisa o ADR-001 (seção "Revisão de 2026-09-23"), o ADR-002 e o ADR-003. Se aceito, substitui a regra "ID completo, não alias" e o quadro de modelos de `DESENVOLVIMENTO-COM-IA.md` §3. Muda arquivos protegidos (`.claude/agents/`, `.claude/workflows/gbpa-task.js`): a aplicação segue `docs/patches/README.md`.
**Confiança:** média. Os números de benchmark são públicos. Nenhuma `/task` real rodou ainda com executor em Sonnet 5.5, e o piloto que mediria a cota (ADR-001, ADR-009) também não rodou.

## Contexto

Três fatos mudaram desde a revisão de 2026-09-23.

1. **Saiu o Sonnet 5.5 (2026-09-28).** Ele custa metade do Opus 5.5 por token (US$ 2 / 10 contra 4 / 20 por milhão). Ganha do Opus 5.5 em agente de terminal e fica perto dele em trabalho de conhecimento. Perde em mudança de código de ponta a ponta e em raciocínio aberto (tabela abaixo). A própria Anthropic posiciona o Sonnet para "tarefas bem delimitadas do dia a dia, correção de bugs e documentos" e diz que o Opus 5.5 "continua claramente mais forte em trabalho complexo e aberto, que pede julgamento sustentado".
2. **O Documenter não roda no modelo que a documentação diz.** O frontmatter usa o alias `haiku`, que na API da Anthropic hoje resolve para o **Haiku 5.5**, e não para o Haiku 4.5 do quadro. Além disso, `scripts/telemetria/precos.json` não tem preço para `claude-haiku-5-5`, então o relatório de custos marca o Documenter como "modelo sem preço".
3. **Nenhum agente declara esforço (`effort`).** Sem `effort` no frontmatter, o subagente roda no esforço da sessão de quem chamou. No Opus 5.5 o default é `medium`, um nível abaixo do default do Opus 5. Na prática, o esforço dos gates varia de máquina para máquina. Só o `gbpa-task.js` fixa esforço, e só em duas chamadas (`recon` em `low` e o refutador cego em `high`).

Além disso, cada troca de versão hoje custa uma revisão manual de mais de 20 arquivos (os 13 agentes, o script, testes e documentação) (ver "Mudou junto" no ADR-001). Foi isso que deixou o Documenter desalinhado do quadro.

### Evidência: Sonnet 5.5 contra Opus 5.5

| Benchmark | O que mede | Sonnet 5.5 | Opus 5.5 | Leitura para o fluxo |
|---|---|---|---|---|
| Terminal-Bench 4.0 | agente operando terminal | **70,6%** | 66,4% (xhigh) | DevOps e Tester (rodar, depurar, scriptar) |
| GDPval-AA v2.1 | trabalho de conhecimento | 1844 | 1846 | empate: Planner, Documenter |
| CursorBench 4.0 | coding em IDE | 55,5% | 57,8% | perto |
| OSWorld 2.1 | uso de computador | 80,1% | 81,8% | perto |
| SWE-Bench Pro | mudança de código real, ponta a ponta | 81,3% | **89,9%** | Coder: diferença de ~9 pontos |
| ProgramBench | programa completo | 79,7% | **91,2%** | design e implementação abertos |
| FrontierCode 1.1 | coding de fronteira | 52,1% (xhigh) | **54,4%** | no `max`, o Sonnet cai para 46,2% |
| Humanity's Last Exam (com ferramentas) | raciocínio difícil | 64,5% | **67,7%** | Architect, Spec-Writer, Debugger |

Os números vêm do anúncio da Anthropic e da tabela do system card citada por terceiros. A Artificial Analysis mediu uma vantagem menor no Terminal-Bench (63,6% contra 59,6%). Resumo: o Sonnet 5.5 empata ou ganha onde o trabalho é delimitado e executável. O Opus mantém vantagem clara onde o trabalho é aberto ou a mudança de código é grande.

## Decisão proposta

### 1. Família por alias, com piso de versão

O frontmatter passa a declarar a **família** (`opus`, `sonnet`, `haiku`, `fable`), e não o ID. Quando sair uma versão nova da família, ela entra sozinha, sem editar arquivo nenhum. É o que já acontece hoje, sem querer, com o Documenter.

A regra de 2026-09-23 ("ID completo, não alias") tinha um motivo: tirar de um efeito colateral a decisão de trocar o modelo de um gate. Este ADR mantém esse controle por outros meios.

- **Piso de versão na autoverificação.** Cada agente confere a **família** e uma **versão mínima** (Opus ≥ 5.5, Sonnet ≥ 5.5, Haiku ≥ 5.5, Fable ≥ 5.1). Família errada ou versão abaixo do piso devolve `status: blocked` com o blocker `"modelo divergente: esperado {família} ≥ {piso}, rodando em {modelo real}"`. Versão mais nova passa. O ponteiro continua registrando o **ID exato** em que o agente rodou (HANDOFF-PROTOCOL §3.2), então a evidência não perde nada.
- **Alavanca de recuo central.** Se uma versão nova piorar algo, uma linha em `.claude/settings.json` volta a família inteira para a versão anterior, sem tocar nos agentes. Por exemplo, `"env": { "ANTHROPIC_DEFAULT_OPUS_MODEL": "claude-opus-5-5" }`. Existem `ANTHROPIC_DEFAULT_SONNET_MODEL`, `_HAIKU_MODEL` e `_FABLE_MODEL` equivalentes. O recuo é decisão do Tech Lead e é registrado neste ADR.
- **Gatilho de revisão.** Saiu versão nova de uma família → a revisão trimestral passa a ser o prazo máximo para registrar aqui que ela foi observada no `run-log`. O Tech Lead não precisa aprovar antes.

**Duas pegadinhas do alias, documentadas pelo Claude Code, que o piso cobre:**

- O alias resolve **por provedor**. Na API da Anthropic, hoje, `opus` é Opus 5.5, `sonnet` é Sonnet 5.5, `haiku` é Haiku 5.5 e `fable` é Fable 5.1. No Bedrock e no Vertex, `sonnet` ainda é Sonnet 4.5 e `haiku` é Haiku 4.5. O playbook roda por assinatura Anthropic (`praticas/00`), mas, se alguém rodar por outro provedor, o piso bloqueia em vez de rebaixar o modelo sem aviso.
- Se a sessão principal já roda na mesma família, o subagente herda **a versão exata dela**. Por exemplo: sessão em Sonnet 5 → subagente `sonnet` roda em Sonnet 5. O piso também bloqueia esse caso.

### 2. Quem fica no Opus e quem vai para o Sonnet 5.5

O critério é o original do ADR-001 e do ADR-003: o modelo de topo fica onde o erro é caro de reverter ou passa despercebido (decomposição, spec, design, dados, IA e os gates). Quem trabalha sob spec fechada, com gate logo depois e com saída fácil de conferir, pode ir para o Sonnet. Isso coincide com o recuo que o próprio ADR-001 já tinha descrito para o caso de a cota não fechar.

| Agente | Hoje | Proposto | Esforço | Por quê |
|---|---|---|---|---|
| Orchestrator | Opus 5.5 | **`opus`** | `high` | A decomposição define tudo que vem depois |
| Spec-Writer | Opus 5.5 | **`opus`** | `high` | Uma ambiguidade na spec vira retrabalho em todos os agentes seguintes |
| Architect | Opus 5.5 | **`opus`** | `high` | Decisão cara de reverter; o Opus lidera em ProgramBench e HLE |
| Reviewer | Opus 5.5 | **`opus`** | `high` | Gate: um falso "aprovado" é o erro mais caro do fluxo |
| Debugger | Opus 5.5 | **`opus`** | `high` | Causa-raiz é raciocínio aberto, sem spec que o guie |
| Data-Engineer | Opus 5.5 | **`opus`** | `high` | Migration e RLS erradas vazam dado entre tenants e são caras de reverter |
| AI-Engineer | Opus 5.5 | **`opus`** | `high` | Prompt, RAG e evals mal feitos falham em silêncio |
| Security-SRE | Fable 5.1 | **`fable`** | `high` | Gate de segurança em outra família; sem mudança de critério |
| Planner | Opus 5.5 | **`sonnet`** | `high` | Fatia trabalho sobre um design já decidido; empate em GDPval |
| Tester | Opus 5.5 | **`sonnet`** | `high` | Testa critérios de aceitação já escritos; o Sonnet lidera no Terminal-Bench |
| DevOps | Opus 5.5 | **`sonnet`** | `high` | Procedural e com checklist; o Sonnet lidera no Terminal-Bench |
| Coder | Opus 5.5 | **`sonnet`** + escalada | `high` | Ver abaixo: é a decisão de maior impacto e de maior risco |
| Documenter | `haiku` (doc diz 4.5, roda 5.5) | **`haiku`** | `medium` | Volume alto sobre conteúdo já aprovado; o Haiku 5.5 custa 1/20 do Sonnet |

**Esforço explícito em todos os agentes.** O frontmatter ganha `effort:`. Assim o esforço deixa de depender de como cada pessoa configurou a própria sessão. O `effort` passado pelo `gbpa-task.js` em cada chamada continua prevalecendo, e a variável `CLAUDE_CODE_EFFORT_LEVEL` prevalece sobre tudo. Para o Sonnet 5.5 fica `high`, como pedido. A Anthropic avisa que o `max` piorou o Sonnet 5.5 no FrontierCode (52,1% no `xhigh` contra 46,2% no `max`), então o `max` fica fora.

**O Coder.** O ADR-001 manteve o Coder em Opus para "evitar o ciclo de retrabalho". Os argumentos para mudar:

- **A favor do Sonnet:** o Coder é o agente que mais consome token, então a economia de cota se concentra nele. Mais importante, mudar o Coder **devolve ao fluxo o princípio original de ter um Reviewer mais capaz que o código que audita**. A revisão de 2026-09-23 registrou essa perda como consequência negativa ("gate no mesmo modelo que o código que audita"). Com Coder em Sonnet e Reviewer em Opus, os dois param de compartilhar os mesmos pontos cegos.
- **Contra:** a diferença de ~9 pontos no SWE-Bench Pro é real. Fatia grande ou com muito acoplamento tende a voltar do Reviewer.
- **Mitigação: escalada por fatia.** O Orchestrator e o `gbpa-task.js` passam `model: "opus"` na chamada do Coder quando a fatia é de alto risco, isto é, quando tem qualquer um destes sinais: task sensível (GOVERNANCE §7); mexe em migration, auth ou dinheiro; o Planner marcou a fatia como `complexa`; ou o Reviewer reprovou a rodada anterior por erro de lógica (não por nit). O parâmetro de modelo por chamada prevalece sobre o frontmatter. O Coder escalado roda como `coder-sonnet` em modelo Opus; para o piso de versão isso é válido, porque a escalada só sobe.
- **Critério de recuo:** se no piloto a taxa de reprovação Coder→Reviewer subir mais de 50% em relação ao Coder em Opus, ou se o custo por fatia *concluída* (somando as voltas de retrabalho) não cair, o Coder volta para `opus`. Isso vem da regra do ADR-001: custo se julga por tarefa concluída, não por chamada.

### 3. Nomes

A convenção do ADR-001 continua: o sufixo do `name:` segue a **família**. `planner-opus`, `tester-opus`, `devops-opus` e `coder-opus` passam a `-sonnet`. Os arquivos mantêm o nome-base. Como o sufixo agora é a família e não a versão, uma versão nova não exige renomear nada.

## Alternativas consideradas

1. **Manter tudo em Opus 5.5 com ID fixo (status quo).** Preserva o controle. Mas continua pagando o preço do topo onde o Sonnet empata ou ganha, mantém o Reviewer no mesmo modelo do Coder e repete a revisão manual de mais de 20 arquivos a cada versão. Rejeitada.
2. **Alias sem piso de versão.** Mais simples, mas um dev com a sessão principal em Sonnet 5 ou rodando pelo Bedrock rebaixaria os executores sem ninguém ver. É exatamente o downgrade silencioso que o ADR-001 proíbe. Rejeitada.
3. **Executores em Sonnet, mas Coder em Opus.** Opção conservadora, que deixa a maior parte da economia de fora e não resolve o gate no mesmo modelo. **É o recuo natural** se o piloto do Coder falhar pelo critério acima.
4. **`opusplan` ou `CLAUDE_CODE_SUBAGENT_MODEL` global.** São alavancas de sessão, não de papel. Não expressam "este agente, este modelo". Rejeitada.

## Consequências

**Positivas:** troca de versão sem PR; esforço igual em todas as máquinas; o Reviewer volta a ser mais forte que o Coder; o Tester, como lente de reprodução, passa a ser uma terceira família na revisão de task sensível (correção em Opus, segurança em Fable, reprodução em Sonnet); menos consumo da cota compartilhada nos agentes que mais rodam.

**Negativas e mitigação:**
- **Versão nova entra sem avaliação prévia.** Mitigação: o `run-log` registra o ID exato; recuo por `ANTHROPIC_DEFAULT_*_MODEL`; nota obrigatória na revisão trimestral.
- **Risco de mais retrabalho no Coder.** Mitigação: escalada por fatia e critério de recuo mensurável.
- **Evidência antiga não muda:** artifacts anteriores registram o ID em que rodaram.

## Como aplicar (patch para o Tech Lead)

Tudo o que muda fica em arquivos protegidos ou em documentação. O patch segue `docs/patches/README.md`.

1. `.claude/agents/*.md`: `model:` → família; `effort:` novo; `name:` dos quatro que vão para Sonnet; seção "Modelo designado" passa a verificar família + piso.
2. `.claude/workflows/gbpa-task.js`: `agentType` `coder-sonnet`, `tester-sonnet`, `planner-sonnet`; escalada do Coder (`model: 'opus'` quando a fatia for de alto risco); descrição do campo `model` do schema.
3. `scripts/test-gbpa-task.mjs` e `docs/patches/test-context-budget.mjs`: nomes `coder-sonnet` e `tester-sonnet`.
4. Docs: tabelas de `DESENVOLVIMENTO-COM-IA.md` §3, `ONBOARDING.md`, `README.md` e `praticas/00`; nota de revisão nos ADR-001, 002 e 003; `PENDENCIAS-TECH-LEAD.md` (o piloto do Coder em Sonnet entra junto com a pendência 6 do ADR-009).
5. Reiniciar as sessões do Claude Code: a definição dos agentes carrega no startup.

Já entra neste PR, porque não depende da decisão: o preço de `claude-haiku-5-5` em `scripts/telemetria/precos.json`, para o relatório de custos parar de marcar o Documenter como "modelo sem preço".

## Fontes

- Claude Code: [subagentes, frontmatter `model` e `effort`](https://code.claude.com/docs/en/sub-agents) · [configuração de modelo, aliases por provedor e `ANTHROPIC_DEFAULT_*_MODEL`](https://code.claude.com/docs/en/model-config)
- [Anúncio do Claude Sonnet 5.5 (Anthropic)](https://www.anthropic.com/claude-sonnet-5-5)
- [The Decoder: Sonnet 5.5 quase iguala o Opus 5.5](https://the-decoder.com/anthropics-claude-sonnet-5-5-nearly-matches-opus-5-5-on-benchmarks-while-costing-up-to-30-percent-less-per-task/) · [AIToolsReview: tabela do system card](https://aitoolsreview.co.uk/insights/claude-sonnet-5-5)
