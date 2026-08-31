# Pendências para o Tech Lead

> **Status (2026-08-04):** os patches nas travas mecânicas foram **aplicados** (por mão humana, como o processo exige): veredito ancorado + gate de segurança com hook no `check-reviewer-gate.mjs`; bypasses de push fechados + trava de DDL destrutivo no `block-dangerous-git.mjs`; denies extras no `settings.json`; `GOVERNANCE.md` atualizado (§2.6, §3.4–3.5, §4.3, §5, §6). Ambos os hooks passaram por suíte de testes (26 casos). **Sessões do Claude Code precisam ser reiniciadas** para carregar os hooks novos.

## O que resta (decisões, não patches)

1. **Ativar branch protection** em `main`/`master` dos repos existentes no GitHub (PR obrigatório, ≥1 aprovação, status checks, force push/deleção bloqueados) — a regra do `GOVERNANCE.md §2.6` só vale se aplicada no servidor.
2. ~~**Preencher `praticas/00-stack-e-defaults-gbpa.md`**~~ — *resolvido como processo, não como pendência:* o 00 passou a ser preenchido **por projeto** (`ONBOARDING.md §2`, passo 6) e campo em branco é **decisão do Architect** em ADR, não blocker do Tech Lead. Resta ao Tech Lead apenas os campos que extrapolam o projeto: **política de dados pessoais em prompt e status do contrato/DPA com o provedor de LLM**.
3. **Validar o alias `model: fable`** no frontmatter dos 4 agentes numa task real — se o harness não reconhecer, o fallback é silencioso; nesse caso trocar pelo id completo `claude-fable-5` (ADR-001, revisão trimestral).
4. **Definir SLA de correção por severidade** para achados de segurança não-bloqueantes (`praticas/06-devsecops.md`, camada 2) — sem isso, "CRITICAL/HIGH explorável bloqueia" depende de interpretação.
5. **Convenção de nome dos agentes.** Os arquivos em `.claude/agents/` chamam-se `reviewer-fable`, `coder-sonnet`…, mas todas as referências (ONBOARDING, campo `agent:`/`next_agent:` do handoff, corpo do orchestrator) usam o **nome-base**. É tradeoff consciente — o sufixo torna o modelo visível na listagem —, mas se o ADR-001 trocar o modelo de um agente, o nome do arquivo muda e as referências quebram. Alternativa: nome-base puro, com o modelo apenas no frontmatter e no ADR.
6. **Binários defasados em `docs/`.** `DESENVOLVIMENTO-COM-IA.docx` e `.pdf` são de 2026-08-09; o `.md` mudou bastante desde então (camada ISO, correções upstream, seção de travas). Ninguém os referencia, não há processo de regeneração e `pandoc` não está instalado na máquina. Decidir: **(a)** definir o comando de regeração e rodá-lo a cada release do playbook, ou **(b)** removê-los e distribuir o `.md`/o repo. Manter binário órfão contradiz a própria regra de dono-e-data da `docs/EVIDENCIAS-E-METRICAS.md` §4.
7. **Trilha de capacitação** — certificações Anthropic (CCDV-F para devs, CCAR-F para arquitetos/Tech Lead). Verificar elegibilidade da GBPA no Claude Partner Network e decidir quem faz e quando.

---

## Patch pendente em arquivo protegido — `GOVERNANCE.md` §7

> **Contexto:** trabalho de conformidade ISO/IEC 27001 e 42001 (`docs/ADR-004-conformidade-iso.md`, `docs/ISO-MAPPING.md`).
> `GOVERNANCE.md` é zona negada para escrita por agentes (§6.2). O texto abaixo está pronto para colar **por mão humana**, ao final do arquivo. Enquanto não for aplicado, `praticas/10-dados-e-contexto-de-ia.md` vale como prática (referência), não como lei — e o controle 42001 A.9.2 fica PARCIAL no `ISO-MAPPING.md`.

```markdown
---

## §7. Dados, evidência e conformidade

1. **Classificação antes do contexto.** Toda informação enviada a um modelo de IA é classificada como Pública, Interna, Confidencial ou Restrita (`praticas/10-dados-e-contexto-de-ia.md` §2). Dado **Restrito** — segredo, credencial, dado pessoal sensível (LGPD art. 5º II), dado de criança ou adolescente — **nunca entra no contexto de um modelo. Sem exceção, e nem o Tech Lead autoriza.** Dado **Confidencial** só entra com as três condições da §3 daquele documento: ferramental aprovado, contrato que cubra o subprocessamento e minimização.
2. **A classe declarada no brief.** Todo `brief.md` declara a classe de dado da task. Classe Confidencial ou Restrita torna a task **sensível** para efeito do gate do Security-SRE (§3.5).
3. **Envio indevido é incidente, não achado.** Reportar ao Tech Lead imediatamente; se for credencial, revogar e rotacionar; se envolver dado pessoal, o Tech Lead aciona o encarregado (DPO) para avaliar o art. 48 da LGPD. Registrar no `run-log.md`. Não há punição por reportar rápido — há por esconder.
4. **Avaliação de impacto de IA.** Feature que entrega decisão ou conteúdo de IA a usuário final, processa dado pessoal com IA, ou influencia decisão sobre pessoas não é `done` sem `tasks/{task_id}/artifacts/impacto-ia.md` (`multi-agents/templates/AVALIACAO-IMPACTO-IA.template.md`), auditado pelo Security-SRE.
5. **Evidência é versionada.** `tasks/` não entra no `.gitignore`. Brief, run-log e artifacts são retidos por **3 anos** (`docs/EVIDENCIAS-E-METRICAS.md` §2). Artifact registra veredito e racional — nunca dado real de cliente ou pessoal.
6. **Revisão periódica.** Cada documento do playbook tem dono e cadência declarados em `docs/EVIDENCIAS-E-METRICAS.md` §4. Revisão feita atualiza a data no cabeçalho, mesmo sem alteração de conteúdo.
```

