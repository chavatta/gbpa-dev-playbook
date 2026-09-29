#!/usr/bin/env node
// Roda teste, lint ou análise estática mostrando só falhas e resumo (praticas/12, docs/ADR-009).
// Agnóstico de stack: o comando vem do perfil do projeto (praticas/00 → bloco orcamento-contexto →
// `comandos_quiet`) ou vem depois de `--`. A saída completa vai para arquivo; o terminal (e o contexto do
// agente) recebe no máximo `saida_ferramenta.quiet_max_linhas` linhas.
//
// Uso:
//   node scripts/quiet/run-quiet.mjs <teste|lint|analise> [--task <task_id>] [-- <comando>]
//   node scripts/quiet/test-quiet.mjs [--task <task_id>]      (idem lint-quiet.mjs, analise-quiet.mjs)
//
// Com --task, a saída completa fica em tasks/<task_id>/artifacts/<tipo>-<hora>.log (evidência da task);
// sem, no diretório temporário do sistema. O código de saída é o do comando.

import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

// Linhas que indicam falha em qualquer ecossistema comum. Lista curta de propósito: o resumo final
// (últimas linhas) cobre o que ela não pegar.
const FALHA = /\b(FAIL(ED|URE)?|ERROR|Error|panic|Traceback|Exception|AssertionError|not ok)\b|\berror(\[\w+\])?:|assert(ion)? failed|[✗✕×]|^\s*(E|F)\s{2,}/;
const RESUMO_LINHAS = 8;

function perfil(raiz) {
  try {
    const t = readFileSync(join(raiz, "praticas", "00-stack-e-defaults-gbpa.md"), "utf8");
    const m = /<!--\s*orcamento-contexto:inicio\s*-->[\s\S]*?```json\s*([\s\S]*?)```/.exec(t);
    return m ? JSON.parse(m[1]) : {};
  } catch {
    return {};
  }
}

// Seleciona o que mostrar: linhas de falha (com a seguinte, que costuma trazer o local) + resumo final.
export function resumir(linhas, max) {
  const marcadas = new Set();
  linhas.forEach((l, i) => { if (FALHA.test(l)) { marcadas.add(i); if (i + 1 < linhas.length) marcadas.add(i + 1); } });
  const inicioResumo = Math.max(0, linhas.length - RESUMO_LINHAS);
  const falhas = [...marcadas].filter((i) => i < inicioResumo).sort((a, b) => a - b);
  const orcFalhas = Math.max(0, max - Math.min(RESUMO_LINHAS, linhas.length) - 1);
  const out = [];
  let prev = -2;
  for (const i of falhas.slice(0, orcFalhas)) { if (i !== prev + 1 && out.length) out.push("…"); out.push(linhas[i]); prev = i; }
  if (falhas.length > orcFalhas) out.push(`… (+${falhas.length - orcFalhas} linhas de falha no arquivo)`);
  if (out.length) out.push("— resumo —");
  out.push(...linhas.slice(inicioResumo));
  return out.slice(0, max);
}

export async function main(tipo, argv) {
  const raiz = process.cwd();
  const cfg = perfil(raiz);
  const max = cfg.saida_ferramenta?.quiet_max_linhas ?? 60;
  const sep = argv.indexOf("--");
  const cmd = sep >= 0 ? argv.slice(sep + 1).join(" ") : (cfg.comandos_quiet?.[tipo] || "");
  const ti = argv.indexOf("--task");
  const task = ti >= 0 && (sep < 0 || ti < sep) ? argv[ti + 1] : null;
  if (!["teste", "lint", "analise"].includes(tipo)) { console.error("tipo: teste | lint | analise"); return 2; }
  if (!cmd) { console.error(`Sem comando de ${tipo}: preencha comandos_quiet.${tipo} no bloco orcamento-contexto de praticas/00, ou passe-o depois de --.`); return 2; }
  if (task && !/^\d{4}-\d{2}-\d{2}_[a-z0-9][a-z0-9-]*$/.test(task)) { console.error("--task no formato AAAA-MM-DD_slug"); return 2; }

  const dir = task ? join(raiz, "tasks", task, "artifacts") : tmpdir();
  mkdirSync(dir, { recursive: true });
  const arquivo = join(dir, `${tipo}-${new Date().toISOString().replace(/[:.]/g, "-")}.log`);
  const partes = [];
  const code = await new Promise((ok) => {
    const p = spawn(cmd, { shell: true, cwd: raiz, env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1", CI: process.env.CI || "1" } });
    p.stdout.on("data", (d) => partes.push(d));
    p.stderr.on("data", (d) => partes.push(d));
    p.on("close", (c) => ok(c ?? 1));
    p.on("error", () => ok(127));
  });
  const texto = Buffer.concat(partes).toString("utf8").replace(/\x1b\[[0-9;]*m/g, "");
  writeFileSync(arquivo, texto);
  const linhas = texto.split(/\r?\n/).filter((l, i, a) => l !== "" || i < a.length - 1);
  const rel = task ? `tasks/${task}/artifacts/${arquivo.split(/[\\/]/).pop()}` : arquivo;
  console.log(resumir(linhas, max).join("\n"));
  console.log(`[${tipo}-quiet] ${code === 0 ? "passou" : `falhou (código ${code})`} · ${linhas.length} linhas completas em ${rel} — leia só o trecho que precisar (rg -n ou leitura por faixa).`);
  return code;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv[2], process.argv.slice(3)).then((c) => process.exit(c));
}
