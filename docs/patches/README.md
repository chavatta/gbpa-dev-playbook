# Patches pendentes em arquivos protegidos

Arquivos que agentes não podem escrever (`.claude/hooks/`, `.claude/settings.json`, `GOVERNANCE.md` — `GOVERNANCE.md` §6.2) chegam aqui prontos e testados, para o **Tech Lead aplicar por mão humana**. O racional de cada patch fica em [`../PENDENCIAS-TECH-LEAD.md`](../PENDENCIAS-TECH-LEAD.md).

## Pendente — `GOVERNANCE-fluxo-por-script.md` (ADR-005)

Ajusta §3.1, §3.4, §6.2 e §6.4 para o fluxo por script. Texto pronto e verificação de sintaxe no próprio arquivo. Sem banco de payloads: não é trava, é texto.

## Aplicado em 2026-08-31 — `block-dangerous-git.mjs` (mantido como referência da suíte)

> A versão abaixo já está em produção (arquivo idêntico ao de `.claude/hooks/`) e a suíte cresceu para 60 casos. O texto original fica como registro do processo.


O hook em produção casa o padrão perigoso em qualquer posição da linha, então `grep "git clean -f" arquivo.md` é bloqueado mesmo sendo busca, não execução. Esta versão casa por posição de comando e, de quebra, fecha dois bypasses reais (ofuscação por aspas e `eval "rm -rf …"`).

**Rodar a suíte antes de aplicar** — compara a versão em produção com a corrigida:

```bash
node docs/patches/test-block-dangerous-git.mjs .claude/hooks/block-dangerous-git.mjs
```

```bash
node docs/patches/test-block-dangerous-git.mjs docs/patches/block-dangerous-git.mjs
```

Esperado: a de produção passa 38/45, a corrigida 45/45. **Aplicar só se a corrigida fechar 45/45** — se algum caso de bloqueio falhar, o patch afrouxou uma trava e não deve entrar.

**Aplicar:**

```bash
cp docs/patches/block-dangerous-git.mjs .claude/hooks/block-dangerous-git.mjs
```

Hooks carregam no startup: **reinicie as sessões do Claude Code** depois de aplicar, ou elas seguem com o hook antigo em memória.

## Manutenção

O banco de payloads é o teste de regressão das travas — toda mudança futura em `block-dangerous-git.mjs` acrescenta o caso novo aqui e roda a suíte inteira antes de aplicar. Caso que deve bloquear e caso que deve passar têm o mesmo peso: guardrail que gera falso positivo é contornado, e guardrail contornado não protege nada.
