# Telemetria do playbook — contrato `playbook.telemetry/v1`

> **Dono:** Tech Lead · **Revisão:** a cada mudança do schema (ADR novo que complementa o `docs/ADR-008`) · **Última revisão:** 2026-09-26

Formato comum dos eventos que os hooks do fluxo emitem para um **coletor HTTP opcional**. Sem coletor configurado, nada é emitido e nada muda no projeto. Decisão e racional: [`docs/ADR-008`](../ADR-008-contrato-de-telemetria.md).

## Arquivos

| Arquivo | O que é |
|---|---|
| `evento.schema.json` | JSON Schema 2020-12 da versão **atual** do evento (`$id` `urn:playbook-telemetry:evento:v1`). Gerado, nunca editado à mão: chega copiado byte a byte, e a cópia é conferida por `sha256` com o gerador |
| `v<N>/evento.schema.json` | Cópia congelada de cada major anterior, criada quando a v<N+1> entrar |
| [`../patches/telemetry-emit.mjs`](../patches/telemetry-emit.mjs) | Hook emissor proposto (destino `.claude/hooks/`), com a suíte [`../patches/test-telemetry-emit.mjs`](../patches/test-telemetry-emit.mjs). Aplicação pelo [`docs/patches/README.md`](../patches/README.md) |

## Evento

- **Envelope estrito** (chave desconhecida é rejeitada): `schema` (`"playbook.telemetry/v1"`), `event_id` (ULID), `ts` (ISO 8601 UTC), `source` (`kind`, `runtime`, versão, host), `type`, `data`; opcionais `project`, `task_id`, `session_id`, `run_id`, `agent`, `provider`, `model`.
- **`data` por tipo, tolerante:** o schema de cada tipo valida os campos conhecidos e preserva os desconhecidos, para que consumidor antigo aceite emissor mais novo dentro da mesma major.
- **Tipos** (`type`, enum fechado): `session.start`, `session.end`, `prompt.submit`, `tool.pre`, `tool.post`, `tool.fail`, `subagent.start`, `subagent.stop`, `handoff.pointer`, `permission.request`, `permission.resolved`, `notification`, `decision.requested`, `decision.answered`, `bus.message`, `bus.handoff`, `bus.claim`, `progress.report`, `usage.report`, `limit.hit`, `limit.status`, `flow.step`, `gate.verdict`, `task.indexed`, `run.state`, `compact`, `error`, `alert`.
- **Invariantes fora do JSON Schema:** o tempo do ULID de `event_id` corresponde a `ts` (1 ms de tolerância); o evento serializado tem no máximo 64 KiB, e `data` no máximo 48 KiB.

Qualquer validador JSON Schema 2020-12 serve para conferir um evento contra o arquivo. O consumidor aplica também as duas invariantes acima.

## Emissor (quando aplicado)

```text
node --no-warnings .claude/hooks/telemetry-emit.mjs [--runtime=claude-code|codex|cursor|agy] [--event=<Nome>]
     [--detail=minimal|standard|verbose] [--project=<slug>] [--budget-ms=<≤1500>] [--no-auto-exclude]
```

| Variável (da máquina, nunca do repositório) | Uso | Padrão |
|---|---|---|
| `PLAYBOOK_TELEMETRY_URL` | URL completa do coletor. **Vazia ou ausente ⇒ o hook não faz nada.** `spool` ⇒ só spool local, sem rede | — |
| `PLAYBOOK_TELEMETRY_TOKEN` | Bearer enviado ao coletor | sem header |
| `PLAYBOOK_TELEMETRY_DETAIL` | `minimal` \| `standard` \| `verbose` (a flag `--detail` prevalece) | `standard` |
| `PLAYBOOK_TELEMETRY_SCOPE` | `all` \| `complement` (em execução orquestrada, emite só o que a saída estruturada do runtime não traz) | `complement` com `PLAYBOOK_RUN_ID`; senão `all` |
| `PLAYBOOK_TELEMETRY_DEBUG` | `1` ⇒ log local **redigido** em `${tmpdir}/playbook-telemetry/debug.log` (rotação em 1 MiB) | desligado |
| `PLAYBOOK_TASK_ID`, `PLAYBOOK_RUN_ID`, `PLAYBOOK_AGENT_ROLE`, `PLAYBOOK_PROJECT_ID` | Contexto de execuções orquestradas | — |

Garantias, cobertas pela suíte:
- **nunca bloqueia:** sai com 0 em qualquer caso, não escreve em stderr, stdout vazio (ou `{}` onde o runtime exige JSON) e nunca devolve campo de decisão;
- **prazo rígido** de 1,5 s por evento (1 s no fim de sessão) e disjuntor por coletor: com o coletor fora do ar, só uma invocação por janela paga o timeout de rede;
- **redação antes de sair:** segredos, caminhos e conteúdo são tratados na origem. Em `standard`, o texto do prompt não sai (só o tamanho e um hash curto).

## Spool local

Quando o coletor não confirma (ou com `PLAYBOOK_TELEMETRY_URL=spool`), o evento já redigido vai para:

| Situação | Arquivo |
|---|---|
| `task_id` conhecido e `tasks/<task_id>/` existe | `tasks/<task_id>/telemetry.jsonl` |
| sem task, e `.claude/` gravável | `.claude/telemetry-spool.jsonl` |
| nenhum dos dois | `${XDG_CACHE_HOME:-~/.cache}/playbook-telemetry/` (Windows: `%LOCALAPPDATA%\playbook-telemetry\`) |

O spool é **fila de envio, não evidência** (ADR-008 §4): os padrões `tasks/*/telemetry.jsonl*` e `.claude/telemetry-spool.jsonl*` ficam no `.gitignore` — no repo que adota o playbook, acrescente-os ao `.gitignore` dele (comando no `README.md`, "Adotando em um repositório"). A próxima invocação com o coletor de volta drena um lote por vez.

## Mudar o contrato

1. Mudança compatível (campo opcional em `data`, valor novo em vocabulário aberto, limite maior) fica na v1; qualquer outra exige v2 (ADR-008 §2).
2. O arquivo novo é gerado, copiado byte a byte para cá e conferido por `sha256`.
3. Toda mudança vem num ADR novo que complementa o ADR-008. Em major nova, a versão anterior é congelada em `v<N>/`.
