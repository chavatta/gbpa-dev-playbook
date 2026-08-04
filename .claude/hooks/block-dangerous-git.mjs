#!/usr/bin/env node
// PreToolUse/Bash — bloqueia comandos git/shell destrutivos, inclusive sintaxes
// que burlam o deny por prefixo (ex.: git push -u origin main, git push origin branch:main).
// Multiplataforma (macOS/Linux/Windows).
// exit 2 = bloqueia a ação e devolve o stderr ao agente.

import { readFileSync } from "node:fs";

let cmd = "";
try {
  const input = JSON.parse(readFileSync(0, "utf8"));
  cmd = input?.tool_input?.command ?? "";
} catch {
  process.exit(0);
}

const norm = String(cmd).replace(/\s+/g, " ");

const block = (msg) => {
  process.stderr.write(msg + "\n");
  process.exit(2);
};

// push para main/master, em qualquer forma: aceita N flags/tokens entre `push` e o
// refspec (-u, --no-verify, etc.) e qualquer origem no refspec (branch:main, HEAD:main,
// refs completas). Guarda de fim de palavra evita falso positivo em main-backup etc.
if (/git( +[^ ]+)* +push( +[^ ]+)* +([^ :]+:)?(refs\/heads\/)?(main|master)([^-a-zA-Z0-9_/]|$)/.test(norm)) {
  block("BLOQUEADO: push direto em main/master. Fluxo correto: branch + draft PR (GOVERNANCE.md §2).");
}

// force push em qualquer ordem de flags, incluindo refspec com +
if (/git +push( +[^ ]+)* +(--force|--force-with-lease|-f)([^-a-zA-Z]|$)/.test(norm)) {
  block("BLOQUEADO: force push. Se for realmente necessário, é decisão do Tech Lead, não do agente.");
}
if (/git +push +[^ ]+ +\+[^ ]+/.test(norm)) {
  block("BLOQUEADO: push com refspec forçado (+). Equivale a force push (GOVERNANCE.md §2).");
}

// rm -rf / -fr em qualquer combinação de flags (e o equivalente Windows)
if (/(^|[;&|] *)rm +(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r)[a-zA-Z]* /.test(norm)) {
  block("BLOQUEADO: rm -rf. Delete arquivos individualmente e explique o motivo no artifact.");
}
if (/(^|[;&|] *)(rmdir +\/s|rd +\/s|Remove-Item +.*-Recurse.*-Force|Remove-Item +.*-Force.*-Recurse)/i.test(norm)) {
  block("BLOQUEADO: remoção recursiva forçada (equivalente Windows de rm -rf). Delete arquivos individualmente e explique o motivo no artifact.");
}

// destruição de histórico/working tree
if (/git +reset +--hard/.test(norm)) {
  block("BLOQUEADO: git reset --hard descarta trabalho. Use stash ou branch (GOVERNANCE.md §2).");
}
if (/git +clean +-[a-zA-Z]*f/.test(norm)) {
  block("BLOQUEADO: git clean -f apaga arquivos não rastreados. Revise manualmente o que remover.");
}

// DDL destrutivo direto via CLI de banco (regra inviolável do Data-Engineer,
// até então sem trava mecânica). Escopo estreito para evitar falso positivo.
if (/\b(psql|mysql)\b/.test(norm) && /(DROP +(TABLE|DATABASE|SCHEMA)|TRUNCATE +)/i.test(norm)) {
  block("BLOQUEADO: DDL destrutivo (DROP/TRUNCATE) via CLI de banco. Operação destrutiva exige aprovação do Tech Lead (manual do Data-Engineer; GOVERNANCE.md §6).");
}

process.exit(0);