**Efeito colateral do patch:** o §3.5 (gate de segurança) passa a ter um gatilho adicional — classe de dado — e o `brief.md` já foi atualizado com os dois campos novos. Nenhuma trava mecânica muda; o `check-reviewer-gate.mjs` continua verificando o marcador de sensibilidade, que agora também é acionado pela classe.

**Trava opcional (decisão do Tech Lead):** estender `check-reviewer-gate.mjs` para exigir `artifacts/impacto-ia.md` quando o brief marcar `**Avaliação de impacto de IA:** sim`. É o mesmo padrão do gate de segurança e fecha o item 4 acima mecanicamente. Só o Tech Lead edita hooks.

## Patch pendente em arquivo protegido — `block-dangerous-git.mjs`

> **Contexto:** o hook casava o padrão perigoso em **qualquer posição da linha**, então um `grep "git clean -f" arquivo.md` — busca, não execução — era bloqueado. O falso positivo apareceu ao tentar *auditar a própria documentação das travas*, que é justamente quando a trava não pode atrapalhar.
> `.claude/hooks/` é zona negada para escrita por agentes (§6.2), então o arquivo corrigido foi entregue pronto e testado em [`patches/`](patches/README.md), **para aplicação por mão humana**.

**O que muda.** O casamento passa a ser por **posição de comando** — início da linha ou logo após separador (`;`, `&&`, `||`, `|`, subshell), admitindo prefixo de variável de ambiente. Citar o comando como texto deixa de disparar. Três correções vieram junto:

- **Quebra de linha vira separador explícito** antes de colapsar espaço. Sem isso, `echo a`⏎`git clean -fd` viraria uma linha só e o comando perigoso sairia da posição de comando — o ancoramento teria aberto um bypass novo.
- **Aspas são removidas como caracteres, não como conteúdo**, fechando a ofuscação `git clean -"f"`, que a versão anterior deixava passar.
- **Wrappers que executam string como código** (`sh -c`, `bash -c`, `eval`, `xargs`) voltam a casar em qualquer posição, porque neles o texto citado **é** comando. A versão anterior deixava passar `eval "rm -rf /tmp/x"`.

**Evidência.** Banco de 45 payloads reais rodado contra as duas versões: a atual passa 38/45 (5 falsos positivos + 2 bypasses reais — a ofuscação por aspas e o `eval`); a corrigida passa 45/45. Nenhum caso que a versão atual bloqueia deixou de ser bloqueado.

**Limitação conhecida, aceita:** conteúdo de heredoc (`<<EOF`) é tratado como sequência de comandos, então escrever documentação que *contenha* um comando perigoso via heredoc bloqueia. O caminho certo para isso é a ferramenta de escrita de arquivo, não o shell — falha para o lado seguro.

## Lacuna de guardrail — escrita em `.claude/` via shell

`protect-guardrails.mjs` intercepta `Write|Edit|MultiEdit|NotebookEdit` e o `settings.json` nega `Write(.claude/hooks/**)`. **Nenhum dos dois cobre o shell:** um `cp`, `tee` ou redirecionamento `>` para `.claude/hooks/` não passa por esses controles — só o `block-dangerous-git.mjs` vê comandos Bash, e ele não tem regra sobre caminhos protegidos. Na sessão de 2026-08-31 um `cp` para esse caminho foi barrado pelo classificador de permissões do harness, não pelas travas do playbook — ou seja, a defesa que funcionou não é a nossa.

**Decisão do Tech Lead:** adicionar ao `block-dangerous-git.mjs` uma regra que bloqueie escrita em `.claude/settings.json`, `.claude/hooks/` e `GOVERNANCE.md` por comando de shell (`cp`, `mv`, `tee`, `>`, `>>`, `sed -i`, `install`). Fecha a assimetria entre o caminho de ferramenta e o caminho de shell.

## Ações de conformidade ISO em aberto

Rastreadas com numeração estável em `docs/ISO-MAPPING.md` §4:

- **4.1** branch protection nos repos existentes · **4.2** preencher `praticas/00` (inclui ferramental aprovado para dado Confidencial) · **4.3** este patch do §7 · **4.4** SLA por severidade
- **4.5** runbook de incidente envolvendo IA · **4.6** registro de competência (quem leu o onboarding, quando) · **4.7** verificar termos do provedor de IA: retenção, opt-out de treino, subprocessadores, DPA
- **4.8** registro de risco e Declaração de Aplicabilidade · **4.9** auditoria interna e análise crítica — ambas na camada organizacional, fora deste repositório

