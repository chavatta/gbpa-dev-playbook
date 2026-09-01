# Brief — 2026-08-31_pendencias-iso

**Criado por:** Orchestrator
**Data:** 2026-08-31
**Complexidade:** média
**Sensível (security gate):** sim — define política de dado pessoal em prompt e a postura contratual com o provedor de LLM. Toca dados pessoais e contrato com terceiro
**Classe de dado:** Interna — o trabalho manipula documentação e política do próprio playbook; nenhum dado de cliente entra no contexto
**Avaliação de impacto de IA:** não — nada aqui entrega decisão ou conteúdo de IA a usuário final
**Fluxo escolhido:** Orchestrator → Coder → Security-SRE → Reviewer

## Objetivo (verificável)

Fechar as pendências decididas pelo Tech Lead em 2026-08-31: preencher os dois campos 🔒 do `praticas/00`, criar o registro de competência (ação ISO 4.6) e o runbook de incidente envolvendo IA (ação 4.5), remover os binários defasados de `docs/`, e refletir tudo no `PENDENCIAS-TECH-LEAD` e no `ISO-MAPPING`.

## Escopo

**Dentro:**
- `praticas/00` — campos `Provedor/modelos 🔒` e `Contrato/DPA com provedor 🔒: {status}`.
- Check de padrão de PII no CI, junto do `gitleaks` — documentado na `praticas/06`, com o script de verificação.
- `docs/COMPETENCIA.md` — registro de quem leu o onboarding, quando, e revalidação anual (27001 A.6.3, 42001 A.4.6).
- `docs/RUNBOOK-INCIDENTE-IA.md` — três cenários: vazamento por prompt, código defeituoso em produção, dependência alucinada (27001 A.5.24–5.28, 42001 A.8.4).
- Remover `docs/DESENVOLVIMENTO-COM-IA.docx` e `.pdf`; o `.md` passa a ser a única fonte.
- Atualizar `PENDENCIAS-TECH-LEAD`, `ISO-MAPPING` §4 e a tabela de cadência de `EVIDENCIAS-E-METRICAS` §4.

**Fora:**
- Trava mecânica exigindo `impacto-ia.md` — **descartada** pelo Tech Lead: o gatilho depende de declaração humana e não dispararia nenhuma vez no estado atual do repo. Reavaliar quando entrar o primeiro projeto com IA voltada a usuário final.
- Qualquer alteração em `.claude/`, `GOVERNANCE.md` ou `settings.json` — zona negada a agentes (`GOVERNANCE.md` §6.2). Se surgir necessidade, vai para `docs/patches/`.
- Contratação ou troca de plano com o provedor de LLM — é decisão do Tech Lead, aqui só se registra o estado.

## Critérios de sucesso / aceitação

- [ ] Nenhum campo `{status}` ou `{...}` marcado 🔒 do `praticas/00` referente a IA/LLM segue vazio.
- [ ] O campo de contrato registra o plano **e** a consequência operacional dele para a `praticas/10` §3, não apenas "ok".
- [ ] `docs/COMPETENCIA.md` existe, tem cabeçalho de dono/cadência/data e uma linha por pessoa com data de leitura e de revalidação.
- [ ] `docs/RUNBOOK-INCIDENTE-IA.md` cobre os três cenários com detecção, contenção, erradicação e comunicação, e cada um nomeia **quem decide** e **em quanto tempo**.
- [ ] O check de PII no CI está documentado com o comando executável, e é somatório ao `gitleaks`, não alternativa.
- [ ] Os binários de `docs/` não existem mais e nenhuma referência a eles sobrou.
- [ ] `ISO-MAPPING` §4 reflete o novo status de 4.5, 4.6 e 4.7; `EVIDENCIAS` §4 lista os dois documentos novos.
- [ ] Links internos de markdown resolvem.

## Contexto e constraints

- Decisões do Tech Lead nesta data, registradas em `docs/PENDENCIAS-TECH-LEAD.md`.
- **Achado que muda a política:** a GBPA usa hoje **planos de subscrição**. O DPA da Anthropic é incorporado automaticamente aos Termos Comerciais (Team/Enterprise/API), mas **não** aos planos de consumidor (Pro/Max), em que cada usuário controla individualmente o uso dos próprios dados para treino — com retenção de 5 anos se ligado, 30 dias se desligado. Se a subscrição for de consumidor, a condição 2 da `praticas/10` §3 falha e dado Confidencial (código de cliente) não pode entrar no contexto. O campo deve registrar isso de forma verificável, não otimista.
- O PR #4 foi mergeado sem passar pelo gate do playbook. Esta task existe também para corrigir esse padrão: é o fluxo aplicado a si mesmo.
- Fluxo: branch + PR, nunca push em `main` (`GOVERNANCE.md` §2).

## Agentes previstos

`coder` (implementação), `security-sre` (gate de task sensível), `reviewer` (gate de qualidade).
