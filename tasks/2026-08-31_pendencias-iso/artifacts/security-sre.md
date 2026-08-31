**Veredito:** APROVADO

# Security-SRE — Gate de task sensível — 2026-08-31_pendencias-iso

**Agente:** security-sre-fable · **Modelo em execução:** fable (claude-fable-5) · **Data:** 2026-08-31
**Escopo auditado:** diff completo da working tree contra `main` (o branch ainda não tem commit) — `scripts/check-pii.sh`, `praticas/00`, `praticas/06`, `docs/RUNBOOK-INCIDENTE-IA.md`, `docs/COMPETENCIA.md`, `docs/ISO-MAPPING.md`, `docs/PENDENCIAS-TECH-LEAD.md`, `docs/EVIDENCIAS-E-METRICAS.md`, remoção dos binários.

Nenhum achado CRITICAL ou HIGH. Três achados MEDIUM/LOW, todos não-bloqueantes, em backlog com dono e prazo abaixo. Ressalvas explícitas: achados 1, 2 e 3 — todos de custo trivial e recomendados para este mesmo PR, mas nenhum condiciona o merge.

---

## Verificações executadas

**`scripts/check-pii.sh` — executado, 6 cenários próprios:**

| Cenário | Esperado | Obtido |
|---|---|---|
| Fixtures com CPF/CNPJ/celular formatados | exit 1 | exit 1, achados listados |
| Repo sem nenhuma pasta de dado de teste | exit 0 | exit 0 |
| Fixtures limpas | exit 0 | exit 0 |
| Nome de arquivo com espaço (`users seed.json`) | detecta | detectado, caminho impresso corretamente |
| Nome de arquivo com `$(touch INJECTED)` e backticks | não executa | **não executou** — `find -exec {} +` passa argumentos sem shell; nenhum arquivo criado |
| Celular sem formatação (`11912345678`, `(21)98765-4321`) | detecta | detectado |

- **Injeção via nome de arquivo: não há.** `-exec grep ... {} +` invoca `grep` diretamente, sem interpretação de shell. Confirmado empiricamente.
- **`set -u` sem `set -e`: correto e necessário.** Com `set -e`, o `grep` saindo 1 (nenhum match — o caminho feliz) abortaria o script dentro da atribuição antes do `exit 0`. A escolha está certa e o racional está documentado na `praticas/06`.
- **Códigos de saída: conforme o contrato declarado** (1 achou / 0 limpo / 0 sem pasta de teste).
- Falso positivo de forma próxima (`version 1.2.3-45 build`, `123.456.789-0`): não casa. Bom sinal de precisão.

**Afirmações contratuais (item 2 do escopo) — verificadas contra o Privacy Center e Help Center da Anthropic:**

1. DPA incorporado automaticamente aos Termos Comerciais (API, Claude for Work Team/Enterprise), com SCCs, sem assinatura separada — **confirmado**.
2. DPA **não** se aplica a planos de consumidor (Free/Pro/Max) — **confirmado**.
3. Consumidor: escolha individual de treino; retenção de 5 anos com treino ligado, 30 dias desligado — **confirmado** (mudança de política de ago/2025). Nuance de precisão no achado 4.

**Encadeamento lógico:** plano de consumidor → sem DPA organizacional e sem controle central do interruptor de treino → falha a condição 2 da `praticas/10` §3 ("termos comerciais com DPA e opt-out de treinamento verificados") → dado Confidencial não entra. **Correto e defensável.** A própria condição 2 já antecipava: "plano gratuito ou pessoal quase sempre falha aqui". Nenhuma afirmação está forte demais; a nota é adequadamente não-otimista e o campo em `praticas/00` registra o estado real ("classe a confirmar") em vez de um "ok" vazio — exatamente o que o brief pediu.

**Runbook (item 3):** ordem de contenção do cenário 1 correta (revogar credencial **antes** de comunicar — janela de exploração de segredo se mede em minutos; depois parar a sessão, comunicar, preservar rastro). Cenário 2: rollback antes de diagnóstico, correto. Cenário 3: tratar pacote instalado como supply chain comprometida e rotacionar segredos do ambiente, correto e alinhado ao vetor real de scripts de pós-instalação. **Nenhum conselho perigoso:** o runbook manda preservar rastro e comunicar cedo, nunca o contrário. Atribuição de decisão coerente com `GOVERNANCE.md` §7.3 e `praticas/10` §7: dev não decide gravidade, Tech Lead aciona DPO no mesmo dia, DPO decide art. 48. Lacuna menor no achado 3.

**COMPETENCIA.md (item 4):** minimização adequada. Pede nome, papel, datas, commit e PR — o mínimo para A.6.3/A.4.6. Nenhum dado pessoal além do que o próprio git já expõe (autor/e-mail do commit). Auto-registro por PR é a escolha certa; manter linha de quem saiu com data de saída é retenção justificada por evidência histórica, não excesso.

