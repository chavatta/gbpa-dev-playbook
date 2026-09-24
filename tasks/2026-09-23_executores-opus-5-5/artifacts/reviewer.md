**Veredito:** APROVADO

# Reviewer — 2026-09-23_executores-opus-5-5 (rodada 3)

**Agente:** reviewer · **Modelo em que rodou:** `claude-opus-5-5` (o system prompt mostra `claude-opus-5-5[1m]`; o sufixo é só a janela de contexto, a versão é a designada) · **Status:** completed · **Próximo:** orchestrator
**Escopo:** `git diff 9e141a3..370e4c0`: `docs/ADR-001-modelos-por-agente.md` e `DESENVOLVIMENTO-COM-IA.md`, cerca de 7+/7- linhas fora de `tasks/`. Tamanho adequado.

## Histórico das rodadas

- **Rodada 1 (HEAD d22755c): 9 issues, reprovada.** Os HIGH eram o ADR-005:41, que ainda listava `agentType` `-sonnet`, e as "Consequências" do ADR-001, que diziam que o gate era mais capaz que o código auditado. Os MEDIUM eram o perfil "balanceado" na Decisão do ADR-001, o refutador cego posto fora da família Opus e o "todos pelo ID completo" no PENDENCIAS. Os LOW eram os racionais das tabelas, a alternativa 1 do ADR-003, o "agentes de topo" do HANDOFF e o recuo de cota sem critério junto com a nota de evidência sem `sonnet`.
- **Rodada 2 (HEAD 9e141a3): 4 issues, reprovada.** Os 9 da rodada 1 foram resolvidos ou resolvidos em parte. Dois dos 4 bloqueavam, ambos afirmações falsas novas no ADR-001: a linha 78 dizia "o tipo que o ADR sempre pôs no topo", desmentido pela tabela (Debugger em Sonnet) e pelo ADR-003:21; a linha 48 dizia "com o ID fixado, nada muda sozinho", falso para o Documenter no alias `haiku`. Os dois LOW eram o título e a frase de abertura da seção de revisão, que cobriam só a primeira etapa, e os racionais de Spec-Writer, Data-Engineer e AI-Engineer no DESENVOLVIMENTO §3.
- **Rodada 3 (HEAD 370e4c0):** os 4 foram resolvidos. Resta uma melhoria não-bloqueante (abaixo).

## Verificação dos 4 achados da rodada 2

| # | Situação | Evidência |
|---|---|---|
| 1 | Resolvido | ADR-001:78 agora diz "Debugger, Spec-Writer, Data-Engineer e AI-Engineer ficam em Opus por decisão do Tech Lead. Pelo critério original (ADR-001 e ADR-003: há gate logo depois), eles seriam o segundo passo do recuo". Conferido contra o ADR-003:21, que manteve os três em Sonnet por serem "consumido[s] e auditado[s] por um nó no modelo de topo imediatamente a jusante", e contra a tabela do ADR-001:29 (Debugger era Sonnet) e o Contexto (linha 15: "um erro na execução é barato, porque o Reviewer o intercepta"). O "sempre" saiu, e a frase já não reescreve a história do ADR. |
| 2 | Resolvido | ADR-001:48 diz "Opus e Fable estão fixados pelo ID e não mudam sozinhos; o Documenter usa o alias `haiku` e acompanha a versão mais nova do Haiku sem passar por aqui". Confere com `.claude/agents/documenter.md:5` (`model: haiku`) e com o resto do frontmatter (`claude-opus-5-5` em 12 agentes, `claude-fable-5-1` no Security-SRE). |
| 3 | Resolvido | O título (ADR-001:67) é "Opus 5.5 em quase todo o time, Fable 5.1 no gate de segurança". A frase de abertura (linha 71) está marcada como "*Primeira etapa:*" e aponta para a segunda. A redação nova tem um efeito colateral pequeno, ver melhoria 1. |
| 4 | Resolvido | DESENVOLVIMENTO §3 (linhas 83-85) reescrito para o custo de erro de cada papel. Conferido com os manuais: Data-Engineer, "Migration e RLS erradas são caras de reverter e podem expor dado entre tenants", bate com `multi-agents/agents/10-data-engineer.md:7`, `:17` e `:65` (banco como "o componente ... mais difícil de reverter"; RLS contra vazamento "de outro tenant/usuário"). AI-Engineer, "Prompt, RAG e evals mal desenhados falham em silêncio", bate com `multi-agents/agents/11-ai-engineer.md:7`, `:16` e `:25-28` (comportamento probabilístico, sem evals "melhorou" é opinião). Spec-Writer, "a spec é o contrato de tudo que vem depois", é coerente com o fluxo SDD (spec, depois Architect, depois Planner). |