**Coerência (item 5):** sem contradições. `GOVERNANCE.md` intocado (zona negada §6.2 respeitada). Check de PII documentado como somatório ao `gitleaks`, conforme o brief. Nenhuma referência restante aos binários removidos. M7 existe em `EVIDENCIAS` §3. Links de `COMPETENCIA.md` e do runbook resolvem. Status 4.5/4.6/4.7 do `ISO-MAPPING` refletem a realidade — o "PARCIAL" da 4.6 é honesto. `docs/contratos/` ainda não existe, mas só é citado como encaminhamento futuro — ok.

---

## Achados (todos não-bloqueantes)

### 1. MEDIUM — CPF/CNPJ sem formatação não são detectados, e a documentação sugere cobertura maior

- **Local:** `scripts/check-pii.sh:9` (regex) e `praticas/06-devsecops.md:37` ("Casa CPF, CNPJ e celular brasileiro").
- **Cenário:** fixture JSON com `"cpf": "12345678901"` — a forma **mais comum** em seed de banco — passa limpa (confirmado em teste). O celular sem formatação é pego; CPF e CNPJ, não. Quem ler a `praticas/06` vai assumir cobertura que não existe, e é assim que rede de segurança vira falsa confiança.
- **Correção:** escolher uma das duas, no mesmo PR: (a) documentar explicitamente na `praticas/06` e no cabeçalho do script que **só padrões formatados** de CPF/CNPJ são cobertos e por quê (11 dígitos crus colidem com timestamp/ID — ruído demais); ou (b) estender o padrão com âncoras de fronteira (`(^|[^0-9])[0-9]{11}([^0-9]|$)` restrito a chaves como `cpf`/`documento`) e recalibrar. A opção (a) é suficiente; a (b) só se a calibração provar ruído aceitável.
- **Dono:** Coder. **Prazo:** neste PR (custo: um parágrafo); no máximo na revisão trimestral de `praticas/06`.

### 2. LOW — o script varre `node_modules/`, vendor e `.git`

- **Local:** `scripts/check-pii.sh:11-15` (`find .` sem `-prune`).
- **Cenário:** confirmado em teste — `node_modules/pkg/x.spec.js` de terceiro com telefone de exemplo derruba o CI (exit 1) por dado que não é do repo. Em runner que roda o check depois do `npm install`, é falso positivo garantido mais custo de varredura.
- **Correção:** adicionar `-prune` para `node_modules`, `.git`, `vendor`, `dist`/`build` no `find`, ou documentar que o check deve rodar **antes** da instalação de dependências.
- **Dono:** Coder. **Prazo:** neste PR; no máximo antes da primeira adoção do check num repo com `node_modules`.

### 3. LOW — a "erradicação" do cenário 1 do runbook determina escopo, mas nunca erradica

- **Local:** `docs/RUNBOOK-INCIDENTE-IA.md:41` (Erradicação e escopo), em tensão parcial com a linha 39 ("não apague o rastro").
- **Cenário:** em plano de consumidor, deletar a conversa é o que inicia o relógio de 30 dias de remoção no provedor. O runbook — corretamente — proíbe apagar o rastro na contenção, mas nunca fecha o ciclo: o dado Confidencial fica retido no provedor indefinidamente mesmo depois de escopo determinado e linha do tempo registrada.
- **Correção:** acrescentar à erradicação do cenário 1: *depois* de a linha do tempo estar registrada no `run-log.md` (conteúdo enviado, ferramenta, conta, horário), o Tech Lead autoriza deletar a conversa/sessão no provedor — e, em plano comercial, avaliar pedido de remoção via suporte. Preserva a evidência local e minimiza a retenção remota; as duas regras deixam de competir.
- **Dono:** Tech Lead (dono do runbook), com apoio Security-SRE. **Prazo:** neste PR ou na primeira revisão do runbook (semestral / pós-incidente).

### 4. INFO — precisão de retenção em `praticas/00`

- **Local:** `praticas/00-stack-e-defaults-gbpa.md:83`.
- **Nota:** a Anthropic declara "**até** 5 anos, em formato desidentificado" para quem liga o treino, e conteúdo sinalizado por trust & safety pode ser retido além dos 30 dias mesmo com treino desligado. A tabela simplifica na direção conservadora — aceitável para o propósito (a conclusão não muda; o dado não entra de qualquer forma). Ajustar para "até 5 anos" quando o campo for reescrito no fechamento da pendência 1.
- **Dono:** Tech Lead, junto com a pendência 1 do `PENDENCIAS-TECH-LEAD.md`. **Prazo:** no fechamento da 4.7.

---

## Registro de risco residual

Nenhum risco residual aceito nesta task — os quatro achados têm correção especificada, dono e prazo; nenhum exige aceite do Tech Lead para o merge.