## grep `sonnet` fora de `tasks/`

`grep -rni sonnet --exclude-dir=.git --exclude-dir=tasks .` devolveu 14 ocorrências, nas mesmas posições da rodada 2: ADR-002:27, :28; ADR-001:13, :26-30, :38, :77, :78, :81; ADR-003:21; ARCHITECTURE:20. A única linha com texto novo é a ADR-001:78:

```
./docs/ADR-001-modelos-por-agente.md:78:  - **Cota.** Os executores são os agentes que mais rodam, e passam a gastar no preço do topo. O piloto do `/task` (`PENDENCIAS-TECH-LEAD.md`, item 3) é onde medir isso. Se a cota não fechar, o recuo natural é devolver ao Sonnet quem trabalha sob spec fechada e sob gate e tem saída mais fácil de conferir: Planner, Tester e DevOps. O Coder fica em Opus porque o código é o que o Reviewer audita, e manter os dois no mesmo nível evita reabrir o ciclo de retrabalho que a alternativa 3 descreve. Debugger, Spec-Writer, Data-Engineer e AI-Engineer ficam em Opus por decisão do Tech Lead. Pelo critério original (ADR-001 e ADR-003: há gate logo depois), eles seriam o segundo passo do recuo, se o primeiro não bastar.
```

A menção continua condicional (recuo) e não descreve o estado atual como Sonnet. As outras 13 não mudaram e seguem históricas ou do estudo citado, como verificado na rodada 2. O critério do brief está cumprido.

## Outras verificações

- `node scripts/test-gbpa-task.mjs`: 15/15, 0 falhas.
- Links relativos markdown fora de `tasks/`: 100 verificados, 0 quebrados.
- Sem segredos nem credenciais no diff. Nada a rotear ao `security-sre`.

## Melhorias (não-bloqueantes)

### 1. LOW — A diversidade de família dos gates ficou atribuída à segunda etapa
- **Arquivo:** `docs/ADR-001-modelos-por-agente.md:71`
- **Problema:** "A segunda etapa, mais abaixo, leva o topo também aos executores — e os dois gates passam a rodar em famílias diferentes: ...". Pela pontuação, a diversidade de família dos gates vira efeito da segunda etapa. Na verdade ela vem da primeira: o Reviewer passa de Fable 5 para Opus 5.5 e o Security-SRE fica em Fable. Mover os executores não mexe nos gates. O estado atual descrito é verdadeiro, só a etapa está trocada, e as duas etapas são do mesmo dia. Por isso não bloqueia.
- **Correção sugerida:** reordenar, por exemplo: "*Primeira etapa:* o racional de *onde* fica o modelo de topo não muda (decomposição, design e os dois gates); muda *qual* modelo ocupa esses nós, e os dois gates passam a rodar em famílias diferentes: em task sensível, (...). A segunda etapa, mais abaixo, leva o topo também aos executores."

### Observação (sem ação obrigatória)
- ADR-001:48, "acompanha a versão mais nova do Haiku": a linha 73 do mesmo ADR registra que o alias herda a versão exata da conversa principal quando ela já roda na mesma família. Para o Haiku esse caso é raro (a sessão principal não roda em Haiku), e a frase vale na prática. Se quiser precisão total, dá para acrescentar "(salvo quando a sessão principal já roda em Haiku)".

## Roteamento
- Nenhum issue bloqueante. A task pode seguir para o fechamento pelo Orchestrator. A melhoria 1 é uma edição de uma frase e pode entrar agora ou na revisão trimestral do ADR-001.
